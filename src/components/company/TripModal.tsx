'use client';

import React, { useState, useRef, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Plus, Trash2, Clock } from 'lucide-react';
import CitySelector from '@/components/homepage/city-selector';
import { City } from '@/generated/prisma';
import { Calendar } from '@/components/ui/calendar';
import { srLatn } from 'date-fns/locale';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const { DateTime } = require('luxon');

interface TimeSlot {
  id: string;
  departureTime: string;
  arrivalTime: string;
  duration: number; // in minutes
}

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateTripModal({
  isOpen,
  onClose,
}: CreateTripModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    new Date()
  );
  const [arrivalDate, setArrivalDate] = useState<Date | undefined>(new Date());
  const [seatsTotal, setSeatsTotal] = useState(50);
  const [fromCity, setFromCity] = useState<City | null>(null);
  const [toCity, setToCity] = useState<City | null>(null);
  const [openDeparture, setOpenDeparture] = useState(false);
  const [openArrival, setOpenArrival] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Multiple time slots for the same route
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    {
      id: '1',
      departureTime: '09:00',
      arrivalTime: '11:30',
      duration: 150, // 2.5 hours
    },
  ]);

  function combineToUtcIso(date: Date, time: string) {
    const dateStr = date.toISOString().split('T')[0];
    const dt = DateTime.fromISO(`${dateStr}T${time}`, {
      zone: 'Europe/Belgrade',
    }).toUTC();
    return dt.toISO();
  }

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
    value: string | number
  ) => {
    setTimeSlots((prevSlots) => {
      const updatedSlots = prevSlots.map((slot) => {
        if (slot.id === id) {
          const updatedSlot = { ...slot, [field]: value };

          // If updating departure or arrival time, recalculate duration
          if (field === 'departureTime' || field === 'arrivalTime') {
            const departureTime =
              field === 'departureTime'
                ? (value as string)
                : slot.departureTime;
            const arrivalTime =
              field === 'arrivalTime' ? (value as string) : slot.arrivalTime;
            updatedSlot.duration = calculateDuration(
              departureTime,
              arrivalTime
            );
          }

          return updatedSlot;
        }
        return slot;
      });

      return updatedSlots;
    });

    // Clear error when updating times
    if (field === 'departureTime' || field === 'arrivalTime') {
      setError(null);
    }
  };

  const calculateDuration = (departureTime: string, arrivalTime: string) => {
    const dep = DateTime.fromISO(`2000-01-01T${departureTime}`);
    const arr = DateTime.fromISO(`2000-01-01T${arrivalTime}`);
    return arr.diff(dep, 'minutes').minutes;
  };

  const checkForOverlaps = (timeSlots: TimeSlot[]) => {
    const overlaps: string[] = [];

    for (let i = 0; i < timeSlots.length; i++) {
      for (let j = i + 1; j < timeSlots.length; j++) {
        const slot1 = timeSlots[i];
        const slot2 = timeSlots[j];

        // Convert to DateTime objects for comparison
        const dep1 = DateTime.fromISO(`2000-01-01T${slot1.departureTime}`);
        const arr1 = DateTime.fromISO(`2000-01-01T${slot1.arrivalTime}`);
        const dep2 = DateTime.fromISO(`2000-01-01T${slot2.departureTime}`);
        const arr2 = DateTime.fromISO(`2000-01-01T${slot2.arrivalTime}`);

        // Check for overlap
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
              })`
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

  async function handleSubmit(formData: FormData) {
    if (!fromCity || !toCity || !departureDate || !arrivalDate) {
      setError('Sva polja su obavezna');
      return;
    }

    if (timeSlots.length === 0) {
      setError('Morate dodati bar jedan polazak');
      return;
    }

    // Clear previous errors
    setError(null);

    // Validate for overlaps
    if (!validateTimeSlots()) {
      return;
    }

    startTransition(async () => {
      try {
        const { createMultipleTrips } = await import('@/app/actions');

        // Create trips for each time slot
        const tripsData = timeSlots.map((slot) => ({
          fromId: fromCity.id,
          toId: toCity.id,
          departure: combineToUtcIso(departureDate, slot.departureTime),
          arrival: combineToUtcIso(arrivalDate, slot.arrivalTime),
          seatsTotal: seatsTotal,
        }));

        await createMultipleTrips(tripsData);

        // Reset form
        setFromCity(null);
        setToCity(null);
        setDepartureDate(new Date());
        setArrivalDate(new Date());
        setSeatsTotal(50);
        setTimeSlots([
          {
            id: '1',
            departureTime: '09:00',
            arrivalTime: '11:30',
            duration: 150,
          },
        ]);
        setError(null);
        onClose();
      } catch (err: any) {
        setError(err.message || 'Greška pri kreiranju putovanja');
      }
    });
  }

  const formatedDeparture = departureDate
    ? format(departureDate, 'PPP', { locale: srLatn })
    : '';

  const formatedArrival = arrivalDate
    ? format(arrivalDate, 'PPP', { locale: srLatn })
    : '';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Kreiraj Nova Putovanja</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <div className="font-medium mb-1">Greška:</div>
            <div className="text-sm whitespace-pre-line">{error}</div>
          </div>
        )}

        <form ref={formRef} action={handleSubmit} className="space-y-6">
          {/* Route Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informacije o ruti</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <CitySelector
                label="Polazak iz"
                selectedCity={fromCity}
                setSelectedCity={setFromCity}
              />
              <CitySelector
                label="Dolazak u"
                selectedCity={toCity}
                setSelectedCity={setToCity}
              />

              <div>
                <Label>Datum polaska</Label>
                <Popover open={openDeparture} onOpenChange={setOpenDeparture}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="justify-between font-normal border p-2 rounded w-full"
                    >
                      {departureDate ? formatedDeparture : 'Izaberi datum'}
                      <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={departureDate}
                      onSelect={(date) => {
                        setDepartureDate(date);
                        setOpenDeparture(false);
                      }}
                      captionLayout="dropdown"
                      locale={srLatn}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Datum dolaska</Label>
                <Popover open={openArrival} onOpenChange={setOpenArrival}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="justify-between font-normal border p-2 rounded w-full"
                    >
                      {arrivalDate ? formatedArrival : 'Izaberi datum'}
                      <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={arrivalDate}
                      onSelect={(date) => {
                        setArrivalDate(date);
                        setOpenArrival(false);
                      }}
                      captionLayout="dropdown"
                      locale={srLatn}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="col-span-2">
                <Label>Ukupan broj sedišta po putovanju</Label>
                <Input
                  type="number"
                  value={seatsTotal}
                  onChange={(e) => setSeatsTotal(Number(e.target.value))}
                  min="1"
                  max="100"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Time Slots */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Polasci</CardTitle>
                <Button
                  type="button"
                  onClick={addTimeSlot}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Dodaj polazak
                </Button>
              </div>
              {checkForOverlaps(timeSlots).length > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  ⚠️ Detektovana su preklapanja između polazaka. Molimo
                  ispravite vremena pre kreiranja.
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {timeSlots.map((slot, index) => {
                const overlaps = checkForOverlaps(timeSlots);
                const hasOverlap = overlaps.some((overlap) =>
                  overlap.includes(`Polazak #${index + 1}`)
                );

                return (
                  <div
                    key={slot.id}
                    className={`flex items-center gap-4 p-4 border rounded-lg ${
                      hasOverlap ? 'bg-red-50 border-red-200' : 'bg-gray-50'
                    }`}
                  >
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
                    </div>

                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs">Vreme polaska</Label>
                        <Input
                          type="time"
                          value={slot.departureTime}
                          onChange={(e) => {
                            updateTimeSlot(
                              slot.id,
                              'departureTime',
                              e.target.value
                            );
                          }}
                          className="text-sm"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Vreme dolaska</Label>
                        <Input
                          type="time"
                          value={slot.arrivalTime}
                          onChange={(e) => {
                            updateTimeSlot(
                              slot.id,
                              'arrivalTime',
                              e.target.value
                            );
                          }}
                          className="text-sm"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Trajanje</Label>
                        <div className="flex items-center h-10 px-3 border rounded-md bg-gray-100 text-sm text-gray-600">
                          {Math.floor(slot.duration / 60)}h {slot.duration % 60}
                          m
                        </div>
                      </div>
                    </div>

                    {timeSlots.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTimeSlot(slot.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isPending}
            >
              Otkaži
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? 'Kreiranje...'
                : `Kreiraj ${timeSlots.length} putovanja`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
