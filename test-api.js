process.env.NODE_ENV = 'test';
const http = require('node:http');

// Import server
const { app, server } = require('./server');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const req = http.request(`http://localhost:${port}${path}`, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting STARKTECH Backend Verification ---');
  let failures = 0;

  async function check(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
    } catch (err) {
      console.error(`❌ FAIL: ${name}`, err);
      failures++;
    }
  }

  // 1. Health check
  await check('Health Endpoint', async () => {
    const res = await request('/api/health');
    if (res.status !== 200 || res.body.status !== 'ok') throw new Error(`Unexpected health response: ${JSON.stringify(res)}`);
  });

  // 2. Auth quick-picks
  await check('Auth Quick Picks', async () => {
    const res = await request('/api/auth/quick-picks');
    if (res.status !== 200 || !Array.isArray(res.body) || res.body.length < 5) throw new Error('Quick picks failed');
  });

  // 3. Auth login valid
  let authToken = '';
  let loggedInUser = null;
  await check('Auth Login (Valid)', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { identifier: 'alex.johnson@starktech.demo', password: '123456789' }
    });
    if (res.status !== 200 || !res.body.token || res.body.user.name !== 'Alex Johnson') {
      throw new Error(`Login failed: ${JSON.stringify(res)}`);
    }
    authToken = res.body.token;
    loggedInUser = res.body.user;
  });

  // 4. Auth login invalid
  await check('Auth Login (Invalid Password)', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { identifier: 'alex.johnson@starktech.demo', password: 'wrongpassword' }
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 5. Technologies list
  await check('Technologies List & Filtering', async () => {
    const resAll = await request('/api/technologies');
    if (resAll.status !== 200 || resAll.body.length !== 18) throw new Error(`Expected 18 techs, got ${resAll.body.length}`);

    const resReal = await request('/api/technologies?real=1');
    if (resReal.status !== 200 || resReal.body.length !== 10) throw new Error(`Expected 10 real techs, got ${resReal.body.length}`);

    const resSyn = await request('/api/technologies?real=0');
    if (resSyn.status !== 200 || resSyn.body.length !== 8) throw new Error(`Expected 8 synthetic techs, got ${resSyn.body.length}`);
  });

  // 6. Labs list & interactive actions
  await check('Labs List & Stats', async () => {
    const res = await request('/api/labs');
    if (res.status !== 200 || !res.body.labs || !res.body.stats) throw new Error('Labs response malformed');
    if (res.body.labs.length !== 16) throw new Error(`Expected 16 labs, got ${res.body.labs.length}`);
  });

  await check('Lab Start & Submit', async () => {
    const startRes = await request('/api/labs/LAB-040/start', { method: 'POST' });
    if (startRes.status !== 200 || !startRes.body.success) throw new Error('Lab start failed');

    const submitRes = await request('/api/labs/LAB-040/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { code: 'print("test")', terminalOutput: 'OK', userId: 'STK-U1000' }
    });
    if (submitRes.status !== 200 || !submitRes.body.success) throw new Error('Lab submit failed');

    const labCheck = await request('/api/labs/LAB-040');
    if (labCheck.body.st !== 'Completed') throw new Error(`Lab should be Completed, got ${labCheck.body.st}`);
  });

  // 7. Projects list
  await check('Projects Endpoint', async () => {
    const res = await request('/api/projects');
    if (res.status !== 200 || res.body.length !== 8) throw new Error('Projects query failed');
  });

  // 8. Learning endpoint
  await check('Learning Endpoint', async () => {
    const res = await request('/api/learning');
    if (res.status !== 200 || !res.body.courses || !res.body.tree) throw new Error('Learning endpoint failed');
  });

  // 9. Research endpoint
  await check('Research Endpoint', async () => {
    const res = await request('/api/research');
    if (res.status !== 200 || !res.body.radar || !res.body.papers) throw new Error('Research endpoint failed');
  });

  // 10. Users list & Priority update
  await check('Users List and Priority Patch', async () => {
    const usersRes = await request('/api/users');
    if (usersRes.status !== 200 || usersRes.body.length !== 100) throw new Error('Users count mismatch');

    const patchRes = await request('/api/users/STK-U1000/priority', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: { priority: 1, actor: 'Administrator' }
    });
    if (patchRes.status !== 200 || patchRes.body.priority !== 1) throw new Error('Priority patch failed');

    const userCheck = await request('/api/users/STK-U1000');
    if (userCheck.body.pri !== 1) throw new Error('Priority not updated in database');
  });

  // 11. Security Audit Logs
  await check('Security Audit Logs', async () => {
    const res = await request('/api/security/audit-logs');
    if (res.status !== 200 || !Array.isArray(res.body) || res.body.length === 0) throw new Error('Audit logs missing');
  });

  // 12. Search
  await check('Global Search', async () => {
    const res = await request('/api/search?q=neural');
    if (res.status !== 200 || !Array.isArray(res.body) || res.body.length === 0) throw new Error('Search failed');
  });

  // 13. Analytics
  await check('Analytics Endpoint', async () => {
    const res = await request('/api/analytics');
    if (res.status !== 200 || !res.body.roleDistribution) throw new Error('Analytics failed');
  });

  // 14. Dashboard
  await check('Role Dashboard Endpoint', async () => {
    const res = await request('/api/dashboard/Student');
    if (res.status !== 200 || !res.body.s || !res.body.p) throw new Error('Dashboard Student failed');
  });

  // 15. Static academy.html serving
  await check('Static academy.html Serving', async () => {
    const res = await request('/');
    if (res.status !== 200 || typeof res.body !== 'string' || !res.body.includes('STARKTECH Academy')) {
      throw new Error('academy.html not served at /');
    }
  });

  // 16. Learning Progress Sync
  await check('User Learning Progress Endpoint', async () => {
    const postRes = await request('/api/learning/progress/STK-U1000', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { courseId: 'PYTHON', completedLessons: [0, 1, 2] }
    });
    if (postRes.status !== 200 || !postRes.body.success) throw new Error('Progress save failed');

    const getRes = await request('/api/learning/progress/STK-U1000');
    if (getRes.status !== 200 || !Array.isArray(getRes.body['PYTHON']) || getRes.body['PYTHON'].length !== 3) {
      throw new Error(`Progress fetch failed: ${JSON.stringify(getRes.body)}`);
    }
  });

  server.close();

  if (failures === 0) {
    console.log('\n🎉 ALL 16 BACKEND TESTS PASSED!');
    process.exit(0);
  } else {
    console.error(`\n⚠️  ${failures} test(s) failed.`);
    process.exit(1);
  }
}

runTests();
