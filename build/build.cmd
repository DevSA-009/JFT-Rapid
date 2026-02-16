@echo off
setlocal EnableDelayedExpansion

echo.
echo =====================================================
echo     CEP Extension Sign Tool  (ZXPSignCmd)   v1.2
echo     Signs the "source" subfolder
echo     February 2026
echo =====================================================
echo.

:: === Configuration =====================================

set "ZXPSIGN_CMD=ZXPSignCmd.exe"
set "CERT_FILE=selft-sign-certificate.p12"
set "CERT_PASSWORD=NPn$8CDqg*YEt95"
set "OUTPUT_FILE=com.jftrapid.cep.zxp"
set "TSA_URL=http://timestamp.digicert.com"

:: ========================================================

:: Check required files
if not exist "%ZXPSIGN_CMD%" (
    echo ERROR: ZXPSignCmd.exe not found in current folder.
    echo.
    echo Fix:
    echo  • Place ZXPSignCmd.exe next to this .bat file
    echo  • Or edit this line with full path:
    echo      set "ZXPSIGN_CMD=C:\full\path\to\ZXPSignCmd.exe"
    echo.
    pause
    exit /b 1
)

if not exist "%CERT_FILE%" (
    echo ERROR: Certificate file "%CERT_FILE%" not found.
    echo        Place mycert.p12 in the same folder as this script.
    echo.
    pause
    exit /b 1
)

:: Force source to be the "source" subfolder
set "SOURCE_FOLDER=%~dp0source"

if not exist "%SOURCE_FOLDER%\" (
    echo ERROR: Required folder "source" not found in current directory.
    pause
    exit /b 1
)

echo Signing extension from:
echo   %SOURCE_FOLDER%
echo.
echo Output file will be created as:
echo   %~dp0%OUTPUT_FILE%
echo.
echo Certificate  : %CERT_FILE%
echo Password     : (hidden)
echo Timestamp URL: %TSA_URL%
echo.

echo Press ENTER to begin signing   (Ctrl+C to cancel)
pause >nul

echo.
echo =====================================================
echo Signing in progress... please wait
echo =====================================================
echo.

:: === The actual signing command =========================
"%ZXPSIGN_CMD%" -sign "%SOURCE_FOLDER%" "%OUTPUT_FILE%" "%CERT_FILE%" "%CERT_PASSWORD%" -tsa "%TSA_URL%"

:: === Result feedback ====================================
if %ERRORLEVEL% EQU 0 (
    echo.
    echo =====================================================
    echo               SIGNING SUCCESSFUL
    echo =====================================================
    echo.
    echo Created:
    echo   %OUTPUT_FILE%
    echo.
    echo Location:
    echo   %~dp0%OUTPUT_FILE%
    echo.
    echo You can now install or share JFT_Rapid.zxp
    echo.
) else (
    echo.
    echo =====================================================
    echo                   SIGNING FAILED
    echo =====================================================
    echo.
    echo Error code: %ERRORLEVEL%
    echo.
    echo Common causes:
    echo  • Incorrect certificate password
    echo  • Certificate is expired or invalid
    echo  • manifest.xml is missing or broken
    echo  • Files inside "source" are not readable
    echo  • ZXPSignCmd version incompatibility
    echo.
)

echo.
pause