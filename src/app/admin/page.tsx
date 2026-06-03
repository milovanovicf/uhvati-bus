import { redirect } from 'next/navigation';
import { getAdminFromToken } from '@/app/api/lib/auth';
import { prisma } from '@/app/utils/db';
import AdminClient from './AdminClient';

export default async function AdminPage() {
  const isAdmin = await getAdminFromToken();
  if (!isAdmin) redirect('/admin/login');

  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      emailVerified: true,
    },
    orderBy: { status: 'asc' },
  });

  return <AdminClient companies={companies} />;
}
