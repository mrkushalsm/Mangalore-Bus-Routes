import { NextRequest, NextResponse } from 'next/server';
import { loginUser, setSessionCookie } from '@/lib/server/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const { user, sessionToken } = await loginUser(email, password);

    const response = NextResponse.json({
      success: true,
      user,
      message: 'Logged in successfully.',
    });

    setSessionCookie(response, sessionToken);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid credentials.' },
      { status: 401 }
    );
  }
}

