# 🌐 Come mettere PokeShinyTracker online

Guida per pubblicare **PokeShinyTracker** su Vercel (gratuito).

---

## Prerequisiti

- **Node.js** installato: https://nodejs.org (versione LTS)
- **Account Vercel**: https://vercel.com (puoi accedere con GitHub)

---

## Metodo 1 — Deploy veloce con Vercel CLI

### Passo 1: Apri il terminale nella cartella del progetto

```powershell
cd "C:\Users\cc\Downloads\Telegram Desktop\shinytrack-complete\shinytrack-complete"
```

### Passo 2: Installa le dipendenze (se non l'hai già fatto)

```powershell
npm install
```

### Passo 3: Deploy

```powershell
npx vercel
```

### Passo 4: Rispondi alle domande

- **Set up and deploy?** → `Y`
- **Which scope?** → scegli il tuo account
- **Link to existing project?** → `N`
- **What's your project's name?** → `pokeshinytracker` (oppure premi Invio)
- **In which directory is your code located?** → premi Invio

Al termine vedrai un URL tipo: `https://pokeshinytracker-xxx.vercel.app`

---

## Metodo 2 — Deploy con GitHub (consigliato per aggiornamenti)

### Passo 1: Crea un repository su GitHub

1. Vai su https://github.com
2. Clicca **+** → **New repository**
3. Nome: `pokeshinytracker`
4. Imposta **Public**
5. Non selezionare "Add a README"
6. Clicca **Create repository**

### Passo 2: Carica il progetto

Nel terminale, dalla cartella del progetto:

```powershell
cd "C:\Users\cc\Downloads\Telegram Desktop\shinytrack-complete\shinytrack-complete"

git init
git add .
git commit -m "PokeShinyTracker - primo deploy"
git branch -M main
git remote add origin https://github.com/TUO_USERNAME/pokeshinytracker.git
git push -u origin main
```

Sostituisci `TUO_USERNAME` con il tuo username GitHub.

### Passo 3: Collega a Vercel

1. Vai su https://vercel.com e accedi (anche con GitHub)
2. Clicca **Add New** → **Project**
3. Seleziona **pokeshinytracker**
4. Clicca **Import**
5. Clicca **Deploy**

Dopo 1–2 minuti il sito sarà online su `https://pokeshinytracker.vercel.app`

---

## Aggiornare il sito (solo con Metodo 2)

Dopo aver modificato il codice:

```powershell
git add .
git commit -m "Descrizione delle modifiche"
git push
```

Vercel farà automaticamente un nuovo deploy.

---

## Troubleshooting

### "npm non riconosciuto"
Installa Node.js da https://nodejs.org e riavvia il terminale.

### Errore 404 (NOT_FOUND) su alcune pagine
Il progetto ha già `vercel.json` con le regole corrette per le SPA. Se hai copiato il progetto senza quel file, assicurati che `vercel.json` contenga i `rewrites` verso `index.html`.

### Build fallita
Esegui in locale `npm run build` per vedere eventuali errori e correggerli prima del deploy.

---

**Buona caccia agli shiny!** ✨🎮
