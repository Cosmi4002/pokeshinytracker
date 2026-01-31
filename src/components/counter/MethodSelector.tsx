import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useState } from 'react';
import { HUNTING_METHODS, HuntingMethod } from '@/lib/pokemon-data';

interface MethodSelectorProps {
  value: string;
  onChange: (method: HuntingMethod) => void;
}

export function MethodSelector({ value, onChange }: MethodSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedMethod = HUNTING_METHODS.find(m => m.id === value);

  // Group methods by generation
  const methodsByGen = HUNTING_METHODS.reduce((acc, method) => {
    const gen = method.generation === 0 ? 'Custom' : `Generation ${method.generation}`;
    if (!acc[gen]) acc[gen] = [];
    acc[gen].push(method);
    return acc;
  }, {} as Record<string, HuntingMethod[]>);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12"
        >
          {selectedMethod ? (
            <span className="truncate">{selectedMethod.name}</span>
          ) : (
            <span className="text-muted-foreground">Select Method...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search method..." />
          <CommandList>
            <CommandEmpty>No method found.</CommandEmpty>
            {Object.entries(methodsByGen).map(([gen, methods]) => (
              <CommandGroup key={gen} heading={gen}>
                {methods.map((method) => (
                  <CommandItem
                    key={method.id}
                    value={method.name}
                    onSelect={() => {
                      onChange(method);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between"
                  >
                    <span className="truncate">{method.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        1/{method.baseOdds}
                      </span>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value === method.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
