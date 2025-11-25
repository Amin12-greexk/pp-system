@echo off
REM Clear Cache Script for Windows
REM Use this if you encounter caching issues during development

echo.
echo 🧹 Clearing Next.js cache...
echo.

REM Kill any running dev servers
echo 📛 Stopping dev servers...
taskkill /F /IM node.exe >nul 2>&1

REM Remove Next.js build cache
echo 🗑️  Removing .next directory...
if exist .next rmdir /s /q .next

REM Remove lock files if they exist
echo 🔓 Removing lock files...
if exist .next\dev\lock del /f /q .next\dev\lock >nul 2>&1

REM Clear node_modules\.cache if it exists
echo 🧼 Clearing node_modules cache...
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo.
echo ✅ Cache cleared successfully!
echo.
echo To restart development server, run:
echo   npm run dev
echo.
pause
