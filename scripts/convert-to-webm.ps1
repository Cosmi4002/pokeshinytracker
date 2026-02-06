# Convert all GIF sprites to WebM format
# This script converts all .gif files in public/sprites to .webm using FFmpeg

$spritesDir = Join-Path $PSScriptRoot "..\public\sprites"
$ffmpegPath = Join-Path $PSScriptRoot "..\tools\ffmpeg-8.0.1-essentials_build\bin\ffmpeg.exe"

# Check if FFmpeg exists
if (-not (Test-Path $ffmpegPath)) {
    Write-Host "FFmpeg not found at: $ffmpegPath" -ForegroundColor Red
    Write-Host "Please ensure FFmpeg is installed in the tools directory." -ForegroundColor Yellow
    exit 1
}

$gifFiles = Get-ChildItem -Path $spritesDir -Filter "*.gif"
$total = $gifFiles.Count
$current = 0
$succeeded = 0
$failed = 0

Write-Host "Found $total GIF files to convert" -ForegroundColor Green
Write-Host "Using FFmpeg: $ffmpegPath" -ForegroundColor Cyan
Write-Host "Starting conversion..." -ForegroundColor Yellow
Write-Host ""

foreach ($gif in $gifFiles) {
    $current++
    $webmFile = $gif.FullName -replace '\.gif$', '.webm'
    
    Write-Host "[$current/$total] Converting: $($gif.Name)" -ForegroundColor Cyan
    
    # FFmpeg command optimized for small animated sprites
    # -c:v libvpx-vp9: VP9 codec for better compression
    # -b:v 0: Use quality-based encoding
    # -crf 30: Quality level (lower = better, 15-35 recommended)
    # -pix_fmt yuva420p: Pixel format with alpha channel support
    & $ffmpegPath -i $gif.FullName -c:v libvpx-vp9 -b:v 0 -crf 30 -pix_fmt yuva420p -an $webmFile -y -loglevel error
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Success" -ForegroundColor Green
        $succeeded++
    }
    else {
        Write-Host "  [FAIL] Failed" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "Conversion completed!" -ForegroundColor Green
Write-Host "Succeeded: $succeeded" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host "Total: $total" -ForegroundColor Yellow
