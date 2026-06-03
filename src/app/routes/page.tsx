import React from 'react';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Header from '@/components/homepage/header';
import Footer from '@/components/homepage/footer';
import RoutesResults from '@/components/routes/RoutesResults';
import { getCompanyFromToken } from '../api/lib/auth';

interface RoutesPageProps {
  searchParams: Promise<{
    fromId?: string;
    toId?: string;
    date?: string;
  }>;
}

export default async function RoutesPage({ searchParams }: RoutesPageProps) {
  const company = await getCompanyFromToken();

  if (company) {
    redirect('/company');
  }

  const resolvedSearchParams = await searchParams;
  const { fromId, toId, date } = resolvedSearchParams;

  if (!fromId || !toId || !date) {
    redirect('/');
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dostupne rute
            </h1>
            <p className="text-gray-600">
              Rezultati pretrage za odabrani datum i destinaciju
            </p>
          </div>

          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Učitavanje...</span>
              </div>
            }
          >
            <RoutesResults
              fromId={fromId}
              toId={toId}
              date={date}
            />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
