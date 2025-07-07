import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const company = await prisma.company.findUnique({ where: { email } });

  if (!company || !(await bcrypt.compare(password, company.password))) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = jwt.sign({ id: company.id }, process.env.JWT_SECRET!, {
    expiresIn: '1d',
  });

  const cookieStore = await cookies();
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24,
    path: '/',
  });

  return NextResponse.json({ success: true });
}
