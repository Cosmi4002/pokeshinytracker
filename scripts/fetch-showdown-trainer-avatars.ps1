param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string[]]$Names
)

$ErrorActionPreference = "Stop"

$baseUrl = "https://play.pokemonshowdown.com/sprites/trainers"
$outDir = Join-Path $PSScriptRoot "..\\public\\img\\trainers"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

foreach ($name in $Names) {
  $clean = $name.Trim().ToLower()
  if (-not $clean) { continue }

  $url = "$baseUrl/$clean.png"
  $dest = Join-Path $outDir "$clean.png"

  Write-Host "Downloading $url -> $dest"
  Invoke-WebRequest -Uri $url -OutFile $dest
}

Write-Host "Done."

