import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/utils/db';
import { sendVerificationCode } from '@/lib/email';

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  const company = await prisma.company.findUnique({ where: { email } });

  if (!company) {
    return NextResponse.json({ success: true });
  }

  if (company.emailVerified) {
    return NextResponse.json({ error: 'Already verified' }, { status: 400 });
  }

  const code = generateCode();
  const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.company.update({
    where: { id: company.id },
    data: { verificationCode: code, verificationExpiry },
  });

  await sendVerificationCode(email, company.name, code);

  return NextResponse.json({ success: true });
}
