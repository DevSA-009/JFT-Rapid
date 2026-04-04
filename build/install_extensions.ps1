# install_extensions.ps1
# Unzips all ZIP files in the script's directory into Adobe CEP extensions folder
# Uses only built-in .NET — no external tools required

$extensionsBase = "C:\Program Files (x86)\Common Files\Adobe\CEP\extensions"
$scriptDir      = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Collect all zip files next to this script
$zipFiles = Get-ChildItem -Path $scriptDir -Filter "*.zxp" -File

if ($zipFiles.Count -eq 0) {
    Write-Host "No ZXP files found in: $scriptDir" -ForegroundColor Yellow
    exit 0
}

foreach ($zip in $zipFiles) {

    # Destination folder = extensions base + zip file name (without extension)
    $destFolder = Join-Path $extensionsBase $zip.BaseName

    Write-Host "`nProcessing: $($zip.Name)" -ForegroundColor Cyan
    Write-Host "  -> Target: $destFolder"

    # ── Remove existing folder ───────────────────────────────────────────────
    if (Test-Path $destFolder) {
        Write-Host "  Removing existing folder..." -ForegroundColor Yellow
        Remove-Item -Path $destFolder -Recurse -Force
    }

    # ── Create fresh destination folder ─────────────────────────────────────
    New-Item -ItemType Directory -Path $destFolder -Force | Out-Null

    # ── Extract using built-in .NET (no external tools) ──────────────────────
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::ExtractToDirectory($zip.FullName, $destFolder)
        Write-Host "  Done." -ForegroundColor Green
    }
    catch {
        Write-Host "  ERROR extracting $($zip.Name): $_" -ForegroundColor Red
    }
}

Write-Host "`nAll done!" -ForegroundColor Green
