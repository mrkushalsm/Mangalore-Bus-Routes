import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { getUserSubmissions, type ReviewComment, type RouteCorrectionRecord } from '@/lib/server/corrections-store';
import { githubFetch, getGitHubConfig, fetchPrComments } from '@/lib/server/github';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface EnrichedCorrectionSubmission extends RouteCorrectionRecord {
  status: 'pending' | 'accepted' | 'closed';
  prState: string;
  isMerged: boolean;
  canRevise: boolean;
  comments: ReviewComment[];
  latestCommentDate?: string;
}

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in to view your route corrections.' },
        { status: 401 }
      );
    }

    // 2. Fetch submissions strictly for this user (Private list)
    const userSubmissions = await getUserSubmissions(user.id);
    const { isConfigured } = getGitHubConfig();

    // 3. Enrich submissions with live PR status and comments
    const enriched: EnrichedCorrectionSubmission[] = await Promise.all(
      userSubmissions.map(async (sub) => {
        // If it's a mock submission or GitHub is not configured
        if (sub.isMock || !isConfigured) {
          const status = sub.mockStatus || 'pending';
          const isMerged = status === 'merged';
          const canRevise = status === 'open' || status === 'pending';

          return {
            ...sub,
            status: isMerged ? 'accepted' : status === 'closed' ? 'closed' : 'pending',
            prState: status,
            isMerged,
            canRevise,
            comments: sub.mockComments || [],
            latestCommentDate: sub.mockComments?.[sub.mockComments.length - 1]?.createdAt,
          };
        }

        // Live GitHub PR status & comments
        try {
          const pr = await githubFetch(`/pulls/${sub.prNumber}`);
          const isMerged = Boolean(pr.merged_at || pr.merged);
          const prState = pr.state; // 'open' | 'closed'

          let status: 'pending' | 'accepted' | 'closed' = 'pending';
          if (isMerged) {
            status = 'accepted';
          } else if (prState === 'closed') {
            status = 'closed';
          }

          const comments = await fetchPrComments(sub.prNumber);

          return {
            ...sub,
            status,
            prState,
            isMerged,
            canRevise: prState === 'open' && !isMerged,
            comments,
            latestCommentDate: comments[comments.length - 1]?.createdAt,
          };
        } catch (githubErr) {
          console.warn(`Failed to fetch live GitHub info for PR #${sub.prNumber}:`, githubErr);
          // Fallback to cached or basic status
          return {
            ...sub,
            status: 'pending',
            prState: 'open',
            isMerged: false,
            canRevise: true,
            comments: [],
          };
        }
      })
    );

    return NextResponse.json(
      {
        success: true,
        submissions: enriched,
        githubConfigured: isConfigured,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('My corrections fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve corrections.' },
      { status: 500 }
    );
  }
}

