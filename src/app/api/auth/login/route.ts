import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { getUserByEmail } from '@/db/queries/users';
import { signJWT, setSessionCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  userId: string;
  email: string;
  plan: string;
}

/**
 * POST /api/auth/login
 *
 * Authenticate user and issue JWT session cookie
 */
export async function POST(request: Request): Promise<NextResponse<LoginResponse | { error: string }>> {
  try {
    const body = await request.json() as LoginRequest;
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = await compare(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Sign JWT and set session cookie
    const token = await signJWT({
      userId: user.id,
      plan: user.plan,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      plan: user.plan,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}
