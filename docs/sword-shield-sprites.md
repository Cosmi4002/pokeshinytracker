# Modelli shiny di Pokémon Spada e Scudo

I modelli non sono più dedotti dal numero del Pokédex. Ogni URL usato
nell'app deve comparire nel manifest generato dalla categoria ufficiale
[**Sword and Shield Shiny models**](https://archives.bulbagarden.net/wiki/Category:Sword_and_Shield_Shiny_models).
Questo impedisce di mostrare un modello base al posto di una forma regionale,
di una forma alternativa o della variante femminile.

## Rigenerazione del manifest

```bash
node scripts/generate-swsh-shiny-model-manifest.mjs
```

Lo script interroga tutte le pagine della categoria, conserva solo PNG, collega
ogni file al nome canonico del catalogo e scrive:

- `src/data/sword-shield-shiny-model-manifest.ts`, che è l'unica lista letta dal
  resolver a runtime;
- `reports/sword-shield-shiny-model-import.json`, con ogni file non interpretabile
  o non mappato.

Il comando termina con codice diverso da zero finché la lista `unparsed` o
`unmapped` non è vuota: il report è quindi la lista esplicita dei Pokémon/forme
che richiedono una mappatura, non un fallback silenzioso. I suffissi non
univoci del repository (per esempio `-G`) sono mantenuti nella tabella
`FORM_BY_SPECIES_AND_SUFFIX` nello script e vanno aggiunti lì dopo la verifica
nel category listing.

## Hosting gratuito

I file binari non vengono scaricati, duplicati in `public`, caricati in
Supabase Storage o passati da una funzione Vercel. Il browser chiede soltanto
il redirect stabile del file nell'archivio (`Special:Redirect/file/...`), mentre
l'app conserva un piccolo manifest di testo. Questo non aggiunge storage o
banda a Supabase e non crea invocazioni serverless Vercel.
