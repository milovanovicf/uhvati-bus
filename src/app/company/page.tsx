import React from 'react';
import { LogoutLink } from '@kinde-oss/kinde-auth-nextjs/server';
import {
  getCompanyTrips,
  getCurrentCompany,
  getCompanyRoutes,
} from '../actions';
import CompanyClient from '@/components/company/CompanyClient';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';

export default async function CompanyDashboard() {
  try {
    const company = await getCurrentCompany();
    const trips = await getCompanyTrips();
    const routes = await getCompanyRoutes();

    async function handleLogout() {
      try {
        await fetch('/api/logout', { method: 'POST', credentials: 'include' });
        window.location.href = '/';
      } catch {
        window.location.href = '/';
      }
    }

    return (
      <div className="min-h-screen p-6 bg-slate-50">
        <header className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Dobrodošli {company?.name}</h2>
          <div className="flex items-center gap-3">
            <LogoutButton />
          </div>
        </header>

        <CompanyClient
          company={company}
          initialTrips={trips}
          initialRoutes={routes}
        />
      </div>
    );
  } catch (error) {
    return (
      <div className="min-h-screen p-6 bg-slate-50">
        <div className="text-center">
          <p className="text-red-500 text-lg">
            Error loading dashboard:{' '}
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <LogoutLink className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block">
            Sign In Again
          </LogoutLink>
        </div>
      </div>
    );
  }
}
