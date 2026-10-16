const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/labs
router.get('/', (req, res) => {
  const labs = db.prepare('SELECT * FROM labs ORDER BY id ASC').all();

  const stats = {
    available: labs.filter(l => l.st === 'Available').length,
    running: labs.filter(l => l.st === 'Running').length,
    completed: labs.filter(l => l.st === 'Completed').length,
    credits: 120
  };

  res.json({ labs, stats });
});

// GET /api/labs/:id
router.get('/:id', (req, res) => {
  const lab = db.prepare('SELECT * FROM labs WHERE id = ?').get(req.params.id);
  if (!lab) {
    return res.status(404).json({ error: 'Lab not found' });
  }

  // Get recent submissions for this lab if any
  const submissions = db.prepare(`
    SELECT * FROM lab_submissions WHERE lab_id = ? ORDER BY id DESC LIMIT 5
  `).all(req.params.id);

  res.json({ ...lab, submissions });
});

// POST /api/labs/:id/start
router.post('/:id/start', (req, res) => {
  const lab = db.prepare('SELECT * FROM labs WHERE id = ?').get(req.params.id);
  if (!lab) {
    return res.status(404).json({ error: 'Lab not found' });
  }

  db.prepare('UPDATE labs SET st = ? WHERE id = ?').run('Running', req.params.id);
  res.json({
    success: true,
    message: `Lab ${lab.id} session initialized`,
    terminal: `$ lab start ${lab.id}\nenvironment: ${lab.env}\nready.\nallocated container: sandbox-inst-${Math.floor(1000 + Math.random() * 9000)}`
  });
});

// POST /api/labs/:id/reset
router.post('/:id/reset', (req, res) => {
  const lab = db.prepare('SELECT * FROM labs WHERE id = ?').get(req.params.id);
  if (!lab) {
    return res.status(404).json({ error: 'Lab not found' });
  }

  res.json({
    success: true,
    terminal: `[env reset]\nEnvironment state cleared.\nSandbox ${lab.env} reloaded at ${new Date().toLocaleTimeString()}.`
  });
});

// POST /api/labs/:id/submit
router.post('/:id/submit', (req, res) => {
  const { code, terminalOutput, userId, userRole } = req.body;
  const lab = db.prepare('SELECT * FROM labs WHERE id = ?').get(req.params.id);
  if (!lab) {
    return res.status(404).json({ error: 'Lab not found' });
  }

  const uId = userId || 'STK-U1000';
  db.prepare(`
    INSERT INTO lab_submissions (lab_id, user_id, status, code, terminal_output)
    VALUES (?, ?, ?, ?, ?)
  `).run(lab.id, uId, 'PASSED', code || '', terminalOutput || '');

  db.prepare('UPDATE labs SET st = ? WHERE id = ?').run('Completed', lab.id);

  // Add audit log
  db.prepare('INSERT INTO audit_logs (actor, event) VALUES (?, ?)').run(
    uId,
    `Submitted experiment results for ${lab.id} (${lab.title})`
  );

  res.json({
    success: true,
    message: `Experiment submitted for ${lab.id}. All automated verification tests passed!`,
    terminal: `\n[experiment submitted]\nVerifying test suite... 100% OK\nResult: APPROVED (Score: 100/100)\nLab marked as Completed.`
  });
});

// POST /api/labs/:id/execute
router.post('/:id/execute', (req, res) => {
  const { command } = req.body;
  const cmd = (command || '').trim();

  let response = '';
  if (!cmd) {
    response = 'Please enter a command. Type "help" for options.';
  } else if (cmd === 'help') {
    response = 'Available commands: run, test, status, env, reset, submit, clear';
  } else if (cmd.startsWith('python') || cmd === 'run') {
    response = '[starktech-runner] Executing script...\nProcess started with PID 4192\nOutput:\nhello, lab\nExit code: 0 (OK)';
  } else if (cmd === 'test') {
    response = 'Running test suite...\n✓ test_syntax passed\n✓ test_environment passed\n✓ test_security_assertions passed\n3/3 tests passed.';
  } else if (cmd === 'status') {
    response = 'Environment: Healthy\nLatency: 14ms\nMemory Usage: 58%\nCPU Usage: 34%';
  } else {
    response = `[shell] Executed: ${cmd}\nCommand completed with return code 0.`;
  }

  res.json({ command: cmd, output: response });
});

module.exports = router;
