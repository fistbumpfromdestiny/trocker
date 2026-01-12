import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/db';
import { updateApartmentSchema } from '@/lib/validations/apartment';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apartment = await prisma.apartment.findUnique({
      where: { id: params.id },
    });

    if (!apartment) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 });
    }

    if (apartment.userId !== token.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(apartment);
  } catch (error) {
    console.error('Error getting apartment:', error);
    return NextResponse.json(
      { error: 'Failed to get apartment' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apartment = await prisma.apartment.findUnique({
      where: { id: params.id },
    });

    if (!apartment) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 });
    }

    if (apartment.userId !== token.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateApartmentSchema.parse(body);

    const updated = await prisma.apartment.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error('Error updating apartment:', error);

    if (error instanceof Error && 'name' in error && error.name === 'ZodError' && 'errors' in error) {
      return NextResponse.json(
        { error: 'Invalid data', details: (error as { errors: unknown }).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update apartment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apartment = await prisma.apartment.findUnique({
      where: { id: params.id },
    });

    if (!apartment) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 });
    }

    if (apartment.userId !== token.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.apartment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Apartment deleted' });
  } catch (error) {
    console.error('Error deleting apartment:', error);
    return NextResponse.json(
      { error: 'Failed to delete apartment' },
      { status: 500 }
    );
  }
}
