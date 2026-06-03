'use client';

import React, { useState } from 'react';
import { DateTime } from 'luxon';
import { Button } from '../ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { srLatn, enUS } from 'date-fns/locale';
import { ArrowLeftRight, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CitySelector from './city-selector';
import { City } from '@prisma/client';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { cityToSlug } from '@/lib/slug';

export default function BookingForm() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [open, setOpen] = useState(false);
  const [fromCity, setFromCity] = useState<City | null>(null);
  const [toCity, setToCity] = useState<City | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [seats, setSeats] = useState(1);
  const { language, t } = useTranslation();
  const locale = language === 'sr' ? 'sr-Latn' : 'en';
  const dateFnsLocale = language === 'sr' ? srLatn : enUS;

  const formattedDate = date
    ? DateTime.fromJSDate(date).setLocale(locale).toFormat('d. LLL yyyy')
    : '';

  const handleSearch = () => {
    if (!fromCity || !toCity || !date) {
      alert(t('booking.validation'));
      return;
    }

    const isoDate = DateTime.fromJSDate(date).toISODate() || '';
    const fromSlug = cityToSlug(fromCity.name);
    const toSlug = cityToSlug(toCity.name);

    const params = new URLSearchParams();
    if (fullName) params.set('fullName', fullName);
    if (email) params.set('email', email);
    params.set('seats', seats.toString());

    const query = params.toString();
    window.location.href = `/rute/${fromSlug}/${toSlug}/${isoDate}${query ? `?${query}` : ''}`;
  };

  return (
    <Card className="w-full sm:w-90">
      <CardHeader>
        <CardTitle>{t('booking.title')}</CardTitle>
      </CardHeader>

      <CardContent className="px-5">
        <div className="space-y-4">
          <div>
            <Label htmlFor="date-picker" className="px-1">{t('booking.date')}</Label>
            <div className="mt-1">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" id="date-picker" className="w-full justify-between font-normal border p-2 rounded">
                    {formattedDate || t('booking.selectDate')}
                    <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => { setDate(d); setOpen(false); }}
                    disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
                    captionLayout="dropdown"
                    locale={dateFnsLocale}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="w-full sm:w-[200px]">
              <CitySelector
                label={t('booking.from')}
                selectedCity={fromCity}
                setSelectedCity={setFromCity}
                excludeCityIds={toCity ? [toCity.id] : []}
              />
            </div>
            <div className="flex items-center justify-center sm:items-end sm:pt-6">
              <Button
                type="button"
                size="icon"
                onClick={() => { const tmp = fromCity; setFromCity(toCity); setToCity(tmp); }}
                className="rounded-full h-10 w-10 bg-white text-gray-800 shadow-none hover:bg-gray-800 hover:text-white"
                title={t('booking.swapCities')}
              >
                <ArrowLeftRight className="h-5 w-5" />
              </Button>
            </div>
            <div className="w-full sm:w-[200px]">
              <CitySelector
                label={t('booking.to')}
                selectedCity={toCity}
                setSelectedCity={setToCity}
                excludeCityIds={fromCity ? [fromCity.id] : []}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('booking.fullName')} <span className="text-gray-400 font-normal">{t('booking.optional')}</span>
            </label>
            <Input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border p-2 rounded" placeholder={t('booking.fullName')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('booking.email')} <span className="text-gray-400 font-normal">{t('booking.optional')}</span>
            </label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border p-2 rounded" placeholder="Email" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('booking.seats')} <span className="text-gray-400 font-normal">{t('booking.optional')}</span>
            </label>
            <Input type="number" min={1} max={10} value={seats} onChange={(e) => setSeats(Number(e.target.value))} className="w-full border p-2 rounded" />
          </div>

          <Button type="button" className="bg-chart-4 text-white cursor-pointer" onClick={handleSearch}>
            {t('booking.searchBtn')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
