import { useState, useMemo, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
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
import { getArchiveShinySpriteUrl, handlePokemonSpriteError, toLocalPokemonSpriteUrl } from '@/lib/pokemon-data';

interface PokemonSelectorProps {
  value: number | null;
  valueName?: string;
  onChange: (pokemonId: number | null, pokemonName: string, pokemonBaseId?: number) => void;
}

const MAX_RESULTS_EMPTY_SEARCH = 120;
const MAX_RESULTS_WITH_SEARCH = 200;

export function PokemonSelector({ value, valueName, onChange }: PokemonSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isXboxBrowser, setIsXboxBrowser] = useState(false);
  const { pokemon, loading } = usePokemonList();

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(max-width: 640px)');
    const handleChange = () => setIsSmallScreen(mediaQuery.matches);
    handleChange();
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const ua = navigator.userAgent || '';
    setIsXboxBrowser(/xbox/i.test(ua));
  }, []);

  const selectedPokemon = useMemo(() => {
    if (value === null) return undefined;
    if (valueName) {
      const exact = pokemon.find((p) => p.name === valueName && (p.id === value || p.baseId === value));
      if (exact) return exact;
    }
    return pokemon.find((p) => p.id === value);
  }, [pokemon, value, valueName]);

  const searchablePokemon = useMemo(() => {
    return pokemon.map((p) => ({
      ...p,
      nameLower: (p.name || '').toLowerCase(),
      displayLower: (p.displayName || '').toLowerCase(),
      idText: String(p.id),
      baseIdText: String(p.baseId),
    }));
  }, [pokemon]);

  const { filteredPokemon, totalMatches } = useMemo(() => {
    const searchLower = (searchTerm || '').trim().toLowerCase();
    const maxResults = searchLower ? MAX_RESULTS_WITH_SEARCH : MAX_RESULTS_EMPTY_SEARCH;

    const matches = searchLower
      ? searchablePokemon.filter((p) =>
          p.nameLower.includes(searchLower) ||
          p.displayLower.includes(searchLower) ||
          p.idText.includes(searchLower) ||
          p.baseIdText.includes(searchLower)
        )
      : searchablePokemon;

    return {
      filteredPokemon: matches.slice(0, maxResults),
      totalMatches: matches.length,
    };
  }, [searchablePokemon, searchTerm]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
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
                key={getArchiveShinySpriteUrl(selectedPokemon.id, { shiny: true, name: selectedPokemon.name, form: selectedPokemon.name }) || getPokemonSpriteUrl(selectedPokemon.id, { shiny: true, name: selectedPokemon.name })}
                src={toLocalPokemonSpriteUrl(getArchiveShinySpriteUrl(selectedPokemon.id, { shiny: true, name: selectedPokemon.name, form: selectedPokemon.name }) || getPokemonSpriteUrl(selectedPokemon.id, { shiny: true, name: selectedPokemon.name }))}
                alt={selectedPokemon.displayName}
                className="h-8 w-8 pokemon-sprite object-contain"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  handlePokemonSpriteError(e.currentTarget);
                }}
              />
              <span>#{selectedPokemon.baseId.toString().padStart(4, '0')} {selectedPokemon.displayName}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">Select Pokemon...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(var(--radix-popover-trigger-width),calc(100vw-2rem))] max-w-[calc(100vw-2rem)] max-h-[min(var(--radix-popper-available-height),calc(100dvh-2rem))] overflow-hidden p-0"
        align="start"
        side={isSmallScreen ? 'top' : 'bottom'}
        sideOffset={isSmallScreen ? 4 : 6}
        collisionPadding={16}
        sticky="always"
        avoidCollisions
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search Pokemon..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList
            className="max-h-[min(320px,50dvh)] overflow-y-auto overscroll-contain touch-pan-y"
            style={{ WebkitOverflowScrolling: 'touch' }}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {loading && <div className="p-4 text-sm text-center text-muted-foreground">Loading...</div>}
            {!loading && filteredPokemon.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">No Pokemon found.</div>
            )}
            {!loading && filteredPokemon.length > 0 && totalMatches > filteredPokemon.length && (
              <div className="px-3 py-2 text-xs text-muted-foreground border-b">
                Showing first {filteredPokemon.length} of {totalMatches} results. Keep typing to narrow down.
              </div>
            )}
            <CommandGroup>
              {filteredPokemon.map((p) => (
                <CommandItem
                  key={`${p.id}-${p.name}`}
                  value={`${p.id}-${p.name}`}
                  onSelect={() => {
                    onChange(p.id, p.name, p.baseId);
                    setOpen(false);
                    setSearchTerm('');
                  }}
                  className="flex items-center gap-2"
                >
                  {!isXboxBrowser && (
                    <img
                      key={getArchiveShinySpriteUrl(p.id, { shiny: true, name: p.name, form: p.name }) || getPokemonSpriteUrl(p.id, { shiny: true, name: p.name })}
                      src={toLocalPokemonSpriteUrl(getArchiveShinySpriteUrl(p.id, { shiny: true, name: p.name, form: p.name }) || getPokemonSpriteUrl(p.id, { shiny: true, name: p.name }))}
                      alt={p.displayName}
                      className="h-8 w-8 pokemon-sprite object-contain"
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        handlePokemonSpriteError(e.currentTarget);
                      }}
                    />
                  )}
                  <span>#{p.baseId.toString().padStart(4, '0')} {p.displayName}</span>
                  <Check
                    className={cn(
                      'ml-auto h-4 w-4',
                      (valueName ? valueName === p.name : value === p.id) ? 'opacity-100' : 'opacity-0'
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
