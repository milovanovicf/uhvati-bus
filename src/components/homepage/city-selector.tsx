'use client';

import * as React from 'react';
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
import { useState } from 'react';

type City = {
  id: number;
  name: string;
};

export default function CitySelector({
  label,
  selectedCity,
  setSelectedCity,
}: {
  label: string;
  selectedCity: City | null;
  setSelectedCity: (city: City) => void;
}) {
  const [open, setOpen] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCities = async () => {
    if (cities.length > 0) return;
    setLoading(true);
    const res = await fetch('/api/cities');
    const data = await res.json();
    setCities(data);
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="justify-between border p-2 rounded"
            onClick={loadCities}
          >
            {selectedCity?.name || `Izaberi grad`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 max-h-60 overflow-y-auto">
          <Command>
            <CommandInput placeholder="Pretrazi grad..." />
            <CommandEmpty>Grad nije pronadjen.</CommandEmpty>
            <CommandGroup>
              {cities.map((city) => (
                <CommandItem
                  key={city.id}
                  value={city.name}
                  onSelect={(value) => {
                    setSelectedCity(city);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedCity === city ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {city.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
