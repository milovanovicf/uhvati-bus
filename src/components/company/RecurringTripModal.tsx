'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Plus, Trash2, ArrowLeftRight } from 'lucide-react';
import CitySelector from '@/components/homepage/city-selector';
import { City } from '@/generated/prisma';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { srLatn } from 'date-fns/locale';
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
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function TripModal({ isOpen, onClose }: Props) {
  const [fromCity, setFromCity] = useState<City | null>(null);
  const [toCity, setToCity] = useState<City | null>(null);
  const [seatsTotal, setSeatsTotal] = useState(50);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { id: '1', departureTime: '09:00', arrivalTime: '11:30' },
  ]);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalDurationMins = durationHours * 60 + durationMinutes;

  function calcArrival(depTime: string, mins: number): string {
    return DateTime.fromISO(`2000-01-01T${depTime}`)
      .plus({ minutes: mins })
      .toFormat('HH:mm');
  }

  // Fetch saved route duration when both cities are selected
  useEffect(() => {
    if (!fromCity || !toCity) return;
    let cancelled = false;
    async function fetchRoute() {
      const { getRouteInfo } = await import('@/app/actions');
      const route = await getRouteInfo(fromCity!.id, toCity!.id);
      if (cancelled) return;
      if (route?.duration) {
        const h = Math.floor(route.duration / 60);
        const m = route.duration % 60;
        setDurationHours(h);
        setDurationMinutes(m);
        setTimeSlots((prev) =>
          prev.map((s) => ({
            ...s,
            arrivalTime: calcArrival(s.departureTime, route.duration!),
          })),
        );
      }
      if (route?.distance) setDistanceKm(route.distance);
    }
    fetchRoute();
    return () => {
      cancelled = true;
    };
  }, [fromCity, toCity]);

  // When duration changes, recalculate all arrival times
  useEffect(() => {
    if (totalDurationMins <= 0) return;
    setTimeSlots((prev) =>
      prev.map((s) => ({
        ...s,
        arrivalTime: calcArrival(s.departureTime, totalDurationMins),
      })),
    );
  }, [totalDurationMins]);

  function countTrips(): number {
    if (!startDate || !endDate || !timeSlots.length) return 0;
    const d = new Date(startDate);
    d.setHours(12, 0, 0, 0);
    const e = new Date(endDate);
    e.setHours(12, 0, 0, 0);
    let count = 0;
    while (d <= e) {
      count++;
      d.setDate(d.getDate() + 1);
    }
    return count * timeSlots.length;
  }

  function addTimeSlot() {
    const last = timeSlots[timeSlots.length - 1];
    const newDep = last
      ? DateTime.fromISO(`2000-01-01T${last.departureTime}`)
          .plus({ hours: 2 })
          .toFormat('HH:mm')
      : '11:00';
    const newArr = last
      ? DateTime.fromISO(`2000-01-01T${last.arrivalTime}`)
          .plus({ hours: 2 })
          .toFormat('HH:mm')
      : '13:30';
    setTimeSlots((prev) => [
      ...prev,
      { id: String(Date.now()), departureTime: newDep, arrivalTime: newArr },
    ]);
  }

  function removeTimeSlot(id: string) {
    if (timeSlots.length > 1)
      setTimeSlots((prev) => prev.filter((s) => s.id !== id));
  }

  function updateTimeSlot(
    id: string,
    field: 'departureTime' | 'arrivalTime',
    value: string,
  ) {
    setTimeSlots((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        if (field === 'departureTime' && totalDurationMins > 0) {
          return {
            ...s,
            departureTime: value,
            arrivalTime: calcArrival(value, totalDurationMins),
          };
        }
        return { ...s, [field]: value };
      }),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fromCity || !toCity) {
      setError('Izaberite polaznu i odredišnu stanicu.');
      return;
    }
    if (fromCity.id === toCity.id) {
      setError('Polazni i odredišni grad ne mogu biti isti.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Izaberite početni i krajnji datum.');
      return;
    }
    if (endDate < startDate) {
      setError('Krajnji datum mora biti posle početnog.');
      return;
    }

    setError(null);
    setResult(null);

    startTransition(async () => {
      try {
        const { generateRecurringTrips } = await import('@/app/actions');
        const res = await generateRecurringTrips({
          fromId: fromCity.id,
          toId: toCity.id,
          startDate: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`,
          endDate: `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`,
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          timeSlots: timeSlots.map((s) => ({
            departureTime: s.departureTime,
            arrivalTime: s.arrivalTime,
          })),
          seatsTotal,
          ...(totalDurationMins > 0 && { duration: totalDurationMins }),
          ...(distanceKm > 0 && { distance: distanceKm }),
        });
        setResult(res);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'Greška pri kreiranju putovanja.',
        );
      }
    });
  }

  function handleClose() {
    setFromCity(null);
    setToCity(null);
    setSeatsTotal(50);
    setTimeSlots([{ id: '1', departureTime: '09:00', arrivalTime: '11:30' }]);
    setStartDate(undefined);
    setEndDate(undefined);
    setDurationHours(0);
    setDurationMinutes(0);
    setDistanceKm(0);
    setError(null);
    setResult(null);
    onClose();
  }

  const tripCount = countTrips();
  const isSingleDay =
    startDate && endDate && startDate.toDateString() === endDate.toDateString();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-5">Dodaj putovanje</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}
        {result && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
            Uspešno kreirano <strong>{result.created}</strong> putovanja.
            {result.created === 0 &&
              ' Sva putovanja za ovaj period već postoje.'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ruta i sedišta</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex items-end gap-2">
                <div className="flex-1">
                  <CitySelector
                    label="Polazak iz"
                    selectedCity={fromCity}
                    setSelectedCity={setFromCity}
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => { const t = fromCity; setFromCity(toCity); setToCity(t); }}
                  className="flex-none mb-0.5"
                  title="Zameni gradove"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <CitySelector
                    label="Dolazak u"
                    selectedCity={toCity}
                    setSelectedCity={setToCity}
                  />
                </div>
              </div>
              <div>
                <Label>
                  Trajanje vožnje{' '}
                  <span className="text-gray-400 font-normal">(opciono)</span>
                </Label>
                <div className="flex items-center gap-1 mt-1 border rounded-md px-2 py-1 bg-white w-fit">
                  <input
                    type="number"
                    value={durationHours || ''}
                    onChange={(e) =>
                      setDurationHours(Math.max(0, Number(e.target.value)))
                    }
                    min="0"
                    max="23"
                    placeholder="0"
                    className="w-10 text-sm text-center outline-none bg-transparent"
                  />
                  <span className="text-sm text-gray-400">h</span>
                  <input
                    type="number"
                    value={durationMinutes || ''}
                    onChange={(e) =>
                      setDurationMinutes(
                        Math.max(0, Math.min(59, Number(e.target.value))),
                      )
                    }
                    min="0"
                    max="59"
                    placeholder="0"
                    className="w-10 text-sm text-center outline-none bg-transparent"
                  />
                  <span className="text-sm text-gray-400">min</span>
                </div>
              </div>
              <div>
                <Label>
                  Distanca{' '}
                  <span className="text-gray-400 font-normal">(opciono)</span>
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    value={distanceKm || ''}
                    onChange={(e) =>
                      setDistanceKm(Math.max(0, Number(e.target.value)))
                    }
                    min="0"
                    placeholder="0"
                    className="w-28"
                  />
                  <span className="text-sm text-gray-500">km</span>
                </div>
              </div>
              <div className="col-span-2">
                <Label>Broj sedišta po putovanju</Label>
                <Input
                  type="number"
                  value={seatsTotal}
                  onChange={(e) => setSeatsTotal(Number(e.target.value))}
                  min="1"
                  max="200"
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Period i raspored</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Od datuma</Label>
                  <Popover open={openStart} onOpenChange={setOpenStart}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="justify-between font-normal border p-2 rounded w-full"
                      >
                        {startDate
                          ? format(startDate, 'PPP', { locale: srLatn })
                          : 'Izaberi datum'}
                        <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(d) => {
                          setStartDate(d);
                          setOpenStart(false);
                        }}
                        captionLayout="dropdown"
                        locale={srLatn}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Do datuma</Label>
                  <Popover open={openEnd} onOpenChange={setOpenEnd}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="justify-between font-normal border p-2 rounded w-full"
                      >
                        {endDate
                          ? format(endDate, 'PPP', { locale: srLatn })
                          : 'Izaberi datum'}
                        <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(d) => {
                          setEndDate(d);
                          setOpenEnd(false);
                        }}
                        captionLayout="dropdown"
                        locale={srLatn}
                        disabled={(d) => (startDate ? d < startDate : false)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Vremena polazaka</CardTitle>
                <Button type="button" onClick={addTimeSlot} size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Dodaj vreme
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {timeSlots.map((slot, index) => (
                <div
                  key={slot.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 border rounded-lg"
                >
                  <span className="text-sm text-gray-400 w-5">
                    #{index + 1}
                  </span>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Polazak</Label>
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
                      />
                    </div>
                    <div>
                      <Label className="text-xs">
                        Dolazak
                        {totalDurationMins > 0 && (
                          <span className="text-blue-500 ml-1">(auto)</span>
                        )}
                      </Label>
                      <Input
                        type="time"
                        value={slot.arrivalTime}
                        onChange={(e) =>
                          updateTimeSlot(slot.id, 'arrivalTime', e.target.value)
                        }
                        readOnly={totalDurationMins > 0}
                        className={
                          totalDurationMins > 0
                            ? 'bg-gray-50 text-gray-500 cursor-default'
                            : ''
                        }
                      />
                    </div>
                  </div>
                  {timeSlots.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTimeSlot(slot.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {tripCount > 0 && !result && (
            <div className="text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-lg p-3">
              {isSingleDay ? (
                <>
                  Kreiraće se <strong>{tripCount}</strong>{' '}
                  {tripCount === 1 ? 'putovanje' : 'putovanja'} za{' '}
                  <strong>
                    {format(startDate!, 'd. MMMM yyyy.', { locale: srLatn })}
                  </strong>
                </>
              ) : (
                <>
                  Generisaće se <strong>{tripCount}</strong> putovanja{' '}
                  <span className="text-blue-600">
                    ({format(startDate!, 'd.M.yyyy')} –{' '}
                    {format(endDate!, 'd.M.yyyy')})
                  </span>
                </>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isPending}
            >
              {result ? 'Zatvori' : 'Otkaži'}
            </Button>
            {!result && (
              <Button type="submit" disabled={isPending || tripCount === 0}>
                {isPending
                  ? 'Kreiranje...'
                  : `Kreiraj${tripCount > 0 ? ` ${tripCount}` : ''} putovanja`}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
