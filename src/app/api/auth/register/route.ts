import { NextRequest, NextResponse } from 'next/server';
import { registerUser, setSessionCookie } from '@/lib/server/auth';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }
    if (!email || !email.trim() || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const { user, sessionToken } = await registerUser(name, email, password);

    const response = NextResponse.json({
      success: true,
      user,
      message: 'Account created successfully.',
    });

    setSessionCookie(response, sessionToken);
    return response;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Registration failed.';
    const status = errMsg.toLowerCase().includes('already exists') ? 409 : 400;
    return NextResponse.json({ error: errMsg }, { status });
  }
}

