// Public webhook endpoint — no JWT required (verified by HMAC signature instead)

const express = require('express');
const router  = express.Router();

const { githubWebhook } = require('../controllers/webhookController');

// GitHub sends the raw JSON body — we need it unparsed for HMAC verification.
// This route uses express.json() with a verify callback to store the raw body.
router.post(
    '/github',
    express.json({
        verify: (req, _res, buf) => {
        // Store raw body on the request object so we can verify the HMAC signature
        req.rawBody = buf.toString('utf8');
    },
    }),
    githubWebhook
);

module.exports = router;
