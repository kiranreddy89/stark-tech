const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper to compute relative time string
function getRelativeTime(dateStr) {
  const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (isNaN(diffSec) || diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

// GET /api/security/audit-logs
router.get('/audit-logs', (req, res) => {
  const logs = db.prepare('SELECT id, actor, event, created_at FROM audit_logs ORDER BY id DESC LIMIT 50').all();

  const formatted = logs.map(l => ({
    id: l.id,
    time: getRelativeTime(l.created_at),
    event: l.event,
    actor: l.actor,
    timestamp: l.created_at
  }));

  res.json(formatted);
});

// POST /api/security/audit-logs
router.post('/audit-logs', (req, res) => {
  const { actor, event } = req.body;
  if (!event) {
    return res.status(400).json({ error: 'Event description is required' });
  }

  db.prepare('INSERT INTO audit_logs (actor, event) VALUES (?, ?)').run(actor || 'System', event);
  res.status(201).json({ success: true });
});

module.exports = router;
