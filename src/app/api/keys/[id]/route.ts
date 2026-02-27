import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { deactivateApiKey } from '@/db/queries/api-keys';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * DELETE /api/keys/:id
 *
 * Revoke (deactivate) an API key
 */
export async function DELETE(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse<{ success: boolean } | { error: string }>> {
  try {
    const payload = await requireAuth();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
      );
    }

    // Deactivate the key (verifies ownership)
    const deactivated = await deactivateApiKey(id, payload.sub);

    if (!deactivated) {
      return NextResponse.json(
        { error: 'API key not found or already revoked' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error('Revoke key error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    );
  }
}
