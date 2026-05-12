const axios = require('axios');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get ML model info
// @route   GET /api/ml/info
// @access  Private
exports.getModelInfo = asyncHandler(async (req, res) => {
  try {
    const response = await axios.get(`${process.env.ML_SERVICE_URL}/model-info`);
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('ML Service Error (info):', error.message);
    res.status(502).json({
      success: false,
      message: 'ML service is unreachable'
    });
  }
});

// @desc    Retrain ML model
// @route   POST /api/ml/retrain
// @access  Private/Admin
exports.retrainModel = asyncHandler(async (req, res) => {
  try {
    const response = await axios.post(`${process.env.ML_SERVICE_URL}/retrain`, req.body);
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('ML Service Error (retrain):', error.message);
    
    const status = error.response?.status || 502;
    const message = error.response?.data?.error || 'Retraining failed';
    
    res.status(status).json({
      success: false,
      message
    });
  }
});
