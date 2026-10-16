const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/projects
router.get('/', (req, res) => {
  const { cat, status, pri, q } = req.query;
  let sql = 'SELECT * FROM projects WHERE 1=1';
  const params = [];

  if (cat) {
    sql += ' AND cat = ?';
    params.push(cat);
  }
  if (status) {
    sql += ' AND st = ?';
    params.push(status);
  }
  if (pri) {
    sql += ' AND pri = ?';
    params.push(pri);
  }
  if (q) {
    sql += ' AND (LOWER(name) LIKE ? OR LOWER(id) LIKE ? OR LOWER(owner) LIKE ?)';
    const term = `%${q.toLowerCase()}%`;
    params.push(term, term, term);
  }

  sql += ' ORDER BY id ASC';
  const projects = db.prepare(sql).all(...params);
  res.json(projects);
});

// GET /api/projects/:id
router.get('/:id', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(project);
});

// POST /api/projects
router.post('/', (req, res) => {
  const { name, cat, st, pr, pri, owner } = req.body;
  if (!name || !cat) {
    return res.status(400).json({ error: 'Name and category are required' });
  }

  const count = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
  const newId = 'STK-PROJ-' + String(21 + count).padStart(3, '0');

  db.prepare(`
    INSERT INTO projects (id, name, cat, st, pr, pri, owner)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    newId,
    name,
    cat,
    st || 'PLANNING',
    parseInt(pr, 10) || 0,
    pri || 'MEDIUM',
    owner || 'Unassigned'
  );

  res.status(201).json({ success: true, id: newId });
});

// PATCH /api/projects/:id
router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const { name, cat, st, pr, pri, owner } = req.body;
  db.prepare(`
    UPDATE projects 
    SET name = ?, cat = ?, st = ?, pr = ?, pri = ?, owner = ?
    WHERE id = ?
  `).run(
    name !== undefined ? name : existing.name,
    cat !== undefined ? cat : existing.cat,
    st !== undefined ? st : existing.st,
    pr !== undefined ? parseInt(pr, 10) : existing.pr,
    pri !== undefined ? pri : existing.pri,
    owner !== undefined ? owner : existing.owner,
    req.params.id
  );

  res.json({ success: true, message: 'Project updated' });
});

module.exports = router;
