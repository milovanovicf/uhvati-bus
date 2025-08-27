import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { Company } from '@/generated/prisma';

export async function getCompanyFromToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;

  const companyId = (jwt.verify(token, process.env.JWT_SECRET!) as Company).id;
  if (!companyId) return null;

  return prisma.company.findUnique({ where: { id: companyId } });
}
