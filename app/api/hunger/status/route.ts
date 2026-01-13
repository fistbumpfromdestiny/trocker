import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { calculateCurrentHunger } from '@/lib/services/hunger';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const catId = searchParams.get('catId') || 'rocky';

    const cat = await prisma.cat.findUnique({
      where: { id: catId },
    });

    if (!cat) {
      return NextResponse.json({ error: 'Cat not found' }, { status: 404 });
    }

    const currentHunger = await calculateCurrentHunger(catId);

    return NextResponse.json({
      hungerLevel: currentHunger,
      lastFedAt: cat.lastFedAt,
      lastHungerUpdate: cat.lastHungerUpdate,
    });
  } catch (error) {
    console.error('Error getting hunger status:', error);
    return NextResponse.json(
      { error: 'Failed to get hunger status' },
      { status: 500 }
    );
  }
}
