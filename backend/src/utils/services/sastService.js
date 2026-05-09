const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');

const SONAR_URL = process.env.SONARQUBE_URL || 'http://sonarqube:9000';
const SONAR_TOKEN = process.env.SONARQUBE_TOKEN;

//! Step 1: Create SonarQube project if it doesn't exist
const ensureSonarProject = async (projectKey, projectName) => {
    try {
        await axios.post(
            `${SONAR_URL}/api/projects/create`,
            new URLSearchParams({ project: projectKey, name: projectName }),
            { headers: { Authorization: `Bearer ${SONAR_TOKEN}` } }
        );
        console.log(`  [SAST] SonarQube project created: ${projectKey}`);
    } catch (err) {
        // 400 = project already exists — that's fine
        if (err.response?.status !== 400) {
            console.warn(`  [SAST] Could not create project: ${err.message}`);
        }
    }
};

//! Step 2: Run sonar-scanner inside a Docker container
const runSonarScanner = (codePath, projectKey) => {
    return new Promise((resolve, reject) => {
        console.log(`  [SAST] Running sonar-scanner on ${codePath}`);

        // Mount the cloned code as /src, run the scanner against SonarQube
        const args = [
            'run', '--rm',
            '--network', 'secops-network',               // same network as SonarQube
            '-v', `${codePath}:/usr/src`,                // mount source code
            'sonarsource/sonar-scanner-cli:latest',
            `-Dsonar.projectKey=${projectKey}`,
            `-Dsonar.sources=/usr/src`,
            `-Dsonar.host.url=${SONAR_URL}`,
            `-Dsonar.token=${SONAR_TOKEN}`,
            '-Dsonar.sourceEncoding=UTF-8',
        ];

        const proc = spawn('docker', args);
        let output = '';
        proc.stdout.on('data', d => { output += d; process.stdout.write(d); });
        proc.stderr.on('data', d => { output += d; });
        proc.on('close', code => {
            if (code !== 0) return reject(new Error(`sonar-scanner exited with code ${code}`));
            resolve(output);
        });
    });
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

//! Step 3: Poll the CE (Compute Engine) task until analysis is done 
const waitForAnalysis = async (projectKey, timeoutMs = 120_000) => {
    const start = Date.now();
    console.log(`  [SAST] Waiting for analysis to complete...`);

    while (Date.now() - start < timeoutMs) {
        const { data } = await axios.get(`${SONAR_URL}/api/ce/activity`, {
            params: { component: projectKey, ps: 1 },
            headers: { Authorization: `Bearer ${SONAR_TOKEN}` },
        });

        const task = data.tasks?.[0];
        if (!task) { await sleep(3000); continue; }
        if (task.status === 'SUCCESS') return task.analysisId;
        if (task.status === 'FAILED') throw new Error('SonarQube analysis task failed');

        await sleep(3000); // wait 3s before polling again
    }
    throw new Error('SonarQube analysis timed out');
};

//! Step 4: Fetch issues from SonarQube API
const fetchIssues = async (projectKey) => {
    let page = 1, allIssues = [];

    while (true) {
        const { data } = await axios.get(`${SONAR_URL}/api/issues/search`, {
            params: { componentKeys: projectKey, ps: 500, p: page, resolved: false },
            headers: { Authorization: `Bearer ${SONAR_TOKEN}` },
        });

        allIssues = allIssues.concat(data.issues || []);
        if (allIssues.length >= data.paging.total) break;
        page++;
    }
    return allIssues;
};

//* Main entry: called by pipelineRunner.js
const runSast = async (codePath, pipelineId) => {
    const projectKey = `secops-${pipelineId}`;

    await ensureSonarProject(projectKey, `Pipeline ${pipelineId}`);
    await runSonarScanner(codePath, projectKey);
    await waitForAnalysis(projectKey);
    const rawIssues = await fetchIssues(projectKey);

    // Normalize into our schema
    const result = { critical: 0, high: 0, medium: 0, low: 0, issues: [] };

    rawIssues.forEach(issue => {
        const sev = normalizeSeverity(issue.severity);
        result[sev]++;
        result.issues.push({
            ruleId: issue.rule,
            severity: sev,
            type: issue.type,              // BUG / VULNERABILITY / CODE_SMELL
            message: issue.message,
            filePath: issue.component?.split(':').pop() || '',
            line: issue.line || 0,
        });
    });

    console.log(`  [SAST] Done — Critical: ${result.critical}, High: ${result.high}, Medium: ${result.medium}`);
    return result;
};

const normalizeSeverity = (s) => {
    if (!s) return 'low';
    const m = { BLOCKER: 'critical', CRITICAL: 'critical', MAJOR: 'high', MINOR: 'medium', INFO: 'low' };
    return m[s.toUpperCase()] || 'low';
};



module.exports = { runSast };