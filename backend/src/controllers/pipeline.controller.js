const Pipeline = require("../models/Pipeline.model");

// GET /api/pipelines
const getAllPipelines = async (req, res, next) => {
  try {
    const pipelines = await Pipeline.find().sort({ createdAt: -1 });
    return res.status(200).json(pipelines);
  } catch (error) {
    next(error);
  }
};

// GET /api/pipelines/:id
const getPipelineById = async (req, res, next) => {
  try {
    const pipeline = await Pipeline.findById(req.params.id);
    if (!pipeline) {
      return res.status(404).json({ message: "Pipeline not found" });
    }
    return res.status(200).json(pipeline);
  } catch (error) {
    next(error);
  }
};

// POST /api/pipelines
const createPipeline = async (req, res, next) => {
  try {
    const pipeline = await Pipeline.create(req.body);
    return res.status(201).json(pipeline);
  } catch (error) {
    next(error);
  }
};

// PUT /api/pipelines/:id
const updatePipeline = async (req, res, next) => {
  try {
    const pipeline = await Pipeline.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!pipeline) {
      return res.status(404).json({ message: "Pipeline not found" });
    }

    return res.status(200).json(pipeline);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/pipelines/:id
const deletePipeline = async (req, res, next) => {
  try {
    const pipeline = await Pipeline.findByIdAndDelete(req.params.id);

    if (!pipeline) {
      return res.status(404).json({ message: "Pipeline not found" });
    }

    return res.status(200).json({ message: "Pipeline deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPipelines,
  getPipelineById,
  createPipeline,
  updatePipeline,
  deletePipeline,
};