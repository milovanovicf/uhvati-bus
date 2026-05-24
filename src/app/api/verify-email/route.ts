import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/app/utils/db';

export async function POST(req: NextRequest) {
  const { email, code } = await req.json();

  const company = await prisma.company.findUnique({ where: { email } });

  if (!company) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
  }

  if (company.emailVerified) {
    return NextResponse.json({ error: 'Already verified' }, { status: 400 });
  }

  if (
    company.verificationCode !== code ||
    !company.verificationExpiry ||
    company.verificationExpiry < new Date()
  ) {
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
  }

  await prisma.company.update({
    where: { id: company.id },
    data: {
      emailVerified: true,
      verificationCode: null,
      verificationExpiry: null,
    },
  });

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
