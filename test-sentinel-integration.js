process.env.NODE_ENV = 'test';
const http = require('node:http');
const { app, server } = require('./server');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const reqOptions = { ...options };
    reqOptions.headers = { ...(options.headers || {}) };

    let payload = null;
    if (options.body) {
      payload = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      reqOptions.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(`http://localhost:${port}${path}`, reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  console.log('=======================================================');
  console.log('🧪 STARKTECH Sentinel AI & Multi-Agent Integration Tests');
  console.log('=======================================================');
  let failures = 0;

  async function check(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
    } catch (err) {
      console.error(`❌ FAIL: ${name}`, err.message || err);
      failures++;
    }
  }

  // 1. Sentinel AI Status Endpoint
  await check('GET /api/sentinel metadata & routing configuration', async () => {
    const res = await request('/api/sentinel');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.body.service !== 'STARKTECH Sentinel AI Platform') throw new Error('Service name mismatch');
    if (!res.body.model || !res.body.model.name.includes('Qwen2.5')) throw new Error('Qwen 2.5 model not configured');
    if (!res.body.routing.student_teacher || !res.body.routing.developer_researcher) throw new Error('Missing routing definition');
  });

  // 2. Student Role Chat
  await check('POST /api/sentinel/chat - Student role course assistance', async () => {
    const res = await request('/api/sentinel/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        message: 'What courses do you recommend for learning AI and neural networks?',
        role: 'Student',
        courseContext: 'PYTHON'
      }
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.reply || res.body.reply.length < 20) throw new Error('Empty reply');
    if (res.body.role !== 'Student') throw new Error(`Role was ${res.body.role}`);
    if (!res.body.model.includes('Qwen 2.5')) throw new Error(`Model mismatch: ${res.body.model}`);
  });

  // 3. Teacher Role Chat
  await check('POST /api/sentinel/chat - Teacher role lab & curriculum guidance', async () => {
    const res = await request('/api/sentinel/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        message: 'How should I assess students completing the Build a Secure AI API lab?',
        role: 'Teacher',
        courseContext: 'LAB-040'
      }
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.reply || !res.body.reply.includes('Secure AI API')) throw new Error('Reply does not reference lab');
    if (res.body.role !== 'Teacher') throw new Error(`Role was ${res.body.role}`);
  });

  // 4. Technology Concept Query (STK-NeuralCore)
  await check('POST /api/sentinel/chat - STK-NeuralCore concept breakdown', async () => {
    const res = await request('/api/sentinel/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        message: 'Explain how STK-NeuralCore works and its code example',
        role: 'Student'
      }
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.reply.includes('NeuralCore')) throw new Error('Reply does not mention NeuralCore');
  });

  // 5. Multi-Agent Workspace Static Files
  await check('GET /sentinel-ai/ serves Multi-Agent Engine dashboard', async () => {
    const res = await request('/sentinel-ai/');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (typeof res.body !== 'string' || !res.body.includes('SentinelAI')) {
      throw new Error('Workspace HTML not returned');
    }
    if (!res.body.includes('Return to STARKTECH')) {
      throw new Error('Missing Return to STARKTECH link in workspace HTML');
    }
  });

  // 6. Multi-Agent Engine CSS serving
  await check('GET /sentinel-ai/css/styles.css serves workspace stylesheet', async () => {
    const res = await request('/sentinel-ai/css/styles.css');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (typeof res.body !== 'string' || !res.body.includes('--primary')) {
      throw new Error('CSS styles not loaded properly');
    }
  });

  // 7. Multi-Agent Engine JS serving
  await check('GET /sentinel-ai/js/app.js serves workspace javascript', async () => {
    const res = await request('/sentinel-ai/js/app.js');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (typeof res.body !== 'string' || !res.body.includes('checkSystemStatus')) {
      throw new Error('app.js script not loaded properly');
    }
  });

  // 8. Multi-Agent Engine Status Proxy/Fallback
  await check('GET /api/status returns Multi-Agent & Qwen 2.5 telemetry', async () => {
    const res = await request('/api/status');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.llm || !res.body.agents) throw new Error('Status payload incomplete');
  });

  // 9. Multi-Agent Engine Analyze Proxy/Fallback
  await check('POST /api/analyze executes threat analysis workflow', async () => {
    const res = await request('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { query: 'SQL injection attempt on login endpoint' }
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.body.status !== 'success' || !res.body.planning || !res.body.execution) {
      throw new Error('Analysis workflow response invalid');
    }
  });

  // 10. Academy HTML Client Check
  await check('GET /STARKTECH.html contains Sentinel AI Chatbot UI & Gateway', async () => {
    const res = await request('/STARKTECH.html');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.includes('sentinelChat') || !res.body.includes('sentinelDeveloper') || !res.body.includes('sentinelGuest')) {
      throw new Error('Academy HTML is missing role-based Sentinel AI functions');
    }
  });

  server.close();

  if (failures === 0) {
    console.log('\n🎉 ALL 10 SENTINEL INTEGRATION TESTS PASSED!');
    process.exit(0);
  } else {
    console.error(`\n⚠️  ${failures} test(s) failed.`);
    process.exit(1);
  }
}

runTests();
