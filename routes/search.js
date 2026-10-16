const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/search?q=...&role=...
router.get('/', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  const role = req.query.role || 'Student';

  if (!q) {
    return res.json([]);
  }

  const term = `%${q}%`;

  // Search Technologies
  const techs = db.prepare(`
    SELECT name as label, 'Technology' as type, 'Technologies' as tab
    FROM technologies
    WHERE LOWER(name) LIKE ? OR LOWER(id) LIKE ? OR LOWER(cat) LIKE ?
    LIMIT 5
  `).all(term, term, term);

  // Search Labs
  const labs = db.prepare(`
    SELECT (title || ' (' || id || ')') as label, 'Lab' as type, 'Labs' as tab
    FROM labs
    WHERE LOWER(title) LIKE ? OR LOWER(id) LIKE ? OR LOWER(tech) LIKE ?
    LIMIT 5
  `).all(term, term, term);

  // Search Projects
  const projs = db.prepare(`
    SELECT name as label, 'Project' as type, 'Projects' as tab
    FROM projects
    WHERE LOWER(name) LIKE ? OR LOWER(id) LIKE ? OR LOWER(cat) LIKE ?
    LIMIT 5
  `).all(term, term, term);

  // Search Docs
  const docs = db.prepare(`
    SELECT title as label, 'Documentation' as type, 'Documentation' as tab
    FROM docs
    WHERE LOWER(title) LIKE ? OR LOWER(category) LIKE ?
    LIMIT 5
  `).all(term, term);

  let users = [];
  if (role === 'Administrator') {
    users = db.prepare(`
      SELECT (name || ' (' || id || ')') as label, 'User' as type, 'Users' as tab
      FROM users
      WHERE LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(id) LIKE ?
      LIMIT 5
    `).all(term, term, term);
  }

  const results = [...techs, ...labs, ...projs, ...docs, ...users].slice(0, 10);
  res.json(results);
});

module.exports = router;
