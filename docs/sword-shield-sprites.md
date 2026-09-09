# Modelli shiny di Pokémon Spada e Scudo senza costi aggiuntivi

## Decisione adottata

I modelli shiny base di **Pokémon Spada** e **Pokémon Scudo** vengono richiesti
direttamente dal redirect del Bulbagarden Archives. Non vengono scaricati nella
repository, caricati in Supabase Storage, né passano dall'API `/api/game-sprite`.

Questa è la scelta più adatta al piano gratuito:

- non aumenta i circa 523 MB di asset già presenti nella cartella `public`;
- non consuma spazio o banda di Supabase;
- non crea invocazioni serverless o banda di immagini su Vercel: il browser
  dell'utente scarica il modello dall'archivio sorgente;
- non richiede elaborazione sul PC durante deploy o build.

Il resolver costruisce URL come
`https://archives.bulbagarden.net/wiki/Special:Redirect/file/Spr_8s_001_s.png`.
Il redirect è preferibile a un URL `media/upload/...` con hash: l'hash può
cambiare quando il file viene aggiornato, mentre il nome del file resta stabile.

## Limite intenzionale: forme

Il fallback automatico copre solo i Pokémon in forma base. Forme di Galar,
Gigamax e altre forme non vengono sostituite con un modello base sbagliato.
Se servono, aggiungere solo le forme necessarie a un manifest esplicito con il
loro esatto nome file di Bulbagarden. Questa aggiunta è minuscola perché contiene
testo, non asset binari.

## Quando scaricarli davvero

Non scaricare tutta la categoria come prima soluzione. Farlo conviene soltanto
se il sito deve funzionare anche quando Bulbagarden non è raggiungibile oppure
se l'archivio impedisce il caricamento diretto. In quel caso:

1. prova prima con un piccolo gruppo di modelli realmente usati;
2. converti ciascun file in WebP e conserva una sola dimensione ragionevole;
3. misura il totale con `du -sh public` prima del commit;
4. evita Supabase Storage per asset pubblici: introdurrebbe quote e una seconda
   infrastruttura da mantenere.

Non implementare una cache "al primo accesso" su Vercel: il filesystem delle
funzioni è effimero, quindi non offrirebbe una cache persistente gratuita.
