// backend/src/utils/services/scaService.js
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const runSca = async (codePath, pipelineId) => {
    console.log(`  [SCA] Running npm audit on ${codePath}`);
    return new Promise((resolve) => {
        // Check if package.json exists
        if (!fs.existsSync(path.join(codePath, 'package.json'))) {
            console.log('  [SCA] No package.json found — skipping');
            return resolve(emptyResult());
        }

        const proc = spawn('npm', ['audit', '--json', '--prefix', codePath], {
            cwd: codePath,
            env: { ...process.env, npm_config_update_notifier: 'false' },
        });

        let stdout = '';
        proc.stdout.on('data', d => { stdout += d.toString(); });
        proc.stderr.on('data', d => process.stderr.write(d));

        proc.on('close', () => {
            try {
                const report = JSON.parse(stdout);
                resolve(parseNpmAudit(report));
            } catch {
                resolve(emptyResult());
            }
        });

        proc.on('error', () => resolve(emptyResult()));

        setTimeout(() => { proc.kill(); resolve(emptyResult()); }, 60_000);
    });
};

const parseNpmAudit = (report) => {
    const result = emptyResult();
    const vulns = report.vulnerabilities || {};

    Object.values(vulns).forEach(vuln => {
        const sev = (vuln.severity || '').toLowerCase();
        const cvss = vuln.cvss?.score || 0;

        if (sev === 'critical') { result.criticalCves++; result.maxCvssScore = Math.max(result.maxCvssScore, cvss); }
        else if (sev === 'high') { result.highCves++; result.maxCvssScore = Math.max(result.maxCvssScore, cvss); }

        if (vuln.fixAvailable === false) result.outdatedCount++;

        result.cves.push({
            cveId: vuln.name || 'unknown',
            cvssScore: cvss,
            severity: sev,
            description: (vuln.title || '').slice(0, 300),
            packageName: vuln.name || '',
            installedVersion: vuln.range || 'unknown',
            fixedVersion: vuln.fixAvailable?.version || null,
        });
    });

    console.log(`  [SCA] Done — Critical: ${result.criticalCves}, High: ${result.highCves}`);
    return result;
};

const emptyResult = () => ({
    criticalCves: 0, highCves: 0, maxCvssScore: 0, outdatedCount: 0, cves: [],
});

module.exports = { runSca };