import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/db';
import { createOutdoorLocationSchema } from '@/lib/validations/outdoor-location';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const locations = await prisma.outdoorLocation.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error('Error getting outdoor locations:', error);
    return NextResponse.json(
      { error: 'Failed to get outdoor locations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createOutdoorLocationSchema.parse(body);

    const location = await prisma.outdoorLocation.create({
      data: validatedData,
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating outdoor location:', error);

    if (error instanceof Error && 'name' in error && error.name === 'ZodError' && 'errors' in error) {
      return NextResponse.json(
        { error: 'Invalid data', details: (error as { errors: unknown }).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create outdoor location' },
      { status: 500 }
    );
  }
}
