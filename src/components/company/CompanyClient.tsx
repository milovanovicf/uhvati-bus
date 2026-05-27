'use client';

import React, { useState, useTransition, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, ChevronLeft, ChevronRight, ChevronDown, Bus, CircleUser, Settings, LogOut } from 'lucide-react';
import { Company } from '@prisma/client';
import TripsTab from './TripsTab';
import SettingsTab from './SettingsTab';
import TripModal from './RecurringTripModal';
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
  const [collapsed, setCollapsed] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { language, setLanguage, t } = useTranslation();
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTabChange = (tab: Tab) => {
    startTransition(() => setActiveTab(tab));
  };

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    } finally {
      window.location.href = '/';
    }
  }

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
        <button
          onClick={() => setLanguage(language === 'sr' ? 'en' : 'sr')}
          className="text-sm font-medium px-2.5 py-1 border rounded hover:bg-gray-50 transition-colors"
        >
          {language === 'sr' ? 'EN' : 'SR'}
        </button>
      </header>

      <main className="flex gap-6 items-start">
        {/* Sidebar */}
        <aside className={`shrink-0 transition-all duration-200 ${collapsed ? 'w-14' : 'w-48'}`}>
          <Card className="h-full">
            <CardContent className="p-3">
              {/* Collapse toggle */}
              <div className={`flex items-center mb-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
                {!collapsed && (
                  <span className="text-sm font-semibold px-1">{t('dashboard.management')}</span>
                )}
                <button
                  onClick={() => setCollapsed((c) => !c)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-500"
                >
                  {collapsed
                    ? <ChevronRight className="h-4 w-4" />
                    : <ChevronLeft className="h-4 w-4" />}
                </button>
              </div>

              {/* Add trip button */}
              <Button
                onClick={() => setModalOpen(true)}
                className="cursor-pointer mb-3 w-full"
                disabled={isPending}
                title={collapsed ? t('dashboard.addTrip') : undefined}
              >
                <Plus className={collapsed ? 'h-4 w-4' : 'mr-2 h-4 w-4'} />
                {!collapsed && t('dashboard.addTrip')}
              </Button>

              {/* Trips tab */}
              <ul className="space-y-1">
                <li>
                  <button
                    className={`cursor-pointer w-full p-2 rounded hover:bg-gray-100 flex items-center ${
                      collapsed ? 'justify-center' : 'gap-2'
                    } ${activeTab === 'trips' ? 'font-semibold bg-gray-100' : ''}`}
                    onClick={() => handleTabChange('trips')}
                    disabled={isPending}
                    title={collapsed ? t('dashboard.tabTrips') : undefined}
                  >
                    <Bus className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="text-sm">{t('dashboard.tabTrips')}</span>}
                  </button>
                </li>

                {/* Account item with dropdown */}
                <li>
                  <div className="relative" ref={accountRef}>
                    <button
                      className={`cursor-pointer w-full p-2 rounded hover:bg-gray-100 flex items-center ${
                        collapsed ? 'justify-center' : 'gap-2'
                      } ${activeTab === 'settings' ? 'font-semibold bg-gray-100' : ''}`}
                      onClick={() => setAccountOpen((o) => !o)}
                      title={collapsed ? t('dashboard.tabAccount') : undefined}
                    >
                      <CircleUser className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="text-sm">{t('dashboard.tabAccount')}</span>
                          <ChevronDown className={`h-3 w-3 ml-auto transition-transform duration-150 ${accountOpen ? 'rotate-180' : ''}`} />
                        </>
                      )}
                    </button>

                    {accountOpen && (
                      <div className={`absolute z-20 bg-white border rounded-md shadow-md py-1 min-w-[160px] ${
                        collapsed ? 'left-full top-0 ml-2' : 'left-0 top-full mt-1'
                      }`}>
                        <button
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                          onClick={() => { handleTabChange('settings'); setAccountOpen(false); }}
                        >
                          <Settings className="h-3.5 w-3.5 text-gray-500" />
                          {t('dashboard.tabSettings')}
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          {isLoggingOut ? t('auth.loggingOut') : t('nav.logoutBtn')}
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </aside>

        {/* Main content */}
        <section className="flex-1 min-w-0">
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
