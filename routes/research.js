const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/research
router.get('/', (req, res) => {
  const radarItems = db.prepare('SELECT topic, ring FROM radar ORDER BY id ASC').all();
  const techs = db.prepare('SELECT name, ring FROM technologies').all();

  const RINGS = ["Adopt", "Trial", "Experimental", "Research", "Deprecated"];

  const groupedRadar = {};
  for (const ring of RINGS) {
    const topicList = radarItems.filter(r => r.ring === ring).map(r => r.topic);
    const techList = techs.filter(t => t.ring === ring).slice(0, 2).map(t => t.name);
    groupedRadar[ring] = [...topicList, ...techList];
  }

  const papers = [
    { title: "Federated Intrusion Detection: Real-Time Decentralized Defense", status: "draft v3", author: "Dr. Sarah Wilson" },
    { title: "Post-Quantum Cryptographic Key Encapsulation in Edge Mesh", status: "under review", author: "Research Institute" },
    { title: "Zero-Knowledge Proofs for Distributed Model Verification", status: "published", author: "Platform Engineering" }
  ];

  const datasets = [
    { name: "Global Threat Telemetry v4", records: "1.4M events", size: "4.2 GB" },
    { name: "Synthetic Microkernel System Calls", records: "820K samples", size: "1.1 GB" },
    { name: "Quantum Simulation Bitstrings", records: "50K states", size: "512 MB" }
  ];

  const experiments = [
    { id: "EXP-118", name: "Distributed Gradient Compression", status: "running", progress: 74 },
    { id: "EXP-117", name: "Lattice Encryption Benchmark", status: "completed", progress: 100 },
    { id: "EXP-116", name: "AegisNet Throughput Stress Test", status: "completed", progress: 100 }
  ];

  res.json({
    rings: RINGS,
    radar: groupedRadar,
    papers,
    datasets,
    experiments
  });
});

module.exports = router;
