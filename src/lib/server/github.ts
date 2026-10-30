import dns from 'dns';
import { parseBusRoutesFromCsv, serializeBusRoutes, type BusRoute } from '@/lib/bus-data';
import type { CorrectionType, ReviewComment } from './corrections-store';

// Prefer IPv4 to avoid ConnectTimeoutError on dual-stack networks (especially on Windows)
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

export interface CorrectionRequest {
  type: CorrectionType;
  busNumber: string;
  description: string;
  busId?: string;
  stops: string[];
  reason: string;
  submitterName?: string;
  submitterContact?: string;
}

export const GITHUB_API = 'https://api.github.com';
export const CSV_PATH = 'public/data/bus-data.csv';

export function getGitHubConfig() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;
  const baseBranch = process.env.GITHUB_BASE_BRANCH || 'master';

  const isConfigured = Boolean(
    token &&
    owner &&
    repo &&
    token !== 'your_github_pat_here' &&
    !token.startsWith('your_')
  );

  return { token, owner, repo, baseBranch, isConfigured };
}

export async function githubFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { token, owner, repo, isConfigured } = getGitHubConfig();

  if (!isConfigured) {
    throw new Error('GitHub configuration is missing or using placeholder credentials.');
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${GITHUB_API}/repos/${owner}/${repo}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    if (res.status === 403 && (errorText.includes('Resource not accessible') || errorText.includes('Must have push access'))) {
      throw new Error(
        `GitHub API Permission Error (403): The Personal Access Token lacks required permissions. Ensure your token has 'Contents: Read and write' and 'Pull requests: Read and write' permissions for this repository.`
      );
    }
    throw new Error(`GitHub API error (${res.status}): ${errorText}`);
  }

  // Handle 204 No Content (e.g. branch deletion)
  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export function applyCorrectionToCsv(
  csvContent: string,
  correction: CorrectionRequest
): string {
  const routes = parseBusRoutesFromCsv(csvContent);

  switch (correction.type) {
    case 'edit': {
      const index = routes.findIndex(r => r.id === correction.busId);
      if (index === -1) {
        // Fallback: try matching by busNumber if ID doesn't match
        const byNumIndex = routes.findIndex(r => r.busNumber.toLowerCase() === correction.busNumber.toLowerCase());
        if (byNumIndex === -1) {
          throw new Error(`Bus route with ID ${correction.busId || correction.busNumber} not found in CSV.`);
        }
        routes[byNumIndex] = {
          ...routes[byNumIndex],
          busNumber: correction.busNumber,
          description: correction.description,
          stops: correction.stops,
        };
      } else {
        routes[index] = {
          ...routes[index],
          busNumber: correction.busNumber,
          description: correction.description,
          stops: correction.stops,
        };
      }
      break;
    }
    case 'add': {
      const maxId = Math.max(...routes.map(r => parseInt(r.id) || 0), 0);
      const newRoute: BusRoute = {
        id: (maxId + 1).toString(),
        busNumber: correction.busNumber,
        description: correction.description,
        stops: correction.stops,
      };
      routes.push(newRoute);
      break;
    }
    case 'remove': {
      const removeIndex = routes.findIndex(r => r.id === correction.busId);
      if (removeIndex === -1) {
        const byNumIndex = routes.findIndex(r => r.busNumber.toLowerCase() === correction.busNumber.toLowerCase());
        if (byNumIndex === -1) {
          throw new Error(`Bus route with ID ${correction.busId || correction.busNumber} not found.`);
        }
        routes.splice(byNumIndex, 1);
      } else {
        routes.splice(removeIndex, 1);
      }
      break;
    }
  }

  return serializeBusRoutes(routes);
}

export function buildPrTitle(correction: CorrectionRequest): string {
  const prefix = correction.type === 'edit' ? '✏️ Edit'
    : correction.type === 'add' ? '➕ Add'
      : '❌ Remove';
  return `[Community] ${prefix}: Bus ${correction.busNumber} - ${correction.description}`;
}

export function buildPrBody(correction: CorrectionRequest, revisionNotes?: string): string {
  const lines = [
    `## Community Route Correction`,
    ``,
    `**Type:** ${correction.type.charAt(0).toUpperCase() + correction.type.slice(1)}`,
    `**Bus Number:** ${correction.busNumber}`,
    `**Description:** ${correction.description}`,
    ``,
  ];

  if (correction.type !== 'remove') {
    lines.push(`### Stops`);
    correction.stops.forEach((stop, i) => {
      lines.push(`${i + 1}. ${stop}`);
    });
    lines.push(``);
  }

  lines.push(`### Reason`);
  lines.push(correction.reason || 'No reason provided.');
  lines.push(``);

  if (correction.submitterName) {
    lines.push(`### Submitted By`);
    lines.push(`**Name:** ${correction.submitterName}`);
    if (correction.submitterContact) {
      lines.push(`**Contact:** ${correction.submitterContact}`);
    }
    lines.push(``);
  }

  if (revisionNotes) {
    lines.push(`### 🔄 Revision History`);
    lines.push(revisionNotes);
    lines.push(``);
  }

  lines.push(`---`);
  lines.push(`*This PR was submitted via the Mangalore Bus Routes community correction portal.*`);
  lines.push(`*Reviewers: Review the CSV diff below and leave comments if revisions are requested.*`);

  return lines.join('\n');
}

export async function fetchPrComments(prNumber: number): Promise<ReviewComment[]> {
  const comments: ReviewComment[] = [];

  try {
    // 1. Issue comments (general conversation comments on the PR)
    const issueComments = await githubFetch<any[]>(`/issues/${prNumber}/comments`);
    for (const c of issueComments) {
      comments.push({
        id: `issue-${c.id}`,
        author: c.user?.login || 'Reviewer',
        authorAvatar: c.user?.avatar_url,
        body: c.body || '',
        createdAt: c.created_at,
        htmlUrl: c.html_url,
        isReview: false,
      });
    }
  } catch (err) {
    console.warn(`Could not fetch issue comments for PR #${prNumber}:`, err);
  }

  try {
    // 2. PR review comments (inline review diff comments)
    const reviewComments = await githubFetch<any[]>(`/pulls/${prNumber}/comments`);
    for (const c of reviewComments) {
      comments.push({
        id: `review-${c.id}`,
        author: c.user?.login || 'Reviewer',
        authorAvatar: c.user?.avatar_url,
        body: c.body || '',
        createdAt: c.created_at,
        htmlUrl: c.html_url,
        isReview: true,
      });
    }
  } catch (err) {
    console.warn(`Could not fetch review comments for PR #${prNumber}:`, err);
  }

  try {
    // 3. PR review status comments (APPROVE, REQUEST_CHANGES, COMMENT)
    const reviews = await githubFetch<any[]>(`/pulls/${prNumber}/reviews`);
    for (const r of reviews) {
      if (r.body && r.body.trim()) {
        comments.push({
          id: `state-${r.id}`,
          author: r.user?.login || 'Reviewer',
          authorAvatar: r.user?.avatar_url,
          body: `**[${r.state}]** ${r.body}`,
          createdAt: r.submitted_at || new Date().toISOString(),
          htmlUrl: r.html_url,
          isReview: true,
        });
      }
    }
  } catch (err) {
    console.warn(`Could not fetch reviews for PR #${prNumber}:`, err);
  }

  // Sort chronologically
  return comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

