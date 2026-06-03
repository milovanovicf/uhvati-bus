import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { Company } from '@prisma/client';
import { prisma } from '@/app/utils/db';

export async function getCompanyFromToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;

  const companyId = (jwt.verify(token, process.env.JWT_SECRET!) as Company).id;
  if (!companyId) return null;

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company || company.status !== 'ACTIVE') return null;

  return company;
}

export async function getAdminFromToken(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return false;
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { isAdmin?: boolean };
    return payload.isAdmin === true;
  } catch {
    return false;
  }
}
