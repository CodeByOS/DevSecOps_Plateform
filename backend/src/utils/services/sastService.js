const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Severity normalisation 
// Semgrep emits: ERROR | WARNING | INFO (and sometimes the literals below)
// We map these onto our 5-level scale.
const normalizeSeverity = (s) => {
    if (!s) return 'low';
    switch (s.toLowerCase()) {
        case 'critical': return 'critical';
        case 'error': return 'high';      // semgrep ERROR → high
        case 'high': return 'high';
        case 'warning': return 'medium';    // semgrep WARNING → medium
        case 'medium': return 'medium';
        case 'info': return 'info';      // semgrep INFO → info (was wrongly mapped to medium)
        case 'low': return 'low';
        default: return 'low';
    }
};

// Semgrep invocation
// Preferred ruleset order (offline-friendly, no network required after install):
//   1. p/owasp-top-ten  – high-signal security rules
//   2. p/secrets        – credential/key detection
//   3. p/default        – broad best-practice rules (fallback when auto is unavailable)
//
// We avoid '--config auto' because it requires Semgrep to phone home at scan time,
// which is unreliable in air-gapped or resource-limited CI environments.
// If none of the named packs are available (e.g. fresh install without login),
// we fall back to 'auto' so scans still run in development.

const SEMGREP_RULESETS = [
    'p/owasp-top-ten',
    'p/secrets',
    'p/default',
];

const SEMGREP_TIMEOUT_MS = 120_000; // 2 min hard kill
const MAX_ISSUES = 500;     // cap to prevent huge documents

const runSemgrep = (codePath, pipelineId) => {
    return new Promise((resolve) => {
        const reportPath = path.join(os.tmpdir(), `semgrep-${pipelineId}.json`);

        // Remove any stale report from a previous run
        try { fs.unlinkSync(reportPath); } catch { /* ignore */ }

        console.log(`  [SAST] Running semgrep on ${codePath}`);

        // Build args – try preferred ruleset first, fall back to auto
        const configs = SEMGREP_RULESETS.flatMap(r => ['--config', r]);

        const args = [
            ...configs,
            '--json',
            '--output', reportPath,
            '--timeout', '60',          // per-file timeout (seconds)
            '--max-memory', '1024',     // MB
            '--jobs', '2',              // parallelism (keep container RAM bounded)
            '--quiet',                  // suppress progress output to stderr
            '--',                       // treat everything after as positional args
            codePath,
        ];

        // Minimal safe environment: only pass what semgrep needs.
        // Never forward the full process.env which may contain DB passwords, JWT secrets, etc.
        const safeEnv = {
            HOME: process.env.HOME ?? '/root',
            PATH: process.env.PATH ?? '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
            TMPDIR: os.tmpdir(),
            SEMGREP_SEND_METRICS: 'off',  // disable telemetry
            SEMGREP_VERSION_CHECK_TIMEOUT: '0',
        };

        let timedOut = false;
        const proc = spawn('semgrep', args, { env: safeEnv });

        // Collect stderr for diagnostics
        let stderr = '';
        proc.stderr.on('data', (d) => { stderr += d.toString(); });
        // stdout is piped to the JSON file, but drain it anyway
        proc.stdout.on('data', () => { });

        // Hard-kill timer
        const timer = setTimeout(() => {
            timedOut = true;
            proc.kill('SIGKILL');
            console.warn(`  [SAST] Timed out after ${SEMGREP_TIMEOUT_MS / 1000}s — returning empty result`);
            resolve({ timedOut: true, reportPath: null });
        }, SEMGREP_TIMEOUT_MS);

        proc.on('close', (code) => {
            clearTimeout(timer);
            if (timedOut) return; // already resolved

            // Semgrep exit codes:
            //   0  – success, no findings
            //   1  – success, findings found
            //   2+ – error (bad config, parse failure, etc.)
            if (code !== null && code > 1) {
                const snippet = stderr.slice(0, 400);
                console.warn(`  [SAST] semgrep exited with code ${code}: ${snippet}`);

                // If the preferred rulesets failed (e.g. not logged in), retry with 'auto'
                if (stderr.includes('No rules found') || stderr.includes('Could not find')) {
                    console.warn('  [SAST] Falling back to --config auto');
                    resolve({ fallback: true, reportPath });
                } else {
                    resolve({ reportPath: null }); // error path
                }
                return;
            }

            resolve({ reportPath });
        });

        proc.on('error', (err) => {
            clearTimeout(timer);
            if (timedOut) return;
            console.warn(`  [SAST] semgrep not found or failed to start: ${err.message}`);
            resolve({ reportPath: null, notFound: true });
        });
    });
};

// Retry with --config auto when preferred packs aren't available
const runSemgrepAuto = (codePath, pipelineId) => {
    return new Promise((resolve) => {
        const reportPath = path.join(os.tmpdir(), `semgrep-${pipelineId}.json`);
        const args = [
            '--config', 'auto',
            '--json',
            '--output', reportPath,
            '--timeout', '60',
            '--max-memory', '1024',
            '--jobs', '2',
            '--quiet',
            '--',
            codePath,
        ];

        const safeEnv = {
            HOME: process.env.HOME ?? '/root',
            PATH: process.env.PATH ?? '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
            TMPDIR: os.tmpdir(),
            SEMGREP_SEND_METRICS: 'off',
        };

        let timedOut = false;
        const proc = spawn('semgrep', args, { env: safeEnv });
        proc.stdout.on('data', () => { });
        let stderr = '';
        proc.stderr.on('data', (d) => { stderr += d.toString(); });

        const timer = setTimeout(() => {
            timedOut = true;
            proc.kill('SIGKILL');
            resolve({ reportPath: null });
        }, SEMGREP_TIMEOUT_MS);

        proc.on('close', (code) => {
            clearTimeout(timer);
            if (timedOut) return;
            resolve({ reportPath: (code === 0 || code === 1) ? reportPath : null });
        });

        proc.on('error', () => {
            clearTimeout(timer);
            resolve({ reportPath: null });
        });
    });
};

// Report parsing 
const emptyResult = () => ({
    critical: 0, high: 0, medium: 0, low: 0, info: 0, coverage: 0, issues: [],
});

const parseReport = (reportPath) => {
    if (!reportPath) return emptyResult();

    if (!fs.existsSync(reportPath)) {
        console.warn('  [SAST] No semgrep report found at', reportPath);
        return emptyResult();
    }

    let raw;
    try {
        raw = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    } catch (e) {
        console.warn('  [SAST] Could not parse semgrep report:', e.message);
        return emptyResult();
    } finally {
        // Always clean up the temp file
        try { fs.unlinkSync(reportPath); } catch { /* ignore */ }
    }

    const result = emptyResult();
    const findings = (raw.results ?? []).slice(0, MAX_ISSUES);

    for (const finding of findings) {
        const sev = normalizeSeverity(
            finding.extra?.severity ?? finding.severity ?? ''
        );

        // Increment severity counter (info doesn't map to a named counter → skip)
        if (sev === 'critical') result.critical++;
        else if (sev === 'high') result.high++;
        else if (sev === 'medium') result.medium++;
        else if (sev === 'low') result.low++;
        else if (sev === 'info') result.info++;

        result.issues.push({
            ruleId: finding.check_id ?? 'unknown',
            severity: sev,
            type: finding.extra?.metadata?.category ?? 'VULNERABILITY',
            message: (finding.extra?.message ?? finding.message ?? '').slice(0, 400),
            filePath: finding.path ?? '',
            line: finding.start?.line ?? 0,
        });
    }

    // Rough coverage proxy: number of unique files scanned (if available)
    // Semgrep doesn't emit a coverage % by default; we leave it 0 unless
    // the report includes 'paths.scanned'.
    if (Array.isArray(raw.paths?.scanned)) {
        const scanned = raw.paths.scanned.length;
        const total = (raw.paths?.scanned?.length ?? 0) + (raw.paths?.ignored?.length ?? 0);
        result.coverage = total > 0 ? Math.round((scanned / total) * 100) : 0;
    }

    return result;
};

// Public API 
const runSast = async (codePath, pipelineId) => {
    let { reportPath, fallback, notFound, timedOut } = await runSemgrep(codePath, pipelineId);

    if (notFound) {
        console.warn('  [SAST] semgrep binary not found — skipping SAST step');
        return emptyResult();
    }

    if (timedOut) {
        console.warn('  [SAST] scan timed out — returning empty result');
        return emptyResult();
    }

    if (fallback) {
        // Primary ruleset failed; retry with 'auto'
        const retry = await runSemgrepAuto(codePath, pipelineId);
        reportPath = retry.reportPath;
    }

    const result = parseReport(reportPath);

    console.log(
        `  [SAST] Done — Critical: ${result.critical}, High: ${result.high}, ` +
        `Medium: ${result.medium}, Low: ${result.low}, Info: ${result.info}, ` +
        `Total: ${result.issues.length}`
    );

    return result;
};

module.exports = { runSast };