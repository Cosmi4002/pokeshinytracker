# Evolution Feature Enhancement Plan

## Current State Analysis
- In Collection.tsx, the evolve button (ArrowUpCircle) incorrectly opens EditShinyDialog instead of EvolveDialog
- Evolution data from pokemondb.net already exists in evolution-data.ts
- Pokedex page has a function updateCaughtDataForEvolution but it's not being used

## Tasks to Complete

### 1. Fix Collection.tsx - Connect evolve button to EvolveDialog
- [x] Add state for tracking evolve dialog: `isEvolveDialogOpen`
- [x] Add state for tracking current entry for evolution: `evolveEntry`
- [x] Import EvolveDialog component
- [x] Change onEvolve handler to set evolveEntry and open EvolveDialog
- [x] Add EvolveDialog component to the render

### 2. Enhance EvolveDialog (Optional - if current implementation works)
- [x] Review current implementation
- [x] Make any UI improvements if needed

### 3. Add Pokedex Highlighting for Evolved Pokemon
- [x] Track evolved Pokemon in the app state
- [x] Pass evolved Pokemon IDs to PokedexCard components
- [x] Add golden glow effect to PokedexCard for evolved Pokemon
- [x] Use evolution-data.ts to find related Pokemon (prev evolutions) to highlight

### 4. Test the complete flow
- [ ] Test evolution from Collection page
- [ ] Verify Pokedex highlighting works after evolution

## Implementation Notes
- The evolution-data.ts already has all required data from pokemondb.net
- Golden glow effect should be similar to the stars shown on evolved ShinyCards
- Need to highlight pre-evolution forms in Pokedex (the Pokemon that was evolved FROM)
