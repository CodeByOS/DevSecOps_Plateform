require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

//* Route files 
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const pipelineRoutes = require('./routes/pipelineRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();

//* Security middleware
app.use(helmet());         // Sets secure HTTP headers automatically

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,       // Allow cookies (needed for refresh token)
}));

//* Rate limiter: max 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

//* Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); // Needed to read the refresh token cookie

//* Request logging (dev only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//* Health check (no auth needed)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'SecOps Platform API',
    time: new Date().toISOString(),
  });
});

//! API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/audit', auditRoutes);

//* Pipeline routes are nested under projects AND accessible standalone
// /api/projects/:projectId/pipelines  -> list pipelines for a project
// /api/pipelines/:id                  -> get/override a single pipeline
app.use('/api/projects/:projectId/pipelines', pipelineRoutes);
app.use('/api/pipelines', pipelineRoutes);

//* 404 handler 
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

//* Global error handler (must be last)
app.use(errorHandler);

//* Start server
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Mode : ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health: http://localhost:${PORT}/health\n`);
    });
  })
  .catch(err => console.log("Failed to run server..", err));
