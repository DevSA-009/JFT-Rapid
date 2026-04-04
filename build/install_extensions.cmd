@echo off
:: run_as_admin.cmd
:: Bypasses PowerShell execution policy and runs install_extensions.ps1
:: Automatically re-launches itself with Administrator privileges if needed

:: ── Check for admin rights ───────────────────────────────────────────────────
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo Requesting Administrator privileges...
    powershell -NoProfile -Command ^
        "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

:: ── Run the PowerShell script with execution policy bypass ──────────────────
echo Running install_extensions.ps1 ...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install_extensions.ps1"

echo.
if %errorLevel% EQU 0 (
    echo SUCCESS
) else (
    echo FAILED  ^(exit code: %errorLevel%^)
)

pause
