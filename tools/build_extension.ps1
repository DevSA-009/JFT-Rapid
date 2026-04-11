# =============================================================
#  build_extension.ps1
#  Copies CLIENT, CSXS, HOST dirs + jft.conf into a temp dir,
#  then signs them as a ZXP using ZXPSignCmd.exe
# =============================================================

$CERT_PASSWORD = 'NPn$8CDqg*YEt95'   # <-- single quotes, set your cert password here

# --- Paths -------------------------------------------------------------------
$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectRoot = Split-Path -Parent $ScriptDir

$ZXPSignCmd  = Join-Path $ScriptDir "ZXPSignCmd.exe"
$CertFile    = Join-Path $ScriptDir "selft-sign-certificate.p12"
$BuildDir    = Join-Path $ProjectRoot "build"
$OutputFile  = Join-Path $BuildDir   "com.jftrapid.cep.zxp"
$TsaUrl      = "http://timestamp.digicert.com"

$SourceItems = @(
    (Join-Path $ProjectRoot "CLIENT"),
    (Join-Path $ProjectRoot "CSXS"),
    (Join-Path $ProjectRoot "HOST"),
    (Join-Path $ProjectRoot "jft.conf")
)

# --- Banner ------------------------------------------------------------------
Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "     CEP Extension Build Tool  (ZXPSignCmd)          " -ForegroundColor Cyan
Write-Host "     com.jftrapid.cep  --  PowerShell edition        " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# --- Pre-flight checks -------------------------------------------------------
if (-not (Test-Path $ZXPSignCmd)) {
    Write-Host "ERROR: ZXPSignCmd.exe not found at:" -ForegroundColor Red
    Write-Host "  $ZXPSignCmd"
    exit 1
}

if (-not (Test-Path $CertFile)) {
    Write-Host "ERROR: Certificate file not found at:" -ForegroundColor Red
    Write-Host "  $CertFile"
    exit 1
}

foreach ($item in $SourceItems) {
    if (-not (Test-Path $item)) {
        Write-Host "ERROR: Required source not found:" -ForegroundColor Red
        Write-Host "  $item"
        exit 1
    }
}

# --- Ensure build dir exists -------------------------------------------------
if (-not (Test-Path $BuildDir)) {
    Write-Host "[INFO] build\ directory not found -- creating it..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $BuildDir -Force | Out-Null
    Write-Host "[INFO] build\ directory created." -ForegroundColor Green
}

# --- Remove existing ZXP -----------------------------------------------------
if (Test-Path $OutputFile) {
    Write-Host "[INFO] Existing ZXP found -- deleting..." -ForegroundColor Yellow
    Remove-Item -Path $OutputFile -Force
    Write-Host "[INFO] Deleted: $OutputFile" -ForegroundColor Green
}

# --- Create temp staging directory -------------------------------------------
$TempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("cep_build_" + [System.IO.Path]::GetRandomFileName())
New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
Write-Host "[INFO] Temp staging dir: $TempDir" -ForegroundColor DarkGray

# --- Copy source items into temp dir -----------------------------------------
Write-Host ""
Write-Host "Copying source files..." -ForegroundColor Cyan

foreach ($item in $SourceItems) {
    $name = Split-Path -Leaf $item
    if (Test-Path $item -PathType Container) {
        $dest = Join-Path $TempDir $name
        Copy-Item -Path $item -Destination $dest -Recurse -Force
        Write-Host "  [+] $name\" -ForegroundColor Gray
    } else {
        Copy-Item -Path $item -Destination $TempDir -Force
        Write-Host "  [+] $name" -ForegroundColor Gray
    }
}

Write-Host ""

# --- Sign (Start-Process -Wait blocks until ZXPSignCmd window closes) --------
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host " Signing in progress..." -ForegroundColor Cyan
Write-Host " (waiting for ZXPSignCmd to finish...)" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  Source  : $TempDir"
Write-Host "  Output  : $OutputFile"
Write-Host "  Cert    : $CertFile"
Write-Host "  TSA     : $TsaUrl"
Write-Host ""

$SignArgs = "-sign `"$TempDir`" `"$OutputFile`" `"$CertFile`" `"$CERT_PASSWORD`" -tsa `"$TsaUrl`""

$Process = Start-Process -FilePath $ZXPSignCmd `
    -ArgumentList $SignArgs `
    -Wait `
    -PassThru

$ExitCode = $Process.ExitCode

# --- Cleanup temp dir (only AFTER ZXPSignCmd has fully finished) -------------
Write-Host ""
Write-Host "[INFO] Cleaning up temp dir..." -ForegroundColor DarkGray
Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue

# --- Result ------------------------------------------------------------------
Write-Host ""
if ($ExitCode -eq 0) {
    Write-Host "=====================================================" -ForegroundColor Green
    Write-Host "                  BUILD SUCCESSFUL                    " -ForegroundColor Green
    Write-Host "=====================================================" -ForegroundColor Green
    Write-Host "  Output: $OutputFile" -ForegroundColor Green
} else {
    Write-Host "=====================================================" -ForegroundColor Red
    Write-Host "                  BUILD FAILED                        " -ForegroundColor Red
    Write-Host "=====================================================" -ForegroundColor Red
    Write-Host "  Error code: $ExitCode" -ForegroundColor Red
    exit $ExitCode
}

Write-Host ""
