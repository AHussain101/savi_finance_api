import { NextResponse } from 'next/server';
import { publicEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/debug
 *
 * Shows OAuth configuration for debugging
 */
export async function GET(): Promise<NextResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  return NextResponse.json({
    appUrl: publicEnv.APP_URL,
    redirectUri: `${publicEnv.APP_URL}/api/auth/google/callback`,
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    clientIdPrefix: clientId ? clientId.substring(0, 20) + '...' : null,
  });
}
