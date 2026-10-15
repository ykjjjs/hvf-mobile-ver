@echo off
rem Humphrey visual field practice: offline install (Chrome app window + desktop icon)
if not exist "%~dp0install.ps1" (
  echo [!] Extract ALL files from the zip first, then run install.bat again.
  pause
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
pause
