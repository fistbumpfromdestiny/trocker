import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/db';
import { createApartmentSchema } from '@/lib/validations/apartment';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apartments = await prisma.apartment.findMany({
      where: { userId: token.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(apartments);
  } catch (error) {
    console.error('Error getting apartments:', error);
    return NextResponse.json(
      { error: 'Failed to get apartments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createApartmentSchema.parse(body);

    const apartment = await prisma.apartment.create({
      data: {
        ...validatedData,
        userId: token.id,
      },
    });

    return NextResponse.json(apartment, { status: 201 });
  } catch (error: any) {
    console.error('Error creating apartment:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create apartment' },
      { status: 500 }
    );
  }
}
