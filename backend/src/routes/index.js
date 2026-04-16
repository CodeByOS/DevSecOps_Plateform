const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const projectRoutes = require("./project.routes");
const pipelineRoutes = require("./pipeline.routes");

// Group routes
router.use("/auth", authRoutes);
router.use("/projects", projectRoutes);
router.use("/pipelines", pipelineRoutes);

module.exports = router;