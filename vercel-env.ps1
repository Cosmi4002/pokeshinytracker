# Aggiunge le variabili Supabase da .env.local a Vercel (production)
# Esegui dalla cartella del progetto: .\vercel-env.ps1
# Richiede: npx vercel login e npx vercel link (se non gia fatto)

if (-not (Test-Path .env.local)) {
  Write-Host "File .env.local non trovato."
  exit 1
}

$content = Get-Content .env.local -Raw
if ($content -match 'VITE_SUPABASE_URL=(.+?)(?:\r?\n|$)') { $url = $Matches[1].Trim() } else { $url = $null }
if ($content -match 'VITE_SUPABASE_PUBLISHABLE_KEY=(.+?)(?:\r?\n|$)') { $key = $Matches[1].Trim() } else { $key = $null }

if ($url) {
  Write-Host "Aggiungo VITE_SUPABASE_URL..."
  $url | Out-File -FilePath .env.vercel.url -Encoding utf8NoBOM
  Get-Content .env.vercel.url -Raw | npx vercel env add VITE_SUPABASE_URL production
  Remove-Item .env.vercel.url -ErrorAction SilentlyContinue
}
if ($key) {
  Write-Host "Aggiungo VITE_SUPABASE_PUBLISHABLE_KEY..."
  $key | Out-File -FilePath .env.vercel.key -Encoding utf8NoBOM
  Get-Content .env.vercel.key -Raw | npx vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production
  Remove-Item .env.vercel.key -ErrorAction SilentlyContinue
}

Write-Host "Fatto. Redeploy: npx vercel --prod"
