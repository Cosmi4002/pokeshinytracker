@echo off
chcp 65001 >nul
cd /d "%~dp0.."
echo ============================================
echo   Configura Supabase su Vercel
echo ============================================
echo.
echo Legge .env.local e imposta le variabili sul progetto Vercel.
echo Devi aver già linkato il progetto: npx vercel link
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0set-vercel-env.ps1"
echo.
pause
