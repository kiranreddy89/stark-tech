const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/docs
router.get('/', (req, res) => {
  const docs = db.prepare('SELECT id, title, category, version FROM docs ORDER BY id ASC').all();
  res.json({
    docs,
    quickstart: {
      cliCommand: 'pip install starktech-sdk\nstk login --demo',
      npmCommand: 'npm install @starktech/sdk\nnpx stk-connect --demo',
      version: 'v2.4'
    }
  });
});

// GET /api/docs/:id
router.get('/:id', (req, res) => {
  const doc = db.prepare('SELECT * FROM docs WHERE id = ?').get(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.json(doc);
});

module.exports = router;
