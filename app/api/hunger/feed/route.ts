import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { feedCat } from '@/lib/services/hunger';

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { catId } = body;

    if (!catId) {
      return NextResponse.json({ error: 'Cat ID is required' }, { status: 400 });
    }

    await feedCat(catId);

    return NextResponse.json({ success: true, message: 'Rocky has been fed!' });
  } catch (error) {
    console.error('Error feeding cat:', error);
    return NextResponse.json(
      { error: 'Failed to feed cat' },
      { status: 500 }
    );
  }
}
