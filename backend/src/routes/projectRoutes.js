// Project CRUD + team member management
const express = require('express');
const router  = express.Router();

const {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    addMember,
    removeMember,
} = require('../controllers/projectController');

const { protect, authorize } = require('../middleware/auth');

// All project routes require authentication
router.use(protect);

router.route('/')
    .get(getProjects)
    .post(createProject);

router.route('/:id')
    .get(getProject)
    .put(updateProject)
    .delete(deleteProject);

// Team member management
router.post('/:id/members',           addMember);
router.delete('/:id/members/:userId', removeMember);

module.exports = router;
