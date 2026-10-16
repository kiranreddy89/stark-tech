const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/technologies
router.get('/', (req, res) => {
  const { real, cat, st, ring, df, q } = req.query;
  let sql = 'SELECT * FROM technologies WHERE 1=1';
  const params = [];

  if (real !== undefined && real !== '') {
    sql += ' AND real = ?';
    params.push(parseInt(real, 10));
  }
  if (cat) {
    sql += ' AND cat = ?';
    params.push(cat);
  }
  if (st) {
    sql += ' AND st = ?';
    params.push(st);
  }
  if (ring) {
    sql += ' AND ring = ?';
    params.push(ring);
  }
  if (df) {
    sql += ' AND df = ?';
    params.push(df);
  }
  if (q) {
    sql += ' AND (LOWER(name) LIKE ? OR LOWER(id) LIKE ? OR LOWER(cat) LIKE ?)';
    const term = `%${q.toLowerCase()}%`;
    params.push(term, term, term);
  }

  sql += ' ORDER BY real DESC, name ASC';
  const techs = db.prepare(sql).all(...params);
  res.json(techs);
});

// GET /api/technologies/:id
router.get('/:id', (req, res) => {
  const tech = db.prepare('SELECT * FROM technologies WHERE id = ?').get(req.params.id.toUpperCase());
  if (!tech) {
    return res.status(404).json({ error: 'Technology not found' });
  }
  res.json(tech);
});

// POST /api/technologies
router.post('/', (req, res) => {
  const { id, name, real, cat, ver, st, df, ring } = req.body;
  if (!id || !name || cat === undefined) {
    return res.status(400).json({ error: 'ID, name, and cat are required' });
  }

  try {
    db.prepare(`
      INSERT INTO technologies (id, name, real, cat, ver, st, df, ring)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id.toUpperCase(),
      name,
      real ? 1 : 0,
      cat,
      ver || '1.0',
      st || 'Stable',
      df || 'Beginner',
      ring || 'Adopt'
    );
    res.status(201).json({ success: true, id: id.toUpperCase() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
