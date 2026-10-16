const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/notifications
router.get('/', (req, res) => {
  const { role } = req.query;
  let notes;

  if (role) {
    notes = db.prepare(`
      SELECT id, target_role, message, created_at, is_read 
      FROM notifications 
      WHERE target_role = 'all' OR target_role = ?
      ORDER BY id DESC
    `).all(role);
  } else {
    notes = db.prepare(`
      SELECT id, target_role, message, created_at, is_read 
      FROM notifications 
      ORDER BY id DESC
    `).all();
  }

  res.json(notes);
});

// POST /api/notifications
router.post('/', (req, res) => {
  const { targetRole, message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  db.prepare('INSERT INTO notifications (target_role, message) VALUES (?, ?)').run(targetRole || 'all', message);
  res.status(201).json({ success: true, message: 'Notification created' });
});

// POST /api/notifications/:id/read
router.post('/:id/read', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
