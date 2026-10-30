import dns from 'dns';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { hashPassword, createSession, logoutSession, registerUser, loginUser } from '../src/lib/server/auth';
import {
  saveSubmission,
  getSubmissionById,
  getUserSubmissions,
  updateSubmission,
  type RouteCorrectionRecord,
} from '../src/lib/server/corrections-store';
import {
  applyCorrectionToCsv,
  buildPrTitle,
  buildPrBody,
  getGitHubConfig,
} from '../src/lib/server/github';

// Force IPv4 to avoid IPv6 timeouts
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

const BASE_URL = 'http://localhost:9002';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ? [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  ? [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('?? MANGALORE BUS ROUTES: FULL FUNCTION & INTEGRATION VERIFICATION');
  console.log('=============================================================\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 1: Auth Hashing, Salt & Session Logic
  // --------------------------------------------------------------------------
  console.log('[SUITE 1] Testing Auth Cryptography & Session Engine...');
  const testPassword = 'SecurePassword123!';
  const salt1 = crypto.randomBytes(16).toString('hex');
  const salt2 = crypto.randomBytes(16).toString('hex');
  const hash1 = hashPassword(testPassword, salt1);
  const hash2 = hashPassword(testPassword, salt2);

  assert(Boolean(hash1 && hash1.length === 128), 'scrypt produces a valid 128-char hex hash');
  assert(Boolean(salt1 && salt1.length === 32), 'Generates unique 16-byte (32-char hex) cryptographic salt');

  const matchHash = hashPassword(testPassword, salt1);
  assert(matchHash === hash1, 'Deterministic scrypt hashing matches for identical password and salt');

  const wrongHash = hashPassword('WrongPassword!', salt1);
  assert(wrongHash !== hash1, 'Incorrect password produces non-matching hash');
  assert(salt1 !== salt2 && hash1 !== hash2, 'Unique salt prevents identical hashes for identical passwords');

  const mockUserId = 'test-crypto-user-' + Date.now();
  const sessionToken = await createSession(mockUserId);
  assert(Boolean(sessionToken && sessionToken.length === 64), 'Generates 256-bit cryptographically secure session token');

  await logoutSession(sessionToken);
  console.log('[SUITE 1 PASSED]\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 2: CSV Manipulation Engine (Add, Edit, Remove)
  // --------------------------------------------------------------------------
  console.log('[SUITE 2] Testing CSV Route Transformation Engine...');
  const sampleCsv = `id,bus_number,description,stops
1,11A,State Bank to Kankanady,State Bank;Hampankatta;Kankanady
2,15,State Bank to Surathkal,State Bank;Kodialbail;Surathkal`;

  // Test Add
  const addedCsv = applyCorrectionToCsv(sampleCsv, {
    type: 'add',
    busNumber: '51E',
    description: 'Konaje to State Bank',
    stops: ['Konaje', 'Deralakatte', 'State Bank'],
    reason: 'New service introduced',
  });
  assert(addedCsv.includes('3,51E,Konaje to State Bank,Konaje;Deralakatte;State Bank'), 'applyCorrectionToCsv correctly adds new route with auto-incremented ID');

  // Test Edit
  const editedCsv = applyCorrectionToCsv(sampleCsv, {
    type: 'edit',
    busId: '1',
    busNumber: '11A',
    description: 'State Bank to Kankanady via Jyothi',
    stops: ['State Bank', 'Hampankatta', 'Jyothi', 'Kankanady'],
    reason: 'Updated via Jyothi circle',
  });
  assert(editedCsv.includes('1,11A,State Bank to Kankanady via Jyothi,State Bank;Hampankatta;Jyothi;Kankanady'), 'applyCorrectionToCsv correctly updates existing route and stops');

  // Test Remove
  const removedCsv = applyCorrectionToCsv(sampleCsv, {
    type: 'remove',
    busId: '2',
    busNumber: '15',
    description: 'State Bank to Surathkal',
    stops: ['State Bank', 'Surathkal'],
    reason: 'Route discontinued',
  });
  assert(!removedCsv.includes('2,15,State Bank to Surathkal'), 'applyCorrectionToCsv correctly removes obsolete route');
  console.log('[SUITE 2 PASSED]\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 3: PR Title and Body Generators
  // --------------------------------------------------------------------------
  console.log('[SUITE 3] Testing PR Title & Body Generation...');
  const prTitle = buildPrTitle({
    type: 'edit',
    busNumber: '11A',
    description: 'State Bank to Kankanady',
    stops: ['State Bank', 'Kankanady'],
    reason: 'Update',
  });
  assert(prTitle.includes('[Community]') && prTitle.includes('Bus 11A'), 'buildPrTitle generates standard PR title format');

  const prBody = buildPrBody(
    {
      type: 'add',
      busNumber: '51E',
      description: 'Konaje to State Bank',
      stops: ['Konaje', 'State Bank'],
      reason: 'Direct university bus route',
      submitterName: 'Test Submitter',
      submitterContact: 'submitter@example.com',
    },
    'Revision notes: added intermediate stop'
  );
  assert(prBody.includes('## Community Route Correction'), 'buildPrBody formats structured markdown header');
  assert(prBody.includes('1. Konaje') && prBody.includes('2. State Bank'), 'buildPrBody lists ordered stops');
  assert(prBody.includes('Revision notes: added intermediate stop'), 'buildPrBody includes contributor revision history');
  console.log('[SUITE 3 PASSED]\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 4: Live HTTP Auth Endpoints (Register, Login, Me, Logout)
  // --------------------------------------------------------------------------
  console.log('[SUITE 4] Testing Live Auth HTTP Endpoints...');
  const userAEmail = `user_a_${Date.now()}@example.com`;
  const userBEmail = `user_b_${Date.now()}@example.com`;
  const testPasswordPlain = 'TestPass1234!';

  // 4.1 Register User A
  const regResA = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Alice Test', email: userAEmail, password: testPasswordPlain }),
  });
  assert(regResA.status === 200, 'POST /api/auth/register returns 200 for new user');
  const cookieHeaderA = regResA.headers.get('set-cookie') || '';
  assert(cookieHeaderA.includes('mga_correction_session='), 'Register sets HttpOnly mga_correction_session cookie');
  const userACookie = cookieHeaderA.split(';')[0];

  // 4.2 Duplicate registration rejection
  const regDup = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Alice Duplicate', email: userAEmail, password: testPasswordPlain }),
  });
  assert(regDup.status === 409, 'Duplicate registration returns 409 Conflict');

  // 4.3 Register User B
  const regResB = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Bob Test', email: userBEmail, password: testPasswordPlain }),
  });
  assert(regResB.status === 200, 'POST /api/auth/register returns 200 for User B');
  const cookieHeaderB = regResB.headers.get('set-cookie') || '';
  const userBCookie = cookieHeaderB.split(';')[0];

  // 4.4 Verify Me endpoint for User A
  const meResA = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: userACookie },
  });
  const meDataA = await meResA.json();
  assert(meDataA.authenticated === true && meDataA.user?.email === userAEmail, 'GET /api/auth/me identifies User A from session cookie');

  // 4.5 Verify Me endpoint without cookie
  const meUnauth = await fetch(`${BASE_URL}/api/auth/me`);
  const meUnauthData = await meUnauth.json();
  assert(meUnauthData.authenticated === false, 'GET /api/auth/me returns authenticated: false when unauthenticated');

  // 4.6 Login validation with wrong password
  const badLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userAEmail, password: 'WrongPassword!' }),
  });
  assert(badLogin.status === 401, 'POST /api/auth/login rejects incorrect password with 401');

  // 4.7 Login validation with correct password
  const goodLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userAEmail, password: testPasswordPlain }),
  });
  assert(goodLogin.status === 200, 'POST /api/auth/login succeeds with 200 for valid credentials');
  console.log('[SUITE 4 PASSED]\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 5: Input Validation & Security for Submissions
  // --------------------------------------------------------------------------
  console.log('[SUITE 5] Testing Route Correction Input Validation...');

  // 5.1 Unauthenticated submission rejected
  const unauthSub = await fetch(`${BASE_URL}/api/suggest-correction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'add',
      busNumber: '99',
      description: 'Test',
      stops: ['A', 'B'],
      reason: 'Test',
    }),
  });
  assert(unauthSub.status === 401, 'POST /api/suggest-correction rejects unauthenticated requests with 401');

  // 5.2 Missing bus number rejected
  const noBusNum = await fetch(`${BASE_URL}/api/suggest-correction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: userACookie },
    body: JSON.stringify({
      type: 'add',
      busNumber: '',
      description: 'Valid description',
      stops: ['A', 'B'],
      reason: 'Valid reason',
    }),
  });
  assert(noBusNum.status === 400, 'POST /api/suggest-correction rejects missing busNumber with 400');

  // 5.3 Less than 2 stops rejected
  const oneStop = await fetch(`${BASE_URL}/api/suggest-correction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: userACookie },
    body: JSON.stringify({
      type: 'add',
      busNumber: '99',
      description: 'Valid description',
      stops: ['OnlyOneStop'],
      reason: 'Valid reason',
    }),
  });
  assert(oneStop.status === 400, 'POST /api/suggest-correction rejects submissions with < 2 stops with 400');

  // 5.4 Missing reason rejected
  const noReason = await fetch(`${BASE_URL}/api/suggest-correction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: userACookie },
    body: JSON.stringify({
      type: 'add',
      busNumber: '99',
      description: 'Valid description',
      stops: ['A', 'B'],
      reason: '',
    }),
  });
  assert(noReason.status === 400, 'POST /api/suggest-correction rejects missing reason with 400');
  console.log('[SUITE 5 PASSED]\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 6: Multi-User Privacy & Submission Isolation
  // --------------------------------------------------------------------------
  console.log('[SUITE 6] Testing Multi-User Isolation & Privacy Enforcement...');
  const userAId = meDataA.user.id;
  const submissionIdA = `sub-alice-${Date.now()}`;

  // Seed a submission directly for Alice
  const aliceRecord: RouteCorrectionRecord = {
    id: submissionIdA,
    userId: userAId,
    prNumber: 991,
    prUrl: 'https://github.com/mrkushalsm/Mangalore-Bus-Routes/pull/991',
    branchName: 'correction/bus-alice-test',
    type: 'add',
    busNumber: '88A',
    description: 'Alice Private Route',
    stops: ['Stop A', 'Stop B'],
    reason: 'Private proposal for testing',
    submitterName: 'Alice Test',
    submitterContact: userAEmail,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    baseSha: 'base-sha-test',
    isMock: true,
    mockStatus: 'open',
    mockComments: [
      {
        id: 'mock-comm-1',
        author: 'ReviewerBot',
        body: 'Initial review comment for Alice proposal',
        createdAt: new Date().toISOString(),
      },
    ],
  };
  await saveSubmission(aliceRecord);

  // 6.1 Alice can see her submission
  const myCorresAlice = await fetch(`${BASE_URL}/api/my-corrections`, {
    headers: { Cookie: userACookie },
  });
  const aliceData = await myCorresAlice.json();
  const aliceHasSubmission = aliceData.submissions?.some((s: any) => s.id === submissionIdA);
  assert(aliceHasSubmission === true, 'User A can view their own submitted corrections in My Corrections');

  // 6.2 Bob CANNOT see Alice's submission (Strict Private List)
  const myCorresBob = await fetch(`${BASE_URL}/api/my-corrections`, {
    headers: { Cookie: userBCookie },
  });
  const bobData = await myCorresBob.json();
  const bobHasSubmission = bobData.submissions?.some((s: any) => s.id === submissionIdA);
  assert(bobHasSubmission === false, 'User B CANNOT see User A private submissions (Strict isolation)');

  // 6.3 Bob attempts to revise Alice's submission -> 403 Forbidden
  const bobReviseAlice = await fetch(`${BASE_URL}/api/suggest-correction/${submissionIdA}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: userBCookie },
    body: JSON.stringify({
      busNumber: '88A-HACKED',
      description: 'Hacked description',
      stops: ['Stop A', 'Stop Hacked'],
      reason: 'Malicious revision',
    }),
  });
  assert(bobReviseAlice.status === 403, 'User B revising User A submission is blocked with 403 Forbidden');
  console.log('[SUITE 6 PASSED]\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 7: Revision Flow (Update Same PR Without Duplicate PR)
  // --------------------------------------------------------------------------
  console.log('[SUITE 7] Testing Revision Flow on Open Submissions...');

  // 7.1 Alice revises her open proposal
  const aliceRevision = await fetch(`${BASE_URL}/api/suggest-correction/${submissionIdA}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: userACookie },
    body: JSON.stringify({
      busNumber: '88A',
      description: 'Alice Private Route (Revised)',
      stops: ['Stop A', 'Stop Intermediate', 'Stop B'],
      reason: 'Updated with intermediate stop',
      revisionNote: 'Added intermediate stop per feedback',
    }),
  });
  assert(aliceRevision.status === 200, 'Owner can successfully revise active proposal (HTTP 200)');
  const revResult = await aliceRevision.json();
  assert(revResult.success === true, 'Revision returns success: true');

  // Verify updated data in store
  const updatedRecord = await getSubmissionById(submissionIdA);
  assert(updatedRecord?.description === 'Alice Private Route (Revised)', 'Submission description updated in store');
  assert(updatedRecord?.stops.length === 3, 'Proposed stops array updated to 3 stops');
  console.log('[SUITE 7 PASSED]\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 8: Read-Only Lock on Merged and Closed Corrections
  // --------------------------------------------------------------------------
  console.log('[SUITE 8] Testing Read-Only Lock on Merged & Closed Proposals...');

  // 8.1 Lock when merged
  await updateSubmission(submissionIdA, { mockStatus: 'merged' });
  const reviseMerged = await fetch(`${BASE_URL}/api/suggest-correction/${submissionIdA}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: userACookie },
    body: JSON.stringify({
      busNumber: '88A',
      description: 'Attempt to edit merged',
      stops: ['Stop A', 'Stop B'],
      reason: 'Merged edit attempt',
    }),
  });
  assert(reviseMerged.status === 400, 'Revising a MERGED route correction is rejected with 400 Bad Request');
  const mergedError = await reviseMerged.json();
  assert(mergedError.error.toLowerCase().includes('merged') && mergedError.error.toLowerCase().includes('read-only'), 'Returns explicit error explaining proposal is merged and read-only');

  // 8.2 Lock when closed
  await updateSubmission(submissionIdA, { mockStatus: 'closed' });
  const reviseClosed = await fetch(`${BASE_URL}/api/suggest-correction/${submissionIdA}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: userACookie },
    body: JSON.stringify({
      busNumber: '88A',
      description: 'Attempt to edit closed',
      stops: ['Stop A', 'Stop B'],
      reason: 'Closed edit attempt',
    }),
  });
  assert(reviseClosed.status === 400, 'Revising a CLOSED route correction is rejected with 400 Bad Request');
  const closedError = await reviseClosed.json();
  assert(closedError.error.toLowerCase().includes('closed') && closedError.error.toLowerCase().includes('read-only'), 'Returns explicit error explaining proposal is closed and read-only');
  console.log('[SUITE 8 PASSED]\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 9: Reviewer Comments & Enrichment
  // --------------------------------------------------------------------------
  console.log('[SUITE 9] Testing Reviewer Comments & Status Enrichment...');
  const enrichCheck = await fetch(`${BASE_URL}/api/my-corrections`, {
    headers: { Cookie: userACookie },
  });
  const enrichData = await enrichCheck.json();
  const aliceSubEnriched = enrichData.submissions?.find((s: any) => s.id === submissionIdA);
  assert(aliceSubEnriched.status === 'closed', 'Enriched status reflects closed state');
  assert(Array.isArray(aliceSubEnriched.comments), 'Enriched submission contains reviewer comments list');
  assert(aliceSubEnriched.comments.length >= 1, 'Reviewer comments are populated in the response');
  console.log('[SUITE 9 PASSED]\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 10: Git Security & Secret Exclusion
  // --------------------------------------------------------------------------
  console.log('[SUITE 10] Testing Secret & Data Exclusion in Git...');
  const gitignoreContent = fs.readFileSync(path.join(process.cwd(), '.gitignore'), 'utf-8');
  assert(gitignoreContent.includes('.env*.local'), '.gitignore includes .env*.local');
  assert(gitignoreContent.includes('/data') || gitignoreContent.includes('data/'), '.gitignore excludes data directory');
  console.log('[SUITE 10 PASSED]\n');

  console.log('=============================================================');
  console.log(`? ALL VERIFICATION CHECKS COMPLETED: ${passedTests}/${totalTests} PASSED`);
  console.log('=============================================================\n');
}

runTests().catch((err) => {
  console.error('\n? TEST FAILED WITH EXCEPTION:', err);
  process.exit(1);
});
