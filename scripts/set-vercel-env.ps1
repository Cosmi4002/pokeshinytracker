# Legge .env.local e imposta VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY su Vercel (production + preview).
# Richiede: Vercel CLI (npx vercel) e progetto già linkato (vercel link).
# Esegui dalla root del progetto.

$ErrorActionPreference = "Stop"
# PSScriptRoot = cartella scripts; root = cartella progetto
$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env.local"

if (-not (Test-Path $envFile)) {
    Write-Host "ERRORE: File .env.local non trovato in $root" -ForegroundColor Red
    Write-Host "Crea .env.local con VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (o VITE_SUPABASE_PUBLISHABLE_KEY)" -ForegroundColor Yellow
    exit 1
}

function Get-EnvValue($name) {
    $line = Get-Content $envFile | Where-Object { $_ -match "^\s*$name\s*=" } | Select-Object -First 1
    if (-not $line) { return $null }
    $v = $line -replace "^\s*$name\s*=\s*", ""
    $v = $v.Trim().Trim('"').Trim("'")
    return $v
}

$url = Get-EnvValue "VITE_SUPABASE_URL"
$key = Get-EnvValue "VITE_SUPABASE_ANON_KEY"
if (-not $key) { $key = Get-EnvValue "VITE_SUPABASE_PUBLISHABLE_KEY" }

if (-not $url -or -not $key) {
    Write-Host "ERRORE: In .env.local servono VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (o VITE_SUPABASE_PUBLISHABLE_KEY)" -ForegroundColor Red
    exit 1
}

Push-Location $root
try {
    Write-Host "Impostazione variabili su Vercel (production e preview)..." -ForegroundColor Cyan
    $url | npx vercel env add VITE_SUPABASE_URL production
    $url | npx vercel env add VITE_SUPABASE_URL preview
    $key | npx vercel env add VITE_SUPABASE_ANON_KEY production
    $key | npx vercel env add VITE_SUPABASE_ANON_KEY preview
    Write-Host ""
    Write-Host "Variabili impostate. Ora fai un Redeploy da Vercel:" -ForegroundColor Green
    Write-Host "  Vercel -> Deployments -> ... -> Redeploy" -ForegroundColor White
} finally {
    Pop-Location
}
