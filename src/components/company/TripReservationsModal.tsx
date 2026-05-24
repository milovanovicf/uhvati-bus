'use client';

import React, { useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Users, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { srLatn } from 'date-fns/locale';
import { handleReservationDelete, updateTripTimes } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { TripWithDetails, TripReservation } from './CompanyClient';

const { DateTime } = require('luxon');

interface Props {
  trip: TripWithDetails | null;
  onClose: () => void;
}

export default function TripReservationsModal({ trip, onClose }: Props) {
  const router = useRouter();
  const [deletePending, startDeleteTransition] = useTransition();
  const [timePending, startTimeTransition] = useTransition();
  const [timeError, setTimeError] = useState<string | null>(null);

  const dep = trip ? new Date(trip.departure) : new Date();
  const arr = trip ? new Date(trip.arrival) : new Date();

  const [editDep, setEditDep] = useState(format(dep, 'HH:mm'));
  const [editArr, setEditArr] = useState(format(arr, 'HH:mm'));

  // Reset time fields when trip changes
  React.useEffect(() => {
    if (!trip) return;
    setEditDep(format(new Date(trip.departure), 'HH:mm'));
    setEditArr(format(new Date(trip.arrival), 'HH:mm'));
    setTimeError(null);
  }, [trip?.id]);

  if (!trip) return null;

  const fromCity = trip.route?.from?.name ?? '?';
  const toCity = trip.route?.to?.name ?? '?';
  const bookedSeats = trip.seatsTotal - (trip.seatsAvailable ?? trip.seatsTotal);

  function combineToUtcIso(date: Date, time: string): string {
    const dt = DateTime.fromISO(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${time}`,
      { zone: 'Europe/Belgrade' }
    ).toUTC();
    return dt.toISO();
  }

  function handleSaveTime() {
    setTimeError(null);
    startTimeTransition(async () => {
      try {
        const tripDate = new Date(trip.departure);
        const isNextDay = editArr < editDep;
        const arrDate = isNextDay
          ? new Date(tripDate.getTime() + 86400000)
          : tripDate;
        await updateTripTimes(
          trip.id,
          combineToUtcIso(tripDate, editDep),
          combineToUtcIso(arrDate, editArr),
        );
        router.refresh();
      } catch (err: unknown) {
        setTimeError(err instanceof Error ? err.message : 'Greška pri čuvanju.');
      }
    });
  }

  const timeChanged = editDep !== format(dep, 'HH:mm') || editArr !== format(arr, 'HH:mm');

  function handleDelete(id: number) {
    if (!confirm('Da li ste sigurni da želite da obrišete ovu rezervaciju?')) return;
    startDeleteTransition(async () => {
      const result = await handleReservationDelete(id);
      if (result.success) {
        router.refresh();
      } else {
        alert(`Greška: ${result.error}`);
      }
    });
  }

  return (
    <Dialog open={!!trip} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {fromCity} → {toCity}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4 text-sm text-gray-600 pb-3 border-b">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {format(dep, 'EEEE, d. MMMM yyyy.', { locale: srLatn })}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {bookedSeats}/{trip.seatsTotal} sedišta zauzeto
          </span>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 border">
          <p className="text-xs text-gray-500 mb-2 font-medium">Vreme polaska za ovaj dan</p>
          {timeError && (
            <p className="text-xs text-red-600 mb-2">{timeError}</p>
          )}
          <div className="flex items-end gap-3">
            <div>
              <Label className="text-xs">Polazak</Label>
              <Input
                type="time"
                value={editDep}
                onChange={(e) => setEditDep(e.target.value)}
                className="w-32"
                disabled={timePending}
              />
            </div>
            <div>
              <Label className="text-xs">Dolazak</Label>
              <Input
                type="time"
                value={editArr}
                onChange={(e) => setEditArr(e.target.value)}
                className="w-32"
                disabled={timePending}
              />
            </div>
            <Button
              size="sm"
              onClick={handleSaveTime}
              disabled={timePending || !timeChanged}
            >
              {timePending ? 'Čuvanje...' : 'Sačuvaj vreme'}
            </Button>
          </div>
        </div>

        {trip.reservations.length === 0 ? (
          <p className="text-center text-gray-400 py-6">Nema rezervacija za ovo putovanje.</p>
        ) : (
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 font-medium">#</th>
                <th className="pb-2 font-medium">Putnik</th>
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium">Sedišta</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {trip.reservations.map((r: TripReservation, i: number) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 text-gray-400">{i + 1}</td>
                  <td className="py-2 font-medium">{r.fullName}</td>
                  <td className="py-2 text-gray-500">{r.email}</td>
                  <td className="py-2">
                    {Array.isArray(r.seats) ? (r.seats as number[]).join(', ') : '—'}
                  </td>
                  <td className="py-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleDelete(r.id)}
                      disabled={deletePending}
                    >
                      {deletePending ? (
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DialogContent>
    </Dialog>
  );
}
