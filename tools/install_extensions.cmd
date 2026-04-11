@echo off
:: install_extensions.cmd
:: Launches install_extensions.ps1 without execution-policy restrictions
:: Called via npm: "install_zxp": "cmd /c \"tools\\install_extensions.cmd\""

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install_extensions.ps1"
exit /b %ERRORLEVEL%

pause