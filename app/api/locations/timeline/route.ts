import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getLocationTimeline } from '@/lib/services/location';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const catId = searchParams.get('catId') || 'rocky';
    const limit = parseInt(searchParams.get('limit') || '50');

    const timeline = await getLocationTimeline(catId, limit);

    return NextResponse.json(timeline);
  } catch (error) {
    console.error('Error getting timeline:', error);
    return NextResponse.json(
      { error: 'Failed to get timeline' },
      { status: 500 }
    );
  }
}
