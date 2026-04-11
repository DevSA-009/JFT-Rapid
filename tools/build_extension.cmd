@echo off
setlocal EnableDelayedExpansion

echo.
echo =====================================================
echo      JFT-Rapid CEP Extension Builder
echo      Running PowerShell script...
echo =====================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build_extension.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Build failed with error code %ERRORLEVEL%.
    pause
    exit /b 1
)

echo.
pause