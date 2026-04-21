// CRUD operations for projects + team member management

const Project = require('../models/Project');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');

//* GET /api/projects
// @desc  Get all projects the logged-in user has access to
// @access Private
const getProjects = asyncHandler(async (req, res) => {
  // Admin sees all projects; others see only projects they own or are members of
  let query;

  if (req.user.role === 'admin') {
    query = Project.find().populate('owner', 'name email');
  } else {
    query = Project.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id },
      ],
    }).populate('owner', 'name email');
  }

  const projects = await query.sort({ createdAt: -1 });
  res.json({ success: true, count: projects.length, data: projects });
});

//* GET /api/projects/:id
// @desc  Get a single project by ID
// @access Private
const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email')
    .populate('members.user', 'name email');

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  res.json({ success: true, data: project });
});

//* POST /api/projects
// @desc  Create a new project
// @access Private
const createProject = asyncHandler(async (req, res) => {
  const { name, description, repoUrl, defaultBranch } = req.body;

  const project = await Project.create({
    name,
    description,
    repoUrl,
    defaultBranch,
    owner: req.user._id,
  });

  await AuditLog.log({
    user:    req.user._id,
    action:  'PROJECT_CREATED',
    project: project._id,
    details: { name, repoUrl },
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, data: project });
});

//* PUT /api/projects/:id
// @desc  Update project details
// @access Private (owner or admin)
const updateProject = asyncHandler(async (req, res) => {
  let project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  // Only the owner or an admin can update the project
  if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to update this project' });
  }

  const { name, description, repoUrl, defaultBranch, gateConfig } = req.body;

  project = await Project.findByIdAndUpdate(
    req.params.id,
    { name, description, repoUrl, defaultBranch, gateConfig },
    { new: true, runValidators: true }
  );

  await AuditLog.log({
    user:    req.user._id,
    action:  'PROJECT_UPDATED',
    project: project._id,
    details: req.body,
    ipAddress: req.ip,
  });

  res.json({ success: true, data: project });
});

//* DELETE /api/projects/:id
// @desc  Delete a project
// @access Private (owner or admin)
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this project' });
  }

  await project.deleteOne();

  await AuditLog.log({
    user:    req.user._id,
    action:  'PROJECT_DELETED',
    details: { projectId: req.params.id },
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'Project deleted' });
});

//* POST /api/projects/:id/members
// @desc  Add a team member to a project
// @access Private (owner or admin)
const addMember = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;

  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  // Check if user is already a member
  const alreadyMember = project.members.some((m) => m.user.toString() === userId);
  if (alreadyMember) {
    return res.status(400).json({ success: false, message: 'User is already a member' });
  }

  project.members.push({ user: userId, role: role || 'developer' });
  await project.save();

  await AuditLog.log({
    user:    req.user._id,
    action:  'MEMBER_ADDED',
    project: project._id,
    details: { userId, role },
    ipAddress: req.ip,
  });

  res.json({ success: true, data: project });
});

//* DELETE /api/projects/:id/members/:userId
// @desc  Remove a team member from a project
// @access Private (owner or admin)
const removeMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  project.members = project.members.filter(
    (m) => m.user.toString() !== req.params.userId
  );
  await project.save();

  await AuditLog.log({
    user:    req.user._id,
    action:  'MEMBER_REMOVED',
    project: project._id,
    details: { userId: req.params.userId },
    ipAddress: req.ip,
  });

  res.json({ success: true, data: project });
});

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
