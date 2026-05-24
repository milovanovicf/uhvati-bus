import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/app/utils/db';
import { sendVerificationCode } from '@/lib/email';

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

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
  const code = generateCode();
  const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.company.create({
    data: {
      name,
      email,
      password: hashed,
      verificationCode: code,
      verificationExpiry,
    },
  });

  await sendVerificationCode(email, name, code);

  return NextResponse.json({ success: true }, { status: 201 });
}
