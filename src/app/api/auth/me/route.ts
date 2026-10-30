import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    return NextResponse.json(
      {
        user: user || null,
        authenticated: Boolean(user),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { user: null, authenticated: false, error: error instanceof Error ? error.message : 'Auth check failed.' },
      { status: 500 }
    );
  }
}

