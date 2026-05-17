// Stores the security scan results for a pipeline
// One document per pipeline, containing results from all three tools

const mongoose = require('mongoose');

//* Individual issue found by Semgrep (SAST)
const SastIssueSchema = new mongoose.Schema(
  {
    ruleId: String,
    severity: { type: String, enum: ['critical', 'high', 'medium', 'low', 'info'] },
    type: String,        // BUG, VULNERABILITY, CODE_SMELL
    message: String,
    filePath: String,
    line: Number,
  },
  { _id: false }
);

//* Individual CVE found by Dependency Check (SCA)
const CveSchema = new mongoose.Schema(
  {
    cveId: String,
    cvssScore: Number,
    severity: String,
    description: String,
    packageName: String,
    installedVersion: String,
    fixedVersion: String,
  },
  { _id: false }
);

//* Individual alert found by OWASP ZAP (DAST)
const DastAlertSchema = new mongoose.Schema(
  {
    name: String,
    risk: { type: String, enum: ['high', 'medium', 'low', 'informational'] },
    description: String,
    solution: String,
    url: String,
    owaspCategory: String,
  },
  { _id: false }
);

const ScanResultSchema = new mongoose.Schema(
  {
    pipeline: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pipeline',
      required: true,
      unique: true, // One scan result document per pipeline
    },

    //* SAST results (Semgrep)
    sast: {
      critical: { type: Number, default: 0 },
      high:     { type: Number, default: 0 },
      medium:   { type: Number, default: 0 },
      low:      { type: Number, default: 0 },
      coverage: { type: Number, default: 0 }, // Code coverage percentage
      issues:   { type: [SastIssueSchema], default: [] },
    },

    //* SCA results (Dependency Check)
    sca: {
      criticalCves:  { type: Number, default: 0 },
      highCves:      { type: Number, default: 0 },
      maxCvssScore:  { type: Number, default: 0 },
      outdatedCount: { type: Number, default: 0 },
      cves:          { type: [CveSchema], default: [] },
    },

    //* DAST results (OWASP ZAP)
    dast: {
      highAlerts:   { type: Number, default: 0 },
      mediumAlerts: { type: Number, default: 0 },
      lowAlerts:    { type: Number, default: 0 },
      xssCount:     { type: Number, default: 0 },
      sqliCount:    { type: Number, default: 0 },
      alerts:       { type: [DastAlertSchema], default: [] },
    },

    //* ML Score
    mlScore: {
      score:        { type: Number, default: null }, // 0-100
      modelVersion: { type: String, default: null },
      features:     { type: Object, default: {} },   // Raw features sent to ML service
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ScanResult', ScanResultSchema);
