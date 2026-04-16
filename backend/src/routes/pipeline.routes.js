const express = require("express");
const router = express.Router();
const {
  getAllPipelines,
  getPipelineById,
  createPipeline,
  updatePipeline,
  deletePipeline,
} = require("../controllers/pipeline.controller");

// Pipeline routes
router.get("/", getAllPipelines);
router.get("/:id", getPipelineById);
router.post("/", createPipeline);
router.put("/:id", updatePipeline);
router.delete("/:id", deletePipeline);

module.exports = router;