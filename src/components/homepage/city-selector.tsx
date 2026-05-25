'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/LanguageContext';

type City = {
  id: number;
  name: string;
};

export default function CitySelector({
  label,
  selectedCity,
  setSelectedCity,
  excludeCityIds = [],
}: {
  label: string;
  selectedCity: City | null;
  setSelectedCity: (city: City) => void;
  excludeCityIds?: number[];
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);

  const filteredCities = cities.filter(
    (city) => !excludeCityIds.includes(city.id)
  );

  useEffect(() => {
    const fetchCities = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/cities');
        const data = await res.json();
        setCities(data);
      } catch (error) {
        console.error('Error fetching cities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="flex justify-between items-center border p-2 rounded w-full max-w-[180px]"
          >
            <span
              title={selectedCity?.name}
              className="overflow-hidden whitespace-nowrap text-ellipsis max-w-[140px] inline-block"
            >
              {selectedCity?.name || t('citySelector.placeholder')}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 max-h-60 overflow-y-auto">
          <Command>
            <CommandInput placeholder={t('citySelector.search')} />

            {loading ? (
              <div className="p-4 text-sm text-muted-foreground">
                {t('citySelector.loading')}
              </div>
            ) : cities.length === 0 ? (
              <CommandEmpty>{t('citySelector.notFound')}</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredCities.map((city) => (
                  <CommandItem
                    key={city.id}
                    value={city.name}
                    onSelect={() => {
                      setSelectedCity(city);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedCity?.id === city.id
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    {city.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
