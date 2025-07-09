import prisma from '@/lib/prisma';
import { routeSchema } from '@/lib/validation';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validated = routeSchema.parse(body); // Validates and types the input

    let route = await prisma.route.findUnique({
      where: {
        fromId_toId: {
          fromId: validated.fromId,
          toId: validated.toId,
        },
      },
    });

    if (!route) {
      route = await prisma.route.create({
        data: {
          fromId: validated.fromId,
          toId: validated.toId,
        },
      });
    }

    return NextResponse.json(route);
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid input', details: error },
      { status: 400 }
    );
  }
}
