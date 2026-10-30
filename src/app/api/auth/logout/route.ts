import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, logoutSession } from '@/lib/server/auth';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('mga_correction_session')?.value;
  if (token) {
    await logoutSession(token);
  }

  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully.',
  });

  clearSessionCookie(response);
  return response;
}

