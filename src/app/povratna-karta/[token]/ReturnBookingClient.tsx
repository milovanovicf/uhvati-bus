'use client';

import { useState, useEffect, useActionState } from 'react';
import { DateTime } from 'luxon';
import { srLatn, enUS } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { bookReturnReservation, rescheduleReturnReservation } from '@/app/actions';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface OutboundData {
  bookingRef: string;
  fullName: string;
  email: string;
  seats: number;
  returnFromId: string;
  returnToId: string;
  returnFromName: string;
  returnToName: string;
}

interface ExistingReturn {
  id: number;
  bookingRef: string | null;
  seats: number;
  departure: Date;
  arrival: Date;
  tripId: number;
  seatsTotal: number;
  fromName: string;
  toName: string;
}

interface Trip {
  id: number;
  departure: string;
  arrival: string;
  seatsTotal: number;
  availableSeats: number;
  company: { name: string };
  route: { from: { name: string }; to: { name: string } };
}

type Mode =
  | 'search'
  | 'results'
  | 'booking'
  | 'success'
  | 'view-existing'
  | 'reschedule-search'
  | 'reschedule-results'
  | 'reschedule-booking'
  | 'rescheduled';

const EMPTY = { success: false, error: undefined };

export default function ReturnBookingClient({
  token: _token,
  outbound,
  existingReturn,
}: {
  token: string;
  outbound: OutboundData | null;
  existingReturn: ExistingReturn | null;
}) {
  const { language, t } = useTranslation();
  const locale = language === 'sr' ? 'sr-Latn' : 'en';
  const dateFnsLocale = language === 'sr' ? srLatn : enUS;

  const [mode, setMode] = useState<Mode>(existingReturn ? 'view-existing' : 'search');
  const [calOpen, setCalOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const [bookState, bookAction] = useActionState(bookReturnReservation, EMPTY);
  const [rescheduleState, rescheduleAction] = useActionState(rescheduleReturnReservation, EMPTY);

  useEffect(() => { if (bookState.success) setMode('success'); }, [bookState.success]);
  useEffect(() => { if (rescheduleState.success) setMode('rescheduled'); }, [rescheduleState.success]);

  const fmt = (d: Date | string) =>
    DateTime.fromJSDate(new Date(d))
      .setZone('Europe/Belgrade')
      .setLocale(locale)
      .toFormat('d. LLL yyyy, HH:mm');

  const fmtDate = (d: Date) =>
    DateTime.fromJSDate(d).setLocale(locale).toFormat('d. LLL yyyy');

  const canReschedule = existingReturn
    ? (new Date(existingReturn.departure).getTime() - Date.now()) / 3_600_000 > 24
    : false;

  async function fetchTrips(forMode: 'results' | 'reschedule-results') {
    if (!outbound || !date) return;
    setLoadingTrips(true);
    const isoDate = DateTime.fromJSDate(date).toISODate() || '';
    try {
      const res = await fetch(
        `/api/trips?${new URLSearchParams({ fromId: outbound.returnFromId, toId: outbound.returnToId, date: isoDate })}`
      );
      setTrips(res.ok ? await res.json() : []);
    } catch {
      setTrips([]);
    }
    setLoadingTrips(false);
    setMode(forMode);
  }

  // ── Invalid token ─────────────────────────────────────────────────────────
  if (!outbound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center max-w-sm w-full">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">{t('returnBooking.invalidToken')}</h1>
        </div>
      </div>
    );
  }

  // ── Success / Rescheduled ─────────────────────────────────────────────────
  if (mode === 'success' || mode === 'rescheduled') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center max-w-sm w-full">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">
            {mode === 'success' ? t('returnBooking.successTitle') : t('returnBooking.rescheduledTitle')}
          </h1>
          <p className="text-gray-500 text-sm">
            {mode === 'success' ? t('returnBooking.successMsg') : t('returnBooking.rescheduledMsg')}
          </p>
          <a href="/" className="mt-6 inline-block text-sm text-blue-600 hover:underline">← Početna</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <a href="/"><img src="/logo/logo-big.png" alt="UhvatiBus" className="h-9 mx-auto mb-6" /></a>
          <h1 className="text-2xl font-bold">{t('returnBooking.title')}</h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center justify-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {outbound.returnFromName}
            <ArrowRight className="h-3.5 w-3.5" />
            {outbound.returnToName}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          {/* ── View existing ──────────────────────────────────────────────── */}
          {mode === 'view-existing' && existingReturn && (
            <>
              <h2 className="font-semibold">{t('returnBooking.existingTitle')}</h2>
              <div className="border rounded-lg divide-y text-sm">
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-gray-500">{t('returnBooking.existingRef')}</span>
                  <span className="font-mono font-medium">{existingReturn.bookingRef}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-gray-500">{t('returnBooking.route')}</span>
                  <span>{existingReturn.fromName} → {existingReturn.toName}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-gray-500">{t('returnBooking.existingDep')}</span>
                  <span>{fmt(existingReturn.departure)}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-gray-500">{t('returnBooking.seats')}</span>
                  <span>{existingReturn.seats}</span>
                </div>
              </div>
              {canReschedule ? (
                <Button onClick={() => { setDate(undefined); setMode('reschedule-search'); }}>
                  {t('returnBooking.changeDateBtn')}
                </Button>
              ) : (
                <p className="text-sm text-gray-400 italic">{t('returnBooking.disabledMsg')}</p>
              )}
            </>
          )}

          {/* ── Date search ────────────────────────────────────────────────── */}
          {(mode === 'search' || mode === 'reschedule-search') && (
            <>
              <Label>{t('returnBooking.selectDate')}</Label>
              <Popover open={calOpen} onOpenChange={setCalOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-between font-normal w-full">
                    {date ? fmtDate(date) : t('returnBooking.selectDate')}
                    <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => { setDate(d); setCalOpen(false); }}
                    disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
                    captionLayout="dropdown"
                    locale={dateFnsLocale}
                  />
                </PopoverContent>
              </Popover>
              <div className="flex gap-2">
                {mode === 'reschedule-search' && (
                  <Button variant="outline" onClick={() => setMode('view-existing')}>
                    {t('returnBooking.cancelChange')}
                  </Button>
                )}
                <Button
                  onClick={() => fetchTrips(mode === 'reschedule-search' ? 'reschedule-results' : 'results')}
                  disabled={!date || loadingTrips}
                >
                  {loadingTrips ? t('returnBooking.loading') : t('returnBooking.searchBtn')}
                </Button>
              </div>
            </>
          )}

          {/* ── Trip list ──────────────────────────────────────────────────── */}
          {(mode === 'results' || mode === 'reschedule-results') && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 font-medium">{date && fmtDate(date)} — {trips.length} polazaka</span>
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setMode(mode === 'results' ? 'search' : 'reschedule-search')}
                >
                  ← Promeni datum
                </button>
              </div>
              {trips.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <p>{t('returnBooking.noTrips')}</p>
                  <p className="text-xs mt-1">{t('returnBooking.tryOther')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {trips.map((trip) => {
                    const mins = DateTime.fromISO(trip.arrival).diff(DateTime.fromISO(trip.departure), 'minutes').minutes;
                    const dur = `${Math.floor(mins / 60)}h ${Math.floor(mins % 60)}m`;
                    const dep = DateTime.fromISO(trip.departure).setZone('Europe/Belgrade').toFormat('HH:mm');
                    const arr = DateTime.fromISO(trip.arrival).setZone('Europe/Belgrade').toFormat('HH:mm');
                    const targetMode = mode === 'results' ? 'booking' : 'reschedule-booking';
                    return (
                      <Card key={trip.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium text-sm">{trip.company.name}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />{trip.route.from.name} → {trip.route.to.name}
                              </div>
                            </div>
                            <Badge variant={trip.availableSeats > 0 ? 'default' : 'destructive'} className="text-xs">
                              {trip.availableSeats > 0
                                ? t('returnBooking.freeSeats', { count: trip.availableSeats })
                                : t('returnBooking.noSeatsBtn')}
                            </Badge>
                          </div>
                          <div className="flex gap-3 text-xs text-gray-500 mb-3">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{dep} → {arr}</span>
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{dur}</span>
                          </div>
                          <Button
                            size="sm"
                            disabled={trip.availableSeats === 0}
                            onClick={() => { setSelectedTrip(trip); setMode(targetMode); }}
                          >
                            {t('returnBooking.bookBtn')}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ── New booking form ───────────────────────────────────────────── */}
          {mode === 'booking' && selectedTrip && (
            <form action={bookAction} className="space-y-4">
              <input type="hidden" name="tripId" value={selectedTrip.id} />
              <input type="hidden" name="outboundBookingRef" value={outbound.bookingRef} />
              <div className="text-sm text-gray-600 border rounded-lg p-3 bg-gray-50">
                <strong>{selectedTrip.company.name}</strong>
                {' — '}
                {DateTime.fromISO(selectedTrip.departure).setZone('Europe/Belgrade').toFormat('HH:mm')}
                {' → '}
                {DateTime.fromISO(selectedTrip.arrival).setZone('Europe/Belgrade').toFormat('HH:mm')}
              </div>
              <div>
                <Label>{t('returnBooking.fullName')}</Label>
                <Input name="fullName" defaultValue={outbound.fullName} required className="mt-1" />
              </div>
              <div>
                <Label>{t('returnBooking.email')}</Label>
                <Input name="email" type="email" defaultValue={outbound.email} required className="mt-1" />
              </div>
              <div>
                <Label>{t('returnBooking.seatsCount')}</Label>
                <Input name="seats" type="number" min={1} max={selectedTrip.availableSeats} defaultValue={outbound.seats} required className="mt-1 w-24" />
              </div>
              {bookState.error && <p className="text-sm text-red-600">{bookState.error}</p>}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setMode('results')}>← Nazad</Button>
                <Button type="submit">{t('returnBooking.bookBtn')}</Button>
              </div>
            </form>
          )}

          {/* ── Reschedule booking form ────────────────────────────────────── */}
          {mode === 'reschedule-booking' && selectedTrip && existingReturn && (
            <form action={rescheduleAction} className="space-y-4">
              <input type="hidden" name="tripId" value={selectedTrip.id} />
              <input type="hidden" name="outboundBookingRef" value={outbound.bookingRef} />
              <input type="hidden" name="existingReservationId" value={existingReturn.id} />
              <div className="text-sm text-gray-600 border rounded-lg p-3 bg-gray-50">
                <strong>{selectedTrip.company.name}</strong>
                {' — '}
                {DateTime.fromISO(selectedTrip.departure).setZone('Europe/Belgrade').toFormat('HH:mm')}
                {' → '}
                {DateTime.fromISO(selectedTrip.arrival).setZone('Europe/Belgrade').toFormat('HH:mm')}
              </div>
              <div>
                <Label>{t('returnBooking.fullName')}</Label>
                <Input name="fullName" defaultValue={outbound.fullName} required className="mt-1" />
              </div>
              <div>
                <Label>{t('returnBooking.email')}</Label>
                <Input name="email" type="email" defaultValue={outbound.email} required className="mt-1" />
              </div>
              <div>
                <Label>{t('returnBooking.seatsCount')}</Label>
                <Input name="seats" type="number" min={1} max={selectedTrip.availableSeats} defaultValue={outbound.seats} required className="mt-1 w-24" />
              </div>
              {rescheduleState.error && <p className="text-sm text-red-600">{rescheduleState.error}</p>}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setMode('reschedule-results')}>← Nazad</Button>
                <Button type="submit">{t('returnBooking.confirmChange')}</Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
