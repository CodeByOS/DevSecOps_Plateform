const express = require('express');
const router  = express.Router({ mergeParams: true }); // mergeParams to access :projectId

const {
    getPipelines,
    getPipeline,
    overridePipeline,
    getPipelineStats,
} = require('../controllers/pipelineController');

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// /api/projects/:projectId/pipelines
router.get('/',       getPipelines);
router.get('/stats',  getPipelineStats);

// /api/pipelines/:id
router.get('/:id',           getPipeline);
router.post('/:id/override', authorize('admin'), overridePipeline);

module.exports = router;
