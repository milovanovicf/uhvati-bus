import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

export async function GET() {
  const token = (await cookies()).get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
    };

    const company = await prisma.company.findUnique({
      where: { id: payload.id },
      include: {
        trips: {
          include: {
            route: {
              select: {
                id: true,
                from: {
                  select: { name: true },
                },
                to: {
                  select: { name: true },
                },
              },
            },
            reservations: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
