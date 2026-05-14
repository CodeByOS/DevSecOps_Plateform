// Receives GitHub push events and triggers the security pipeline
// Security: every request is verified using HMAC-SHA256 signature

const crypto = require('crypto');
const Project = require('../models/Project');
const Pipeline = require('../models/Pipeline');
const { runPipeline } = require('../utils/pipelineRunner');

//* POST /api/webhooks/github
// @desc  Receive GitHub push webhook and start a pipeline
// @access Public (but signature-verified)
const githubWebhook = async (req, res) => {
    //* Step 1: Respond to GitHub immediately 
    // GitHub expects a 200 within 10 seconds — we respond right away
    // and run the pipeline in the background
    res.status(200).json({ success: true, message: 'Webhook received' });

    try {
        //* Step 2: Verify the GitHub signature
        const signature = req.headers['x-hub-signature-256'];
        const event = req.headers['x-github-event'];

        // We only care about push events
        if (event !== 'push') return;

        if (!signature) {
            console.warn('⚠️  Webhook received without signature — ignored');
            return;
        }

        //* Step 3: Find the project 
        // We prefer projectId from query string (if provided by the frontend)
        // Fallback to searching by repoUrl from the GitHub payload
        const { projectId: queryProjectId } = req.query;
        const repoUrl = req.body?.repository?.clone_url || req.body?.repository?.html_url;
        
        let project;
        if (queryProjectId) {
            project = await Project.findById(queryProjectId);
        } else if (repoUrl) {
            project = await Project.findOne({ repoUrl });
        }

        if (!project) {
            console.warn(`⚠️  No project found for: ${queryProjectId || repoUrl}`);
            return;
        }

        //* Step 4: Validate HMAC signature with project's webhook secret
        // CRITICAL FIX: Use req.rawBody (the original buffer stored by the verify callback
        // in webhookRoutes.js) instead of re-serializing req.body.
        // JSON.stringify(req.body) can reorder keys or alter formatting, producing a
        // different string than what GitHub actually sent, causing all HMAC checks to fail.
        const rawBody = req.rawBody;
        if (!rawBody) {
            console.warn('⚠️  req.rawBody is missing — verify callback may not have run');
            return;
        }

        const expected = `sha256=${crypto
            .createHmac('sha256', project.webhookSecret)
            .update(rawBody)
            .digest('hex')}`;

        // Ensure both buffers are the same length before timingSafeEqual to avoid crashes
        if (signature.length !== expected.length) {
            console.warn('⚠️  Invalid webhook signature (length mismatch) — request rejected');
            return;
        }

        // Use timingSafeEqual to prevent timing attacks
        const isValid = crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expected)
        );

        if (!isValid) {
            console.warn('⚠️  Invalid webhook signature — request rejected');
            return;
        }

        //* Step 5: Extract commit info from payload 
        const commitSha = req.body.after;
        const branch = req.body.ref?.replace('refs/heads/', '') || 'unknown';
        const commitMsg = req.body.head_commit?.message || '';
        const author = req.body.head_commit?.author?.name || '';

        // Skip pipelines for deleted branches (after = 000...000)
        if (!commitSha || commitSha === '0000000000000000000000000000000000000000') return;

        //* Step 6: Create pipeline document 
        const pipeline = await Pipeline.create({
            project: project._id,
            commitSha,
            branch,
            commitMessage: commitMsg,
            author,
            status: 'pending',
        });

        console.log(`\n Webhook received — Project: ${project.name} | Branch: ${branch} | Commit: ${commitSha.slice(0, 7)}`);

        //* Step 7: Run the pipeline asynchronously (non-blocking) 
        // setImmediate ensures the response is sent before we start processing
        setImmediate(() => runPipeline(pipeline._id, project));

    } catch (err) {
        // Errors here are silent — we already sent 200 to GitHub
        console.error('Webhook processing error:', err.message);
    }
};

module.exports = { githubWebhook };