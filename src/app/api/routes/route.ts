import prisma from '@/lib/prisma';
import { routeSchema } from '@/lib/validation';
import { NextRequest, NextResponse } from 'next/server';
import { getCompanyFromToken } from '../lib/auth';

export async function POST(req: NextRequest) {
  const company = await getCompanyFromToken();

  if (!company) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();

    const validated = routeSchema.parse(body); // Validates and types the input

    let route = await prisma.route.findUnique({
      where: {
        fromId_toId_companyId: {
          companyId: company!.id,
          fromId: validated.fromId,
          toId: validated.toId,
        },
      },
    });

    if (!route) {
      route = await prisma.route.create({
        data: {
          companyId: company!.id,
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

export async function GET() {
  const company = await getCompanyFromToken();

  if (!company) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const routes = await prisma.route.findMany({
    where: { companyId: company.id },
    select: {
      id: true,
      from: {
        select: { name: true },
      },
      to: {
        select: { name: true },
      },
    },
  });

  return NextResponse.json(routes);
}
