import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/logout
 *
 * Clear the session cookie to log out the user
 */
export async function POST(): Promise<NextResponse<{ success: boolean }>> {
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}
