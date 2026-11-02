const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { connectDB, getDbStatus } = require('./src/config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: false,
  })
);
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Auto-reconnect middleware if DB is disconnected
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    connectDB().catch(() => {});
  }
  next();
});

// Routes
const authRoutes = require('./src/routes/authRoutes');
const stepRoutes = require('./src/routes/stepRoutes');
const goalRoutes = require('./src/routes/goalRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/steps', stepRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint (both /health and /api/health)
const healthHandler = (req, res) => {
  const { state, error } = getDbStatus();
  const isDbConnected = state === 1;
  const dbStatusMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'online' : 'database_unavailable',
    database: {
      status: dbStatusMap[state] || 'unknown',
      connected: isDbConnected,
      host: mongoose.connection.host || null,
      name: mongoose.connection.name || null,
      error: isDbConnected ? null : (error || 'Database connection in progress...'),
    },
    app: 'Daily_Activity API Server (MongoDB)',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Daily_Activity API Server (MongoDB Atlas)',
    endpoints: {
      health: 'GET /api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        updateProfile: 'PUT /api/auth/profile',
      },
      steps: {
        sync: 'POST /api/steps/sync',
        today: 'GET /api/steps/today',
        workout: 'POST /api/steps/workout',
      },
      goals: {
        get: 'GET /api/goals',
        update: 'PUT /api/goals',
      },
      analytics: {
        weekly: 'GET /api/analytics/weekly',
        monthly: 'GET /api/analytics/monthly',
        leaderboard: 'GET /api/analytics/leaderboard',
      },
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(` Daily_Activity Backend API Server Running `);
  console.log(` Database: MongoDB Atlas`);
  console.log(` Port:     ${PORT}`);
  console.log(` URL:      http://localhost:${PORT}`);
  console.log(` Health:   http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});
