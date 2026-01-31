@echo off
chcp 65001 >nul
echo ============================================
echo   PokeShinyTracker - Installazione e Deploy
echo ============================================
echo.

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERRORE: Node.js non è installato!
    echo.
    echo Fai così:
    echo 1. Vai su https://nodejs.org
    echo 2. Clicca sul pulsante verde "LTS"
    echo 3. Installa il file scaricato
    echo 4. CHIUDI e RIAPRI questo file
    echo.
    pause
    exit /b 1
)

echo [1/3] Installazione dipendenze...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Errore durante npm install
    pause
    exit /b 1
)

echo.
echo [2/3] Build del progetto...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Errore durante la build
    pause
    exit /b 1
)

echo.
echo [3/3] Deploy su Vercel...
echo.
echo Quando chiede il nome progetto, scrivi: pokeshinytracker
echo.
call npx vercel

echo.
echo Fatto!
pause
