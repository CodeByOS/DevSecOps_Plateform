// Read-only access to the audit trail
// NOTE: No DELETE or UPDATE endpoints — audit logs are immutable

const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');

//* GET /api/audit
// @desc  Get all audit logs (admin) or logs for the current user
// @access Private
const getAuditLogs = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip  = (page - 1) * limit;

  // Build filter based on query params
  const filter = {};

  if (req.user.role !== 'admin') {
    // Non-admins can only see their own actions
    filter.user = req.user._id;
  }

  if (req.query.action)    filter.action    = req.query.action;
  if (req.query.projectId) filter.project   = req.query.projectId;

  const total = await AuditLog.countDocuments(filter);

  const logs = await AuditLog.find(filter)
    .populate('user',    'name email')
    .populate('project', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: logs,
  });
});

module.exports = { getAuditLogs };
