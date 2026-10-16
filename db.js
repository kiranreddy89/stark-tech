const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(__dirname, 'starktech.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode & foreign keys
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      dept TEXT NOT NULL,
      pri INTEGER NOT NULL,
      status TEXT NOT NULL,
      joined TEXT NOT NULL,
      last TEXT NOT NULL,
      skills TEXT NOT NULL, -- JSON array
      projects INTEGER NOT NULL DEFAULT 1,
      pw TEXT NOT NULL DEFAULT '123456789'
    );

    CREATE TABLE IF NOT EXISTS technologies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      real INTEGER NOT NULL, -- 1 for real, 0 for synthetic
      cat TEXT NOT NULL,
      ver TEXT NOT NULL,
      st TEXT NOT NULL,
      df TEXT NOT NULL,
      ring TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS labs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      tech TEXT NOT NULL,
      df TEXT NOT NULL,
      min INTEGER NOT NULL,
      env TEXT NOT NULL,
      st TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cat TEXT NOT NULL,
      st TEXT NOT NULL,
      pr INTEGER NOT NULL,
      pri TEXT NOT NULL,
      owner TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS skill_tree (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skill TEXT NOT NULL UNIQUE,
      progress INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS radar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      ring TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS docs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      version TEXT DEFAULT 'v2.4'
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_role TEXT, -- null or 'all' for all roles
      message TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      is_read INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor TEXT NOT NULL,
      event TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lab_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lab_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL,
      code TEXT,
      terminal_output TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      user_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      completed_lessons TEXT NOT NULL, -- JSON array of lesson indexes
      updated_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, course_id)
    );
  `);
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    return; // Already seeded
  }

  const FN = "Ava Noah Mia Ethan Zoe Lucas Isha Omar Chloe Ravi Nina Felix Tara Diego Leah Arjun Sofia Hugo Priya Jonas".split(" ");
  const LN = "Harris Nguyen Okafor Brandt Mehta Silva Kowalski Tanaka Rossi Adeyemi Larsen Ortiz Khan Moreau Patel Fischer Ito Duarte Walsh Novak".split(" ");
  const DEPT = {
    Student: "Learning Division",
    Developer: "Platform Engineering",
    Teacher: "Academy",
    Researcher: "Research Institute",
    Engineer: "Systems Engineering",
    Administrator: "Operations"
  };
  const PRI = { Administrator: 0, Researcher: 1, Engineer: 1, Teacher: 1, Developer: 2, Student: 3 };
  const SKL = "Python Linux Docker Networking React PostgreSQL Cryptography PyTorch Kubernetes Rust".split(" ");
  const FIX = {
    Student: ["Alex Johnson"],
    Developer: ["David Carter", "Kiran Reddy"],
    Teacher: ["Maya Patel"],
    Researcher: ["Dr. Sarah Wilson"],
    Engineer: ["Liam Chen"],
    Administrator: ["Rhea Singh"]
  };

  const pick = (a, i) => a[i % a.length];
  const userRolesConfig = { Student: 50, Developer: 15, Teacher: 10, Researcher: 10, Engineer: 10, Administrator: 5 };

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, role, dept, pri, status, joined, last, skills, projects, pw)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let n = 0;
  const createdUsers = [];
  const usedEmails = new Set();

  for (const [role, count] of Object.entries(userRolesConfig)) {
    for (let i = 0; i < count; i++, n++) {
      const nm = (FIX[role] && FIX[role][i]) || (pick(FN, n * 3 + 1) + " " + pick(LN, n * 7 + 2));
      let cleanEmail = nm.replace(/^Dr\. /, "").toLowerCase().replace(/ /g, ".") + "@starktech.demo";
      if (usedEmails.has(cleanEmail)) {
        cleanEmail = nm.replace(/^Dr\. /, "").toLowerCase().replace(/ /g, ".") + "." + (1000 + n) + "@starktech.demo";
      }
      usedEmails.add(cleanEmail);

      const u = {
        id: "STK-U" + String(1000 + n),
        name: nm,
        email: cleanEmail,
        role,
        dept: DEPT[role],
        pri: PRI[role],
        status: n % 11 ? "Active" : "Away",
        joined: (2022 + (n % 4)) + "-" + String(1 + (n % 12)).padStart(2, "0") + "-" + String(1 + ((n * 3) % 28)).padStart(2, "0"),
        last: ((n % 9) + 1) + "h ago",
        skills: JSON.stringify([pick(SKL, n), pick(SKL, n + 4)]),
        projects: 1 + (n % 5),
        pw: "123456789"
      };
      insertUser.run(u.id, u.name, u.email, u.role, u.dept, u.pri, u.status, u.joined, u.last, u.skills, u.projects, u.pw);
      createdUsers.push(u);
    }
  }

  // Technologies
  const REAL = "Python Linux Docker Kubernetes TensorFlow PyTorch React PostgreSQL Wireshark Kali-Linux".split(" ");
  const SYN = [
    ["NeuralCore", "AI & Machine Learning"],
    ["CipherGrid", "Cybersecurity"],
    ["SentinelMesh", "Distributed Systems"],
    ["QuantumVault", "Quantum Computing"],
    ["EdgeMind", "IoT"],
    ["AegisNet", "Networking"],
    ["PhotonCompute", "Hardware"],
    ["NexusOS", "Software Engineering"]
  ];
  const CATS = ["AI & Machine Learning", "Cybersecurity", "Cloud Computing", "Robotics", "Quantum Computing", "Computer Vision", "Natural Language Processing", "Distributed Systems", "Networking", "Blockchain", "Data Engineering", "Software Engineering", "IoT", "Hardware", "AR/VR", "Future Technologies"];
  const ST = ["Stable", "Experimental", "Research", "Stable", "Deprecated"];
  const DF = ["Beginner", "Intermediate", "Advanced"];
  const RING = ["Adopt", "Trial", "Experimental", "Research", "Deprecated"];

  const techs = [
    ...REAL.map((t, i) => ({
      id: t.toUpperCase(),
      name: t.replace("-", " "),
      real: 1,
      cat: CATS[i % 16],
      ver: (1 + (i % 4)) + "." + (i % 9),
      st: ST[i % 3 === 2 ? 0 : 0],
      df: DF[i % 3],
      ring: RING[i % 2]
    })),
    ...SYN.map(([t, c], i) => ({
      id: "STK-" + t.toUpperCase(),
      name: "STK-" + t,
      real: 0,
      cat: c,
      ver: (2 + (i % 3)) + "." + ((i * 3) % 10),
      st: ST[i % 5],
      df: DF[1 + (i % 2)],
      ring: RING[2 + (i % 3)]
    }))
  ];

  techs.forEach(t => {
    t.ring = t.st === "Deprecated" ? "Deprecated" : t.st === "Research" ? "Research" : t.st === "Experimental" ? "Experimental" : t.ring;
  });

  const insertTech = db.prepare(`
    INSERT INTO technologies (id, name, real, cat, ver, st, df, ring)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const t of techs) {
    insertTech.run(t.id, t.name, t.real, t.cat, t.ver, t.st, t.df, t.ring);
  }

  // Labs
  const insertLab = db.prepare(`
    INSERT INTO labs (id, title, tech, df, min, env, st)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const labTitles = [
    "Build a Secure AI API", "Packet Forensics Basics", "Containerize a Service", "Train a Small Classifier",
    "Harden a Linux Host", "Mesh Failure Drills", "Encrypt a Data Grid", "Edge Inference Tuning"
  ];
  const durations = [90, 60, 45, 120];
  const envs = ["Cloud Sandbox", "Isolated VM", "Browser Sandbox"];
  const labStatuses = ["Available", "Running", "Completed", "Available"];

  techs.slice(0, 16).forEach((t, i) => {
    const lab = {
      id: "LAB-" + String(40 + i).padStart(3, "0"),
      title: labTitles[i % 8],
      tech: t.name,
      df: DF[i % 3],
      min: durations[i % 4],
      env: envs[i % 3],
      st: labStatuses[i % 4]
    };
    insertLab.run(lab.id, lab.title, lab.tech, lab.df, lab.min, lab.env, lab.st);
  });

  // Projects
  const insertProject = db.prepare(`
    INSERT INTO projects (id, name, cat, st, pr, pri, owner)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const projNames = [
    "StarkSecure AI", "Aegis Mesh Pilot", "Neural Atlas", "Vault Sync",
    "Edge Fleet Monitor", "Cipher Audit Kit", "Nexus Installer", "Photon Benchmarks"
  ];
  const projStatuses = ["ACTIVE", "ACTIVE", "PLANNING", "REVIEW"];
  const projProgresses = [68, 41, 12, 90, 55, 77, 30, 84];
  const projPris = ["HIGH", "MEDIUM", "LOW"];

  projNames.forEach((p, i) => {
    insertProject.run(
      "STK-PROJ-" + String(21 + i).padStart(3, "0"),
      p,
      CATS[(i * 3 + 1) % 16],
      projStatuses[i % 4],
      projProgresses[i],
      projPris[i % 3],
      createdUsers[50 + i]?.name || "Lead Engineer"
    );
  });

  // Skill tree
  const insertSkill = db.prepare('INSERT INTO skill_tree (skill, progress) VALUES (?, ?)');
  const tree = [["Programming", 100], ["Python", 92], ["Machine Learning", 64], ["Deep Learning", 38], ["LLMs", 15], ["RAG", 0], ["AI Agents", 0]];
  for (const [s, pr] of tree) {
    insertSkill.run(s, pr);
  }

  // Radar
  const insertRadar = db.prepare('INSERT INTO radar (topic, ring) VALUES (?, ?)');
  const radar = [
    ["Quantum Key Distribution Study", "Research"],
    ["Federated Intrusion Detection", "Experimental"],
    ["WebAssembly Sandboxes", "Trial"],
    ["Kubernetes", "Adopt"],
    ["Legacy VPN Gateway", "Deprecated"]
  ];
  for (const [topic, ring] of radar) {
    insertRadar.run(topic, ring);
  }

  // Docs
  const insertDoc = db.prepare('INSERT INTO docs (title, category, version) VALUES (?, ?, ?)');
  const docs = [
    ["STK-NeuralCore Architecture", "Architecture", "v2.4"],
    ["Lab Environment Guide", "Lab docs", "v2.4"],
    ["Platform API v2", "API", "v2.4"],
    ["SDK Quickstart", "SDK", "v2.4"],
    ["Research Data Policy", "Research", "v2.4"],
    ["Threat Model Tutorial", "Tutorial", "v2.4"]
  ];
  for (const [title, category, version] of docs) {
    insertDoc.run(title, category, version);
  }

  // Notifications
  const insertNote = db.prepare('INSERT INTO notifications (target_role, message) VALUES (?, ?)');
  const notes = {
    all: ["New laboratory available", "New technology documentation published", "System maintenance scheduled"],
    Student: ["Your teacher assigned a new laboratory", "Your project deadline is approaching"],
    Teacher: ["3 submissions awaiting grading"],
    Developer: ["Build STK-PROJ-024 passed"],
    Researcher: ["Research project updated"],
    Engineer: ["Deployment window opens at 22:00"],
    Administrator: ["Security alert: 3 failed sign-ins"]
  };
  for (const msg of notes.all) {
    insertNote.run('all', msg);
  }
  for (const [role, items] of Object.entries(notes)) {
    if (role === 'all') continue;
    for (const msg of items) {
      insertNote.run(role, msg);
    }
  }

  // Audit Logs
  const insertAudit = db.prepare('INSERT INTO audit_logs (actor, event) VALUES (?, ?)');
  insertAudit.run('unknown', 'Failed sign-in');
  insertAudit.run('Rhea Singh', 'Priority changed');
  insertAudit.run('Rhea Singh', 'Role policy updated');
  insertAudit.run('Liam Chen', 'Session revoked');
}

// Initialize on require
initSchema();
seedData();

module.exports = db;
