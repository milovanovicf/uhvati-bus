'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { srLatn } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CitySelector from './city-selector';
import prisma from '@/lib/prisma';
import { City, Route } from '@/generated/prisma';
const { DateTime } = require('luxon');

type RouteWithCities = Route & {
  from: City;
  to: City;
};

type BookingFormProps = {
  routes: RouteWithCities[];
};

export default function BookingForm({ routes }: BookingFormProps) {
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [seats, setSeats] = useState(1);

  const selectedRoute = routes.find((route) => route.id === selectedRouteId);
  const [date, setDate] = React.useState<Date | undefined>();
  const [open, setOpen] = React.useState(false);
  const [time, setTime] = React.useState('10:30');
  const [fromCity, setFromCity] = React.useState<string | null>(null);
  const [toCity, setToCity] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!fromCity || !toCity || !date || !time) {
      alert('Molimo popunite sva polja.');
      return;
    }

    const dbRoutes = await prisma.route.findMany({
      include: {
        from: true,
        to: true,
      },
    });

    // Find matching route
    const matchingRoute = dbRoutes.find(
      (route) => route.from.name === fromCity && route.to.name === toCity
    );

    if (!matchingRoute) {
      alert('Nema dostupne rute za odabrane gradove.');
      return;
    }

    const payload = {
      fullName,
      email,
      date: DateTime.fromJSDate(date).toISODate(),
      time,
      seats,
      routeId: matchingRoute.id,
    };

    try {
      const response = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Greška prilikom rezervacije.');
      }

      const result = await response.json();
      alert('Uspešno ste rezervisali mesto!');
      console.log('Reservation result:', result);
    } catch (error) {
      console.error('Reservation error:', error);
      alert('Došlo je do greške prilikom rezervacije.');
    }
  }

  const formattedDate = date ? format(date, 'PPP', { locale: srLatn }) : '';
  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Rezervacija</CardTitle>
      </CardHeader>

      <CardContent className="px-5">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1">
              Ime i Prezime
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border p-2 rounded"
            />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Date Picker */}
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
                    {date ? formattedDate : 'Izaberi datum'}
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
            </div>

            {/* Time Picker */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="time-picker" className="px-1">
                Vreme
              </Label>
              <Input
                type="time"
                id="time-picker"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                step="60"
                defaultValue="10:30"
                className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none border p-2 rounded"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <CitySelector
              label="Od"
              selectedCity={fromCity}
              setSelectedCity={setFromCity}
            />
            <CitySelector
              label="Do"
              selectedCity={toCity}
              setSelectedCity={setToCity}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Broj sedišta
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
              required
              className="w-full border p-2 rounded"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit">Rezerviši</Button>
            <Button
              type="submit"
              variant="outline"
              className="bg-chart-4 text-white"
            >
              Pogledaj rute
            </Button>
          </div>

          {selectedRoute && (
            <p className="text-sm text-gray-600">
              Izabrana ruta: {selectedRoute.from.name} → {selectedRoute.to.name}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
