import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { reportLocation } from '@/lib/services/location';
import { reportLocationSchema } from '@/lib/validations/location';

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = reportLocationSchema.parse(body);

    const report = await reportLocation({
      ...validatedData,
      userId: token.id,
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error: any) {
    console.error('Error reporting location:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    if (error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to report location' },
      { status: 500 }
    );
  }
}
