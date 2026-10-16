const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/learning
router.get('/', (req, res) => {
  const treeRows = db.prepare('SELECT skill, progress FROM skill_tree ORDER BY id ASC').all();
  const tree = treeRows.map(r => [r.skill, r.progress]);

  const courses = [
    "Cybersecurity → Networking → Linux → Cryptography → Threat Detection → AI Security",
    "AI → Python → Machine Learning → Deep Learning → LLMs → RAG → AI Agents"
  ];

  const certifications = [
    { title: "Linux Fundamentals", status: "Certified", date: "2024-03-12" },
    { title: "Python Practitioner", status: "Certified", date: "2024-07-28" },
    { title: "Kubernetes Operator", status: "In Progress", date: null }
  ];

  res.json({ courses, tree, certifications });
});

// PATCH /api/learning/tree/:skill
router.patch('/tree/:skill', (req, res) => {
  const { progress } = req.body;
  const p = parseInt(progress, 10);
  if (isNaN(p) || p < 0 || p > 100) {
    return res.status(400).json({ error: 'Progress must be between 0 and 100' });
  }

  const existing = db.prepare('SELECT * FROM skill_tree WHERE skill = ?').get(req.params.skill);
  if (!existing) {
    return res.status(404).json({ error: 'Skill not found in skill tree' });
  }

  db.prepare('UPDATE skill_tree SET progress = ? WHERE skill = ?').run(p, req.params.skill);
  res.json({ success: true, skill: req.params.skill, progress: p });
});

// GET /api/learning/progress/:userId
router.get('/progress/:userId', (req, res) => {
  const rows = db.prepare('SELECT course_id, completed_lessons FROM user_progress WHERE user_id = ?').all(req.params.userId);
  const progressMap = {};
  for (const r of rows) {
    try {
      progressMap[r.course_id] = JSON.parse(r.completed_lessons);
    } catch {
      progressMap[r.course_id] = [];
    }
  }
  res.json(progressMap);
});

// POST /api/learning/progress/:userId
router.post('/progress/:userId', (req, res) => {
  const { courseId, completedLessons } = req.body;
  if (!courseId || !Array.isArray(completedLessons)) {
    return res.status(400).json({ error: 'courseId and completedLessons array are required' });
  }

  db.prepare(`
    INSERT INTO user_progress (user_id, course_id, completed_lessons, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, course_id) DO UPDATE SET
      completed_lessons = excluded.completed_lessons,
      updated_at = excluded.updated_at
  `).run(req.params.userId, courseId, JSON.stringify(completedLessons));

  res.json({ success: true, courseId, count: completedLessons.length });
});

module.exports = router;
