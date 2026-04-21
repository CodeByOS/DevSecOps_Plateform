// A Project links a GitHub repository to its security pipeline configuration

const mongoose = require('mongoose');
const crypto = require('crypto');

const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },

    description: {
      type: String,
      default: '',
    },

    //* The GitHub repository URL to clone and scan
    repoUrl: {
      type: String,
      required: [true, 'Repository URL is required'],
    },

    defaultBranch: {
      type: String,
      default: 'main',
    },

    //* Secret used to verify incoming GitHub webhook signatures
    webhookSecret: {
      type: String,
      default: () => crypto.randomBytes(20).toString('hex'),
    },

    //* The user who created this project
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    //* Team members with access to this project
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['developer', 'viewer'], default: 'developer' },
      },
    ],

    //* Gate configuration: controls when a pipeline is blocked
    gateConfig: {
      // Score threshold (0-100). Pipelines scoring above this are blocked
      threshold: { type: Number, default: 70 },

      // block = auto-block, warn = alert only, allow = never block
      mode: { type: String, enum: ['block', 'warn', 'allow'], default: 'block' },

      // Notification channels
      notifySlack: { type: Boolean, default: false },
      notifyEmail: { type: Boolean, default: false },
      emailRecipients: [{ type: String }],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Project', ProjectSchema);
