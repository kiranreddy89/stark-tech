const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/users
router.get('/', (req, res) => {
  const { role, status, q } = req.query;
  let sql = 'SELECT id, name, email, role, dept, pri, status, joined, last, skills, projects FROM users WHERE 1=1';
  const params = [];

  if (role) {
    sql += ' AND role = ?';
    params.push(role);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (q) {
    sql += ' AND (LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(id) LIKE ?)';
    const term = `%${q.toLowerCase()}%`;
    params.push(term, term, term);
  }

  sql += ' ORDER BY id ASC';

  const users = db.prepare(sql).all(...params).map(u => {
    try {
      u.skills = JSON.parse(u.skills);
    } catch {
      u.skills = [];
    }
    return u;
  });

  res.json(users);
});

// GET /api/users/:id
router.get('/:id', (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, dept, pri, status, joined, last, skills, projects FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  try {
    user.skills = JSON.parse(user.skills);
  } catch {
    user.skills = [];
  }
  res.json(user);
});

// PATCH /api/users/:id/priority
router.patch('/:id/priority', (req, res) => {
  const { priority, actor } = req.body;
  const priVal = parseInt(priority, 10);
  if (isNaN(priVal) || priVal < 0 || priVal > 3) {
    return res.status(400).json({ error: 'Priority must be an integer between 0 and 3' });
  }

  const existing = db.prepare('SELECT id, name, pri FROM users WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'User not found' });
  }

  db.prepare('UPDATE users SET pri = ? WHERE id = ?').run(priVal, req.params.id);

  // Log audit
  const actorName = actor || 'Administrator';
  db.prepare('INSERT INTO audit_logs (actor, event) VALUES (?, ?)').run(
    actorName,
    `Priority changed from P${existing.pri} to P${priVal} for ${existing.name} (${existing.id})`
  );

  res.json({ success: true, id: req.params.id, priority: priVal });
});

// PATCH /api/users/:id
router.patch('/:id', (req, res) => {
  const { name, dept, status, skills } = req.body;
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'User not found' });
  }

  const newName = name !== undefined ? name : existing.name;
  const newDept = dept !== undefined ? dept : existing.dept;
  const newStatus = status !== undefined ? status : existing.status;
  const newSkills = skills !== undefined ? JSON.stringify(skills) : existing.skills;

  db.prepare('UPDATE users SET name = ?, dept = ?, status = ?, skills = ? WHERE id = ?').run(
    newName, newDept, newStatus, newSkills, req.params.id
  );

  res.json({ success: true, message: 'User updated successfully' });
});

// DELETE /api/users/:id
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT id, name FROM users WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'User not found' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  const actor = req.body?.actor || 'Administrator';
  db.prepare('INSERT INTO audit_logs (actor, event) VALUES (?, ?)').run(actor, `Deleted user account: ${existing.name} (${existing.id})`);

  res.json({ success: true, message: 'User deleted' });
});

module.exports = router;
