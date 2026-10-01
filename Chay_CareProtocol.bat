@echo off
title CareProtocol Local Server
cd /d "%~dp0"
echo ======================================================================
echo    CAREPROTOCOL - HE THONG PHUC HOI CHUC NANG (LOCAL SERVER)
echo ======================================================================
echo.
echo Dang khoi chay may chu Cuc bo (Localhost)...
echo.

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [Canh bao] Khong tim thay Node.js tren may. Dang mo truc tiep file HTML...
    start "" "%~dp0CareProtocol_GiaoDien.html"
    pause
    exit /b
)

node "%~dp0server.js"
pause
