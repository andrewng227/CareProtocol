@echo off
chcp 65001 >nul
title CareProtocol - Máy chủ Localhost & Ví Phantom
echo ======================================================================
echo    CAREPROTOCOL - HỆ THỐNG PHỤC HỒI CHỨC NĂNG & KẾT NỐI VÍ PHANTOM
echo ======================================================================
echo.
echo [1/2] Đang khởi chạy máy chủ cục bộ (Localhost)...
echo [2/2] Khi chạy trên localhost, ví Phantom sẽ tự động pop-up để kết nối!
echo.
echo Đang mở trình duyệt tại: http://localhost:3000/CareProtocol_GiaoDien.html
echo.
start "" "http://localhost:3000/CareProtocol_GiaoDien.html"
npx serve public -l 3000
pause
