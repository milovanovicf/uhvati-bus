'use client';

import React, { useActionState, useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { srLatn } from 'date-fns/locale';
import { ArrowLeftRight, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CitySelector from './city-selector';
import { City } from '@/generated/prisma';
import { handleReservationCreate } from '@/app/actions';
import { useFormStatus } from 'react-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
const { DateTime } = require('luxon');
import { HelpCircle } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="disabled:opacity-50 cursor-pointer"
    >
      {pending ? 'Rezervacija u toku...' : 'Rezerviši'}
    </Button>
  );
}

export default function BookingForm() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [open, setOpen] = useState(false);
  const [fromCity, setFromCity] = useState<City | null>(null);
  const [toCity, setToCity] = useState<City | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const [state, formAction] = useActionState(handleReservationCreate, {
    success: false,
  });

  const formattedDate = date
    ? DateTime.fromJSDate(date).setLocale('sr-Latn').toFormat('d. LLL yyyy')
    : '';

  // Handle URL parameters for pre-filling form
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromId = urlParams.get('fromId');
    const toId = urlParams.get('toId');
    const dateParam = urlParams.get('date');
    const timeParam = urlParams.get('time');
    const tripId = urlParams.get('tripId');

    if (tripId) {
      setSelectedTripId(tripId);
    }

    if (dateParam) {
      setDate(new Date(dateParam));
    }

    if (timeParam) {
      const timeInput = document.querySelector(
        'input[name="time"]'
      ) as HTMLInputElement;
      if (timeInput) {
        timeInput.value = timeParam;
      }
    }

    // Load cities if IDs are provided
    if (fromId || toId) {
      const loadCities = async () => {
        try {
          const response = await fetch('/api/cities');
          const cities = await response.json();

          if (fromId) {
            const fromCityData = cities.find(
              (city: City) => city.id === parseInt(fromId)
            );
            if (fromCityData) setFromCity(fromCityData);
          }

          if (toId) {
            const toCityData = cities.find(
              (city: City) => city.id === parseInt(toId)
            );
            if (toCityData) setToCity(toCityData);
          }
        } catch (error) {
          console.error('Error loading cities:', error);
        }
      };

      loadCities();
    }
  }, []);

  return (
    <Card className="w-90">
      <CardHeader>
        <CardTitle>Rezervacija</CardTitle>
      </CardHeader>

      <CardContent className="px-5">
        {state?.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {state.error}
          </div>
        )}

        {state?.success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Rezervacija uspešna! <br /> Broj sedišta:{' '}
            {Array.isArray(state.reservation?.seats)
              ? state.reservation?.seats.join(', ')
              : '-'}
          </div>
        )}

        {selectedTripId && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
            <strong>Odabran specifičan polazak</strong> - rezervacija će biti
            kreirana za ovaj polazak.
          </div>
        )}

        <form className="space-y-4" action={formAction}>
          <div>
            <label className="block text-sm font-medium mb-1">
              Ime i Prezime
            </label>
            <Input
              type="text"
              name="fullName"
              required
              className="w-full border p-2 rounded"
              placeholder="Ime i Prezime"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              name="email"
              required
              className="w-full border p-2 rounded"
              placeholder="Email"
            />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-col gap-2">
              <Label htmlFor="date-picker" className="px-1">
                Datum
              </Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="date-picker"
                    className="justify-between font-normal border p-2 rounded"
                  >
                    {formattedDate || 'Izaberi datum'}
                    <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selectedDate) => {
                      setDate(selectedDate);
                      setOpen(false);
                    }}
                    captionLayout="dropdown"
                    locale={srLatn}
                  />
                </PopoverContent>
              </Popover>

              {/* Hidden input for form submission  */}
              {date && (
                <input
                  type="hidden"
                  name="date"
                  value={DateTime.fromJSDate(date).toISODate()}
                />
              )}
            </div>

            {/* Time Picker */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="time-picker" className="px-1">
                Vreme
              </Label>
              <Input
                type="time"
                id="time-picker"
                step="1"
                name="time"
                defaultValue="10:30:00"
                required
                className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none border p-2 rounded"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div
              className="flex-grow min-w-0"
              style={{ maxWidth: '200px', width: '200px' }}
            >
              <CitySelector
                label="Od"
                selectedCity={fromCity}
                setSelectedCity={setFromCity}
                excludeCityIds={toCity ? [toCity.id] : []}
              />
            </div>
            <div className="flex items-end justify-center pt-6">
              <Button
                type="button"
                size="icon"
                onClick={() => {
                  const temp = fromCity;
                  setFromCity(toCity);
                  setToCity(temp);
                }}
                className="rounded-full h-10 w-10 bg-white text-gray-800 shadow-none hover:bg-gray-800 hover:text-white"
                title="Zameni gradove"
              >
                <ArrowLeftRight className="h-5 w-5" />
              </Button>
            </div>
            <div
              className="flex-grow min-w-0"
              style={{ maxWidth: '200px', width: '200px' }}
            >
              <CitySelector
                label="Do"
                selectedCity={toCity}
                setSelectedCity={setToCity}
                excludeCityIds={fromCity ? [fromCity.id] : []}
              />
            </div>
            {/* Hidden inputs for city IDs  */}
            {fromCity && (
              <input type="hidden" name="fromCityId" value={fromCity.id} />
            )}
            {toCity && (
              <input type="hidden" name="toCityId" value={toCity.id} />
            )}
            {selectedTripId && (
              <input type="hidden" name="tripId" value={selectedTripId} />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Broj sedišta
            </label>
            <Input
              type="number"
              min={1}
              max={10}
              name="seats"
              required
              defaultValue={1}
              placeholder="Broj sedista"
              className="w-full border p-2 rounded"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col items-start gap-1">
              <div className="flex w-full justify-end">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-s text-base bg-gray-600">
                      <p>
                        Klikom na <strong>Rezerviši</strong> automatski se bira
                        prvi slobodan polazak najbliži odabranom vremenu.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <SubmitButton />
            </div>

            <div className="flex flex-col items-start gap-1">
              <div className="flex w-full justify-end">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0 "
                      >
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-s text-base bg-gray-600">
                      <p>
                        Klikom na <strong>Pogledaj rute</strong> videćete sve
                        dostupne polaske za izabrani datum i vreme.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Button
                className="bg-chart-4 text-white cursor-pointer"
                onClick={() => {
                  if (!fromCity || !toCity || !date) {
                    alert('Molimo popunite sva polja pre pretrage ruta.');
                    return;
                  }

                  const params = new URLSearchParams({
                    fromId: fromCity.id.toString(),
                    toId: toCity.id.toString(),
                    date: DateTime.fromJSDate(date).toISODate() || '',
                  });

                  // Add time if provided
                  const timeInput = document.querySelector(
                    'input[name="time"]'
                  ) as HTMLInputElement;
                  if (timeInput && timeInput.value) {
                    params.set('time', timeInput.value);
                  }

                  window.location.href = `/routes?${params}`;
                }}
              >
                Pogledaj rute
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
