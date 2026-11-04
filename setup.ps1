# One-time setup for Windows. Easiest: double-click setup.bat
$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot

function Have($cmd) { [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }

if (-not (Have node)) {
    Write-Host "Node.js not found. Install Node 22 LTS or newer:  winget install OpenJS.NodeJS.LTS" -ForegroundColor Red
    exit 1
}
$nodeMajor = [int]((node -v).TrimStart("v").Split(".")[0])
if ($nodeMajor -lt 22) {
    Write-Host "Node $(node -v) is too old; need >= 22.  winget upgrade OpenJS.NodeJS.LTS" -ForegroundColor Red
    exit 1
}

# --- uv (Python packages: pretty_midi, pedalboard, numpy) ---
if (-not (Have uv)) {
    Write-Host "Installing uv..." -ForegroundColor Cyan
    powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
    $env:Path = "$env:USERPROFILE\.local\bin;$env:Path"
}

if (-not (Have pnpm)) {
    Write-Host "Installing pnpm..." -ForegroundColor Cyan
    Invoke-WebRequest https://get.pnpm.io/install.ps1 -UseBasicParsing | Invoke-Expression
    $env:Path = "$env:LOCALAPPDATA\pnpm;$env:Path"
}

Write-Host "`nInstalling JS packages (pnpm)..." -ForegroundColor Cyan
pnpm install
if ($LASTEXITCODE -ne 0) { Write-Host "pnpm install failed." -ForegroundColor Red; exit 1 }

Write-Host "`nInstalling Python packages (uv)..." -ForegroundColor Cyan
uv sync

Write-Host "`nDownloading the headless browser Remotion renders with (one time)..." -ForegroundColor Cyan
pnpm exec remotion browser ensure

if (-not (Have ffmpeg)) {
    Write-Host "`nOptional: FFmpeg is not on PATH. The story pipeline works without it, but HyperFrames renders need it:  winget install Gyan.FFmpeg" -ForegroundColor Yellow
}

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "`nCreated .env from .env.example. Open it to set your whisper.cpp folder and models (WHISPER_PATH, WHISPER_EN_MODEL, WHISPER_AR_MODEL)." -ForegroundColor Yellow
}

Write-Host "`nChecking..." -ForegroundColor Cyan
pnpm video doctor

Write-Host "`nDone. Make a video:  make-video.bat demo-game" -ForegroundColor Green
