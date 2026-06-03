'use client';

import { useState } from 'react';
import { DateTime } from 'luxon';
import { srLatn, enUS } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Clock, MapPin, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

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

interface Props {
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  minDate: string;
  initialReturnDate?: string;
  onSkip: () => void;
  onSelect: (trip: Trip) => void;
}

export default function ReturnTripStep({
  fromId, toId, fromName, toName,
  minDate, initialReturnDate,
  onSkip, onSelect,
}: Props) {
  const { language, t } = useTranslation();
  const dateFnsLocale = language === 'sr' ? srLatn : enUS;
  const locale = language === 'sr' ? 'sr-Latn' : 'en';

  const parseInitial = () => {
    const d = initialReturnDate ?? minDate;
    if (!d) return undefined;
    const dt = DateTime.fromISO(d);
    return dt.isValid ? dt.toJSDate() : undefined;
  };

  const [date, setDate] = useState<Date | undefined>(parseInitial);
  const [calOpen, setCalOpen] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<Trip | null>(null);

  const fmt = (d: Date) =>
    DateTime.fromJSDate(d).setLocale(locale).toFormat('d. LLL yyyy');

  const fmtTime = (s: string) =>
    DateTime.fromISO(s).setZone('Europe/Belgrade').toFormat('HH:mm');

  const minDateObj = DateTime.fromISO(minDate).toJSDate();

  async function search() {
    if (!date) return;
    setLoading(true);
    setSelectedReturn(null);
    const isoDate = DateTime.fromJSDate(date).toISODate() || '';
    const res = await fetch(`/api/trips?${new URLSearchParams({ fromId, toId, date: isoDate })}`);
    setTrips(res.ok ? await res.json() : []);
    setSearched(true);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          {fromName} <ArrowRight className="h-4 w-4 text-gray-400" /> {toName}
          <span className="text-sm font-normal text-gray-400 ml-1">({t('routes.returnStepTitle')})</span>
        </h2>
      </div>

      {/* Date picker row */}
      <div className="flex items-end gap-3 flex-wrap">
        <div>
          <p className="text-xs text-gray-500 mb-1">{t('booking.returnDate')}</p>
          <Popover open={calOpen} onOpenChange={setCalOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-between font-normal">
                {date ? fmt(date) : t('booking.selectDate')}
                <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => { setDate(d); setCalOpen(false); setSearched(false); }}
                disabled={{ before: minDateObj }}
                captionLayout="dropdown"
                locale={dateFnsLocale}
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button onClick={search} disabled={!date || loading} variant="outline">
          {loading ? t('routes.loading') : t('returnBooking.searchBtn')}
        </Button>
        <Button variant="ghost" onClick={onSkip} className="text-gray-500">
          {t('booking.skipReturn')}
        </Button>
      </div>

      {/* Trip list */}
      {searched && trips.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p>{t('returnBooking.noTrips')}</p>
          <p className="text-xs mt-1">{t('returnBooking.tryOther')}</p>
        </div>
      )}

      {trips.length > 0 && (
        <div className="space-y-3">
          {trips.map((trip) => {
            const mins = DateTime.fromISO(trip.arrival).diff(DateTime.fromISO(trip.departure), 'minutes').minutes;
            const dur = `${Math.floor(mins / 60)}h ${Math.floor(mins % 60)}m`;
            const isSelected = selectedReturn?.id === trip.id;

            return (
              <Card
                key={trip.id}
                className={`transition-all cursor-pointer ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}
                onClick={() => setSelectedReturn(isSelected ? null : trip)}
              >
                <CardHeader className="pb-2 pt-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{trip.company.name}</CardTitle>
                    <Badge variant={trip.availableSeats > 0 ? 'default' : 'destructive'}>
                      {trip.availableSeats > 0
                        ? t('routes.freeSeats', { count: trip.availableSeats })
                        : t('routes.full')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {trip.route.from.name} → {trip.route.to.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {fmtTime(trip.departure)} – {fmtTime(trip.arrival)} ({dur})
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Action buttons */}
      {searched && (
        <div className="flex gap-3 pt-2 border-t">
          <Button variant="outline" onClick={onSkip}>
            {t('booking.skipReturn')}
          </Button>
          <Button
            disabled={!selectedReturn || selectedReturn.availableSeats === 0}
            onClick={() => selectedReturn && onSelect(selectedReturn)}
          >
            {t('routes.reserveBtn')}
          </Button>
        </div>
      )}
    </div>
  );
}
