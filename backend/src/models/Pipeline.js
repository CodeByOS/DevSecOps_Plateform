// Represents a single CI/CD pipeline run triggered by a GitHub push

const mongoose = require('mongoose');

// Each step in the pipeline (clone, sast, sca, dast, ml, gate)
const StepSchema = new mongoose.Schema(
  {
    name: String,
    status: {
      type: String,
      enum: ['pending', 'running', 'success', 'failed', 'skipped'],
      default: 'pending',
    },
    startedAt: Date,
    completedAt: Date,
    error: { type: String, default: null },

    // Store key metrics for this step (e.g. number of issues found)
    summary: { type: Object, default: {} },
  },
  { _id: false } // No need for a separate _id on each step
);

const PipelineSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },

    // Git info from the webhook payload
    commitSha: { type: String, required: true },
    branch: { type: String, required: true },
    commitMessage: { type: String, default: '' },
    author: { type: String, default: '' },

    // Overall pipeline state
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'blocked'],
      default: 'pending',
    },

    // The 6 pipeline steps in order
    steps: {
      type: [StepSchema],
      default: [
        { name: 'clone' },
        { name: 'sast' },
        { name: 'sca' },
        { name: 'dast' },
        { name: 'ml_score' },
        { name: 'gate' },
      ],
    },

    // Final ML risk score (0-100)
    score: { type: Number, default: null },

    // Final deployment decision
    decision: {
      type: String,
      enum: ['approved', 'blocked', 'override', null],
      default: null,
    },

    // Manual override info (when admin unblocks a blocked pipeline)
    overrideBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    overrideReason: { type: String, default: null },

    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Pipeline', PipelineSchema);
