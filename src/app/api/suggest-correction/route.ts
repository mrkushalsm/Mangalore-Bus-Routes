import { NextRequest, NextResponse } from 'next/server';
import { parseBusRoutesFromCsv, serializeBusRoutes, type BusRoute } from '@/lib/bus-data';

// Simple in-memory rate limiting (resets on server restart)
const submissions = new Map<string, number[]>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

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

type CorrectionType = 'edit' | 'add' | 'remove';

interface CorrectionRequest {
    type: CorrectionType;
    busNumber: string;
    description: string;
    busId?: string; // Required for edit/remove
    stops: string[]; // New/modified stops for edit/add
    reason: string;
    submitterName?: string;
    submitterContact?: string;
}

const GITHUB_API = 'https://api.github.com';
const CSV_PATH = 'public/data/bus-data.csv';
const BASE_BRANCH = process.env.GITHUB_BASE_BRANCH;

async function githubFetch(endpoint: string, options: RequestInit = {}) {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_REPO_OWNER;
    const repo = process.env.GITHUB_REPO_NAME;

    if (!token || !owner || !repo) {
        throw new Error('GitHub configuration missing. Check environment variables.');
    }

    const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API}/repos/${owner}/${repo}${endpoint}`;

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
        const error = await res.text();
        throw new Error(`GitHub API error (${res.status}): ${error}`);
    }

    return res.json();
}

async function getCurrentCsv(): Promise<{ content: string; sha: string }> {
    const data = await githubFetch(`/contents/${CSV_PATH}?ref=${BASE_BRANCH}`);
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return { content, sha: data.sha };
}

function applyCorrectionToCsv(
    csvContent: string,
    correction: CorrectionRequest
): string {
    const routes = parseBusRoutesFromCsv(csvContent);

    switch (correction.type) {
        case 'edit': {
            const index = routes.findIndex(r => r.id === correction.busId);
            if (index === -1) throw new Error(`Bus route with ID ${correction.busId} not found.`);
            routes[index] = {
                ...routes[index],
                busNumber: correction.busNumber,
                description: correction.description,
                stops: correction.stops,
            };
            break;
        }
        case 'add': {
            const maxId = Math.max(...routes.map(r => parseInt(r.id) || 0));
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
            if (removeIndex === -1) throw new Error(`Bus route with ID ${correction.busId} not found.`);
            routes.splice(removeIndex, 1);
            break;
        }
    }

    return serializeBusRoutes(routes);
}

function buildPrTitle(correction: CorrectionRequest): string {
    const prefix = correction.type === 'edit' ? '✏️ Edit'
        : correction.type === 'add' ? '➕ Add'
            : '❌ Remove';
    return `[Community] ${prefix}: Bus ${correction.busNumber} - ${correction.description}`;
}

function buildPrBody(correction: CorrectionRequest): string {
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

    lines.push(`---`);
    lines.push(`*This PR was automatically created by the Mangalore Bus Routes community correction feature.*`);
    lines.push(`*Please review the CSV diff below before merging.*`);

    return lines.join('\n');
}

export async function POST(request: NextRequest) {
    try {
        // Rate limiting
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        if (isRateLimited(ip)) {
            return NextResponse.json(
                { error: 'Too many submissions. Please try again later.' },
                { status: 429 }
            );
        }

        // Parse and validate
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
            return NextResponse.json({ error: 'Bus ID is required for edit/remove.' }, { status: 400 });
        }
        if ((body.type === 'edit' || body.type === 'add') && (!body.stops || body.stops.length < 2)) {
            return NextResponse.json({ error: 'At least 2 stops are required.' }, { status: 400 });
        }
        if (!body.reason?.trim()) {
            return NextResponse.json({ error: 'A reason for the correction is required.' }, { status: 400 });
        }

        // 1. Get current CSV from GitHub
        const { content: csvContent, sha: csvSha } = await getCurrentCsv();

        // 2. Apply the correction
        const newCsvContent = applyCorrectionToCsv(csvContent, body);

        // 3. Get the base branch SHA
        const baseBranch = await githubFetch(`/git/ref/heads/${BASE_BRANCH}`);
        const baseSha = baseBranch.object.sha;

        // 4. Create a new branch
        const timestamp = Date.now();
        const branchName = `correction/bus-${body.busNumber.replace(/\s+/g, '-')}-${timestamp}`;

        await githubFetch(`/git/refs`, {
            method: 'POST',
            body: JSON.stringify({
                ref: `refs/heads/${branchName}`,
                sha: baseSha,
            }),
        });

        // 5. Update the file on the new branch
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

        // 6. Create the Pull Request
        const pr = await githubFetch(`/pulls`, {
            method: 'POST',
            body: JSON.stringify({
                title: buildPrTitle(body),
                body: buildPrBody(body),
                head: branchName,
                base: BASE_BRANCH,
            }),
        });

        // Record submission for rate limiting
        recordSubmission(ip);

        return NextResponse.json({
            success: true,
            message: 'Your correction has been submitted for review. Thank you!',
            prUrl: pr.html_url,
            prNumber: pr.number,
        });

    } catch (error) {
        console.error('Correction submission error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'An unexpected error occurred.' },
            { status: 500 }
        );
    }
}
