import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSessionUser } from '@/lib/server/auth';
import { saveSubmission, type RouteCorrectionRecord } from '@/lib/server/corrections-store';
import {
  githubFetch,
  getGitHubConfig,
  applyCorrectionToCsv,
  buildPrTitle,
  buildPrBody,
  CSV_PATH,
  type CorrectionRequest,
} from '@/lib/server/github';

// Rate limiting: 10 per 10 minutes per IP
const submissions = new Map<string, number[]>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 10 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = submissions.get(ip) || [];
  const recent = timestamps.filter(t => now - t < RATE_WINDOW_MS);
  submissions.set(ip, recent);
  return recent.length >= RATE_LIMIT;
}

function recordSubmission(ip: string): void {
  const timestamps = submissions.get(ip) || [];
  timestamps.push(Date.now());
  submissions.set(ip, timestamps);
}

export async function POST(request: NextRequest) {
  try {
    // 1. Ownership & Authentication
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to submit and track route corrections.' },
        { status: 401 }
      );
    }

    // 2. Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many submissions. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }

    // 3. Validation
    const body: CorrectionRequest = await request.json();

    if (!body.type || !['edit', 'add', 'remove'].includes(body.type)) {
      return NextResponse.json({ error: 'Invalid correction type.' }, { status: 400 });
    }
    if (!body.busNumber?.trim()) {
      return NextResponse.json({ error: 'Bus number is required.' }, { status: 400 });
    }
    if (!body.description?.trim()) {
      return NextResponse.json({ error: 'Route description is required.' }, { status: 400 });
    }
    if ((body.type === 'edit' || body.type === 'remove') && !body.busId) {
      return NextResponse.json({ error: 'Bus ID is required for edit or remove.' }, { status: 400 });
    }
    if ((body.type === 'edit' || body.type === 'add') && (!body.stops || body.stops.length < 2)) {
      return NextResponse.json({ error: 'At least 2 stops are required.' }, { status: 400 });
    }
    if (!body.reason?.trim()) {
      return NextResponse.json({ error: 'A reason for the correction is required.' }, { status: 400 });
    }

    const { baseBranch, isConfigured } = getGitHubConfig();

    // 4. If GitHub credentials are not configured or placeholder, run in demo/local development mode
    if (!isConfigured) {
      const mockPrNumber = Math.floor(100 + Math.random() * 900);
      const submissionId = crypto.randomUUID();
      const mockBranch = `correction/bus-${body.busNumber.replace(/\s+/g, '-')}-${Date.now()}`;

      const newRecord: RouteCorrectionRecord = {
        id: submissionId,
        userId: user.id,
        prNumber: mockPrNumber,
        prUrl: `https://github.com/mrkushalsm/Mangalore-Bus-Routes/pull/${mockPrNumber}`,
        branchName: mockBranch,
        type: body.type,
        busNumber: body.busNumber.trim(),
        description: body.description.trim(),
        busId: body.busId,
        stops: body.stops || [],
        reason: body.reason.trim(),
        submitterName: body.submitterName?.trim() || user.name,
        submitterContact: body.submitterContact?.trim() || user.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        baseSha: 'mock-base-sha',
        isMock: true,
        mockStatus: 'open',
        mockComments: [
          {
            id: `mock-1`,
            author: 'RouteReviewerBot',
            authorAvatar: 'https://github.com/identicons/app/bot.png',
            body: `Thanks for submitting! Automated checks passed. A maintainer will review the proposed stops: ${body.stops?.slice(0, 3).join(' ➔ ')}...`,
            createdAt: new Date().toISOString(),
            isReview: true,
          },
        ],
      };

      await saveSubmission(newRecord);
      recordSubmission(ip);

      return NextResponse.json({
        success: true,
        submissionId,
        prNumber: mockPrNumber,
        prUrl: newRecord.prUrl,
        isMock: true,
        message: 'Your route correction has been saved to your Contributor Portal! (Note: GITHUB_TOKEN in .env.local is unconfigured, so this was saved in local contributor mode without opening a live pull request on GitHub).',
      });
    }

    // 5. Real GitHub submission flow with concurrency safety
    // Step A: Fetch base branch SHA first to establish a consistent commit boundary
    const baseBranchData = await githubFetch(`/git/ref/heads/${baseBranch}`);
    const baseSha = baseBranchData.object?.sha;
    if (!baseSha) {
      throw new Error(`Failed to resolve base branch ${baseBranch} on repository.`);
    }

    // Step B: Fetch the CSV file using the EXACT base SHA retrieved in Step A
    const csvData = await githubFetch(`/contents/${CSV_PATH}?ref=${baseSha}`);
    const csvContent = Buffer.from(csvData.content, 'base64').toString('utf-8');
    const csvSha = csvData.sha;

    // Step C: Apply the correction to the CSV content
    const newCsvContent = applyCorrectionToCsv(csvContent, body);

    if (body.type === 'edit' && newCsvContent === csvContent) {
      return NextResponse.json(
        { error: 'No changes detected. The proposed route stops and description are identical to the existing route.' },
        { status: 400 }
      );
    }

    // Step D: Create a dedicated branch off the exact baseSha
    const timestamp = Date.now();
    const branchName = `correction/bus-${body.busNumber.replace(/\s+/g, '-')}-${timestamp}`;
    let branchCreated = false;

    try {
      await githubFetch(`/git/refs`, {
        method: 'POST',
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: baseSha,
        }),
      });
      branchCreated = true;

      // Step E: Commit updated CSV onto the new branch
      const commitMessage = buildPrTitle(body).replace('[Community] ', '');
      await githubFetch(`/contents/${CSV_PATH}`, {
        method: 'PUT',
        body: JSON.stringify({
          message: commitMessage,
          content: Buffer.from(newCsvContent).toString('base64'),
          sha: csvSha,
          branch: branchName,
        }),
      });

      // Step F: Create the Pull Request
      const pr = await githubFetch(`/pulls`, {
        method: 'POST',
        body: JSON.stringify({
          title: buildPrTitle(body),
          body: buildPrBody(body),
          head: branchName,
          base: baseBranch,
        }),
      });

      // Step G: Save submission record to server database
      const submissionId = crypto.randomUUID();
      const newRecord: RouteCorrectionRecord = {
        id: submissionId,
        userId: user.id,
        prNumber: pr.number,
        prUrl: pr.html_url,
        branchName,
        type: body.type,
        busNumber: body.busNumber.trim(),
        description: body.description.trim(),
        busId: body.busId,
        stops: body.stops || [],
        reason: body.reason.trim(),
        submitterName: body.submitterName?.trim() || user.name,
        submitterContact: body.submitterContact?.trim() || user.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        baseSha,
        isMock: false,
      };

      await saveSubmission(newRecord);
      recordSubmission(ip);

      return NextResponse.json({
        success: true,
        submissionId,
        prNumber: pr.number,
        prUrl: pr.html_url,
        message: 'Your route correction has been submitted for review. Thank you!',
      });
    } catch (operationError: any) {
      // Clean up orphaned branch on failure
      if (branchCreated) {
        try {
          await githubFetch(`/git/refs/heads/${branchName}`, { method: 'DELETE' });
        } catch (cleanupErr) {
          console.error(`Failed to clean up orphaned branch ${branchName}:`, cleanupErr);
        }
      }

      const errMsg = operationError?.message || '';
      // Handle concurrent base branch modifications / conflicts
      if (
        errMsg.includes('409') ||
        errMsg.toLowerCase().includes('conflict') ||
        errMsg.includes('Reference does not exist') ||
        errMsg.includes('is not at the expected')
      ) {
        return NextResponse.json(
          {
            error:
              'The base bus route data was updated concurrently on GitHub. Your temporary branch has been cleaned up. Please refresh and try submitting again.',
            isConflict: true,
          },
          { status: 409 }
        );
      }

      throw operationError;
    }
  } catch (error) {
    console.error('Suggest correction error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred during submission.' },
      { status: 500 }
    );
  }
}
