// Clones a GitHub repo to a temp local path so SAST and SCA tools can
// mount it as a volume. Always call cleanup() in a finally block.

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

//* Clone a repo to /tmp/secops-clones/<pipelineId>/
const cloneRepo = (repoUrl, pipelineId, branch = 'main') => {
    return new Promise((resolve, reject) => {
        // Use OS temp dir so it works both inside Docker and locally
        const cloneRoot = path.join(os.tmpdir(), 'secops-clones');
        const codePath  = path.join(cloneRoot, pipelineId);

        // Remove any leftover clone from a previous failed run
        if (fs.existsSync(codePath)) {
            fs.rmSync(codePath, { recursive: true, force: true });
        }

        fs.mkdirSync(codePath, { recursive: true });

        console.log(`  [Clone] Cloning ${repoUrl} (branch: ${branch}) → ${codePath}`);

        // --depth 1 = shallow clone (only latest commit, much faster)
        // --single-branch = skip all other branches
        const args = [
            'clone',
            '--depth', '1',
            '--single-branch',
            '--branch', branch,
            '--', // Security: ensure everything after this is treated as a positional argument (repo URL and path)
            repoUrl,
            codePath,
        ];

        const proc = spawn('git', args);

        proc.stdout.on('data', d => process.stdout.write(d));
        proc.stderr.on('data', d => process.stderr.write(d));

        proc.on('close', code => {
            if (code !== 0) {
                return reject(new Error(`git clone exited with code ${code}`));
            }
            console.log(`  [Clone] Done → ${codePath}`);
            resolve(codePath);
        });

        proc.on('error', err => {
            reject(new Error(`git clone failed to start: ${err.message}`));
        });
    });
};

//* Remove the cloned directory — always call this in a finally block
const cleanup = (codePath) => {
    if (!codePath) return;
    try {
        fs.rmSync(codePath, { recursive: true, force: true });
        console.log(`  [Clone] Cleaned up ${codePath}`);
    } catch (err) {
        // Non-critical — just log, don't throw
        console.warn(`  [Clone] Cleanup warning: ${err.message}`);
    }
};

module.exports = { cloneRepo, cleanup };
