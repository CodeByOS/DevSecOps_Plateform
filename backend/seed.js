/**
 * seed.js — Generates realistic fake data for the SecOps Platform
 *
 * Usage:
 *   cd backend
 *   node ../seed.js
 *
 * Or with custom MONGO_URI:
 *   MONGO_URI=mongodb://... node seed.js
 *
 * What it creates:
 *   - 3 users (1 admin, 2 developers)
 *   - 4 projects
 *   - 30 pipelines with scan results and audit logs
 */

require('dotenv').config({path: '.env'});
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── Minimal inline models (avoids importing your full app)

const UserSchema = new mongoose.Schema({
  name:         String,
  email:        { type: String, unique: true },
  password:     String,
  role:         { type: String, enum: ['admin','developer','viewer'], default: 'developer' },
  tokenVersion: { type: Number, default: 0 },
}, { timestamps: true });

const ProjectSchema = new mongoose.Schema({
  name:          String,
  description:   String,
  repoUrl:       String,
  defaultBranch: { type: String, default: 'main' },
  stagingUrl:    { type: String, default: '' },
  webhookSecret: String,
  owner:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members:       [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, role: String }],
  gateConfig: {
    threshold:        { type: Number, default: 70 },
    mode:             { type: String, default: 'block' },
    notifySlack:      { type: Boolean, default: false },
    notifyEmail:      { type: Boolean, default: false },
    emailRecipients:  [String],
  },
}, { timestamps: true });

const StepSchema = new mongoose.Schema({
  name:        String,
  status:      { type: String, enum: ['pending','running','success','failed','skipped'], default: 'pending' },
  startedAt:   Date,
  completedAt: Date,
  error:       { type: String, default: null },
  summary:     { type: Object, default: {} },
}, { _id: false });

const PipelineSchema = new mongoose.Schema({
  project:       { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  commitSha:     String,
  branch:        String,
  commitMessage: String,
  author:        String,
  status:        { type: String, enum: ['pending','running','completed','failed','blocked'], default: 'pending' },
  steps:         { type: [StepSchema], default: [] },
  score:         { type: Number, default: null },
  decision:      { type: String, enum: ['approved','blocked','override', null], default: null },
  overrideBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  overrideReason:{ type: String, default: null },
  startedAt:     { type: Date, default: Date.now },
  completedAt:   { type: Date, default: null },
}, { timestamps: true });

const ScanResultSchema = new mongoose.Schema({
  pipeline: { type: mongoose.Schema.Types.ObjectId, ref: 'Pipeline', unique: true },
  sast: {
    critical: { type: Number, default: 0 },
    high:     { type: Number, default: 0 },
    medium:   { type: Number, default: 0 },
    low:      { type: Number, default: 0 },
    coverage: { type: Number, default: 0 },
    issues:   { type: Array, default: [] },
  },
  sca: {
    criticalCves:  { type: Number, default: 0 },
    highCves:      { type: Number, default: 0 },
    maxCvssScore:  { type: Number, default: 0 },
    outdatedCount: { type: Number, default: 0 },
    cves:          { type: Array, default: [] },
  },
  dast: {
    highAlerts:   { type: Number, default: 0 },
    mediumAlerts: { type: Number, default: 0 },
    lowAlerts:    { type: Number, default: 0 },
    xssCount:     { type: Number, default: 0 },
    sqliCount:    { type: Number, default: 0 },
    alerts:       { type: Array, default: [] },
  },
  mlScore: {
    score:        { type: Number, default: null },
    modelVersion: { type: String, default: null },
    features:     { type: Object, default: {} },
  },
}, { timestamps: true });

const AuditLogSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  action:    String,
  project:   { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  details:   { type: Object, default: {} },
  ipAddress: { type: String, default: null },
}, { timestamps: { createdAt: true, updatedAt: false } });

const User      = mongoose.model('User',      UserSchema);
const Project   = mongoose.model('Project',   ProjectSchema);
const Pipeline  = mongoose.model('Pipeline',  PipelineSchema);
const ScanResult= mongoose.model('ScanResult',ScanResultSchema);
const AuditLog  = mongoose.model('AuditLog',  AuditLogSchema);

// ── Helpers ───────────────────────────────────────────────────────────────────

const rand  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick  = arr => arr[Math.floor(Math.random() * arr.length)];
const sha   = () => [...Array(40)].map(() => Math.floor(Math.random()*16).toString(16)).join('');
const daysAgo = n => new Date(Date.now() - n * 86_400_000);

const BRANCHES   = ['main','develop','feature/auth','feature/api','fix/xss','hotfix/sqli','release/v2.0'];
const AUTHORS    = ['Oussama Saidi','Alice Martin','Bob Chen','Sara Lopez','Yassine El Idrissi'];
const COMMIT_MSGS= [
  'Add JWT authentication middleware',
  'Fix SQL injection vulnerability in search',
  'Update dependencies to latest versions',
  'Refactor API error handling',
  'Add rate limiting to auth endpoints',
  'Fix XSS in user profile page',
  'Upgrade React to v19',
  'Remove hardcoded credentials',
  'Add input validation for forms',
  'Fix CORS configuration',
  'Implement CSP headers',
  'Add HTTPS redirect middleware',
];

const SAST_RULES = [
  { ruleId: 'javascript.express.security.audit.xss.manual-url-building', severity: 'high',     message: 'Potential XSS: avoid building URLs from user input' },
  { ruleId: 'javascript.node.security.detect-sql-injection',              severity: 'critical', message: 'Possible SQL injection with string concatenation' },
  { ruleId: 'javascript.express.security.audit.unhandled-error',          severity: 'medium',   message: 'Unhandled promise rejection may leak stack traces' },
  { ruleId: 'javascript.node.security.hardcoded-secret',                  severity: 'critical', message: 'Hardcoded secret detected in source code' },
  { ruleId: 'javascript.browser.security.insecure-document-write',        severity: 'medium',   message: 'document.write() usage can lead to XSS' },
  { ruleId: 'javascript.node.security.path-traversal',                    severity: 'high',     message: 'Potential path traversal via user-controlled input' },
];

const CVES = [
  { cveId: 'CVE-2023-44270', cvssScore: 9.8, severity: 'critical', description: 'Prototype pollution in lodash < 4.17.21', packageName: 'lodash',   installedVersion: '4.17.20', fixedVersion: '4.17.21' },
  { cveId: 'CVE-2024-21501', cvssScore: 7.5, severity: 'high',     description: 'ReDoS in sanitize-html < 2.11.0',          packageName: 'sanitize-html', installedVersion: '2.10.0', fixedVersion: '2.11.0' },
  { cveId: 'CVE-2023-26115', cvssScore: 7.5, severity: 'high',     description: 'ReDoS in word-wrap < 1.2.4',               packageName: 'word-wrap', installedVersion: '1.2.3', fixedVersion: '1.2.4' },
  { cveId: 'CVE-2022-46175', cvssScore: 8.8, severity: 'high',     description: 'Prototype pollution in json5 < 2.2.2',     packageName: 'json5',    installedVersion: '2.2.1', fixedVersion: '2.2.2' },
  { cveId: 'CVE-2023-28155', cvssScore: 6.1, severity: 'medium',   description: 'Open redirect in request < 2.88.2',        packageName: 'request',  installedVersion: '2.88.1', fixedVersion: null },
];

const DAST_ALERTS = [
  { name: 'Cross Site Scripting (Reflected)',    risk: 'high',   description: 'Reflected XSS found in search parameter',  solution: 'Sanitize and encode all user input', owaspCategory: 'CWE-79' },
  { name: 'SQL Injection',                       risk: 'high',   description: 'SQL injection via id parameter',            solution: 'Use parameterized queries',            owaspCategory: 'CWE-89' },
  { name: 'Content Security Policy Not Set',    risk: 'medium', description: 'CSP header is missing from responses',      solution: 'Add a Content-Security-Policy header', owaspCategory: 'CWE-693' },
  { name: 'X-Frame-Options Header Not Set',     risk: 'medium', description: 'Clickjacking possible without X-Frame-Options', solution: 'Set X-Frame-Options: DENY',         owaspCategory: 'CWE-1021' },
  { name: 'Cookie Without Secure Flag',         risk: 'low',    description: 'Session cookie missing Secure flag',        solution: 'Set Secure flag on all cookies',       owaspCategory: 'CWE-614' },
  { name: 'Strict-Transport-Security Not Set',  risk: 'low',    description: 'HSTS header missing',                       solution: 'Add Strict-Transport-Security header', owaspCategory: 'CWE-319' },
];

// Build a realistic set of pipeline steps
const buildSteps = (status, startedAt) => {
  const stepNames = ['clone','sast','sca','dast','ml_score','gate'];
  const steps = [];
  let t = new Date(startedAt);

  for (const name of stepNames) {
    const duration = rand(2, name === 'dast' ? 120 : 30) * 1000;
    const completedAt = new Date(t.getTime() + duration);

    let stepStatus = 'success';
    if (status === 'failed' && name === 'clone') stepStatus = 'failed';
    if (status === 'blocked' && name === 'gate') stepStatus = 'success';

    const summary = {};
    if (name === 'sast')     { summary.critical = rand(0,2); summary.high = rand(0,4); summary.total = rand(0,8); }
    if (name === 'sca')      { summary.criticalCves = rand(0,2); summary.highCves = rand(0,3); }
    if (name === 'dast')     { summary.highAlerts = rand(0,3); summary.xss = rand(0,2); }
    if (name === 'ml_score') { summary.score = rand(10,95); }
    if (name === 'gate')     { summary.decision = status === 'blocked' ? 'blocked' : 'approved'; }

    steps.push({ name, status: stepStatus, startedAt: new Date(t), completedAt, summary });
    t = completedAt;
  }
  return steps;
};

// Build realistic scan results
const buildScanResult = (pipelineId, riskLevel) => {
  const isRisky = riskLevel === 'high';

  const sastIssues = [];
  const issueCount = isRisky ? rand(3, 6) : rand(0, 2);
  for (let i = 0; i < issueCount; i++) {
    const rule = pick(SAST_RULES);
    sastIssues.push({ ...rule, filePath: pick(['src/index.js','src/api/auth.js','src/utils/db.js','public/app.js']), line: rand(10, 200) });
  }

  const cves = [];
  const cveCount = isRisky ? rand(2, 4) : rand(0, 1);
  for (let i = 0; i < cveCount; i++) cves.push(pick(CVES));

  const alerts = [];
  const alertCount = isRisky ? rand(2, 4) : rand(0, 2);
  for (let i = 0; i < alertCount; i++) {
    alerts.push({ ...pick(DAST_ALERTS), url: `https://staging.example.com/${pick(['search','login','profile','api/users'])}` });
  }

  const critical = sastIssues.filter(i => i.severity === 'critical').length;
  const high     = sastIssues.filter(i => i.severity === 'high').length;
  const medium   = sastIssues.filter(i => i.severity === 'medium').length;
  const critCves = cves.filter(c => c.severity === 'critical').length;
  const highCves = cves.filter(c => c.severity === 'high').length;
  const highAlerts = alerts.filter(a => a.risk === 'high').length;
  const xssCount   = alerts.filter(a => a.name.toLowerCase().includes('cross site')).length;
  const sqliCount  = alerts.filter(a => a.name.toLowerCase().includes('sql')).length;
  const score      = isRisky ? rand(65, 95) : rand(5, 55);

  return {
    pipeline: pipelineId,
    sast: {
      critical, high, medium,
      low: rand(0, 3),
      coverage: rand(60, 95),
      issues: sastIssues,
    },
    sca: {
      criticalCves: critCves,
      highCves,
      maxCvssScore: cves.length ? Math.max(...cves.map(c => c.cvssScore)) : 0,
      outdatedCount: rand(0, 5),
      cves,
    },
    dast: {
      highAlerts,
      mediumAlerts: alerts.filter(a => a.risk === 'medium').length,
      lowAlerts: alerts.filter(a => a.risk === 'low').length,
      xssCount,
      sqliCount,
      alerts,
    },
    mlScore: {
      score,
      modelVersion: '1.0.0',
      features: { critical, high, medium, nb_critical_cves: critCves, nb_high_cves: highCves, nb_high_alerts: highAlerts, nb_xss: xssCount, nb_sqli: sqliCount },
    },
  };
};

// ── Main seed function ────────────────────────────────────────────────────────

async function seed() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('❌  MONGO_URI not set. Make sure backend/.env exists.');
    process.exit(1);
  }

  console.log('🔌  Connecting to MongoDB…');
  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected\n');

  // ── Wipe existing data ──
  console.log('🗑️   Clearing existing data…');
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Pipeline.deleteMany({}),
    ScanResult.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  // ── Users ──
  console.log('👤  Creating users…');
  const hashedPw = await bcrypt.hash('password123', 10);

  const [admin, dev1, dev2] = await User.insertMany([
    { name: 'Admin User',    email: 'admin@secops.io',  password: hashedPw, role: 'admin' },
    { name: 'Alice Martin',  email: 'alice@secops.io',  password: hashedPw, role: 'developer' },
    { name: 'Bob Chen',      email: 'bob@secops.io',    password: hashedPw, role: 'developer' },
  ]);
  console.log(`   ✔ admin@secops.io  (password: password123)`);
  console.log(`   ✔ alice@secops.io  (password: password123)`);
  console.log(`   ✔ bob@secops.io    (password: password123)`);

  // ── Projects ──
  console.log('\n📁  Creating projects…');
  const projectDefs = [
    {
      name: 'E-Commerce API',
      description: 'Backend REST API for the main e-commerce platform',
      repoUrl: 'https://github.com/acme/ecommerce-api',
      stagingUrl: 'https://staging-api.acme.com',
      defaultBranch: 'main',
      owner: admin._id,
      members: [{ user: dev1._id, role: 'developer' }, { user: dev2._id, role: 'viewer' }],
      gateConfig: { threshold: 70, mode: 'block', notifySlack: true, notifyEmail: false, emailRecipients: [] },
    },
    {
      name: 'Customer Portal',
      description: 'React frontend for customer-facing dashboard',
      repoUrl: 'https://github.com/acme/customer-portal',
      stagingUrl: 'https://staging.acme.com',
      defaultBranch: 'main',
      owner: dev1._id,
      members: [{ user: admin._id, role: 'developer' }],
      gateConfig: { threshold: 65, mode: 'block', notifySlack: false, notifyEmail: true, emailRecipients: ['security@acme.com'] },
    },
    {
      name: 'Auth Microservice',
      description: 'JWT authentication and authorization service',
      repoUrl: 'https://github.com/acme/auth-service',
      stagingUrl: '',
      defaultBranch: 'develop',
      owner: admin._id,
      members: [{ user: dev2._id, role: 'developer' }],
      gateConfig: { threshold: 80, mode: 'block', notifySlack: true, notifyEmail: true, emailRecipients: ['admin@acme.com'] },
    },
    {
      name: 'Data Pipeline',
      description: 'ETL pipeline for analytics data processing',
      repoUrl: 'https://github.com/acme/data-pipeline',
      stagingUrl: '',
      defaultBranch: 'main',
      owner: dev2._id,
      members: [],
      gateConfig: { threshold: 60, mode: 'warn', notifySlack: false, notifyEmail: false, emailRecipients: [] },
    },
  ];

  const projects = await Project.insertMany(
    projectDefs.map(p => ({ ...p, webhookSecret: sha().slice(0, 40) }))
  );
  projects.forEach(p => console.log(`   ✔ ${p.name}`));

  // ── Pipelines + Scan Results + Audit Logs ──
  console.log('\n🚀  Creating pipelines and scan results…');

  const allPipelines  = [];
  const allScans      = [];
  const allAuditLogs  = [];

  // Distribute ~30 pipelines across the 4 projects
  const pipelineCounts = [10, 8, 7, 5];

  for (let pi = 0; pi < projects.length; pi++) {
    const project = projects[pi];
    const count   = pipelineCounts[pi];

    for (let i = 0; i < count; i++) {
      const daysBack  = rand(1, 60);
      const startedAt = daysAgo(daysBack);
      const riskLevel = Math.random() < 0.35 ? 'high' : 'low';
      const score     = riskLevel === 'high' ? rand(65, 95) : rand(5, 55);
      const threshold = project.gateConfig.threshold;
      const decision  = score >= threshold ? 'blocked' : 'approved';
      const status    = decision === 'blocked' ? 'blocked' : 'completed';
      const branch    = i === 0 ? project.defaultBranch : pick(BRANCHES);

      const pipeline = {
        project:       project._id,
        commitSha:     sha(),
        branch,
        commitMessage: pick(COMMIT_MSGS),
        author:        pick(AUTHORS),
        status,
        steps:         buildSteps(status, startedAt),
        score,
        decision,
        startedAt,
        completedAt:   new Date(startedAt.getTime() + rand(60, 600) * 1000),
      };

      allPipelines.push(pipeline);
    }
  }

  const insertedPipelines = await Pipeline.insertMany(allPipelines);

  for (const pipeline of insertedPipelines) {
    const riskLevel = pipeline.score >= 65 ? 'high' : 'low';
    allScans.push(buildScanResult(pipeline._id, riskLevel));

    // Audit log for each pipeline completion
    allAuditLogs.push({
      user:    pick([admin._id, dev1._id, dev2._id]),
      action:  pipeline.decision === 'blocked' ? 'PIPELINE_BLOCKED' : 'PIPELINE_COMPLETED',
      project: pipeline.project,
      details: { pipelineId: pipeline._id, score: pipeline.score, decision: pipeline.decision, branch: pipeline.branch },
      ipAddress: `192.168.1.${rand(1, 50)}`,
    });
  }

  await ScanResult.insertMany(allScans);

  // Extra audit logs for user/project actions
  for (const project of projects) {
    allAuditLogs.push({
      user: admin._id, action: 'PROJECT_CREATED',
      project: project._id,
      details: { name: project.name, repoUrl: project.repoUrl },
      ipAddress: '192.168.1.1',
    });
  }

  allAuditLogs.push(
    { user: admin._id,  action: 'LOGIN',    details: { email: 'admin@secops.io' },  ipAddress: '192.168.1.1' },
    { user: dev1._id,   action: 'LOGIN',    details: { email: 'alice@secops.io' },  ipAddress: '192.168.1.10' },
    { user: dev2._id,   action: 'LOGIN',    details: { email: 'bob@secops.io' },    ipAddress: '192.168.1.20' },
    { user: admin._id,  action: 'REGISTER', details: { email: 'admin@secops.io' },  ipAddress: '192.168.1.1' },
    { user: dev1._id,   action: 'REGISTER', details: { email: 'alice@secops.io' },  ipAddress: '192.168.1.10' },
  );

  await AuditLog.insertMany(allAuditLogs);

  // ── Summary ──
  const blockedCount   = insertedPipelines.filter(p => p.status === 'blocked').length;
  const completedCount = insertedPipelines.filter(p => p.status === 'completed').length;

  console.log(`   ✔ ${insertedPipelines.length} pipelines (${completedCount} approved, ${blockedCount} blocked)`);
  console.log(`   ✔ ${allScans.length} scan results`);
  console.log(`   ✔ ${allAuditLogs.length} audit log entries`);

  console.log('\n✅  Seed complete!\n');
  console.log('📋  Login credentials:');
  console.log('   admin@secops.io   / password123  (admin)');
  console.log('   alice@secops.io   / password123  (developer)');
  console.log('   bob@secops.io     / password123  (developer)');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});