@echo off
title CareProtocol Local Server
cd /d "%~dp0"
echo ======================================================================
echo    CAREPROTOCOL - HE THONG PHUC HOI CHUC NANG (LOCAL SERVER)
echo ======================================================================
echo.
echo Dang khoi chay may chu Cuc bo (Localhost)...
echo.

set "NODE_CMD=node"
where node >nul 2>&1
if %errorlevel% neq 0 (
    if exist "%LOCALAPPDATA%\hermes\node\node.exe" (
        set "NODE_CMD=%LOCALAPPDATA%\hermes\node\node.exe"
    )
)

"%NODE_CMD%" -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [CANH BAO] Khong tim thay Node.js tren may.
    echo.
    echo Camera, vi Phantom va Tro ly AI Chat can chay qua localhost de hoat dong day du.
    echo Cach khac phuc:
    echo   1. Tai va cai Node.js tai: https://nodejs.org
    echo   2. Chay lai file .bat nay sau khi cai xong.
    echo.
    echo Trong luc cho, ban van co the mo file HTML truc tiep:
    start "" "%~dp0CareProtocol_GiaoDien.html"
    pause
    exit /b
)

"%NODE_CMD%" "%~dp0server.js"
pause
