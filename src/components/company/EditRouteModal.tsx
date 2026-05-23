'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Clock, Plus, Trash2, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { DateTime } from 'luxon';
import { deleteTrip, createMultipleTrips } from '@/app/actions';
import { TripWithDetails } from './CompanyClient';

export interface RouteGroup {
  routeId: number;
  fromCity: string;
  toCity: string;
  trips: TripWithDetails[];
  totalSeats: number;
  availableSeats: number;
  totalReservations: number;
}

interface TimeSlot {
  id: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  tripId?: number; // For existing trips
}

interface EditRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: RouteGroup;
}

export default function EditRouteModal({
  isOpen,
  onClose,
  route,
}: EditRouteModalProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [seatsTotal, setSeatsTotal] = useState(50);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize time slots from existing trips
  React.useEffect(() => {
    if (route.trips.length > 0) {
      const slots = route.trips.map((trip, index) => ({
        id: `existing-${trip.id}`,
        departureTime: format(new Date(trip.departure), 'HH:mm'),
        arrivalTime: format(new Date(trip.arrival), 'HH:mm'),
        duration: calculateDuration(
          format(new Date(trip.departure), 'HH:mm'),
          format(new Date(trip.arrival), 'HH:mm'),
        ),
        tripId: trip.id,
      }));
      setTimeSlots(slots);
      setSeatsTotal(route.trips[0].seatsTotal);
    } else {
      setTimeSlots([
        {
          id: '1',
          departureTime: '09:00',
          arrivalTime: '11:30',
          duration: 150,
        },
      ]);
    }
  }, [route]);

  const calculateDuration = (departureTime: string, arrivalTime: string) => {
    const dep = DateTime.fromISO(`2000-01-01T${departureTime}`);
    const arr = DateTime.fromISO(`2000-01-01T${arrivalTime}`);
    return arr.diff(dep, 'minutes').minutes;
  };

  const addTimeSlot = () => {
    const newId = (timeSlots.length + 1).toString();
    const lastSlot = timeSlots[timeSlots.length - 1];
    const newDepartureTime = lastSlot
      ? DateTime.fromISO(`2000-01-01T${lastSlot.departureTime}`)
          .plus({ hours: 2 })
          .toFormat('HH:mm')
      : '11:00';
    const newArrivalTime = lastSlot
      ? DateTime.fromISO(`2000-01-01T${lastSlot.arrivalTime}`)
          .plus({ hours: 2 })
          .toFormat('HH:mm')
      : '13:30';

    setTimeSlots([
      ...timeSlots,
      {
        id: newId,
        departureTime: newDepartureTime,
        arrivalTime: newArrivalTime,
        duration: 150,
      },
    ]);
  };

  const removeTimeSlot = (id: string) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter((slot) => slot.id !== id));
    }
  };

  const updateTimeSlot = (
    id: string,
    field: keyof TimeSlot,
    value: string | number,
  ) => {
    setTimeSlots((prevSlots) => {
      const updatedSlots = prevSlots.map((slot) => {
        if (slot.id === id) {
          const updatedSlot = { ...slot, [field]: value };

          if (field === 'departureTime' || field === 'arrivalTime') {
            const departureTime =
              field === 'departureTime'
                ? (value as string)
                : slot.departureTime;
            const arrivalTime =
              field === 'arrivalTime' ? (value as string) : slot.arrivalTime;
            updatedSlot.duration = calculateDuration(
              departureTime,
              arrivalTime,
            );
          }

          return updatedSlot;
        }
        return slot;
      });

      return updatedSlots;
    });
  };

  const checkForOverlaps = (timeSlots: TimeSlot[]) => {
    const overlaps: string[] = [];

    for (let i = 0; i < timeSlots.length; i++) {
      for (let j = i + 1; j < timeSlots.length; j++) {
        const slot1 = timeSlots[i];
        const slot2 = timeSlots[j];

        const dep1 = DateTime.fromISO(`2000-01-01T${slot1.departureTime}`);
        const arr1 = DateTime.fromISO(`2000-01-01T${slot1.arrivalTime}`);
        const dep2 = DateTime.fromISO(`2000-01-01T${slot2.departureTime}`);
        const arr2 = DateTime.fromISO(`2000-01-01T${slot2.arrivalTime}`);

        const overlap =
          (dep1 >= dep2 && dep1 < arr2) ||
          (arr1 > dep2 && arr1 <= arr2) ||
          (dep1 <= dep2 && arr1 >= arr2) ||
          (dep2 <= dep1 && arr2 >= arr1);

        if (overlap) {
          overlaps.push(
            `Polazak #${i + 1} (${slot1.departureTime} - ${
              slot1.arrivalTime
            }) ` +
              `se preklapa sa polaskom #${j + 1} (${slot2.departureTime} - ${
                slot2.arrivalTime
              })`,
          );
        }
      }
    }

    return overlaps;
  };

  const validateTimeSlots = () => {
    const overlaps = checkForOverlaps(timeSlots);
    if (overlaps.length > 0) {
      setError(`Preklapanje polazaka:\n${overlaps.join('\n')}`);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateTimeSlots()) {
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        // Get the first trip's date for new trips
        const firstTrip = route.trips[0];
        const tripDate = firstTrip ? new Date(firstTrip.departure) : new Date();
        const dateStr = tripDate.toISOString().split('T')[0];

        // Separate existing and new trips
        const existingTrips = timeSlots.filter((slot) => slot.tripId);
        const newTrips = timeSlots.filter((slot) => !slot.tripId);

        // Delete removed trips
        const currentTripIds = existingTrips.map((slot) => slot.tripId!);
        const tripsToDelete = route.trips.filter(
          (trip) => !currentTripIds.includes(trip.id),
        );

        for (const trip of tripsToDelete) {
          await deleteTrip(trip.id);
        }

        // Create new trips
        if (newTrips.length > 0) {
          // Get route information from the first existing trip
          const firstTrip = route.trips[0];
          if (!firstTrip) {
            throw new Error('Nema postojećih putovanja za ovu rutu');
          }

          const tripsData = newTrips.map((slot) => ({
            fromId: firstTrip.route?.from?.id || 1,
            toId: firstTrip.route?.to?.id || 2,
            departure: combineToUtcIso(tripDate, slot.departureTime),
            arrival: combineToUtcIso(tripDate, slot.arrivalTime),
            seatsTotal: seatsTotal,
          }));

          await createMultipleTrips(tripsData);
        }

        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      } catch (err: any) {
        setError(err.message || 'Greška pri čuvanju promena');
      }
    });
  };

  const combineToUtcIso = (date: Date, time: string) => {
    const dateStr = date.toISOString().split('T')[0];
    const dt = DateTime.fromISO(`${dateStr}T${time}`, {
      zone: 'Europe/Belgrade',
    }).toUTC();
    return dt.toISO()!;
  };

  const handleClose = () => {
    if (!isPending) {
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Uredi rutu: {route.fromCity} → {route.toCity}
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="text-center py-6">
            <div className="text-green-600 text-lg font-medium mb-2">
              ✅ Promene uspešno sačuvane!
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                <div className="font-medium mb-1">Greška:</div>
                <div className="text-sm whitespace-pre-line">{error}</div>
              </div>
            )}

            <div className="space-y-6">
              {/* Route Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-2">Informacije o ruti</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Ukupan broj sedišta po putovanju</Label>
                    <Input
                      type="number"
                      value={seatsTotal}
                      onChange={(e) => setSeatsTotal(Number(e.target.value))}
                      min="1"
                      max="100"
                      disabled={isPending}
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="text-sm text-gray-600">
                      Trenutno: {route.trips.length} polazaka
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Polasci</h3>
                  <Button
                    type="button"
                    onClick={addTimeSlot}
                    size="sm"
                    className="flex items-center gap-2"
                    disabled={isPending}
                  >
                    <Plus className="h-4 w-4" />
                    Dodaj polazak
                  </Button>
                </div>

                {checkForOverlaps(timeSlots).length > 0 && (
                  <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    ⚠️ Detektovana su preklapanja između polazaka. Molimo
                    ispravite vremena pre čuvanja.
                  </div>
                )}

                <div className="space-y-3">
                  {timeSlots.map((slot, index) => {
                    const overlaps = checkForOverlaps(timeSlots);
                    const hasOverlap = overlaps.some((overlap) =>
                      overlap.includes(`Polazak #${index + 1}`),
                    );

                    return (
                      <div
                        key={slot.id}
                        className={`p-4 border rounded-lg ${
                          hasOverlap ? 'bg-red-50 border-red-200' : 'bg-gray-50'
                        }`}
                      >
                        {/* Header row: label + delete button */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Clock
                              className={`h-4 w-4 ${
                                hasOverlap ? 'text-red-500' : 'text-gray-600'
                              }`}
                            />
                            <span
                              className={
                                hasOverlap ? 'text-red-600' : 'text-gray-600'
                              }
                            >
                              Polazak #{index + 1}
                            </span>
                            {hasOverlap && (
                              <span className="text-xs text-red-500 font-normal">
                                (Preklapanje!)
                              </span>
                            )}
                            {slot.tripId && (
                              <span className="text-xs text-blue-500 font-normal">
                                (Postojeći)
                              </span>
                            )}
                          </div>

                          {timeSlots.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTimeSlot(slot.id)}
                              className="text-red-600 hover:text-red-700 h-7 w-7 p-0"
                              disabled={isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {/* Inputs row: full width across the card */}
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label className="text-xs">Vreme polaska</Label>
                            <Input
                              type="time"
                              value={slot.departureTime}
                              onChange={(e) =>
                                updateTimeSlot(
                                  slot.id,
                                  'departureTime',
                                  e.target.value,
                                )
                              }
                              className="text-sm w-full"
                              disabled={isPending}
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Vreme dolaska</Label>
                            <Input
                              type="time"
                              value={slot.arrivalTime}
                              onChange={(e) =>
                                updateTimeSlot(
                                  slot.id,
                                  'arrivalTime',
                                  e.target.value,
                                )
                              }
                              className="text-sm w-full"
                              disabled={isPending}
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Trajanje</Label>
                            <div className="flex items-center h-10 px-3 border rounded-md bg-gray-100 text-sm text-gray-600">
                              {Math.floor(slot.duration / 60)}h{' '}
                              {slot.duration % 60}m
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                <Button onClick={handleSave} disabled={isPending}>
                  {isPending ? 'Čuvanje...' : 'Sačuvaj promene'}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
