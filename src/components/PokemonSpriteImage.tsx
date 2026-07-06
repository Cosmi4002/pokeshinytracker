import React, { useState, useMemo } from 'react';
import { getSpriteFallbackChain } from '@/lib/sprite-fallback';

interface PokemonSpriteImageProps {
  pokemonId: number;
  name?: string;
  shiny?: boolean;
  female?: boolean;
  form?: string;
  alt?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

/**
 * Reusable Pokemon sprite image component with built-in fallback chain
 * Automatically tries multiple sprite sources on error
 */
export const PokemonSpriteImage = React.forwardRef<
  HTMLImageElement,
  PokemonSpriteImageProps
>(
  (
    {
      pokemonId,
      name = '',
      shiny = false,
      female = false,
      form = '',
      alt = `Pokemon ${pokemonId}`,
      className = '',
      loading = 'lazy',
      onError: onErrorProp,
    },
    ref
  ) => {
    const fallbackUrls = useMemo(
      () =>
        getSpriteFallbackChain(pokemonId, {
          shiny,
          female,
          name,
          form,
        }),
      [pokemonId, shiny, female, name, form]
    );

    const [currentUrlIndex, setCurrentUrlIndex] = useState(0);

    const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
      setCurrentUrlIndex((prev) => Math.min(prev + 1, fallbackUrls.length - 1));
      if (currentUrlIndex < fallbackUrls.length - 1) {
        // Trigger retry with next URL
        const img = e.currentTarget as HTMLImageElement;
        img.src = fallbackUrls[currentUrlIndex + 1];
      }
      onErrorProp?.(e);
    };

    return (
      <img
        ref={ref}
        src={fallbackUrls[currentUrlIndex]}
        alt={alt}
        className={className}
        loading={loading}
        decoding="async"
        onError={handleError}
      />
    );
  }
);

PokemonSpriteImage.displayName = 'PokemonSpriteImage';
