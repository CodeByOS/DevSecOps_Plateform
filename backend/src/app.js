const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const routes = require("./routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Security middleware
app.use(helmet());

// Logging
app.use(morgan("dev"));

// Enable CORS
app.use(cors());

// Parse JSON
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ message: "SecOps backend is running" });
});

// API routes
app.use("/api", routes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

module.exports = app;