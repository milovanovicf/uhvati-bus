'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { srLatn } from 'date-fns/locale';
import { ArrowLeftRight, Calendar as CalendarIcon, HelpCircle } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
const { DateTime } = require('luxon');

export default function BookingForm() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [open, setOpen] = useState(false);
  const [fromCity, setFromCity] = useState<City | null>(null);
  const [toCity, setToCity] = useState<City | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [seats, setSeats] = useState(1);
  const [time, setTime] = useState('10:30');

  const formattedDate = date
    ? DateTime.fromJSDate(date).setLocale('sr-Latn').toFormat('d. LLL yyyy')
    : '';

  const handleSearch = () => {
    if (!fromCity || !toCity || !date) {
      alert('Molimo popunite sva polja pre pretrage ruta.');
      return;
    }

    const params = new URLSearchParams({
      fromId: fromCity.id.toString(),
      toId: toCity.id.toString(),
      date: DateTime.fromJSDate(date).toISODate() || '',
      time,
    });

    if (fullName) params.set('fullName', fullName);
    if (email) params.set('email', email);
    params.set('seats', seats.toString());

    window.location.href = `/routes?${params}`;
  };

  return (
    <Card className="w-90">
      <CardHeader>
        <CardTitle>Pretraga</CardTitle>
      </CardHeader>

      <CardContent className="px-5">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Ime i Prezime
            </label>
            <Input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="Ime i Prezime"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="time-picker" className="px-1">
                Vreme
              </Label>
              <Input
                type="time"
                id="time-picker"
                value={time}
                onChange={(e) => setTime(e.target.value)}
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
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Broj sedišta
            </label>
            <Input
              type="number"
              min={1}
              max={10}
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
              className="w-full border p-2 rounded"
            />
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              className="bg-chart-4 text-white cursor-pointer"
              onClick={handleSearch}
            >
              Pogledaj rute
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
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
        </div>
      </CardContent>
    </Card>
  );
}
