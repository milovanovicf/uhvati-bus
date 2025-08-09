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

const cities = [
  'Beograd',
  'Novi Sad',
  'Niš',
  'Subotica',
  'Kragujevac',
  'Zrenjanin',
  'Čačak',
  'Leskovac',
  'Krusevac',
];

export default function CitySelector({
  label,
  selectedCity,
  setSelectedCity,
}: {
  label: string;
  selectedCity: string | null;
  setSelectedCity: (city: string) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="justify-between border p-2 rounded"
          >
            {selectedCity || `Izaberi grad`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0">
          <Command>
            <CommandInput placeholder="Pretrazi grad..." />
            <CommandEmpty>Grad nije pronadjen.</CommandEmpty>
            <CommandGroup>
              {cities.map((city) => (
                <CommandItem
                  key={city}
                  value={city}
                  onSelect={(value) => {
                    setSelectedCity(value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedCity === city ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {city}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
