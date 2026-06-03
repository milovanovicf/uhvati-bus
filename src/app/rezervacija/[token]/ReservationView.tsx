'use client';

import { useState, useTransition } from 'react';
import { DateTime } from 'luxon';
import { srLatn, enUS } from 'date-fns/locale';
import { CheckCircle, XCircle, AlertTriangle, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cancelReservation, changeTripDate } from '@/app/actions';
import { useTranslation } from '@/lib/i18n/LanguageContext';

type Reservation = {
  bookingRef: string | null;
  trip: {
    departure: Date;
    route: {
      fromId: number;
      toId: number;
      from: { name: string };
      to: { name: string };
    };
  };
};

interface Trip {
  id: number;
  departure: string;
  arrival: string;
  seatsTotal: number;
  availableSeats: number;
  company: { name: string };
  route: { from: { name: string }; to: { name: string } };
}

type Mode = 'default' | 'change-search' | 'change-results' | 'changed';

interface Props {
  reservation: Reservation | null;
  invalidReason?: 'invalid_token' | 'not_found';
  token: string;
}

export default function ReservationView({ reservation, invalidReason, token }: Props) {
  const { language, t } = useTranslation();
  const dateFnsLocale = language === 'sr' ? srLatn : enUS;
  const [cancelled, setCancelled] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [mode, setMode] = useState<Mode>('default');
  const [calOpen, setCalOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [changeError, setChangeError] = useState<string | null>(null);

  const isPastTrip = reservation
    ? new Date(reservation.trip.departure) < new Date()
    : false;

  const hoursUntilDep = reservation
    ? (new Date(reservation.trip.departure).getTime() - Date.now()) / 3_600_000
    : 0;

  const canChange = !isPastTrip && hoursUntilDep >= 24;

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelReservation(token);
      if (result.success) {
        setCancelled(true);
      } else if (result.error === 'already_departed') {
        setCancelError(t('myReservation.alreadyDeparted'));
      } else {
        setCancelError(t('myReservation.cancelError'));
      }
    });
  }

  async function searchTrips() {
    if (!date || !reservation) return;
    setLoadingTrips(true);
    setSelectedTrip(null);
    setChangeError(null);
    const isoDate = DateTime.fromJSDate(date).toISODate() || '';
    const res = await fetch(
      `/api/trips?${new URLSearchParams({
        fromId: reservation.trip.route.fromId.toString(),
        toId: reservation.trip.route.toId.toString(),
        date: isoDate,
      })}`
    );
    setTrips(res.ok ? await res.json() : []);
    setLoadingTrips(false);
    setMode('change-results');
  }

  function handleConfirmChange() {
    if (!selectedTrip) return;
    startTransition(async () => {
      const result = await changeTripDate(token, selectedTrip.id);
      if (result.success) {
        setMode('changed');
      } else {
        setChangeError(result.error ?? t('myReservation.changeError'));
      }
    });
  }

  const fmtTime = (s: string) =>
    DateTime.fromISO(s).setZone('Europe/Belgrade').toFormat('HH:mm');
  const fmtDate = (d: Date) =>
    DateTime.fromJSDate(d).setLocale(language === 'sr' ? 'sr-Latn' : 'en').toFormat('d. LLL yyyy');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <a href="/">
            <img src="/logo/logo-big.png" alt="UhvatiBus" className="h-10 mx-auto" />
          </a>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-8">
          {/* Invalid / not found */}
          {!reservation && (
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                {t('myReservation.invalidTitle')}
              </h1>
              <p className="text-gray-500 text-sm">
                {invalidReason === 'not_found'
                  ? t('myReservation.notFoundMsg')
                  : t('myReservation.invalidMsg')}
              </p>
            </div>
          )}

          {/* Cancelled */}
          {reservation && cancelled && (
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                {t('myReservation.cancelledTitle')}
              </h1>
              <p className="text-gray-500 text-sm">{t('myReservation.cancelledMsg')}</p>
            </div>
          )}

          {/* Date changed */}
          {reservation && mode === 'changed' && (
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                {t('myReservation.changedTitle')}
              </h1>
              <p className="text-gray-500 text-sm">{t('myReservation.changedMsg')}</p>
            </div>
          )}

          {/* Default view */}
          {reservation && !cancelled && mode === 'default' && (
            <>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1 text-center">
                {reservation.bookingRef}
              </p>

              {cancelError && (
                <div className="flex items-start gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  {cancelError}
                </div>
              )}

              <div className="space-y-2 mt-4">
                {isPastTrip ? (
                  <p className="text-sm text-gray-400 text-center">
                    {t('myReservation.alreadyDeparted')}
                  </p>
                ) : (
                  <>
                    {canChange ? (
                      <Button
                        className="w-full"
                        onClick={() => setMode('change-search')}
                        disabled={isPending}
                      >
                        {t('myReservation.changeDateBtn')}
                      </Button>
                    ) : (
                      <p className="text-xs text-gray-400 text-center italic">
                        {t('myReservation.changeDisabled')}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={handleCancel}
                      disabled={isPending}
                    >
                      {isPending ? t('myReservation.cancelling') : t('myReservation.cancelBtn')}
                    </Button>
                  </>
                )}
              </div>
            </>
          )}

          {/* Change date — date picker */}
          {reservation && mode === 'change-search' && (
            <>
              <h2 className="font-semibold mb-1">{t('myReservation.changeDateTitle')}</h2>
              <p className="text-xs text-gray-500 mb-4">
                {reservation.trip.route.from.name} → {reservation.trip.route.to.name}
              </p>

              <Popover open={calOpen} onOpenChange={setCalOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal mb-4">
                    {date ? fmtDate(date) : t('booking.selectDate')}
                    <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
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
                <Button variant="outline" className="flex-1" onClick={() => setMode('default')}>
                  {t('myReservation.cancelChange')}
                </Button>
                <Button
                  className="flex-1"
                  onClick={searchTrips}
                  disabled={!date || loadingTrips}
                >
                  {loadingTrips ? '...' : t('myReservation.searchTripsBtn')}
                </Button>
              </div>
            </>
          )}

          {/* Change date — trip results */}
          {reservation && mode === 'change-results' && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-sm">
                  {date && fmtDate(date)}
                </h2>
                <button
                  className="text-xs text-gray-400 hover:text-gray-600"
                  onClick={() => setMode('change-search')}
                >
                  ← {t('booking.backStep')}
                </button>
              </div>

              {changeError && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {changeError}
                </div>
              )}

              {trips.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">{t('myReservation.noTripsOnDate')}</p>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {trips.map((trip) => {
                    const isSelected = selectedTrip?.id === trip.id;
                    const dep = fmtTime(trip.departure);
                    const arr = fmtTime(trip.arrival);
                    return (
                      <Card
                        key={trip.id}
                        className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-sm'}`}
                        onClick={() => setSelectedTrip(isSelected ? null : trip)}
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium">{trip.company.name}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <Clock className="h-3 w-3" />{dep} – {arr}
                              </p>
                            </div>
                            <Badge variant={trip.availableSeats > 0 ? 'default' : 'destructive'} className="text-xs">
                              {trip.availableSeats > 0 ? `${trip.availableSeats} mesta` : 'Popunjeno'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setMode('change-search')}>
                  {t('myReservation.cancelChange')}
                </Button>
                <Button
                  className="flex-1"
                  disabled={!selectedTrip || isPending}
                  onClick={handleConfirmChange}
                >
                  {isPending ? '...' : t('myReservation.confirmChange')}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
