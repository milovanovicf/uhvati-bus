'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/app/utils/db';
import { getAdminFromToken } from '@/app/api/lib/auth';

async function requireAdmin() {
  const isAdmin = await getAdminFromToken();
  if (!isAdmin) throw new Error('Unauthorized');
}

export async function approveCompany(id: number) {
  await requireAdmin();
  await prisma.company.update({ where: { id }, data: { status: 'ACTIVE' } });
  revalidatePath('/admin');
}

export async function disableCompany(id: number) {
  await requireAdmin();
  await prisma.company.update({ where: { id }, data: { status: 'DISABLED' } });
  revalidatePath('/admin');
}

export async function enableCompany(id: number) {
  await requireAdmin();
  await prisma.company.update({ where: { id }, data: { status: 'ACTIVE' } });
  revalidatePath('/admin');
}

export async function deleteCompany(id: number) {
  await requireAdmin();
  await prisma.company.delete({ where: { id } });
  revalidatePath('/admin');
}
