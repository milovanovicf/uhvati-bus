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
import { srLatn } from 'date-fns/locale';
import { DateTime } from 'luxon';
import { deleteTrip, createMultipleTrips, updateTripTimes, getRouteInfo, updateRouteMetadata, updateRouteSeats } from '@/app/actions';
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
  tripIds: number[];
  dateFrom: Date | null;
  dateTo: Date | null;
}

interface EditRouteModalProps {
  isOpen: boolean;
  onClose: (saved?: boolean) => void;
  route: RouteGroup;
}

export default function EditRouteModal({
  isOpen,
  onClose,
  route,
}: EditRouteModalProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [seatsTotal, setSeatsTotal] = useState(50);
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const calculateDuration = (departureTime: string, arrivalTime: string) => {
    const dep = DateTime.fromISO(`2000-01-01T${departureTime}`);
    const arr = DateTime.fromISO(`2000-01-01T${arrivalTime}`);
    return arr.diff(dep, 'minutes').minutes;
  };

  // Fetch saved duration/distance for this route
  React.useEffect(() => {
    if (!isOpen) return;
    const fromId = route.trips[0]?.route?.from?.id;
    const toId = route.trips[0]?.route?.to?.id;
    if (!fromId || !toId) return;
    getRouteInfo(fromId, toId).then((info) => {
      if (info?.duration) {
        setDurationHours(Math.floor(info.duration / 60));
        setDurationMinutes(info.duration % 60);
      }
      if (info?.distance) setDistanceKm(info.distance);
    });
  }, [isOpen, route]);

  // Deduplicate trips by time pattern — many recurring trips share the same
  // departure/arrival time; show each unique pattern once.
  React.useEffect(() => {
    if (route.trips.length > 0) {
      const slotMap = new Map<string, TimeSlot>();
      for (const trip of route.trips) {
        const d = new Date(trip.departure);
        const dep = format(d, 'HH:mm');
        const arr = format(new Date(trip.arrival), 'HH:mm');
        const key = `${dep}-${arr}`;
        if (slotMap.has(key)) {
          const slot = slotMap.get(key)!;
          slot.tripIds.push(trip.id);
          if (slot.dateFrom && d < slot.dateFrom) slot.dateFrom = d;
          if (slot.dateTo && d > slot.dateTo) slot.dateTo = d;
        } else {
          slotMap.set(key, {
            id: `existing-${trip.id}`,
            departureTime: dep,
            arrivalTime: arr,
            duration: calculateDuration(dep, arr),
            tripIds: [trip.id],
            dateFrom: d,
            dateTo: d,
          });
        }
      }
      setTimeSlots(Array.from(slotMap.values()));
      setSeatsTotal(route.trips[0].seatsTotal);
    } else {
      setTimeSlots([
        { id: '1', departureTime: '09:00', arrivalTime: '11:30', duration: 150, tripIds: [], dateFrom: null, dateTo: null },
      ]);
    }
  }, [route]);

  const addTimeSlot = () => {
    const lastSlot = timeSlots[timeSlots.length - 1];
    const newDep = lastSlot
      ? DateTime.fromISO(`2000-01-01T${lastSlot.departureTime}`).plus({ hours: 2 }).toFormat('HH:mm')
      : '11:00';
    const newArr = lastSlot
      ? DateTime.fromISO(`2000-01-01T${lastSlot.arrivalTime}`).plus({ hours: 2 }).toFormat('HH:mm')
      : '13:30';
    setTimeSlots([
      ...timeSlots,
      { id: String(Date.now()), departureTime: newDep, arrivalTime: newArr, duration: 150, tripIds: [], dateFrom: null, dateTo: null },
    ]);
  };

  const removeTimeSlot = (id: string) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter((slot) => slot.id !== id));
    }
  };

  const updateTimeSlot = (id: string, field: 'departureTime' | 'arrivalTime', value: string) => {
    setTimeSlots((prev) =>
      prev.map((slot) => {
        if (slot.id !== id) return slot;
        const updated = { ...slot, [field]: value };
        updated.duration = calculateDuration(updated.departureTime, updated.arrivalTime);
        return updated;
      }),
    );
  };

  const checkForOverlaps = (slots: TimeSlot[]) => {
    const overlaps: string[] = [];
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const s1 = slots[i];
        const s2 = slots[j];
        const dep1 = DateTime.fromISO(`2000-01-01T${s1.departureTime}`);
        const arr1 = DateTime.fromISO(`2000-01-01T${s1.arrivalTime}`);
        const dep2 = DateTime.fromISO(`2000-01-01T${s2.departureTime}`);
        const arr2 = DateTime.fromISO(`2000-01-01T${s2.arrivalTime}`);
        const overlap =
          (dep1 >= dep2 && dep1 < arr2) ||
          (arr1 > dep2 && arr1 <= arr2) ||
          (dep1 <= dep2 && arr1 >= arr2) ||
          (dep2 <= dep1 && arr2 >= arr1);
        if (overlap) {
          overlaps.push(
            `Polazak #${i + 1} (${s1.departureTime}–${s1.arrivalTime}) ` +
              `se preklapa sa polaskom #${j + 1} (${s2.departureTime}–${s2.arrivalTime})`,
          );
        }
      }
    }
    return overlaps;
  };

  const combineToUtcIso = (date: Date, time: string) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dt = DateTime.fromISO(`${year}-${month}-${day}T${time}`, {
      zone: 'Europe/Belgrade',
    }).toUTC();
    return dt.toISO()!;
  };

  const handleSave = async () => {
    const overlaps = checkForOverlaps(timeSlots);
    if (overlaps.length > 0) {
      const proceed = confirm(
        `Detektovana su preklapanja između polazaka:\n${overlaps.join('\n')}\n\nNapomena: ovo može biti normalno ako ste ručno izmenili vreme za pojedinačna putovanja (koja su na različitim danima).\n\nDa li želite da nastavite?`
      );
      if (!proceed) return;
    }
    setError(null);

    // Calculate what will change and ask for confirmation
    const tripById = new Map(route.trips.map((t) => [t.id, t]));
    const keptTripIds = new Set(timeSlots.flatMap((s) => s.tripIds));
    const willDelete = route.trips.filter((t) => !keptTripIds.has(t.id)).length;
    const willUpdate = timeSlots
      .filter((s) => {
        if (s.tripIds.length === 0) return false;
        const sample = tripById.get(s.tripIds[0]);
        if (!sample) return false;
        const origDep = format(new Date(sample.departure), 'HH:mm');
        const origArr = format(new Date(sample.arrival), 'HH:mm');
        return s.departureTime !== origDep || s.arrivalTime !== origArr;
      })
      .reduce((sum, s) => sum + s.tripIds.length, 0);
    const existingDateCount = new Map(
      route.trips.map((t) => {
        const d = new Date(t.departure);
        return [`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, true];
      }),
    ).size;
    const newSlotCount = timeSlots.filter((s) => s.tripIds.length === 0).length;
    const willCreate = newSlotCount * existingDateCount;

    const lines: string[] = [];
    if (willUpdate > 0) lines.push(`• Promeniti vreme za ${willUpdate} putovanja`);
    if (willDelete > 0) lines.push(`• Trajno obrisati ${willDelete} putovanja`);
    if (willCreate > 0) lines.push(`• Kreirati ${willCreate} novih putovanja`);

    if (lines.length > 0 && !confirm(`Ova akcija će:\n${lines.join('\n')}\n\nDa li ste sigurni?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const tripById = new Map(route.trips.map((t) => [t.id, t]));
        const fromId = route.trips[0]?.route?.from?.id ?? 1;
        const toId = route.trips[0]?.route?.to?.id ?? 2;

        // Slots removed entirely — delete all their trips
        const keptTripIds = new Set(timeSlots.flatMap((s) => s.tripIds));
        const tripsToDelete = route.trips.filter((t) => !keptTripIds.has(t.id));
        for (const trip of tripsToDelete) {
          await deleteTrip(trip.id);
        }

        // Existing slots whose time was changed — update each trip in place
        const modifiedSlots = timeSlots.filter((s) => {
          if (s.tripIds.length === 0) return false;
          const sample = tripById.get(s.tripIds[0]);
          if (!sample) return false;
          const origDep = format(new Date(sample.departure), 'HH:mm');
          const origArr = format(new Date(sample.arrival), 'HH:mm');
          return s.departureTime !== origDep || s.arrivalTime !== origArr;
        });

        for (const slot of modifiedSlots) {
          for (const id of slot.tripIds) {
            const trip = tripById.get(id);
            if (!trip) continue;
            await updateTripTimes(
              id,
              combineToUtcIso(new Date(trip.departure), slot.departureTime),
              combineToUtcIso(new Date(trip.departure), slot.arrivalTime),
            );
          }
        }

        // Brand-new slots — create one trip per existing date in the route
        const newSlots = timeSlots.filter((s) => s.tripIds.length === 0);
        if (newSlots.length > 0) {
          const existingDates = Array.from(
            new Map(
              route.trips.map((t) => {
                const d = new Date(t.departure);
                const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                return [key, d];
              }),
            ).values(),
          );
          if (existingDates.length === 0) throw new Error('Nema postojećih putovanja za ovu rutu');
          const tripsData = newSlots.flatMap((slot) =>
            existingDates.map((date) => ({
              fromId,
              toId,
              departure: combineToUtcIso(date, slot.departureTime),
              arrival: combineToUtcIso(date, slot.arrivalTime),
              seatsTotal,
            })),
          );
          await createMultipleTrips(tripsData);
        }

        // Update seatsTotal for all existing trips if it changed
        const originalSeats = route.trips[0]?.seatsTotal ?? 50;
        if (seatsTotal !== originalSeats) {
          await updateRouteSeats(route.routeId, seatsTotal);
        }

        const totalMins = durationHours * 60 + durationMinutes;
        if (totalMins > 0 || distanceKm > 0) {
          await updateRouteMetadata(
            route.routeId,
            totalMins > 0 ? totalMins : null,
            distanceKm > 0 ? distanceKm : null,
          );
        }

        setSuccess(true);
        setTimeout(() => { onClose(true); setSuccess(false); }, 2000);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Greška pri čuvanju promena');
      }
    });
  };

  const handleClose = () => {
    if (!isPending) { setError(null); setSuccess(false); onClose(false); }
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
                  <div>
                    <Label>Trajanje vožnje <span className="text-gray-400 font-normal">(opciono)</span></Label>
                    <div className="flex items-center gap-1 mt-1 border rounded-md px-2 py-1 bg-white w-fit">
                      <input
                        type="number"
                        value={durationHours || ''}
                        onChange={(e) => setDurationHours(Math.max(0, Number(e.target.value)))}
                        min="0" max="23" placeholder="0"
                        className="w-10 text-sm text-center outline-none bg-transparent"
                        disabled={isPending}
                      />
                      <span className="text-sm text-gray-400">h</span>
                      <input
                        type="number"
                        value={durationMinutes || ''}
                        onChange={(e) => setDurationMinutes(Math.max(0, Math.min(59, Number(e.target.value))))}
                        min="0" max="59" placeholder="0"
                        className="w-10 text-sm text-center outline-none bg-transparent"
                        disabled={isPending}
                      />
                      <span className="text-sm text-gray-400">min</span>
                    </div>
                  </div>
                  <div>
                    <Label>Distanca <span className="text-gray-400 font-normal">(opciono)</span></Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        value={distanceKm || ''}
                        onChange={(e) => setDistanceKm(Math.max(0, Number(e.target.value)))}
                        min="0" placeholder="0"
                        className="w-28"
                        disabled={isPending}
                      />
                      <span className="text-sm text-gray-500">km</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Polasci</h3>
                  <Button type="button" onClick={addTimeSlot} size="sm" disabled={isPending}>
                    <Plus className="h-4 w-4 mr-1" /> Dodaj polazak
                  </Button>
                </div>

                <div className="space-y-3">
                  {timeSlots.map((slot, index) => {
                    return (
                      <div
                        key={slot.id}
                        className="p-4 border rounded-lg bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Clock className="h-4 w-4 text-gray-600" />
                            <span className="text-gray-600">
                              Polazak #{index + 1}
                            </span>
                            {slot.tripIds.length > 0 && (
                              <span className="text-xs text-blue-500 font-normal">
                                ({slot.tripIds.length} {slot.tripIds.length === 1 ? 'putovanje' : 'putovanja'})
                              </span>
                            )}
                            {slot.tripIds.length === 0 && (
                              <span className="text-xs text-green-600 font-normal">(novo)</span>
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
                        {slot.dateFrom && slot.dateTo && (
                          <div className="mb-3 text-xs text-gray-500">
                            {slot.dateFrom.toDateString() === slot.dateTo.toDateString()
                              ? format(slot.dateFrom, 'd. MMMM yyyy.', { locale: srLatn })
                              : `od ${format(slot.dateFrom, 'd. MMM yyyy.', { locale: srLatn })} do ${format(slot.dateTo, 'd. MMM yyyy.', { locale: srLatn })}`}
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label className="text-xs">Vreme polaska</Label>
                            <Input
                              type="time"
                              value={slot.departureTime}
                              onChange={(e) => updateTimeSlot(slot.id, 'departureTime', e.target.value)}
                              className="text-sm w-full"
                              disabled={isPending}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Vreme dolaska</Label>
                            <Input
                              type="time"
                              value={slot.arrivalTime}
                              onChange={(e) => updateTimeSlot(slot.id, 'arrivalTime', e.target.value)}
                              className="text-sm w-full"
                              disabled={isPending}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Trajanje</Label>
                            <div className="flex items-center h-10 px-3 border rounded-md bg-gray-100 text-sm text-gray-600">
                              {Math.floor(slot.duration / 60)}h {slot.duration % 60}m
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>
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
