'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Clock, MapPin, Users, CalendarIcon, ArrowLeftRight, ArrowRight } from 'lucide-react';
import { DateTime } from 'luxon';
import { format } from 'date-fns';
import { srLatn, enUS } from 'date-fns/locale';
import ReturnTripStep from './ReturnTripStep';
import RoundTripBookingModal from './RoundTripBookingModal';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { cityToSlug } from '@/lib/slug';

interface Trip {
  id: number;
  departure: string;
  arrival: string;
  seatsTotal: number;
  availableSeats: number;
  availableSeatNumbers: number[];
  takenSeats: number[];
  company: { id: number; name: string; email: string };
  route: { from: { name: string }; to: { name: string } };
}

interface RoutesResultsProps {
  fromId: string;
  toId: string;
  date: string;
  returnDate?: string;
}

type FlowStep = 'outbound' | 'return';

export default function RoutesResults({ fromId, toId, date, returnDate }: RoutesResultsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillFullName = searchParams.get('fullName') ?? '';
  const prefillEmail = searchParams.get('email') ?? '';
  const prefillSeats = Number(searchParams.get('seats') ?? 1);

  // Filter state
  const [activeFromId, setActiveFromId] = useState(fromId);
  const [activeToId, setActiveToId] = useState(toId);
  const [activeDate, setActiveDate] = useState(date);
  const [editFromId, setEditFromId] = useState(fromId);
  const [editToId, setEditToId] = useState(toId);
  const [editDate, setEditDate] = useState<Date>(() => new Date(`${date}T12:00:00`));
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Trip data
  const [trips, setTrips] = useState<Trip[]>([]);
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Multi-step flow
  const [flowStep, setFlowStep] = useState<FlowStep>('outbound');
  const [selectedOutbound, setSelectedOutbound] = useState<Trip | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<Trip | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const [sortBy, setSortBy] = useState<'departure-asc' | 'departure-desc' | 'seats-desc'>('departure-asc');
  const [minSeats, setMinSeats] = useState(1);

  const { language, t } = useTranslation();
  const dateFnsLocale = language === 'sr' ? srLatn : enUS;

  const fetchTrips = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/trips?${new URLSearchParams({ fromId: activeFromId, toId: activeToId, date: activeDate })}`
      );
      if (!res.ok) throw new Error('Failed to fetch trips');
      setTrips(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }, [activeFromId, activeToId, activeDate]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [citiesRes, tripsRes] = await Promise.all([
          fetch('/api/cities'),
          fetch(`/api/trips?${new URLSearchParams({ fromId: activeFromId, toId: activeToId, date: activeDate })}`),
        ]);
        if (!citiesRes.ok || !tripsRes.ok) throw new Error('Failed to fetch data');
        const [citiesData, tripsData] = await Promise.all([citiesRes.json(), tripsRes.json()]);
        setCities(citiesData);
        setTrips(tripsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [activeFromId, activeToId, activeDate]);

  function handleSearch() {
    const d = editDate;
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setActiveFromId(editFromId);
    setActiveToId(editToId);
    setActiveDate(dateStr);
    setSelectedOutbound(null);
    setFlowStep('outbound');

    const fromName = cities.find((c) => c.id === Number(editFromId))?.name;
    const toName = cities.find((c) => c.id === Number(editToId))?.name;
    if (fromName && toName) {
      const params = new URLSearchParams();
      if (prefillFullName) params.set('fullName', prefillFullName);
      if (prefillEmail) params.set('email', prefillEmail);
      params.set('seats', prefillSeats.toString());
      const query = params.toString();
      router.replace(
        `/rute/${cityToSlug(fromName)}/${cityToSlug(toName)}/${dateStr}${query ? `?${query}` : ''}`,
        { scroll: false }
      );
    }
  }

  function swapCities() {
    setEditFromId(editToId);
    setEditToId(editFromId);
  }

  const formatTime = (s: string) =>
    DateTime.fromISO(s).setZone('Europe/Belgrade').toFormat('HH:mm');
  const formatDate = (s: string) =>
    DateTime.fromISO(s).setZone('Europe/Belgrade').setLocale(language === 'sr' ? 'sr-Latn' : 'en').toFormat('d. LLL yyyy');
  const getCityName = (id: string) =>
    cities.find((c) => c.id === Number(id))?.name ?? `Grad ${id}`;
  const formatDuration = (dep: string, arr: string) => {
    const mins = DateTime.fromISO(arr).diff(DateTime.fromISO(dep), 'minutes').minutes;
    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const displayedTrips = [...trips]
    .filter((t) => t.availableSeats >= minSeats)
    .sort((a, b) => {
      if (sortBy === 'departure-asc') return new Date(a.departure).getTime() - new Date(b.departure).getTime();
      if (sortBy === 'departure-desc') return new Date(b.departure).getTime() - new Date(a.departure).getTime();
      return b.availableSeats - a.availableSeats;
    });

  const filterBar = (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-end gap-2">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">{t('routes.from')}</label>
            <select value={editFromId} onChange={(e) => setEditFromId(e.target.value)} className="border rounded-md px-2 py-2 text-sm bg-white">
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button type="button" onClick={swapCities} className="mb-0.5 p-1.5 rounded-full border hover:bg-gray-100 transition-colors" title={t('routes.swapCities')}>
            <ArrowLeftRight className="h-4 w-4 text-gray-500" />
          </button>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">{t('routes.to')}</label>
            <select value={editToId} onChange={(e) => setEditToId(e.target.value)} className="border rounded-md px-2 py-2 text-sm bg-white">
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">{t('routes.date')}</label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-between font-normal text-sm h-9 px-2">
                {format(editDate, 'd. MMM yyyy.', { locale: dateFnsLocale })}
                <CalendarIcon className="ml-2 h-3.5 w-3.5 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={editDate} onSelect={(d) => { if (d) { setEditDate(d); setCalendarOpen(false); } }} disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }} captionLayout="dropdown" locale={dateFnsLocale} />
            </PopoverContent>
          </Popover>
        </div>
        <Button onClick={handleSearch} size="sm" className="mb-0.5">{t('routes.searchBtn')}</Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {filterBar}
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="ml-2 text-gray-600">{t('routes.loading')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        {filterBar}
        <div className="text-center py-12">
          <div className="text-red-500 text-lg mb-4">Greška: {error}</div>
          <Button onClick={() => window.location.reload()}>Pokušaj ponovo</Button>
        </div>
      </div>
    );
  }

  // ── Return step ─────────────────────────────────────────────────────────────
  if (flowStep === 'return' && selectedOutbound) {
    const returnFromId = activeToId;
    const returnToId = activeFromId;
    const returnFromName = getCityName(activeToId);
    const returnToName = getCityName(activeFromId);

    return (
      <div className="space-y-4">
        {/* Selected outbound summary bar */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="text-sm">
            <span className="text-blue-400 text-xs uppercase font-medium mr-2">{t('routes.tabOutbound')}</span>
            <span className="font-medium">{selectedOutbound.route.from.name} → {selectedOutbound.route.to.name}</span>
            <span className="text-gray-500 ml-2">{formatTime(selectedOutbound.departure)}</span>
            <span className="text-gray-400 ml-1">· {selectedOutbound.company.name}</span>
          </div>
          <button
            onClick={() => { setFlowStep('outbound'); setSelectedOutbound(null); setSelectedReturn(null); }}
            className="text-xs text-blue-600 hover:underline whitespace-nowrap ml-3"
          >
            {t('routes.changeOutbound')}
          </button>
        </div>

        <ReturnTripStep
          fromId={returnFromId}
          toId={returnToId}
          fromName={returnFromName}
          toName={returnToName}
          minDate={activeDate}
          initialReturnDate={returnDate}
          onSkip={() => { setSelectedReturn(null); setBookingModalOpen(true); }}
          onSelect={(trip) => { setSelectedReturn(trip); setBookingModalOpen(true); }}
        />

        <RoundTripBookingModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          outboundTrip={selectedOutbound}
          returnTrip={selectedReturn}
          defaultFullName={prefillFullName}
          defaultEmail={prefillEmail}
          defaultSeats={prefillSeats}
          onSuccess={fetchTrips}
        />
      </div>
    );
  }

  // ── Outbound step ────────────────────────────────────────────────────────────
  if (trips.length === 0) {
    return (
      <div className="space-y-4">
        {filterBar}
        <div className="text-center py-12 text-gray-500">
          <MapPin className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-lg mb-1">{t('routes.noTrips')}</p>
          <p className="text-sm">
            {getCityName(activeFromId)} → {getCityName(activeToId)},{' '}
            {formatDate(activeDate)}
          </p>
          <p className="text-sm mt-2 text-gray-400">{t('routes.tryOther')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {filterBar}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {getCityName(activeFromId)} → {getCityName(activeToId)} — {formatDate(activeDate)}
          <span className="text-gray-400 font-normal text-sm ml-2">
            ({displayedTrips.length !== trips.length
              ? t('routes.tripsCountFiltered', { count: displayedTrips.length, total: trips.length })
              : t('routes.tripsCount', { count: trips.length })})
          </span>
        </h2>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 whitespace-nowrap">{t('routes.minSeats')}</label>
            <input type="number" min={1} max={99} value={minSeats} onChange={(e) => setMinSeats(Math.max(1, Number(e.target.value)))} className="border rounded-md px-2 py-1 text-sm w-16 bg-white" />
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="border rounded-md px-2 py-1.5 text-sm bg-white">
            <option value="departure-asc">{t('routes.sortEarliest')}</option>
            <option value="departure-desc">{t('routes.sortLatest')}</option>
            <option value="seats-desc">{t('routes.sortMostSeats')}</option>
          </select>
        </div>
      </div>

      {displayedTrips.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>{t('routes.noTripsFiltered', { min: minSeats })}</p>
          <button onClick={() => setMinSeats(1)} className="text-sm text-blue-500 mt-1 hover:underline">{t('routes.showAllTrips')}</button>
        </div>
      )}

      <div className="space-y-4">
        {displayedTrips.map((trip) => {
          const isSelected = selectedOutbound?.id === trip.id;
          return (
            <Card
              key={trip.id}
              className={`transition-all ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{trip.company.name}</CardTitle>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {trip.route.from.name} → {trip.route.to.name}
                    </div>
                  </div>
                  <Badge variant={trip.availableSeats > 0 ? 'default' : 'destructive'} className="ml-2">
                    {trip.availableSeats > 0 ? t('routes.freeSeats', { count: trip.availableSeats }) : t('routes.full')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <div><div className="font-medium">{t('routes.departure')}</div><div className="text-sm text-gray-600">{formatTime(trip.departure)}</div></div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <div><div className="font-medium">{t('routes.arrival')}</div><div className="text-sm text-gray-600">{formatTime(trip.arrival)}</div></div>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-500" />
                    <div><div className="font-medium">{t('routes.duration')}</div><div className="text-sm text-gray-600">{formatDuration(trip.departure, trip.arrival)}</div></div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {t('routes.seatsInfo', { total: trip.seatsTotal, available: trip.availableSeats, taken: trip.takenSeats.length })}
                  </div>
                  <Button
                    onClick={() => setSelectedOutbound(isSelected ? null : trip)}
                    disabled={trip.availableSeats === 0}
                    variant={isSelected ? 'default' : 'outline'}
                    className="ml-4"
                  >
                    {isSelected ? '✓ ' + t('routes.selectedLabel') : t('routes.selectBtn')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sticky bottom bar — shown when a trip is selected */}
      {selectedOutbound && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="text-sm min-w-0">
              <span className="font-medium">
                {selectedOutbound.route.from.name}
                <ArrowRight className="h-3 w-3 inline mx-1 text-gray-400" />
                {selectedOutbound.route.to.name}
              </span>
              <span className="text-gray-500 ml-2">{formatTime(selectedOutbound.departure)}</span>
              <span className="text-gray-400 text-xs ml-2 hidden sm:inline">· {selectedOutbound.company.name}</span>
            </div>
            <Button onClick={() => setFlowStep('return')} className="shrink-0">
              {t('booking.nextStep')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
