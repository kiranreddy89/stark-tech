const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/dashboard/:role
router.get('/:role', (req, res) => {
  const role = req.params.role;

  const projs = db.prepare('SELECT id, name, pr FROM projects LIMIT 5').all();
  const tree = db.prepare('SELECT skill, progress FROM skill_tree ORDER BY id ASC').all().map(r => [r.skill, r.progress]);
  const radar = db.prepare('SELECT topic, ring FROM radar LIMIT 3').all().map(r => [r.topic, r.ring]);
  const techCount = db.prepare('SELECT COUNT(*) as count FROM technologies').get().count;
  const labCount = db.prepare('SELECT COUNT(*) as count FROM labs').get().count;
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const activeNow = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'Active'").get().count;
  const secEvents = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count;

  const roleData = {
    Student: {
      s: [["Courses", 6], ["Labs done", 9], ["Badges", 12], ["Deadlines", 3]],
      p: [
        ["Continue learning", ["Machine Learning · Module 4", "Next: Gradient descent lab"]],
        ["Recommended course", ["Deep Learning Foundations"]],
        ["Upcoming lab", ["LAB-043 Containerize a Service"]],
        ["Assignments", ["Model report · due Fri", "Quiz 3 · due Mon"]],
        ["Projects", ["Neural Atlas · 41%"]]
      ],
      tree
    },
    Teacher: {
      s: [["Classes", 5], ["Students", 142], ["To grade", 18], ["Attendance", "94%"]],
      p: [
        ["Classes today", ["Intro to Networking 10:00", "Applied ML 14:00"]],
        ["Student performance", ["Average score 81%", "7 students at risk"]],
        ["Lab assignments", ["LAB-040 due next week"]],
        ["Announcements", ["Midterm schedule posted"]]
      ]
    },
    Developer: {
      s: [["Repositories", 14], ["API calls today", "18.2k"], ["Builds passing", "92%"], ["Deployments", 6]],
      p: [
        ["Active projects", projs.slice(0, 3).map(p => `${p.name} · ${p.pr}%`)],
        ["Deployments", ["staging · healthy", "prod · v2.4.1 live"]],
        ["Tasks", ["Review PR #212", "Rotate API key"]],
        ["Developer labs", ["LAB-041 Packet Forensics"]]
      ]
    },
    Researcher: {
      s: [["Research projects", 4], ["Experiments", 11], ["Papers", 7], ["Datasets", 9]],
      p: [
        ["Experiments", ["Exp-118 running", "Exp-117 complete"]],
        ["Technology radar", radar.slice(0, 3).map(r => `${r[0]} · ${r[1]}`)],
        ["Papers", ["Federated IDS: draft v3"]],
        ["Research activity", ["12 notes this week"]]
      ]
    },
    Engineer: {
      s: [["Services", 38], ["Uptime", "99.97%"], ["Open tasks", 15], ["Deployments", 4]],
      p: [
        ["System monitoring", ["CPU 41%", "Memory 63%", "Latency 82ms"]],
        ["Architecture", ["Edge tier review Thursday"]],
        ["Engineering tasks", ["Scale mesh nodes", "Patch base image"]],
        ["Technology stack", ["Docker", "Kubernetes", "STK-AegisNet"]]
      ]
    },
    Administrator: {
      s: [["Users", userCount], ["Active now", activeNow], ["Labs", labCount], ["Security events", secEvents]],
      p: [
        ["Role distribution", ["50 students", "15 developers", "10 teachers", "10 researchers", "10 engineers", "5 administrators"]],
        ["System activity", ["1,204 lab sessions this week"]],
        ["Security", [`${secEvents} security events logged`, "0 critical breaches"]]
      ]
    }
  };

  const payload = roleData[role] || roleData.Student;
  const overview = [
    ["Technologies", techCount || 128],
    ["Labs", labCount || 24],
    ["Projects", projs.length || 47],
    ["Research programs", 18]
  ];

  res.json({
    ...payload,
    overview
  });
});

module.exports = router;
