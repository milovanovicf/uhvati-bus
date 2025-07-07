import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  const existing = await prisma.company.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: 'Email already in use' },
      { status: 409 }
    );
  }

  const hashed = await bcrypt.hash(password, 10);

  const company = await prisma.company.create({
    data: { name, email, password: hashed },
  });

  return NextResponse.json({ message: 'Registered successfully', company });
}
