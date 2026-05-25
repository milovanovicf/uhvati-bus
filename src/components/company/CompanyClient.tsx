'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { Company } from '@/generated/prisma';
import TripsTab from './TripsTab';
import SettingsTab from './SettingsTab';
import TripModal from './RecurringTripModal';
import LogoutButton from '@/components/LogoutButton';
import { useTranslation } from '@/lib/i18n/LanguageContext';

type Tab = 'trips' | 'settings';

export type TripReservation = {
  id: number;
  fullName: string;
  email: string;
  seats: unknown;
};

export type TripWithDetails = {
  id: number;
  routeId: number;
  companyId: number;
  departure: Date;
  arrival: Date;
  seatsTotal: number;
  seatsAvailable: number;
  route: {
    id: number;
    from: { id: number; name: string };
    to: { id: number; name: string };
  };
  reservations: TripReservation[];
};

export type RouteWithCities = {
  id: number;
  companyId: number;
  fromId: number;
  toId: number;
  distance: number | null;
  duration: number | null;
  from: { name: string };
  to: { name: string };
};

interface DashboardClientProps {
  company: Company;
  initialTrips: TripWithDetails[];
}

export default function DashboardClient({
  company,
  initialTrips,
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('trips');
  const [modalOpen, setModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { language, setLanguage, t } = useTranslation();

  const handleTabChange = (tab: Tab) => {
    startTransition(() => setActiveTab(tab));
  };

  function renderTab() {
    switch (activeTab) {
      case 'trips':
        return <TripsTab trips={initialTrips} isPending={isPending} />;
      case 'settings':
        return <SettingsTab company={company} isPending={isPending} />;
      default:
        return null;
    }
  }

  return (
    <>
      <header className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t('nav.welcome', { name: company.name })}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLanguage(language === 'sr' ? 'en' : 'sr')}
            className="text-sm font-medium px-2.5 py-1 border rounded hover:bg-gray-50 transition-colors"
          >
            {language === 'sr' ? 'EN' : 'SR'}
          </button>
          <LogoutButton />
        </div>
      </header>
      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.management')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setModalOpen(true)}
                className="cursor-pointer mb-4 w-full"
                disabled={isPending}
              >
                <Plus className="mr-2 h-4 w-4" /> {t('dashboard.addTrip')}
              </Button>

              <ul className="space-y-2">
                {(['trips', 'settings'] as Tab[]).map((tab) => (
                  <li key={tab}>
                    <button
                      className={`text-sm cursor-pointer w-full text-left p-2 rounded hover:bg-gray-100 ${
                        activeTab === tab ? 'font-bold bg-gray-100' : ''
                      }`}
                      onClick={() => handleTabChange(tab)}
                      disabled={isPending}
                    >
                      {tab === 'trips' && t('dashboard.tabTrips')}
                      {tab === 'settings' && t('dashboard.tabSettings')}
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </aside>

        <section className="col-span-1 lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              {isPending ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                  <span className="ml-2">{t('dashboard.loading')}</span>
                </div>
              ) : (
                renderTab()
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      <TripModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
