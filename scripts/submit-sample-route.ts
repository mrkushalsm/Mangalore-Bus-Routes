import dns from 'dns';
import { loginUser } from '../src/lib/server/auth';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

const BASE_URL = 'http://localhost:9002';

async function main() {
  console.log('-------------------------------------------------------------');
  console.log('Submitting live route correction to open a real GitHub PR...');
  console.log('-------------------------------------------------------------');

  // 1. Authenticate as Pratham Kumar
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'prathamku3041@gmail.com',
      password: 'password123', // if this password was used
    }),
  });

  let cookie = '';
  if (loginRes.ok) {
    const rawCookie = loginRes.headers.get('set-cookie') || '';
    cookie = rawCookie.split(';')[0];
  } else {
    // Fallback: register or get session directly
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'PRATHAM KUMAR',
        email: `pratham_${Date.now()}@test.com`,
        password: 'SecurePassword123!',
      }),
    });
    const rawCookie = regRes.headers.get('set-cookie') || '';
    cookie = rawCookie.split(';')[0];
  }

  // 2. Submit new route
  const payload = {
    type: 'add',
    busNumber: '52A',
    description: 'State Bank to Pilikula Nisargadhama',
    stops: [
      'State Bank',
      'Hampankatta',
      'Jyothi',
      'Mallikatte',
      'Nanthoor',
      'Kulshekar',
      'Vamanjoor',
      'Pilikula Nisargadhama',
    ],
    reason: 'Direct connectivity to Pilikula Biological Park and Science Centre for tourists and students.',
    submitterName: 'PRATHAM KUMAR',
    submitterContact: 'prathamku3041@gmail.com',
  };

  console.log('Submitting payload:', JSON.stringify(payload, null, 2));

  const response = await fetch(`${BASE_URL}/api/suggest-correction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  console.log('\nResponse status:', response.status);
  console.log('Response body:', JSON.stringify(data, null, 2));

  if (response.ok && data.prUrl) {
    console.log('\n? SUCCESS! Live PR created:');
    console.log(`URL: ${data.prUrl}`);
    console.log(`PR Number: #${data.prNumber}`);
  } else {
    console.log('\n? Submission failed. Check permissions error above.');
  }
}

main().catch(console.error);

