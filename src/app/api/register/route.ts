import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
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

  // Create JWT token after successful registration
  const token = jwt.sign({ id: company.id }, process.env.JWT_SECRET!, {
    expiresIn: '1d',
  });

  const cookieStore = await cookies();
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 1 day
    path: '/',
  });

  return NextResponse.json({
    success: true,
    message: 'Registered successfully',
    company: {
      id: company.id,
      name: company.name,
      email: company.email,
    },
  });
}
