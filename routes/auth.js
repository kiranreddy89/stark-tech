const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Identifier (email or user ID) and password are required.' });
  }

  const cleanId = String(identifier).trim().toLowerCase();
  const user = db.prepare(`
    SELECT * FROM users 
    WHERE LOWER(email) = ? OR LOWER(id) = ?
  `).get(cleanId, cleanId);

  if (!user || user.pw !== String(password)) {
    // Record failed sign-in in audit log
    db.prepare('INSERT INTO audit_logs (actor, event) VALUES (?, ?)').run('unknown', `Failed sign-in attempt for '${identifier}'`);
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }

  // Parse skills
  let skills = [];
  try {
    skills = JSON.parse(user.skills);
  } catch (e) {
    skills = [];
  }

  const { pw, ...safeUser } = user;
  safeUser.skills = skills;

  // Simple session token simulation (e.g., Bearer token)
  const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

  res.json({
    success: true,
    user: safeUser,
    token
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const userId = req.headers['x-user-id'] || req.query.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(String(userId));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { pw, ...safeUser } = user;
  try {
    safeUser.skills = JSON.parse(user.skills);
  } catch (e) {
    safeUser.skills = [];
  }

  res.json({ user: safeUser });
});

// GET /api/auth/quick-picks
router.get('/quick-picks', (req, res) => {
  const pickNames = [
    "Alex Johnson",
    "Maya Patel",
    "David Carter",
    "Dr. Sarah Wilson",
    "Liam Chen",
    "Rhea Singh"
  ];
  
  const placeholders = pickNames.map(() => '?').join(',');
  const users = db.prepare(`SELECT id, name, email, role, dept, pri FROM users WHERE name IN (${placeholders})`).all(...pickNames);
  res.json(users);
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
