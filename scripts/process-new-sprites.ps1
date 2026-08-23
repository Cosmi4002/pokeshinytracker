# Process new sprites from fixgen123 folder
# Maps filenames to Pokemon IDs and handles variants

$fixGenDir = Join-Path $PSScriptRoot "..\public\fixgen123"
$spritesDir = Join-Path $PSScriptRoot "..\public\sprites"
$pokedexFile = Join-Path $PSScriptRoot "..\src\lib\raw-pokedex.json"
$mappingFile = Join-Path $PSScriptRoot "..\src\lib\sprite-mapping.json"

# Load Pokedex for ID mapping
$pokedexData = Get-Content $pokedexFile -Raw | ConvertFrom-Json
$nameToId = @{}

# Build lookup table (Name -> ID)
foreach ($mon in $pokedexData) {
    if ($mon.name.english) {
        $name = $mon.name.english.ToLower()
        $nameToId[$name] = $mon.id
        
        # Handle special cases
        if ($name -eq "nidoran♀") { $nameToId["nidoran-f"] = $mon.id }
        if ($name -eq "nidoran♂") { $nameToId["nidoran-m"] = $mon.id }
    }
}

# Manual fixes/additions
$nameToId["galarian mr mime"] = 122 # Mr. Mime Galarian form usually shares ID but treated as form? 
# Wait, Mr. Mime is 122. Galarian is usually 122-galar.
# Let's handle specific filenames seen in the directory list.

# Load existing mapping
if (Test-Path $mappingFile) {
    $mapping = Get-Content $mappingFile -Raw | ConvertFrom-Json
}
else {
    $mapping = @{}
}

$files = Get-ChildItem -Path $fixGenDir -Filter "*.gif"
$count = 0

Write-Host "Processing $($files.Count) files..." -ForegroundColor Cyan

foreach ($file in $files) {
    $originalName = $file.BaseName.ToLower() # e.g. "bulbasaur", "aipom-f", "unown a"
    $extension = $file.Extension
    
    $targetKey = $null
    $targetFilename = $null
    
    # 1. Check for -f suffix (Female)
    $isFemale = $originalName.EndsWith("-f")
    $cleanName = if ($isFemale) { $originalName.Substring(0, $originalName.Length - 2) } else { $originalName }
    
    # 2. Check for Unown forms (e.g. "unown a", "unown-a")
    if ($originalName -match "^unown[ -](.+)$") {
        $form = $matches[1].Replace(" ", "").ToLower()
        $monId = 201
        $targetKey = "201-$form"
        $targetFilename = "201-$form$extension"
    }
    # 3. Check for specific variants seen in file list
    elseif ($originalName -eq "galarian mr mime") {
        # 122 is Mr. Mime. Galarian is form.
        $targetKey = "122-galarian" 
        $targetFilename = "122-galarian$extension"
    }
    elseif ($originalName -eq "mr mime") {
        $targetKey = "122"
        $targetFilename = "122$extension"
    }
    # 4. Standard Name lookup
    elseif ($nameToId.ContainsKey($cleanName)) {
        $id = $nameToId[$cleanName]
        
        if ($isFemale) {
            $targetKey = "$id-f"
            $targetFilename = "$id-f$extension"
        }
        else {
            $targetKey = "$id"
            $targetFilename = "$id$extension"
        }
    }
    # 5. Handle Nidoran special chars explicitly if filesystem has them
    elseif ($originalName -eq "nidoran♀") {
        $targetKey = "29"
        $targetFilename = "29$extension"
    }
    elseif ($originalName -eq "nidoran♂") {
        $targetKey = "32"
        $targetFilename = "32$extension"
    }
    # 6. Fallback/Failure
    else {
        Write-Host "  [SKIP] Could not map '$originalName'" -ForegroundColor Yellow
        continue
    }
    
    if ($targetKey -and $targetFilename) {
        # Update mapping
        $mapping | Add-Member -Type NoteProperty -Name $targetKey -Value $targetFilename -Force
        
        # Copy/Move file
        $destPath = Join-Path $spritesDir $targetFilename
        Copy-Item -Path $file.FullName -Destination $destPath -Force
        
        Write-Host "  [OK] $originalName -> $targetFilename" -ForegroundColor Green
        $count++
    }
}

# Save new mapping
$mapping | ConvertTo-Json -Depth 10 | Set-Content $mappingFile

Write-Host "Processed $count sprites." -ForegroundColor Green
