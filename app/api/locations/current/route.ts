import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getCurrentLocation } from '@/lib/services/location';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET, cookieName: '__Secure-authjs.session-token' });

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const catId = searchParams.get('catId') || 'rocky';

    const currentLocation = await getCurrentLocation(catId);

    if (!currentLocation) {
      return NextResponse.json({ location: null, message: 'Rocky has not been spotted yet' });
    }

    return NextResponse.json(currentLocation);
  } catch (error) {
    console.error('Error getting current location:', error);
    return NextResponse.json(
      { error: 'Failed to get current location' },
      { status: 500 }
    );
  }
}
