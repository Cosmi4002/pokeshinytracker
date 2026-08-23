# IMPORTANTE: Converti GIF a WebM

Questo progetto richiede FFmpeg per convertire i file GIF in WebM.

## Opzione 1: Installa FFmpeg (Consigliato)

1. Scarica FFmpeg da: https://www.gyan.dev/ffmpeg/builds/
2. Estrai il file ZIP
3. Aggiungi la cartella `bin` al PATH di Windows
4. Riavvia PowerShell
5. Esegui: `.\scripts\convert-to-webm.ps1`

## Opzione 2: Conversione Online

Usa un servizio online come:
- https://cloudconvert.com/gif-to-webm
- Carica tutti i file GIF dalla cartella `public/sprites`
- Scarica i file WebM convertiti
- Sostituisci i file GIF con i file WebM

## Opzione 3: Usa un altro tool

Puoi usare qualsiasi tool di conversione video che supporti:
- Input: GIF animato
- Output: WebM (codec VP9 o VP8)
- Trasparenza alpha (importante per gli sprite Pokemon)

## Dopo la conversione

Una volta che hai i file WebM, devi aggiornare il codice:

1. Modifica `src/lib/sprite-mapping.json`: cambia tutte le estensioni da `.gif` a `.webm`
2. Modifica `src/lib/pokemon-data.ts`: aggiorna la funzione `getPokemonSpriteUrl()`
3. Modifica `src/pages/SpriteMapper.tsx`: cambia il filtro da `.gif` a `.webm`

---

**NOTA**: Se preferisci, posso procedere ad aggiornare il codice per usare `.webm` ADESSO, e tu poi converti manualmente i file GIF in WebM usando uno dei metodi sopra.
