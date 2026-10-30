import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { getSubmissionById, updateSubmission, type ReviewComment } from '@/lib/server/corrections-store';
import {
  githubFetch,
  getGitHubConfig,
  applyCorrectionToCsv,
  buildPrTitle,
  buildPrBody,
  CSV_PATH,
  type CorrectionRequest,
} from '@/lib/server/github';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Authenticate user
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in to revise your correction.' },
        { status: 401 }
      );
    }

    // 2. Fetch submission record and check ownership
    const submission = await getSubmissionById(id);
    if (!submission) {
      return NextResponse.json(
        { error: 'Route correction submission not found.' },
        { status: 404 }
      );
    }

    if (submission.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to edit this submission.' },
        { status: 403 }
      );
    }

    // 3. Parse and validate revision body
    const body: CorrectionRequest & { revisionNote?: string } = await request.json();

    if (!body.busNumber?.trim()) {
      return NextResponse.json({ error: 'Bus number is required.' }, { status: 400 });
    }
    if (!body.description?.trim()) {
      return NextResponse.json({ error: 'Route description is required.' }, { status: 400 });
    }
    if (submission.type !== 'remove' && (!body.stops || body.stops.length < 2)) {
      return NextResponse.json({ error: 'At least 2 stops are required.' }, { status: 400 });
    }
    if (!body.reason?.trim()) {
      return NextResponse.json({ error: 'Reason for correction is required.' }, { status: 400 });
    }

    const { baseBranch, isConfigured } = getGitHubConfig();

    // 4. Handle Mock/Local Demo mode
    if (submission.isMock || !isConfigured) {
      const currentStatus = submission.mockStatus || 'open';
      if (currentStatus !== 'open') {
        return NextResponse.json(
          { error: `Cannot revise: This correction has been ${currentStatus === 'merged' ? 'accepted and merged' : 'closed'} and is read-only.` },
          { status: 400 }
        );
      }

      const existingComments = submission.mockComments || [];
      const newComment: ReviewComment = {
        id: `mock-rev-${Date.now()}`,
        author: user.name,
        body: `🔄 **Revision Submitted by Contributor**\n\n${body.revisionNote || 'Updated proposed route stops and details.'}`,
        createdAt: new Date().toISOString(),
      };

      const updated = await updateSubmission(id, {
        busNumber: body.busNumber.trim(),
        description: body.description.trim(),
        stops: body.stops || [],
        reason: body.reason.trim(),
        mockComments: [...existingComments, newComment],
      });

      return NextResponse.json({
        success: true,
        message: 'Your route correction has been revised successfully! (Demo mode)',
        submission: updated,
      });
    }

    // 5. Live GitHub PR Revision Flow (updates the same existing PR without creating a second one)
    // Step A: Check PR state on GitHub
    const pr = await githubFetch(`/pulls/${submission.prNumber}`);
    const isMerged = Boolean(pr.merged_at || pr.merged);

    if (pr.state !== 'open' || isMerged) {
      return NextResponse.json(
        {
          error: `Cannot revise: This pull request has already been ${isMerged ? 'accepted and merged' : 'closed'} and can no longer be edited.`,
        },
        { status: 400 }
      );
    }

    // Step B: Fetch latest base branch CSV
    const baseBranchData = await githubFetch(`/git/ref/heads/${baseBranch}`);
    const baseSha = baseBranchData.object?.sha;
    const baseCsvData = await githubFetch(`/contents/${CSV_PATH}?ref=${baseSha}`);
    const baseCsvContent = Buffer.from(baseCsvData.content, 'base64').toString('utf-8');

    // Step C: Apply revised correction onto base CSV
    const revisedCorrection: CorrectionRequest = {
      type: submission.type,
      busNumber: body.busNumber.trim(),
      description: body.description.trim(),
      busId: submission.busId,
      stops: body.stops || [],
      reason: body.reason.trim(),
      submitterName: submission.submitterName || user.name,
      submitterContact: submission.submitterContact || user.email,
    };
    const revisedCsvContent = applyCorrectionToCsv(baseCsvContent, revisedCorrection);

    // Step D: Get current file SHA on the existing submission branch
    const branchFileData = await githubFetch(`/contents/${CSV_PATH}?ref=${submission.branchName}`);
    const branchCsvSha = branchFileData.sha;

    // Step E: Commit updated file to the existing branch
    const commitMsg = `Revise: Bus ${body.busNumber} route correction${body.revisionNote ? ` - ${body.revisionNote}` : ''}`;
    await githubFetch(`/contents/${CSV_PATH}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: commitMsg,
        content: Buffer.from(revisedCsvContent).toString('base64'),
        sha: branchCsvSha,
        branch: submission.branchName,
      }),
    });

    // Step F: Update existing PR title and body
    await githubFetch(`/pulls/${submission.prNumber}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: buildPrTitle(revisedCorrection),
        body: buildPrBody(revisedCorrection, body.revisionNote),
      }),
    });

    // Step G: Post a revision notification comment to the PR thread for reviewers
    if (body.revisionNote && body.revisionNote.trim()) {
      try {
        await githubFetch(`/issues/${submission.prNumber}/comments`, {
          method: 'POST',
          body: JSON.stringify({
            body: `🔄 **Correction Revised by Contributor**\n\n${body.revisionNote.trim()}`,
          }),
        });
      } catch (commentErr) {
        console.warn('Could not post revision comment to PR:', commentErr);
      }
    }

    // Step H: Update local database record
    const updated = await updateSubmission(id, {
      busNumber: body.busNumber.trim(),
      description: body.description.trim(),
      stops: body.stops || [],
      reason: body.reason.trim(),
    });

    return NextResponse.json({
      success: true,
      message: `Your correction has been revised and pull request #${submission.prNumber} was updated successfully.`,
      submission: updated,
    });
  } catch (error) {
    console.error('Revision error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to revise correction.' },
      { status: 500 }
    );
  }
}

export const PATCH = PUT;
