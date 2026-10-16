const http = require('http');

async function testQuery(query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query });
    const req = http.request('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      },
      timeout: 30000
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ error: body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  const attacks = [
    { name: 'SQL Injection', q: 'SELECT * FROM users WHERE id = 1 OR 1=1 --' },
    { name: 'XSS Attack', q: '<script>alert(document.cookie)</script>' },
    { name: 'RCE / Command Injection', q: '; whoami && cat /etc/passwd' },
    { name: 'Path Traversal / LFI', q: '../../../../etc/shadow' },
    { name: 'SSRF Attack', q: 'http://169.254.169.254/latest/meta-data/iam/security-credentials/' },
    { name: 'Ransomware Attack', q: 'CRITICAL ALERT: System encrypted with .wannacry extension.' },
    { name: 'SSH Brute Force', q: 'Failed password for root from 192.168.1.100 port 22' },
    { name: 'DDoS Flood', q: 'High volume HTTP flood on /api/login: 10000 requests/sec' },
    { name: 'Normal / Benign', q: 'GET /academy.html HTTP/1.1 200 OK' }
  ];

  console.log('Testing Sentinel AI Multi-Agent Threat Analyst against distinct attack specifications...\n');

  for (const atk of attacks) {
    const start = Date.now();
    const res = await testQuery(atk.q);
    const duration = Date.now() - start;
    const lines = (res.report || '').split('\n').filter(Boolean);
    const classification = res.validation?.classification || res.analysis_raw?.classification || 'N/A';
    const verdict = lines.find(l => l.includes('Threat Verdict')) || 'N/A';
    const severity = lines.find(l => l.includes('Severity Rating')) || 'N/A';
    const mitre = res.validation?.mitre_mapping || res.analysis_raw?.mitre_mapping || [];

    console.log(`[${atk.name}] (${duration}ms)`);
    console.log(`  Classification: ${classification}`);
    console.log(`  Verdict: ${verdict.replace('- **Threat Verdict**: ', '')}`);
    console.log(`  Severity: ${severity.replace('- **Severity Rating**: ', '')}`);
    console.log(`  MITRE Techniques: ${mitre.map(m => (m.technique_id ? `${m.technique_id} (${m.technique_name})` : m)).join(', ')}`);
    console.log(`  Containment Actions: ${(res.execution?.containment_actions || res.analysis_raw?.containment_actions || []).length} steps formulated`);
    console.log('');
  }
}

run().catch(console.error);
