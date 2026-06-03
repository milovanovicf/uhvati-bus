'use client';

import { useState, useActionState } from 'react';
import { DateTime } from 'luxon';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, MapPin, CheckCircle } from 'lucide-react';
import { bookRoundTripReservation } from '@/app/actions';
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
  isOpen: boolean;
  onClose: () => void;
  outboundTrip: Trip;
  returnTrip: Trip | null;
  defaultFullName?: string;
  defaultEmail?: string;
  defaultSeats?: number;
  onSuccess?: () => void;
}

const EMPTY = { success: false, error: undefined };

export default function RoundTripBookingModal({
  isOpen, onClose,
  outboundTrip, returnTrip,
  defaultFullName = '', defaultEmail = '', defaultSeats = 1,
  onSuccess,
}: Props) {
  const { t } = useTranslation();
  const [state, action] = useActionState(bookRoundTripReservation, EMPTY);
  const [seats, setSeats] = useState(defaultSeats);

  const fmtTime = (s: string) =>
    DateTime.fromISO(s).setZone('Europe/Belgrade').toFormat('HH:mm');
  const fmtDate = (s: string) =>
    DateTime.fromISO(s).setZone('Europe/Belgrade').setLocale('sr-Latn').toFormat('d. LLL yyyy');

  const maxSeats = Math.min(outboundTrip.availableSeats, returnTrip?.availableSeats ?? 99);

  if (state.success) {
    onSuccess?.();
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">{t('reservation.success')}</h3>
            <p className="text-sm text-gray-500">{t('reservation.successMsg')}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const TripSummary = ({ trip, label }: { trip: Trip; label: string }) => (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs font-medium text-gray-400 uppercase mb-1">{label}</p>
      <p className="font-medium text-sm">{trip.company.name}</p>
      <div className="flex gap-3 text-xs text-gray-600 mt-1">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />{trip.route.from.name} → {trip.route.to.name}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />{fmtDate(trip.departure)}, {fmtTime(trip.departure)} – {fmtTime(trip.arrival)}
        </span>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('reservation.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <TripSummary trip={outboundTrip} label={t('routes.tabOutbound')} />
          {returnTrip && <TripSummary trip={returnTrip} label={t('routes.tabReturn')} />}
        </div>

        {state.error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {state.error}
          </div>
        )}

        <form action={action} className="space-y-4">
          <input type="hidden" name="outboundTripId" value={outboundTrip.id} />
          {returnTrip && <input type="hidden" name="returnTripId" value={returnTrip.id} />}

          <div>
            <Label htmlFor="rt-fullName">{t('reservation.fullName')}</Label>
            <Input id="rt-fullName" name="fullName" defaultValue={defaultFullName} required placeholder={t('reservation.fullNamePlaceholder')} />
          </div>
          <div>
            <Label htmlFor="rt-email">{t('reservation.email')}</Label>
            <Input id="rt-email" name="email" type="email" defaultValue={defaultEmail} required placeholder={t('reservation.emailPlaceholder')} />
          </div>
          <div>
            <Label htmlFor="rt-seats">{t('reservation.seats')}</Label>
            <Input
              id="rt-seats"
              name="seats"
              type="number"
              min={1}
              max={maxSeats}
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
              required
            />
            <p className="text-xs text-gray-400 mt-1">{t('reservation.maxSeats', { count: maxSeats })}</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>{t('reservation.cancelBtn')}</Button>
            <Button type="submit">{t('routes.reserveBtn')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
