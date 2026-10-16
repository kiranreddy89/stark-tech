const http = require('node:http');

async function testEndpoint(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path,
      method,
      headers: {
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, data: raw });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function verifyDeveloperWorkflow() {
  console.log('--- Simulating Developer Workspace Flows on http://localhost:3000 ---');

  // 1. Status Check
  const statusRes = await testEndpoint('GET', '/api/status');
  console.log('1. GET /api/status ->', statusRes.status, 'Agents:', statusRes.data.agents ? statusRes.data.agents.length : 'none');
  if (statusRes.status !== 200) throw new Error('Status failed');

  // 2. Threat Analysis
  console.log('2. Running Threat Analysis (simulating "Run Threat Investigation")...');
  const analyzeRes = await testEndpoint('POST', '/api/analyze', { query: "SELECT * FROM users WHERE id = '1' OR '1'='1';" });
  console.log('   POST /api/analyze ->', analyzeRes.status);
  console.log('   Logs Count:', analyzeRes.data.communication_logs?.length);
  console.log('   Report Length:', analyzeRes.data.report?.length);
  console.log('   Status:', analyzeRes.data.status);
  if (analyzeRes.status !== 200 || !analyzeRes.data.communication_logs || !analyzeRes.data.report) {
    throw new Error('Analyze failed');
  }

  // 3. Test Bench
  console.log('3. Running Benchmark (simulating "Run Benchmark")...');
  const benchRes = await testEndpoint('POST', '/api/test-bench');
  console.log('   POST /api/test-bench ->', benchRes.status);
  console.log('   Accuracy Rate:', benchRes.data.accuracy_rate + '%');
  console.log('   Scenarios Count:', benchRes.data.results?.length);
  if (benchRes.status !== 200 || !benchRes.data.results) {
    throw new Error('Benchmark failed');
  }

  // 4. DB Reset
  console.log('4. Running DB Reset (simulating "Reset DB")...');
  const resetRes = await testEndpoint('POST', '/api/db-reset');
  console.log('   POST /api/db-reset ->', resetRes.status, resetRes.data);
  if (resetRes.status !== 200) throw new Error('DB Reset failed');

  console.log('\n🌟 ALL DEVELOPER WORKSPACE OPERATIONS COMPLETED WITH 0 ERRORS!');
  process.exit(0);
}

verifyDeveloperWorkflow().catch(err => {
  console.error('❌ Verification Error:', err);
  process.exit(1);
});
