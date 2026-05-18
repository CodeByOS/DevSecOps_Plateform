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
const mlRoutes = require('./routes/mlRoutes');

const app = express();
app.set('trust proxy', 1);

//* Security middleware
app.use(helmet());         // Sets secure HTTP headers automatically

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,       // Allow cookies (needed for refresh token)
}));

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute (enough for polling every 2-3 seconds)
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

//* Body parsing (except for webhooks which need raw body)
app.use(cookieParser()); // Needed to read the refresh token cookie

//* Body parsing
// We place the webhook routes BEFORE the global express.json() because
// they need the raw buffer for HMAC verification.
app.use('/api/webhooks', webhookRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//* Request logging (dev only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//* Health check & Root API
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'SecOps Platform API',
    time: new Date().toISOString(),
  });
});

app.get('/api', (_req, res) => {
  res.json({
    success: true,
    message: 'SecOps Platform API is online',
    version: '1.0.0'
  });
});

//! API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/ml', mlRoutes);

//* Pipeline routes registration
// Handle nested: /api/projects/:projectId/pipelines
// Handle standalone: /api/pipelines/:id
app.use('/api/projects/:projectId/pipelines', pipelineRoutes);
app.use('/api/pipelines', pipelineRoutes);

//* 404 handler 
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

//* Global error handler (must be last)
app.use(errorHandler);

//* Start server
const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Mode : ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health: http://localhost:${PORT}/health\n`);
    });
  })
  .catch(err => console.log("Failed to run server..", err));
