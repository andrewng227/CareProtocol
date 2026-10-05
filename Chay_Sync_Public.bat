@echo off
rem ============================================================
rem  CareProtocol - Dong bo 3 ban copy (Nguon duy nhat: goc repo)
rem  Chay: node sync_public.cjs  hoac  Chay_Sync_Public.bat
rem  - CareProtocol_GiaoDien.html -> public/CareProtocol_GiaoDien.html + public/index.html
rem  - CareProtocol_DonGian.html  -> public/CareProtocol_DonGian.html
rem  - CareProtocol_Hopita.html   -> public/CareProtocol_Hopita.html
rem  - google_female_voice_pack.js -> public/google_female_voice_pack.js
rem  - logo.png                   -> public/logo.png
rem ============================================================
node "%~dp0sync_public.cjs"
pause
