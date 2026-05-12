const express = require('express');
const router = express.Router();
const { getModelInfo, retrainModel } = require('../controllers/mlController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/info', getModelInfo);
router.post('/retrain', authorize('admin'), retrainModel);

module.exports = router;
