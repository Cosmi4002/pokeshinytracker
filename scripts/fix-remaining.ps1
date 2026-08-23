$spritesDir = Join-Path $PSScriptRoot "..\public\sprites"
$fixGen = Join-Path $PSScriptRoot "..\public\fixgen123"
$jsonPath = Join-Path $PSScriptRoot "..\src\lib\sprite-mapping.json"

if (Test-Path $fixGen) {
    # Nidoran
    $nidos = Get-ChildItem $fixGen -Filter "Nidoran*.gif"
    foreach ($nido in $nidos) {
        $name = $nido.Name
        if ($name.Contains("♀")) {
            $dest = Join-Path $spritesDir "29.gif"
            Copy-Item -Path $nido.FullName -Destination $dest -Force
            Write-Host "Fixed Nidoran F"
        }
        if ($name.Contains("♂")) {
            $dest = Join-Path $spritesDir "32.gif"
            Copy-Item -Path $nido.FullName -Destination $dest -Force
            Write-Host "Fixed Nidoran M"
        }
    }

    # Pikachu
    $pikaPath = Join-Path $fixGen "pikachu-partnercap.gif"
    if (Test-Path $pikaPath) {
        $dest = Join-Path $spritesDir "25-partnercap.gif"
        Copy-Item -Path $pikaPath -Destination $dest -Force
        
        $json = Get-Content $jsonPath -Raw | ConvertFrom-Json
        if (-not $json."25-partnercap") {
            $json | Add-Member -Type NoteProperty -Name "25-partnercap" -Value "25-partnercap.gif" -Force
            $json | ConvertTo-Json -Depth 10 | Set-Content $jsonPath
            Write-Host "Added Pikachu Partner Cap to JSON"
        }
    }

    Remove-Item $fixGen -Recurse -Force
    Write-Host "Removed fixgen123 folder"
}
else {
    Write-Host "Directory fixgen123 not found"
}
