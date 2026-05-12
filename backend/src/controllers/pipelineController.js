// Handles pipeline listing, detail view, and manual gate override

const Pipeline = require('../models/Pipeline');
const ScanResult = require('../models/ScanResult');
const Project = require('../models/Project');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');

//* GET /api/projects/:projectId/pipelines
// @desc  Get all pipelines for a project (paginated)
// @access Private
const getPipelines = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip  = (page - 1) * limit;

  const filter = { project: projectId };

  if (req.query.status)   filter.status   = req.query.status;
  if (req.query.decision) filter.decision = req.query.decision;
  if (req.query.branch)   filter.branch   = { $regex: req.query.branch, $options: 'i' };

  const total = await Pipeline.countDocuments(filter);

  const pipelines = await Pipeline.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: pipelines,
  });
});

//* GET /api/pipelines/:id
// @desc  Get a single pipeline with its full scan results
// @access Private
const getPipeline = asyncHandler(async (req, res) => {
  const pipeline = await Pipeline.findById(req.params.id)
    .populate('project', 'name repoUrl gateConfig')
    .populate('overrideBy', 'name email');

  if (!pipeline) {
    return res.status(404).json({ success: false, message: 'Pipeline not found' });
  }

  // Fetch the associated scan results
  const scanResult = await ScanResult.findOne({ pipeline: req.params.id });

  res.json({
    success: true,
    data: { ...pipeline.toObject(), scanResult },
  });
});

//* POST /api/pipelines/:id/override
// @desc  Manually override a blocked pipeline (admin only)
// @access Private (admin)
const overridePipeline = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (!reason || reason.trim() === '') {
    return res.status(400).json({ success: false, message: 'Override reason is required' });
  }

  const pipeline = await Pipeline.findById(req.params.id);

  if (!pipeline) {
    return res.status(404).json({ success: false, message: 'Pipeline not found' });
  }

  if (pipeline.status !== 'blocked') {
    return res.status(400).json({ success: false, message: 'Only blocked pipelines can be overridden' });
  }

  // Update the pipeline decision to override
  pipeline.status       = 'completed';
  pipeline.decision     = 'override';
  pipeline.overrideBy   = req.user._id;
  pipeline.overrideReason = reason;
  await pipeline.save();

  // Always log overrides in the audit trail
  await AuditLog.log({
    user:    req.user._id,
    action:  'GATE_OVERRIDE',
    project: pipeline.project,
    details: { pipelineId: pipeline._id, score: pipeline.score, reason },
    ipAddress: req.ip,
  });

  res.json({ success: true, data: pipeline });
});

//* GET /api/projects/:projectId/pipelines/stats 
//* OR  /api/pipelines/stats
// @desc  Get pipeline statistics for the dashboard
// @access Private
const getPipelineStats = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const match = {};

  if (projectId) {
    match.project = require('mongoose').Types.ObjectId.createFromHexString(projectId);
  }

  const [total, blocked, completed, avgScoreResult] = await Promise.all([
    Pipeline.countDocuments(match),
    Pipeline.countDocuments({ ...match, status: 'blocked' }),
    Pipeline.countDocuments({ ...match, status: 'completed' }),
    Pipeline.aggregate([
      { $match: { ...match, score: { $ne: null } } },
      { $group: { _id: null, avg: { $avg: '$score' } } },
    ]),
  ]);

  const avgScore = avgScoreResult[0]?.avg?.toFixed(1) || 0;
  const passRate = total > 0 ? (((total - blocked) / total) * 100).toFixed(1) : 0;

  // Last 7 pipelines for the mini trend chart
  const recent = await Pipeline.find({ ...match, score: { $ne: null } })
    .sort({ createdAt: -1 })
    .limit(7)
    .select('score status decision createdAt branch');

  // Recently blocked pipelines (for global dashboard)
  let recentlyBlocked = [];
  if (!projectId) {
    recentlyBlocked = await Pipeline.find({ status: 'blocked' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('project', 'name');
  }

  res.json({
    success: true,
    data: {
      total,
      blocked,
      completed,
      avgScore,
      passRate,
      recent: recent.reverse(), // oldest first for the chart
      recentlyBlocked
    },
  });
});

module.exports = { getPipelines, getPipeline, overridePipeline, getPipelineStats };
