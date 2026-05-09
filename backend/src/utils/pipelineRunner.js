// Runs all security steps sequentially: clone → SAST → SCA → DAST → ML → Gate
// Each step updates the pipeline status in real time

const axios = require('axios');
const Pipeline = require('../models/Pipeline');
const ScanResult = require('../models/ScanResult');
const { notifyPipelineResult } = require('./notifications');
const { cloneRepo, cleanup } = require('./services/cloneService');
const { runSast } = require('./services/sastService');
const { runSca }  = require('./services/scaService');
const { runDast } = require('./services/dastService');

//* Empty DAST result — used when DAST is skipped (no stagingUrl set)
const emptyDast = () => ({
    highAlerts: 0, mediumAlerts: 0, lowAlerts: 0,
    xssCount: 0, sqliCount: 0, alerts: [],
});

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


//* Call the Python ML service for risk scoring ----------------------------------------------------------------------
const runMlScoring = async (sast, sca, dast) => {
    // Extract features from scan results to send to the ML model
    const features = {
        nb_critical: sast.critical,
        nb_high: sast.high,
        nb_medium: sast.medium,
        nb_critical_cves: sca.criticalCves,
        nb_high_cves: sca.highCves,
        max_cvss: sca.maxCvssScore,
        outdated_count: sca.outdatedCount,
        nb_high_alerts: dast.highAlerts,
        nb_medium_alerts: dast.mediumAlerts,
        nb_xss: dast.xssCount,
        nb_sqli: dast.sqliCount,
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
            features.nb_critical * 15 +
            features.nb_high * 7 +
            features.nb_critical_cves * 20 +
            features.nb_high_cves * 10 +
            features.nb_high_alerts * 10 +
            features.nb_xss * 8 +
            features.nb_sqli * 12
        );

        return { score: fallbackScore, modelVersion: 'fallback-rule-based', features };
    }
};

// ── Step 5: Gate decision ────────────────────
const applyGate = (score, gateConfig) => {
    const { threshold, mode } = gateConfig;

    if (mode === 'allow') return 'approved';
    if (mode === 'warn') return 'approved'; // Warn-only mode: never blocks
    if (score >= threshold) return 'blocked';
    return 'approved';
};

//* Main runner: executes all steps for a given pipeline
const runPipeline = async (pipelineId, project) => {
    console.log(`\n🚀 [Pipeline] Starting pipeline ${pipelineId}`);

    await Pipeline.findByIdAndUpdate(pipelineId, { status: 'running' });

    const scanResult = await ScanResult.create({ pipeline: pipelineId });

    // codePath is set by the clone step; always cleaned up in the finally block
    let codePath = null;

    try {
        //! CLONE ---------------------------------------------------------------
        await updateStep(pipelineId, 'clone', 'running');
        codePath = await cloneRepo(
            project.repoUrl,
            pipelineId.toString(),
            project.defaultBranch || 'main'
        );
        await updateStep(pipelineId, 'clone', 'success', { path: codePath });

        //! SAST ----------------------------------------------------------------
        await updateStep(pipelineId, 'sast', 'running');
        const sast = await runSast(codePath, pipelineId.toString());
        scanResult.sast = sast;
        await updateStep(pipelineId, 'sast', 'success', {
            critical: sast.critical,
            high:     sast.high,
            total:    sast.issues.length,
        });

        //! SCA ----------------------------------------------------------------
        await updateStep(pipelineId, 'sca', 'running');
        const sca = await runSca(codePath, pipelineId.toString());
        scanResult.sca = sca;
        await updateStep(pipelineId, 'sca', 'success', {
            criticalCves: sca.criticalCves,
            highCves:     sca.highCves,
        });

        //! DAST ---------------------------------------------------------------
        await updateStep(pipelineId, 'dast', 'running');
        let dast;
        if (project.stagingUrl) {
            // Run ZAP against the live staging environment
            dast = await runDast(project.stagingUrl, pipelineId.toString());
            scanResult.dast = dast;
            await updateStep(pipelineId, 'dast', 'success', {
                highAlerts: dast.highAlerts,
                xss:        dast.xssCount,
            });
        } else {
            // No staging URL configured — skip DAST gracefully
            dast = emptyDast();
            console.log('  [DAST] No stagingUrl configured — step skipped');
            await updateStep(pipelineId, 'dast', 'skipped', {
                reason: 'No stagingUrl set on this project',
            });
        }

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
            status: finalStatus,
            score: ml.score,
            decision,
            completedAt: new Date(),
        });

        await updateStep(pipelineId, 'gate', 'success', { decision, score: ml.score });

        console.log(`✅ [Pipeline] Completed — Score: ${ml.score}/100 — Decision: ${decision.toUpperCase()}`);

        //* Notifications
        const updatedPipeline = await Pipeline.findById(pipelineId);
        await notifyPipelineResult(updatedPipeline, project);

    } catch (err) {
        console.error(`❌ [Pipeline] Fatal error:`, err.message);
        await Pipeline.findByIdAndUpdate(pipelineId, {
            status:      'failed',
            completedAt: new Date(),
        });
    } finally {
        // Always delete the local clone — whether pipeline passed or failed
        cleanup(codePath);
    }
};

module.exports = { runPipeline };
