const axios = require('axios');

const ZAP_URL = process.env.ZAP_URL || 'http://owasp-zap:8090';
const ZAP_KEY = process.env.ZAP_API_KEY || '';

const zap = (path, params = {}) =>
    axios.get(`${ZAP_URL}/JSON/${path}`, {
        params: { apikey: ZAP_KEY, ...params },
        timeout: 10_000,
    });

const sleep = ms => new Promise(r => setTimeout(r, ms));

//* Step 1: Open the target URL in ZAP (lets it build a site tree)
const accessTarget = async (targetUrl) => {
    await zap('core/action/accessUrl', { url: targetUrl, followredirects: true });
    console.log(`  [DAST] ZAP accessed: ${targetUrl}`);
};

//* Step 2: Run spider to discover all pages
const runSpider = async (targetUrl) => {
    const { data } = await zap('spider/action/scan', { url: targetUrl, maxchildren: 5 });
    const scanId = data.scan;
    console.log(`  [DAST] Spider started (scanId: ${scanId})`);

    // Poll until spider finishes (or timeout after 3 min)
    const start = Date.now();
    while (Date.now() - start < 180_000) {
        const { data: status } = await zap('spider/view/status', { scanId });
        if (parseInt(status.status) >= 100) break;
        console.log(`  [DAST] Spider progress: ${status.status}%`);
        await sleep(3000);
    }
};

//* Step 3: Run passive scan (analyzes traffic captured by spider)
const runPassiveScan = async () => {
    const start = Date.now();
    while (Date.now() - start < 120_000) {
        const { data } = await zap('pscan/view/recordsToScan');
        if (parseInt(data.recordsToScan) === 0) break;
        await sleep(2000);
    }
    console.log(`  [DAST] Passive scan complete`);
};

//* Step 4: Run active scan (fires attack payloads)
//* REPLACE the existing runActiveScan function with this
const runActiveScan = async (targetUrl, timeoutMs = 120_000) => { // ← reduced from 600_000 (10min) to 2min
    const { data } = await zap('ascan/action/scan', {
        url: targetUrl,
        recurse: true,
        scanpolicyname: '',
    });
    const scanId = data.scan;
    console.log(`  [DAST] Active scan started (scanId: ${scanId})`);

    const start = Date.now();
    let lastProgress = -1;
    let stuckCount = 0;

    while (Date.now() - start < timeoutMs) {
        const { data: status } = await zap('ascan/view/status', { scanId });
        const pct = parseInt(status.status);

        //* If progress hasn't changed in 3 checks (15s), stop waiting
        if (pct === lastProgress) {
            stuckCount++;
            if (stuckCount >= 3) {
                console.warn(`  [DAST] Active scan stuck at ${pct}% — stopping early`);
                await zap('ascan/action/stopScan', { scanId });
                break;
            }
        } else {
            stuckCount = 0;
            lastProgress = pct;
        }

        if (pct >= 100) break;
        console.log(`  [DAST] Active scan progress: ${pct}%`);
        await sleep(5000);
    }

    //* Stop scan if still running after timeout
    try {
        await zap('ascan/action/stopScan', { scanId });
    } catch { /* ignore */ }
};

//* Step 5: Fetch and normalize alerts
const fetchAlerts = async (targetUrl) => {
    const { data } = await zap('core/view/alerts', {
        baseurl: targetUrl,
        start: 0,
        count: 1000,
    });

    const result = {
        highAlerts: 0, mediumAlerts: 0, lowAlerts: 0,
        xssCount: 0, sqliCount: 0, alerts: [],
    };

    (data.alerts || []).forEach(alert => {
        const risk = alert.risk?.toLowerCase();
        if (risk === 'high') result.highAlerts++;
        if (risk === 'medium') result.mediumAlerts++;
        if (risk === 'low') result.lowAlerts++;

        const name = (alert.name || '').toLowerCase();
        if (name.includes('cross site scripting')) result.xssCount++;
        if (name.includes('sql injection')) result.sqliCount++;

        result.alerts.push({
            name: alert.name,
            risk,
            description: alert.description?.slice(0, 400),
            solution: alert.solution?.slice(0, 400),
            url: alert.url,
            owaspCategory: alert.cweid ? `CWE-${alert.cweid}` : '',
        });
    });

    return result;
};

//* Step 6: Clean up ZAP session after scan
const clearSession = async () => {
    try {
        await zap('core/action/newSession', { name: '', overwrite: true });
        console.log(`  [DAST] ZAP session cleared`);
    } catch {
        // Non-critical — continue even if cleanup fails
    }
};

const waitForZap = async (retries = 10, delayMs = 6000) => {
    for (let i = 0; i < retries; i++) {
        try {
            await axios.get(`${ZAP_URL}/JSON/core/view/version`, {
                params: { apikey: ZAP_KEY },
                timeout: 5_000,
            });
            console.log(`  [DAST] ZAP is ready`);
            return true;
        } catch (err) {
            console.warn(`  [DAST] ZAP not ready yet (attempt ${i + 1}/${retries}), waiting ${delayMs/1000}s...`);
            await sleep(delayMs);
        }
    }
    throw new Error(`ZAP is not reachable at ${ZAP_URL} after ${retries} attempts`);
};

//! Main entry: called by pipelineRunner.js 
const runDast = async (stagingUrl, pipelineId) => {
    console.log(`  [DAST] Scanning: ${stagingUrl}`);
    // Wait for ZAP to be ready (up to ~60 seconds)
    await waitForZap(10, 6000);
    try {
        await axios.get(`${ZAP_URL}/JSON/core/view/version`, {
            params: { apikey: ZAP_KEY },
            timeout: 5_000,
        });
    } catch (err) {
        throw new Error(`ZAP is not reachable at ${ZAP_URL}: ${err.message}`);
    }

    try {
        await accessTarget(stagingUrl);
        await runSpider(stagingUrl);
        await runPassiveScan();
        await runActiveScan(stagingUrl);
        const result = await fetchAlerts(stagingUrl);

        console.log(`  [DAST] Done — High: ${result.highAlerts}, XSS: ${result.xssCount}, SQLi: ${result.sqliCount}`);
        return result;
    } finally {
        // Always clear the ZAP session, even if the scan fails
        await clearSession();
    }
};

module.exports = { runDast };