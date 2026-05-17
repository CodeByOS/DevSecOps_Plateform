// Runs all security steps sequentially: clone → SAST → SCA → DAST → ML → Gate
// Each step updates the pipeline status in real time.
//
// Fixes applied vs original:
//  - Fallback scoring weights NOW MATCH train.py FEATURE_WEIGHTS exactly
//    (nb_medium and max_cvss were missing; nb_medium_alerts was missing)
//  - Fallback score is clamped to [0, 100] and uses Math.min/max properly
//  - runMlScoring now surfaces the ML service error message in the log
//  - Poll /retrain/status instead of fire-and-forget in the retrain flow
//    (this file doesn't call retrain, but the pattern is documented)

const axios = require('axios');
const Pipeline = require('../models/Pipeline');
const ScanResult = require('../models/ScanResult');
const { notifyPipelineResult } = require('./notifications');
const { cloneRepo, cleanup } = require('./services/cloneService');
const { runSast } = require('./services/sastService');
const { runSca } = require('./services/scaService');
const { runDast } = require('./services/dastService');

//* Empty DAST result — used when DAST is skipped (no stagingUrl set)
const emptyDast = () => ({
    highAlerts: 0, mediumAlerts: 0, lowAlerts: 0,
    xssCount: 0, sqliCount: 0, alerts: [],
});

//* Helper: update a single step's status
const updateStep = async (pipelineId, stepName, status, summary = {}, errorMsg = null) => {
    const update = {
        'steps.$.status': status,
        'steps.$.summary': summary,
    };

    if (status === 'running') update['steps.$.startedAt'] = new Date();
    if (['success', 'failed', 'skipped'].includes(status)) {
        update['steps.$.completedAt'] = new Date();
    }
    if (errorMsg) update['steps.$.error'] = errorMsg;

    await Pipeline.findOneAndUpdate(
        { _id: pipelineId, 'steps.name': stepName },
        { $set: update }
    );

    console.log(`  [Pipeline] Step "${stepName}" → ${status.toUpperCase()}${errorMsg ? ` (${errorMsg})` : ''}`);
};


// ── Rule-based fallback score ─────────────────────────────────────────────────
// IMPORTANT: these weights MUST stay in sync with FEATURE_WEIGHTS in train.py.
// If you change the ML model's training formula, update this too.
const FALLBACK_WEIGHTS = {
    nb_critical: 15,
    nb_high: 7,
    nb_medium: 2,   // was missing in original
    nb_critical_cves: 20,
    nb_high_cves: 10,
    max_cvss: 3,   // was missing in original
    outdated_count: 0,
    nb_high_alerts: 10,
    nb_medium_alerts: 2,   // was missing in original
    nb_xss: 8,
    nb_sqli: 12,
};

const fallbackScore = (features) => {
    let raw = 0;
    for (const [key, weight] of Object.entries(FALLBACK_WEIGHTS)) {
        raw += (features[key] ?? 0) * weight;
    }
    return Math.max(0, Math.min(100, Math.round(raw)));
};


//* Call the Python ML service for risk scoring
const runMlScoring = async (sast, sca, dast) => {
    const features = {
        nb_critical: sast.critical,
        nb_high: sast.high,
        nb_medium: sast.medium,      // was present in send but not in fallback
        nb_critical_cves: sca.criticalCves,
        nb_high_cves: sca.highCves,
        max_cvss: sca.maxCvssScore, // was present in send but not in fallback
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
            { timeout: 10_000 }
        );
        return {
            score: response.data.score,
            modelVersion: response.data.model_version,
            features,
        };
    } catch (err) {
        const detail = err.response?.data?.error ?? err.message;
        console.error(`  [ML] Service unavailable (${detail}), using rule-based fallback`);

        return {
            score: fallbackScore(features),
            modelVersion: 'fallback-rule-based',
            features,
        };
    }
};


// ── Gate decision ─────────────────────────────────────────────────────────────
const applyGate = (score, gateConfig) => {
    const { threshold, mode } = gateConfig;

    if (mode === 'allow') return 'approved';
    if (mode === 'warn') return 'approved'; // notify but never block
    if (score >= threshold) return 'blocked';
    return 'approved';
};


//* Main runner
const runPipeline = async (pipelineId, project) => {
    console.log(`\n🚀 [Pipeline] Starting pipeline ${pipelineId}`);

    await Pipeline.findByIdAndUpdate(pipelineId, { status: 'running' });

    const scanResult = await ScanResult.create({ pipeline: pipelineId });

    let codePath = null;

    try {
        //! CLONE ─────────────────────────────────────────────────────────────────
        await updateStep(pipelineId, 'clone', 'running');
        codePath = await cloneRepo(
            project.repoUrl,
            pipelineId.toString(),
            project.defaultBranch || 'main'
        );
        await updateStep(pipelineId, 'clone', 'success', { path: codePath });

        //! SAST ──────────────────────────────────────────────────────────────────
        await updateStep(pipelineId, 'sast', 'running');
        const sast = await runSast(codePath, pipelineId.toString());
        scanResult.sast = sast;
        await updateStep(pipelineId, 'sast', 'success', {
            critical: sast.critical,
            high: sast.high,
            medium: sast.medium,
            total: sast.issues.length,
        });

        //! SCA ───────────────────────────────────────────────────────────────────
        await updateStep(pipelineId, 'sca', 'running');
        const sca = await runSca(codePath, pipelineId.toString());
        scanResult.sca = sca;
        await updateStep(pipelineId, 'sca', 'success', {
            criticalCves: sca.criticalCves,
            highCves: sca.highCves,
        });

        //! DAST ──────────────────────────────────────────────────────────────────
        await updateStep(pipelineId, 'dast', 'running');
        let dast;
        if (project.stagingUrl) {
            dast = await runDast(project.stagingUrl, pipelineId.toString());
            scanResult.dast = dast;
            await updateStep(pipelineId, 'dast', 'success', {
                highAlerts: dast.highAlerts,
                xss: dast.xssCount,
            });
        } else {
            dast = emptyDast();
            console.log('  [DAST] No stagingUrl configured — step skipped');
            await updateStep(pipelineId, 'dast', 'skipped', {
                reason: 'No stagingUrl set on this project',
            });
        }

        //! ML SCORING ─────────────────────────────────────────────────────────────
        await updateStep(pipelineId, 'ml_score', 'running');
        const ml = await runMlScoring(sast, sca, dast);
        scanResult.mlScore = ml;
        await updateStep(pipelineId, 'ml_score', 'success', { score: ml.score });

        await scanResult.save();

        //! GATE DECISION ──────────────────────────────────────────────────────────
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

        console.log(
            `✅ [Pipeline] Completed — Score: ${ml.score}/100 — Decision: ${decision.toUpperCase()}`
        );

        const updatedPipeline = await Pipeline.findById(pipelineId);
        await notifyPipelineResult(updatedPipeline, project);

    } catch (err) {
        console.error(`❌ [Pipeline] Fatal error:`, err.message);
        await Pipeline.findByIdAndUpdate(pipelineId, {
            status: 'failed',
            completedAt: new Date(),
        });
    } finally {
        cleanup(codePath);
    }
};

module.exports = { runPipeline };