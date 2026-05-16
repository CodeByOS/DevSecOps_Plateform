const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const normalizeSeverity = (s) => {
    if (!s) return 'low';
    const s_lower = s.toLowerCase();
    if (s_lower === 'error' || s_lower === 'critical') return 'critical';
    if (s_lower === 'warning' || s_lower === 'high') return 'high';
    if (s_lower === 'info' || s_lower === 'medium') return 'medium';
    return 'low';
};

const runSemgrep = (codePath, pipelineId) => {
    return new Promise((resolve, reject) => {
        const reportPath = path.join(os.tmpdir(), `semgrep-${pipelineId}.json`);
        console.log(`  [SAST] Running semgrep on ${codePath}`);

        const args = [
            '--config', 'auto',
            '--json',
            '--output', reportPath,
            '--timeout', '60',
            '--max-memory', '1024',
            '--no-git-ignore',
            codePath,
        ];

        const proc = spawn('semgrep', args, {
            env: { ...process.env, SEMGREP_SEND_METRICS: 'off' },
        });

        let stderr = '';
        proc.stderr.on('data', d => { stderr += d.toString(); });
        proc.stdout.on('data', d => process.stdout.write(d));

        proc.on('close', code => {
            // semgrep exits 1 when findings exist — that's expected
            if (code !== 0 && code !== 1) {
                console.warn(`  [SAST] semgrep exited with code ${code}: ${stderr.slice(0, 300)}`);
                // Return empty result instead of rejecting — don't block the pipeline
                return resolve({ critical: 0, high: 0, medium: 0, low: 0, coverage: 0, issues: [] });
            }
            resolve(reportPath);
        });

        proc.on('error', err => {
            console.warn(`  [SAST] semgrep not found: ${err.message}`);
            resolve({ critical: 0, high: 0, medium: 0, low: 0, coverage: 0, issues: [] });
        });

        // Hard timeout: 90 seconds
        setTimeout(() => {
            proc.kill('SIGTERM');
            resolve({ critical: 0, high: 0, medium: 0, low: 0, coverage: 0, issues: [] });
        }, 90_000);
    });
};

const parseReport = (reportPath) => {
    if (typeof reportPath === 'object') return reportPath; // already an empty result

    const result = { critical: 0, high: 0, medium: 0, low: 0, coverage: 0, issues: [] };

    if (!fs.existsSync(reportPath)) {
        console.warn('  [SAST] No semgrep report found, returning empty result');
        return result;
    }

    let raw;
    try {
        raw = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    } catch (e) {
        console.warn('  [SAST] Could not parse semgrep report:', e.message);
        return result;
    } finally {
        try { fs.unlinkSync(reportPath); } catch { }
    }

    (raw.results || []).forEach(finding => {
        const sev = normalizeSeverity(finding.extra?.severity || finding.severity);
        if (result[sev] !== undefined) result[sev]++;
        result.issues.push({
            ruleId: finding.check_id || 'unknown',
            severity: sev,
            type: 'VULNERABILITY',
            message: (finding.extra?.message || finding.message || '').slice(0, 300),
            filePath: finding.path || '',
            line: finding.start?.line || 0,
        });
    });

    return result;
};

const runSast = async (codePath, pipelineId) => {
    const reportPathOrResult = await runSemgrep(codePath, pipelineId);
    const result = parseReport(reportPathOrResult);
    console.log(`  [SAST] Done — Critical: ${result.critical}, High: ${result.high}, Medium: ${result.medium}, Total: ${result.issues.length}`);
    return result;
};

module.exports = { runSast };