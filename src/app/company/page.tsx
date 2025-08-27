'use client';

import React, { useEffect, useState } from 'react';
const { DateTime } = require('luxon');
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, LogOut, CalendarIcon } from 'lucide-react';
import CitySelector from '@/components/homepage/city-selector';
import { City, Company, Trip } from '@/generated/prisma';
import ReservationsTab from '@/components/company/ReservationsTab';
import RoutesTab from '@/components/company/RoutesTab';
import SettingsTab from '@/components/company/SettingsTab';
import TripsTab from '@/components/company/TripsTab';
import { Calendar } from '@/components/ui/calendar';
import { srLatn } from 'date-fns/locale';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type Tab = 'trips' | 'routes' | 'reservations' | 'settings';

export default function CompanyAdminDashboard() {
  const [company, setCompany] = useState<Company | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<Tab>('trips');
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    DateTime.now()
  );
  const [departureTime, setDepartureTime] = useState('10:00');
  const [arrivalDate, setArrivalDate] = useState<Date | undefined>(
    DateTime.now()
  );
  const [arrivalTime, setArrivalTime] = useState('12:30');
  const [seatsTotal, setSeatsTotal] = useState(50);
  const [fromCity, setFromCity] = useState<City | null>(null);
  const [toCity, setToCity] = useState<City | null>(null);
  const [openDeparture, setOpenDeparture] = useState(false);
  const [openArrival, setOpenArrival] = useState(false);

  useEffect(() => {
    const savedTab = localStorage.getItem('activeTab') as Tab | null;
    if (savedTab) setActiveTab(savedTab);
    setHydrated(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    fetchCompanyAndTrips();
  }, []);

  useEffect(() => {
    if (activeTab === 'routes' && routes.length === 0) fetchRoutes();
  }, [activeTab]);

  async function fetchCompanyAndTrips() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/company', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch company data');
      const data = await res.json();
      setCompany(data);
      setTrips(data.trips || []);
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchRoutes() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/routes', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch routes');
      const data = await res.json();
      setRoutes(data);
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  function combineToUtcIso(date: string, time: string) {
    const dt = DateTime.fromISO(`${date}T${time}`, {
      zone: 'Europe/Belgrade',
    }).toUTC();
    return dt.toISO();
  }

  async function handleCreateTrip(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fromCity || !toCity || !departureDate || !arrivalDate) {
      setError('Obavezna polja nisu popunjena');
      return;
    }

    try {
      const departureIso = combineToUtcIso(departureDate, departureTime);
      const arrivalIso = combineToUtcIso(arrivalDate, arrivalTime);

      const payload = {
        fromId: fromCity.id,
        toId: toCity.id,
        departure: departureIso,
        arrival: arrivalIso,
        seatsTotal,
        companyId: company!.id,
      };

      const res = await fetch('/api/trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create trip');
      }

      setCreateOpen(false);
      await fetchCompanyAndTrips();
    } catch (err: any) {
      setError(err.message || 'Error creating trip');
    }
  }

  const formatedDeparture = departureDate
    ? format(departureDate, 'PPP', { locale: srLatn })
    : '';

  const formatedArrival = arrivalDate
    ? format(arrivalDate, 'PPP', { locale: srLatn })
    : '';

  function renderTab() {
    switch (activeTab) {
      case 'trips':
        return (
          <TripsTab
            trips={trips}
            loading={loading}
            error={error}
            refreshTrips={fetchCompanyAndTrips}
          />
        );
      case 'routes':
        return (
          <RoutesTab
            routes={routes}
            loading={loading}
            error={error}
            refreshRoutes={fetchCompanyAndTrips}
          />
        );
      case 'reservations':
        return (
          <ReservationsTab
            trips={trips}
            loading={loading}
            error={error}
            refreshReservations={fetchCompanyAndTrips}
          />
        );
      case 'settings':
        return <SettingsTab loading={loading} error={error} />;
      default:
        return null;
    }
  }

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
        <h2 className="text-2xl font-bold">Dobrodosli {company?.name}</h2>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setCreateOpen(true)}
            className="cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" /> Nova Ruta
          </Button>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4 " /> Izloguj se
          </Button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Uredi</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(['trips', 'routes', 'reservations', 'settings'] as Tab[]).map(
                  (tab) => (
                    <li
                      key={tab}
                      className={`text-sm cursor-pointer ${
                        activeTab === tab ? 'font-bold' : ''
                      }`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab === 'trips' && 'Rute'}
                      {tab === 'routes' && 'Putanje'}
                      {tab === 'reservations' && 'Rezervacije'}
                      {tab === 'settings' && 'Podesavanja'}
                    </li>
                  )
                )}
              </ul>
            </CardContent>
          </Card>
        </aside>

        <section className="col-span-1 lg:col-span-3">
          <Card>
            <CardContent>
              {hydrated ? (
                loading ? (
                  <p>Učitavanje...</p>
                ) : error ? (
                  <p className="text-red-500">{error}</p>
                ) : (
                  renderTab()
                )
              ) : (
                <p>Učitavanje...</p>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Create Trip Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Napravi Rutu</h3>
            <form
              onSubmit={handleCreateTrip}
              className="grid grid-cols-2 gap-4"
            >
              <CitySelector
                label="Od"
                selectedCity={fromCity}
                setSelectedCity={setFromCity}
              />
              <CitySelector
                label="Do"
                selectedCity={toCity}
                setSelectedCity={setToCity}
              />
              <div>
                <Label>Datum polaska</Label>
                <Popover open={openDeparture} onOpenChange={setOpenDeparture}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="date-picker"
                      className="justify-between font-normal border p-2 rounded"
                    >
                      {departureDate ? formatedDeparture : 'Izaberi datum'}
                      <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={departureDate}
                      onSelect={(departureDate) => {
                        setDepartureDate(departureDate);
                        setOpenDeparture(false);
                      }}
                      captionLayout="dropdown"
                      locale={srLatn}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Vreme polaska</Label>
                <Input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Datum dolaska</Label>
                <Popover open={openArrival} onOpenChange={setOpenArrival}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="date-picker"
                      className="justify-between font-normal border p-2 rounded"
                    >
                      {arrivalDate ? formatedArrival : 'Izaberi datum'}
                      <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={arrivalDate}
                      onSelect={(arrivalDate) => {
                        setArrivalDate(arrivalDate);
                        setOpenArrival(false);
                      }}
                      captionLayout="dropdown"
                      locale={srLatn}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Vreme dolaska</Label>
                <Input
                  type="time"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Ukupan broj sedista</Label>
                <Input
                  type="number"
                  value={seatsTotal}
                  onChange={(e) => setSeatsTotal(Number(e.target.value))}
                  required
                />
              </div>
              <div className="col-span-2 flex justify-end gap-2 mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCreateOpen(false)}
                  className="cursor-pointer"
                >
                  Otkazi
                </Button>
                <Button type="submit" className="cursor-pointer">
                  Napravi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
