const express = require('express');
const cors = require('cors');
const path = require('node:path');

// Initialize database schema and data
require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Mount API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/technologies', require('./routes/technologies'));
app.use('/api/labs', require('./routes/labs'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/learning', require('./routes/learning'));
app.use('/api/research', require('./routes/research'));
app.use('/api/docs', require('./routes/docs'));
app.use('/api/developer', require('./routes/developer'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/security', require('./routes/security'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/search', require('./routes/search'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'STARKTECH Intelligence Platform Backend',
    version: '2.4.0',
    timestamp: new Date().toISOString()
  });
});

// Sentinel AI routes & Multi-Agent Engine connection
const sentinelModule = require('./routes/sentinel');
app.use('/api/sentinel', sentinelModule.router);

// Multi-Agent Engine API proxy/fallback endpoints
const multiAgentEndpoints = [
  '/api/status',
  '/api/analyze',
  '/api/ingest',
  '/api/ingest-directory',
  '/api/db-reset',
  '/api/test-bench'
];
multiAgentEndpoints.forEach(endpoint => {
  app.all(endpoint, (req, res) => {
    sentinelModule.proxyToFastApi(req, res, req.originalUrl);
  });
});

// Serve Sentinel AI Multi-Agent Engine workspace frontend
app.use('/sentinel-ai', express.static(path.join(__dirname, 'Multi-Agent Engine', 'frontend')));

// Serve frontend
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'academy.html'));
});

app.get('/academy', (req, res) => {
  res.sendFile(path.join(__dirname, 'academy.html'));
});

app.get('/STARKTECH.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'academy.html'));
});

// 404 handler for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Endpoint ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start server
const listenPort = process.env.NODE_ENV === 'test' ? (process.env.TEST_PORT || 0) : PORT;
const server = app.listen(listenPort, () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`=======================================================`);
    console.log(`🚀 STARKTECH Backend Server running at http://localhost:${PORT}`);
    console.log(`📡 API Endpoints available under http://localhost:${PORT}/api/`);
    console.log(`🖥️  STARKTECH Frontend: http://localhost:${PORT}/STARKTECH.html`);
    console.log(`=======================================================`);
  }
});

module.exports = { app, server };
