import prisma from '@/lib/prisma';
import { citySchema } from '@/lib/validation';
import { NextResponse, NextRequest } from 'next/server';

export async function GET() {
  const cities = await prisma.city.findMany({
    select: { id: true, name: true },
    orderBy: {
      name: 'asc',
    },
  });
  return NextResponse.json(cities);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const parseResult = citySchema.safeParse(body);
  if (!parseResult.success) {
    const errors = parseResult.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return NextResponse.json({ errors }, { status: 400 });
  }

  let city = await prisma.city.findUnique({
    where: {
      name: body.name,
    },
  });

  if (!city) {
    city = await prisma.city.create({
      data: {
        name: body.name,
      },
    });
  }

  return NextResponse.json(city);
}
