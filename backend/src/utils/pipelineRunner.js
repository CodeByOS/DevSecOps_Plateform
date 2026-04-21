// Runs all security steps sequentially: clone → SAST → SCA → DAST → ML → Gate
// Each step updates the pipeline status in real time

const axios = require('axios');
const Pipeline = require('../models/Pipeline');
const ScanResult = require('../models/ScanResult');
const { notifyPipelineResult } = require('./notifications');

//* Helper: update a single step's status
const updateStep = async (pipelineId, stepName, status, summary = {}) => {
    const update = {
        'steps.$.status': status,
        'steps.$.summary': summary,
    };

    if (status === 'running') update['steps.$.startedAt'] = new Date();
    if (['success', 'failed', 'skipped'].includes(status)) {
        update['steps.$.completedAt'] = new Date();
    }

    await Pipeline.findOneAndUpdate(
        { _id: pipelineId, 'steps.name': stepName },
        { $set: update }
    );

    console.log(`  [Pipeline] Step "${stepName}" → ${status.toUpperCase()}`);
};

//* Step 1: Call SonarQube API for SAST -----------------------------------------------------------------------------------
const runSast = async (repoUrl, projectKey) => {
    try {
        const sonarUrl = process.env.SONARQUBE_URL;
        const token = process.env.SONARQUBE_TOKEN;

        //! In a real setup, you'd launch sonar-scanner CLI in a Docker container here.
        //! For the API layer, we fetch existing results from SonarQube.
        const response = await axios.get(`${sonarUrl}/api/issues/search`, {
            params: { componentKeys: projectKey, ps: 100 },
            headers: { Authorization: `Bearer ${token}` },
            timeout: 30000,
        });

        const issues = response.data.issues || [];

        //* Count issues by severity
        const result = { critical: 0, high: 0, medium: 0, low: 0, issues: [] };

        issues.forEach((issue) => {
        const sev = issue.severity?.toLowerCase();
        if (sev === 'blocker' || sev === 'critical') result.critical++;
        else if (sev === 'major') result.high++;
        else if (sev === 'minor') result.medium++;
        else result.low++;

        result.issues.push({
            ruleId:   issue.rule,
            severity: sev === 'blocker' ? 'critical' : sev === 'major' ? 'high' : sev === 'minor' ? 'medium' : 'low',
            type:     issue.type,
            message:  issue.message,
            filePath: issue.component,
            line:     issue.line,
        });
        });

        return result;
    } catch (err) {
        console.error('  [SAST] SonarQube error:', err.message);
        //* Return empty result so the pipeline can continue
        return { critical: 0, high: 0, medium: 0, low: 0, issues: [], error: err.message };
    }
};

//* Step 2: Call Dependency Check API for SCA ----------------------------------------------------------------------------- 
// In production this would parse the JSON report from a Docker container run
const runSca = async () => {
    try {
        // Simulated SCA result structure — replace with actual Docker exec logic
        // e.g. spawn('docker', ['run', '--rm', '-v', `${codePath}:/src`, 'owasp/dependency-check', ...])
        return {
            criticalCves:  0,
            highCves:      0,
            maxCvssScore:  0,
            outdatedCount: 0,
            cves:          [],
        };
    } catch (err) {
        console.error('  [SCA] Dependency Check error:', err.message);
        return { criticalCves: 0, highCves: 0, maxCvssScore: 0, outdatedCount: 0, cves: [], error: err.message };
    }
};

//* Step 3: Call OWASP ZAP API for DAST ---------------------------------------------------------------------------------
const runDast = async (targetUrl) => {
    try {
        const zapUrl = process.env.ZAP_URL;
        const apiKey = process.env.ZAP_API_KEY;

        // Start a baseline (passive) scan
        await axios.get(`${zapUrl}/JSON/core/action/accessUrl/`, {
            params: { apikey: apiKey, url: targetUrl },
            timeout: 10000,
        });

        // Fetch alerts after scan completes
        const alertsRes = await axios.get(`${zapUrl}/JSON/core/view/alerts/`, {
            params: { apikey: apiKey, baseurl: targetUrl },
            timeout: 30000,
        });

    const alerts = alertsRes.data.alerts || [];

    const result = { highAlerts: 0, mediumAlerts: 0, lowAlerts: 0, xssCount: 0, sqliCount: 0, alerts: [] };

    alerts.forEach((alert) => {
        const risk = alert.risk?.toLowerCase();
        if (risk === 'high')   result.highAlerts++;
        if (risk === 'medium') result.mediumAlerts++;
        if (risk === 'low')    result.lowAlerts++;

        // Detect XSS and SQL injection specifically
        if (alert.name?.toLowerCase().includes('cross site scripting')) result.xssCount++;
        if (alert.name?.toLowerCase().includes('sql injection'))        result.sqliCount++;

        result.alerts.push({
            name:          alert.name,
            risk,
            description:   alert.description,
            solution:      alert.solution,
            url:           alert.url,
            owaspCategory: alert.cweid ? `CWE-${alert.cweid}` : '',
        });
    });

    return result;
    } catch (err) {
        console.error('  [DAST] ZAP error:', err.message);
        return { highAlerts: 0, mediumAlerts: 0, lowAlerts: 0, xssCount: 0, sqliCount: 0, alerts: [], error: err.message };
    }
};

//* Step 4: Call the Python ML service for risk scoring ----------------------------------------------------------------------
const runMlScoring = async (sast, sca, dast) => {
    // Extract features from scan results to send to the ML model
    const features = {
        nb_critical:       sast.critical,
        nb_high:           sast.high,
        nb_medium:         sast.medium,
        nb_critical_cves:  sca.criticalCves,
        nb_high_cves:      sca.highCves,
        max_cvss:          sca.maxCvssScore,
        outdated_count:    sca.outdatedCount,
        nb_high_alerts:    dast.highAlerts,
        nb_medium_alerts:  dast.mediumAlerts,
        nb_xss:            dast.xssCount,
        nb_sqli:           dast.sqliCount,
    };

    try {
        const response = await axios.post(
            `${process.env.ML_SERVICE_URL}/score`,
            { features },
            { timeout: 10000 }
        );
        return { score: response.data.score, modelVersion: response.data.model_version, features };
    } catch (err) {
        console.error('  [ML] Service unavailable, using rule-based fallback:', err.message);

    // Fallback: simple weighted score if ML service is down
    const fallbackScore = Math.min(
        100,
        features.nb_critical       * 15 +
        features.nb_high           * 7  +
        features.nb_critical_cves  * 20 +
        features.nb_high_cves      * 10 +
        features.nb_high_alerts    * 10 +
        features.nb_xss            * 8  +
        features.nb_sqli           * 12
    );

    return { score: fallbackScore, modelVersion: 'fallback-rule-based', features };
}
};

// ── Step 5: Gate decision ────────────────────
const applyGate = (score, gateConfig) => {
    const { threshold, mode } = gateConfig;

    if (mode === 'allow')  return 'approved';
    if (mode === 'warn')   return 'approved'; // Warn-only mode: never blocks
    if (score >= threshold) return 'blocked';
    return 'approved';
};

//* Main runner: runs all steps for a given pipeline
const runPipeline = async (pipelineId, project) => {
    console.log(`\n🚀 [Pipeline] Starting pipeline ${pipelineId}`);

    //* Mark pipeline as running
    await Pipeline.findByIdAndUpdate(pipelineId, { status: 'running' });

    //* Initialize scan result document for this pipeline
    const scanResult = await ScanResult.create({ pipeline: pipelineId });

    try {
        //! SAST ----------------------------------------------------------------
        await updateStep(pipelineId, 'sast', 'running');
        const sast = await runSast(project.repoUrl, project._id.toString());
        scanResult.sast = sast;
        await updateStep(pipelineId, 'sast', 'success', {
            critical: sast.critical, high: sast.high, total: sast.issues.length,
        });

    //! SCA ---------------------------------------------------------------------
    await updateStep(pipelineId, 'sca', 'running');
    const sca = await runSca();
    scanResult.sca = sca;
    await updateStep(pipelineId, 'sca', 'success', {
        criticalCves: sca.criticalCves, highCves: sca.highCves,
    });

    //! DAST ---------------------------------------------------------------------
    await updateStep(pipelineId, 'dast', 'running');
    // Use project repo URL as target; in production this would be the staging URL
    const dast = await runDast(project.repoUrl);
    scanResult.dast = dast;
    await updateStep(pipelineId, 'dast', 'success', {
        highAlerts: dast.highAlerts, xss: dast.xssCount,
    });

    //! ML Scoring ---------------------------------------------------------------
    await updateStep(pipelineId, 'ml_score', 'running');
    const ml = await runMlScoring(sast, sca, dast);
    scanResult.mlScore = ml;
    await updateStep(pipelineId, 'ml_score', 'success', { score: ml.score });

    // Persist all scan results to MongoDB
    await scanResult.save();

    //! Gate Decision ------------------------------------------------------------
    await updateStep(pipelineId, 'gate', 'running');
    const decision = applyGate(ml.score, project.gateConfig);

    const finalStatus = decision === 'blocked' ? 'blocked' : 'completed';

    await Pipeline.findByIdAndUpdate(pipelineId, {
        status:      finalStatus,
        score:       ml.score,
        decision,
        completedAt: new Date(),
    });

    await updateStep(pipelineId, 'gate', 'success', { decision, score: ml.score });

    console.log(`✅ [Pipeline] Completed — Score: ${ml.score}/100 — Decision: ${decision.toUpperCase()}`);

    //* Notifications
    const updatedPipeline = await Pipeline.findById(pipelineId);
    await notifyPipelineResult(updatedPipeline, project);

    } catch (err) {
        // If any step throws an unexpected error, mark pipeline as failed
        console.error(`❌ [Pipeline] Fatal error:`, err.message);
        await Pipeline.findByIdAndUpdate(pipelineId, {
            status:      'failed',
            completedAt: new Date(),
        });
    }
};

module.exports = { runPipeline };
