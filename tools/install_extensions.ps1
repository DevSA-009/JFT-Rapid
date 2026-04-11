# =============================================================
#  install_extensions.ps1
#  Installs all .zxp files from the build\ directory into the
#  Adobe CEP extensions folder by extracting them as ZIPs.
#  Uses only built-in .NET -- no external tools required.
# =============================================================

# --- Paths -------------------------------------------------------------------
$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectRoot = Split-Path -Parent $ScriptDir
$BuildDir    = Join-Path $ProjectRoot "build"
$ExtBase     = "C:\Program Files (x86)\Common Files\Adobe\CEP\extensions"

# --- Banner ------------------------------------------------------------------
Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "     CEP Extension Installer                         " -ForegroundColor Cyan
Write-Host "     com.jftrapid.cep  --  PowerShell edition        " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# --- Check build dir ---------------------------------------------------------
if (-not (Test-Path $BuildDir)) {
    Write-Host "ERROR: build\ directory not found at:" -ForegroundColor Red
    Write-Host "  $BuildDir"
    Write-Host "Run build_extension first." -ForegroundColor Yellow
    exit 1
}

# --- Collect ZXP files -------------------------------------------------------
$ZxpFiles = Get-ChildItem -Path $BuildDir -Filter "*.zxp" -File

if ($ZxpFiles.Count -eq 0) {
    Write-Host "No .zxp files found in:" -ForegroundColor Yellow
    Write-Host "  $BuildDir"
    exit 0
}

# --- Ensure CEP extensions base folder exists --------------------------------
if (-not (Test-Path $ExtBase)) {
    Write-Host "[INFO] CEP extensions folder not found -- creating..." -ForegroundColor Yellow
    try {
        New-Item -ItemType Directory -Path $ExtBase -Force | Out-Null
    } catch {
        Write-Host "ERROR: Cannot create extensions folder (try running as Administrator):" -ForegroundColor Red
        Write-Host "  $ExtBase"
        Write-Host "  $_"
        exit 1
    }
}

# --- Install each ZXP --------------------------------------------------------
Add-Type -AssemblyName System.IO.Compression.FileSystem

foreach ($zxp in $ZxpFiles) {
    $DestFolder = Join-Path $ExtBase $zxp.BaseName

    Write-Host ""
    Write-Host "Installing: $($zxp.Name)" -ForegroundColor Cyan
    Write-Host "  Source : $($zxp.FullName)"
    Write-Host "  Target : $DestFolder"

    if (Test-Path $DestFolder) {
        Write-Host "  Removing existing installation..." -ForegroundColor Yellow
        try {
            Remove-Item -Path $DestFolder -Recurse -Force
        } catch {
            Write-Host "  ERROR: Could not remove existing folder (try running as Administrator):" -ForegroundColor Red
            Write-Host "  $_"
            continue
        }
    }

    New-Item -ItemType Directory -Path $DestFolder -Force | Out-Null

    try {
        [System.IO.Compression.ZipFile]::ExtractToDirectory($zxp.FullName, $DestFolder)
        Write-Host "  Done." -ForegroundColor Green
    } catch {
        Write-Host "  ERROR extracting $($zxp.Name):" -ForegroundColor Red
        Write-Host "  $_"
    }
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "  Installation complete.                             " -ForegroundColor Green
Write-Host "  Restart Adobe application to load the extension.  " -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""
