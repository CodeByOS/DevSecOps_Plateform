const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

//* Run OWASP Dependency Check in Docker
const runSca = async (codePath, pipelineId) => {
    const reportDir = `/tmp/secops-reports/${pipelineId}`;
    fs.mkdirSync(reportDir, { recursive: true });

    console.log(`  [SCA] Running Dependency Check on ${codePath}`);

    await runDepCheckContainer(codePath, reportDir);

    const reportPath = path.join(reportDir, 'dependency-check-report.json');

    if (!fs.existsSync(reportPath)) {
        console.warn('  [SCA] No report generated — skipping');
        return emptyResult();
    }

    const result = parseReport(reportPath);

    // Clean up temp report
    fs.rmSync(reportDir, { recursive: true, force: true });

    console.log(`  [SCA] Done — Critical CVEs: ${result.criticalCves}, High: ${result.highCves}`);
    return result;
};

//* Spawn the Dependency Check container 
const runDepCheckContainer = (codePath, reportDir) => {
    return new Promise((resolve, reject) => {
        const args = [
            'run', '--rm',
            '-v', `${codePath}:/src:ro`,           // source code (read-only)
            '-v', `${reportDir}:/report`,           // output report
            '-v', `depcheck_data:/usr/share/dependency-check/data`, // NVD cache
            '--network', 'secops-internal',
            'owasp/dependency-check:latest',
            '--scan', '/src',
            '--format', 'JSON',
            '--out', '/report',
            '--project', 'secops-scan',
            '--enableRetired',                      // include retired advisories
        ];

        const proc = spawn('docker', args);
        proc.stdout.on('data', d => process.stdout.write(d));
        proc.stderr.on('data', d => process.stderr.write(d));

        proc.on('close', code => {
            // Dep. Check exits 1 when vulnerabilities are found — that's expected
            if (code !== 0 && code !== 1) {
                return reject(new Error(`dependency-check exited with code ${code}`));
            }
            resolve();
        });
    });
};

//* Parse the JSON report into our schema 
const parseReport = (reportPath) => {
    const raw = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const result = { criticalCves: 0, highCves: 0, maxCvssScore: 0, outdatedCount: 0, cves: [] };

    const dependencies = raw.dependencies || [];

    dependencies.forEach(dep => {
        if (!dep.vulnerabilities?.length) return;
        result.outdatedCount++;

        dep.vulnerabilities.forEach(vuln => {
            const cvss = vuln.cvssv3?.baseScore || vuln.cvssv2?.score || 0;
            const sev = normalizeCvss(cvss);

            if (cvss > result.maxCvssScore) result.maxCvssScore = cvss;
            if (sev === 'critical') result.criticalCves++;
            if (sev === 'high') result.highCves++;

            result.cves.push({
                cveId: vuln.name,
                cvssScore: cvss,
                severity: sev,
                description: vuln.description?.slice(0, 300),
                packageName: dep.fileName,
                installedVersion: dep.packages?.[0]?.id?.split(':').pop() || 'unknown',
                fixedVersion: null,  // Dep Check doesn't always provide this
            });
        });
    });

    return result;
};

const normalizeCvss = (score) => {
    if (score >= 9.0) return 'critical';
    if (score >= 7.0) return 'high';
    if (score >= 4.0) return 'medium';
    return 'low';
};

const emptyResult = () => ({
    criticalCves: 0, highCves: 0, maxCvssScore: 0, outdatedCount: 0, cves: [],
});

module.exports = { runSca };