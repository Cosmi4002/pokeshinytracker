$spritesDir = Join-Path $PSScriptRoot "..\public\sprites"
$jsonPath = Join-Path $PSScriptRoot "..\src\lib\sprite-mapping.json"

# Rename Files
$files = Get-ChildItem $spritesDir -Filter "Nidoran*.gif"
foreach ($f in $files) {
    if ($f.Length -eq 29760) {
        Rename-Item $f.FullName "29.gif" -Force
        Write-Host "Renamed Nidoran Female to 29.gif"
    }
    elseif ($f.Length -eq 32083) {
        Rename-Item $f.FullName "32.gif" -Force
        Write-Host "Renamed Nidoran Male to 32.gif"
    }
}

# Fix JSON
$jsonContent = Get-Content $jsonPath -Raw
if ($jsonContent) {
    # Simple replacement to avoid re-serializing issues (formatting)
    $jsonContent = $jsonContent.Replace('"29":  "1029.gif"', '"29":  "29.gif"')
    $jsonContent = $jsonContent.Replace('"32":  "1032.gif"', '"32":  "32.gif"')
    
    # Also handle standard formatting variants just in case
    $jsonContent = $jsonContent.Replace('"29": "1029.gif"', '"29": "29.gif"')
    $jsonContent = $jsonContent.Replace('"32": "1032.gif"', '"32": "32.gif"')

    $jsonContent | Set-Content $jsonPath
    Write-Host "Updated sprite-mapping.json"
}
