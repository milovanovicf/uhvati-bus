import React from 'react';
import Link from 'next/link';
import { getCompanyTrips, getCurrentCompany } from '../actions';
import CompanyClient from '@/components/company/CompanyClient';
import LogoutButton from '@/components/LogoutButton';
import { LogIn, AlertCircle } from 'lucide-react';

export default async function CompanyDashboard() {
  try {
    const company = await getCurrentCompany();
    const trips = await getCompanyTrips();

    return (
      <div className="min-h-screen p-6 bg-slate-50">
        <header className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Dobrodošli, {company?.name}</h2>
          <LogoutButton />
        </header>

        <CompanyClient
          company={company}
          initialTrips={trips}
        />
      </div>
    );
  } catch (error) {
    const isUnauthorized =
      error instanceof Error && error.message === 'Unauthorized';

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border p-10 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 rounded-full p-3">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          {isUnauthorized ? (
            <>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Niste prijavljeni
              </h1>
              <p className="text-gray-500 mb-6">
                Ova stranica je dostupna samo prijavljenim kompanijama. Molimo
                prijavite se da biste nastavili.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Greška pri učitavanju
              </h1>
              <p className="text-gray-500 mb-6">
                Došlo je do neočekivane greške. Pokušajte ponovo ili se
                prijavite iznova.
              </p>
            </>
          )}

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <LogIn className="h-4 w-4" />
            Prijavite se
          </Link>
        </div>
      </div>
    );
  }
}
