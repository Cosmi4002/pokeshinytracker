# Bingo Games Integration TODO

## Status: [ ] 0/10 Complete

1. [x] Add types BingoCell union, GameCell in Bingo.tsx
2. [x] Hardcode GAMES array in Bingo.tsx from game-themes data (id:20000+i, name, gen, logo)
3. [x] Add UI: includeGames boolean toggle, gameRatio slider (0.1 default)
4. [x] Implement seededShuffle function (mulberry32 seed)
5. [x] Update generateGrid(): filter games, sample ratio, concat pools, seeded shuffle, set gridSeed: Date.now()
6. [ ] Update applyBoardState: regenerate grid from gens+seed if gridSeed present
7. [x] Update cell render: check 'logo' ? game img+name : pokemon sprite+name
8. [x] Change marked: Set<number> indices (0-24)
9. [x] Update interactions: toggleMark(index), replaceCell(index), picker on index
10. [x] Update save/sync: store {..., gridSeed, markedPositions: Array.from(marked), drop gridIds?} - handle Supabase error gracefully
11. [x] Test: generate, mark, replace, regenerate same seed, mix ~20% games
12. [ ] Polish picker for games (select game by index/name)

