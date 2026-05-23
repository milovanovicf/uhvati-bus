'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Clock, MapPin, Users } from 'lucide-react';
import { DateTime } from 'luxon';
import { handleReservationCreate } from '@/app/actions';

interface Trip {
  id: number;
  departure: string;
  arrival: string;
  seatsTotal: number;
  availableSeats: number;
  availableSeatNumbers: number[];
  takenSeats: number[];
  company: {
    id: number;
    name: string;
    email: string;
  };
  route: {
    from: { name: string };
    to: { name: string };
  };
}

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip | null;
  fromId: string;
  toId: string;
  date: string;
  defaultFullName?: string;
  defaultEmail?: string;
  defaultSeats?: number;
  onSuccess?: () => void;
}

export default function ReservationModal({
  isOpen,
  onClose,
  trip,
  fromId,
  toId,
  date,
  defaultFullName = '',
  defaultEmail = '',
  defaultSeats = 1,
  onSuccess,
}: ReservationModalProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(defaultFullName);
  const [email, setEmail] = useState(defaultEmail);
  const [seats, setSeats] = useState(defaultSeats);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Sync pre-fill values when the modal is opened
  React.useEffect(() => {
    if (isOpen) {
      setFullName(defaultFullName);
      setEmail(defaultEmail);
      setSeats(defaultSeats);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, defaultFullName, defaultEmail, defaultSeats]);

  const formatTime = (dateString: string) => {
    return DateTime.fromISO(dateString).toFormat('HH:mm');
  };

  const formatDate = (dateString: string) => {
    return DateTime.fromISO(dateString)
      .setLocale('sr-Latn')
      .toFormat('d. LLL yyyy');
  };

  const formatDuration = (departure: string, arrival: string) => {
    const dep = DateTime.fromISO(departure);
    const arr = DateTime.fromISO(arrival);
    const duration = arr.diff(dep, 'minutes').minutes;

    const hours = Math.floor(duration / 60);
    const minutes = Math.floor(duration % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!trip) return;

    if (!fullName || !email || !seats) {
      setError('Sva polja su obavezna');
      return;
    }

    if (seats > trip.availableSeats) {
      setError(`Maksimalno ${trip.availableSeats} sedišta je dostupno`);
      return;
    }

    if (seats < 1) {
      setError('Morate rezervisati bar 1 sedište');
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set('fullName', fullName);
        formData.set('email', email);
        formData.set('seats', seats.toString());
        formData.set('fromCityId', fromId);
        formData.set('toCityId', toId);
        formData.set('date', date);
        formData.set('time', trip.departure);
        formData.set('tripId', trip.id.toString());

        const result = await handleReservationCreate(
          { success: false },
          formData,
        );

        if (result.success) {
          setSuccess(true);
          onSuccess?.();

          setTimeout(() => {
            onClose();
            setSuccess(false);
          }, 1500);
        } else {
          setError(result.error || 'Greška pri kreiranju rezervacije');
        }
      } catch (err: any) {
        setError(err.message || 'Greška pri kreiranju rezervacije');
      }
    });
  };

  const handleClose = () => {
    if (!isPending) {
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  if (!trip) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rezerviši sedište</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="text-center py-6">
            <div className="text-green-600 text-lg font-medium mb-2">
              ✅ Rezervacija uspešna!
            </div>
            <div className="text-sm text-gray-600">
              Rezervacija je uspešno kreirana!
            </div>
          </div>
        ) : (
          <>
            {/* Trip Information */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">{trip.company.name}</h3>
                <div className="text-sm text-gray-600">
                  {trip.availableSeats} slobodno
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                  <span>
                    {trip.route.from.name} → {trip.route.to.name}
                  </span>
                </div>

                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <span>
                    {formatTime(trip.departure)} - {formatTime(trip.arrival)}(
                    {formatDuration(trip.departure, trip.arrival)})
                  </span>
                </div>

                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{formatDate(date)}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Ime i Prezime</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={isPending}
                  placeholder="Unesite ime i prezime"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isPending}
                  placeholder="Unesite email adresu"
                />
              </div>

              <div>
                <Label htmlFor="seats">Broj sedišta</Label>
                <Input
                  id="seats"
                  type="number"
                  min="1"
                  max={trip.availableSeats}
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                  required
                  disabled={isPending}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Maksimalno {trip.availableSeats} sedišta dostupno
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  disabled={isPending}
                >
                  Otkaži
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Rezervacija...' : 'Rezerviši'}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
