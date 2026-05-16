const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

const runSast = async (codePath, pipelineId) => {
    return new Promise((resolve, reject) => {
        console.log(`  [SAST] Running Semgrep scan on ${codePath}`);

        // Le fichier de sortie pour les résultats JSON
        const outputFile = `/tmp/semgrep-${pipelineId}.json`;

        // Lancement du conteneur Semgrep
        // Il monte le dossier du code et utilise les règles par défaut (auto)
        const args = [
            'run', '--rm',
            '-v', `${codePath}:/src`,
            '-v', `/tmp:/tmp`, // Monter /tmp pour récupérer le rapport
            'semgrep/semgrep',
            'semgrep', 'scan',
            '--config=auto',    // Utiliser les règles recommandées par Semgrep
            '--json',           // Sortie au format JSON
            `--output=${outputFile}`,
            '/src'
        ];

        const proc = spawn('docker', args);

        proc.stdout.on('data', d => process.stdout.write(d));
        proc.stderr.on('data', d => process.stdout.write(d));

        proc.on('close', async (code) => {
            // Semgrep retourne 0 (succès), ou 1 (s'il trouve des failles - ce qui est normal pour nous)
            // S'il crashe avec un autre code, c'est une vraie erreur.
            if (code !== 0 && code !== 1) {
                return reject(new Error(`Semgrep exited with abnormal code ${code}`));
            }

            try {
                // 1. Lire le fichier JSON généré
                const rawData = await fs.readFile(outputFile, 'utf-8');
                const semgrepReport = JSON.parse(rawData);

                // 2. Nettoyer le fichier temporaire
                await fs.unlink(outputFile).catch(e => console.warn('Could not delete temp file', e));

                // 3. Normaliser les résultats pour votre Pipeline Runner et le ML
                const result = { critical: 0, high: 0, medium: 0, low: 0, issues: [] };

                semgrepReport.results.forEach(issue => {
                    // Semgrep utilise INFO, WARNING, ERROR. On les mappe à votre format.
                    const sev = normalizeSeverity(issue.extra?.severity);
                    result[sev]++;

                    result.issues.push({
                        ruleId: issue.check_id,
                        severity: sev,
                        type: 'VULNERABILITY',
                        message: issue.extra?.message || 'Security issue detected',
                        filePath: issue.path || '',
                        line: issue.start?.line || 0,
                    });
                });

                console.log(`  [SAST] Semgrep Done — High: ${result.high}, Medium: ${result.medium}, Low: ${result.low}`);
                resolve(result);

            } catch (err) {
                console.error('  [SAST] Error parsing Semgrep output:', err);
                reject(err);
            }
        });
    });
};

const normalizeSeverity = (s) => {
    if (!s) return 'low';
    const severityMap = {
        'ERROR': 'high',      // Semgrep 'ERROR'
        'WARNING': 'medium',  // Semgrep 'WARNING'
        'INFO': 'low'         // Semgrep 'INFO'
    };
    return severityMap[s.toUpperCase()] || 'low';
};

module.exports = { runSast };
