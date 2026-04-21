// Sends Slack messages and emails for pipeline alerts

const axios = require('axios');
const nodemailer = require('nodemailer');

//! Slack notification
  //* Sends a message to Slack using an incoming webhook URL
const sendSlack = async (webhookUrl, pipeline, project, decision) => {
    if (!webhookUrl) return;

    const emoji = decision === 'blocked' ? '🔴' : '🟢';
    const color = decision === 'blocked' ? '#C00000' : '#217346';

    const message = {
        attachments: [
        {
            color,
            title: `${emoji} Pipeline ${decision.toUpperCase()} — ${project.name}`,
            fields: [
                { title: 'Branch',     value: pipeline.branch,     short: true },
                { title: 'Commit',     value: pipeline.commitSha.slice(0, 7), short: true },
                { title: 'Risk Score', value: `${pipeline.score}/100`, short: true },
                { title: 'Decision',   value: decision.toUpperCase(), short: true },
            ],
            footer: 'SecOps Platform',
            ts: Math.floor(Date.now() / 1000),
        },
    ],
    };

    try {
        await axios.post(webhookUrl, message);
    } catch (err) {
        console.error('Slack notification failed:', err.message);
    }
};

//! Email notification
  //* Sends an email using Nodemailer with SMTP
    const sendEmail = async ({ to, subject, html }) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        await transporter.sendMail({
            from: `"SecOps Platform" <${process.env.SMTP_USER}>`,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject,
            html,
        });
    } catch (err) {
        console.error('Email notification failed:', err.message);
    }
};

//! Notify pipeline result
  //* Called after gate decision — sends both Slack + email if configured
const notifyPipelineResult = async (pipeline, project) => {
    const { gateConfig } = project;
    const decision = pipeline.decision;

    //* Only send notifications if the gate triggered
    if (decision !== 'blocked' && decision !== 'approved') return;

    //* Send Slack
    if (gateConfig.notifySlack && process.env.SLACK_WEBHOOK_URL) {
        await sendSlack(process.env.SLACK_WEBHOOK_URL, pipeline, project, decision);
    }

    //* Send email
    if (gateConfig.notifyEmail && gateConfig.emailRecipients.length > 0) {
        const emoji = decision === 'blocked' ? '🔴' : '🟢';
        await sendEmail({
            to: gateConfig.emailRecipients,
            subject: `${emoji} [SecOps] Pipeline ${decision} — ${project.name}`,
            html: `
                <h2>Pipeline ${decision.toUpperCase()}</h2>
                <p><strong>Project:</strong> ${project.name}</p>
                <p><strong>Branch:</strong> ${pipeline.branch}</p>
                <p><strong>Commit:</strong> ${pipeline.commitSha.slice(0, 7)}</p>
                <p><strong>Risk Score:</strong> ${pipeline.score}/100</p>
                <p><strong>Threshold:</strong> ${gateConfig.threshold}/100</p>
                <br/>
                <p>View the full report in your <a href="${process.env.FRONTEND_URL || '#'}">SecOps dashboard</a>.</p>
            `,
        });
    }
};

module.exports = { sendSlack, sendEmail, notifyPipelineResult };
