import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
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
import { usePokemonList, getPokemonSpriteUrl } from '@/hooks/use-pokemon';

interface PokemonSelectorProps {
  value: number | null;
  onChange: (pokemonId: number | null, pokemonName: string) => void;
}

export function PokemonSelector({ value, onChange }: PokemonSelectorProps) {
  const [open, setOpen] = useState(false);
  const { pokemon, loading } = usePokemonList();

  const selectedPokemon = useMemo(() => {
    return pokemon.find(p => p.id === value);
  }, [pokemon, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12"
        >
          {selectedPokemon ? (
            <div className="flex items-center gap-2">
              <img
                src={getPokemonSpriteUrl(selectedPokemon.id, { shiny: true, name: selectedPokemon.name })}
                alt={selectedPokemon.displayName}
                className="h-8 w-8 pokemon-sprite object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
              <span>#{selectedPokemon.baseId.toString().padStart(4, '0')} {selectedPokemon.displayName}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">Select Pokémon...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandInput placeholder="Search Pokémon..." />
          <CommandList className="max-h-[50vh] overflow-y-auto overscroll-contain touch-pan-y">
            <CommandEmpty>
              {loading ? 'Loading...' : 'No Pokémon found.'}
            </CommandEmpty>
            <CommandGroup>
              {pokemon.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.id} ${p.name} ${p.displayName}`}
                  onSelect={() => {
                    onChange(p.id, p.name);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <img
                    src={getPokemonSpriteUrl(p.id, { shiny: true, name: p.name })}
                    alt={p.displayName}
                    className="h-8 w-8 pokemon-sprite object-contain"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                  <span>#{p.baseId.toString().padStart(4, '0')} {p.displayName}</span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === p.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
