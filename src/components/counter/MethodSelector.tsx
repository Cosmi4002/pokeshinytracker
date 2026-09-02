import { useState, useMemo } from 'react';
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
import { findHuntingMethod, getGameGeneration, getHuntingMethodsForGame, HUNTING_METHODS, HuntingMethod } from '@/lib/pokemon-data';

interface MethodSelectorProps {
  value: string;
  onChange: (method: HuntingMethod) => void;
  currentOdds?: number;
  gameId?: string | null;
}

export function MethodSelector({ value, onChange, currentOdds, gameId }: MethodSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Group methods by generation
  const methodsByGen = useMemo(() => {
    return HUNTING_METHODS.reduce((acc, method) => {
      const gen = method.generation === 0 ? 'Custom' : `Generation ${method.generation}`;
      if (!acc[gen]) acc[gen] = [];
      acc[gen].push(method);
      return acc;
    }, {} as Record<string, HuntingMethod[]>);
  }, []);

  const selectedMethod = useMemo(() => {
    return findHuntingMethod(value);
  }, [value]);

  const filteredMethodsByGen = useMemo(() => {
    if (!searchTerm) return methodsByGen;
    const searchLower = searchTerm.toLowerCase();

    const filtered: Record<string, HuntingMethod[]> = {};
    Object.entries(methodsByGen).forEach(([gen, methods]) => {
      const matches = methods.filter(m =>
        m.name.toLowerCase().includes(searchLower) ||
        m.id.toLowerCase().includes(searchLower)
      );
      if (matches.length > 0) {
        filtered[gen] = matches;
      }
    });
    return filtered;
  }, [searchTerm, methodsByGen]);

  const displayedMethodsByGen = useMemo(() => {
    const suggestedGeneration = getGameGeneration(gameId);
    if (searchTerm || suggestedGeneration === null) return filteredMethodsByGen;

    const suggestedMethods = getHuntingMethodsForGame(gameId);
    if (suggestedMethods.length === 0) return filteredMethodsByGen;

    return {
      [`Recommended — Generation ${suggestedGeneration}`]: suggestedMethods,
      ...Object.fromEntries(
        Object.entries(filteredMethodsByGen)
          .filter(([generation]) => generation !== `Generation ${suggestedGeneration}`),
      ),
    };
  }, [filteredMethodsByGen, gameId, searchTerm]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12"
        >
          {selectedMethod ? (
            <span className="flex items-center justify-between w-full gap-2 pr-2">
              <span>{selectedMethod.name}</span>
              <span className="text-xs text-muted-foreground">
                1/{(currentOdds ?? selectedMethod.baseOdds).toLocaleString()}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">Select Method...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search method..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>No method found.</CommandEmpty>
            {Object.entries(displayedMethodsByGen).map(([gen, methods]) => (
              <CommandGroup key={gen} heading={gen}>
                {methods.map((method) => (
                  <CommandItem
                    key={method.id}
                    value={method.id}
                    onSelect={() => {
                      onChange(method);
                      setOpen(false);
                      setSearchTerm('');
                    }}
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <span>{method.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        1/{method.baseOdds.toLocaleString()}
                      </span>
                      <Check
                        className={cn(
                          "ml-2 h-4 w-4",
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
