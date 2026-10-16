const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('node:crypto');

let currentApiKey = 'stk_demo_' + crypto.randomBytes(8).toString('hex');

// GET /api/developer
router.get('/', (req, res) => {
  const projects = db.prepare('SELECT id, name, pr FROM projects LIMIT 4').all();

  res.json({
    apiKey: currentApiKey,
    sdks: ["Python", "JavaScript", "Go", "Rust", "TypeScript"],
    builds: projects.map(p => `${p.name} · passing`),
    metrics: {
      requestsToday: "18.2k",
      latencyP99: "42ms",
      errorRate: "0.01%"
    }
  });
});

// POST /api/developer/rotate-key
router.post('/rotate-key', (req, res) => {
  currentApiKey = 'stk_demo_' + crypto.randomBytes(8).toString('hex');
  const actor = req.body?.actor || 'Developer';
  db.prepare('INSERT INTO audit_logs (actor, event) VALUES (?, ?)').run(actor, 'Rotated Developer API Key');
  res.json({
    success: true,
    newApiKey: currentApiKey
  });
});

module.exports = router;
