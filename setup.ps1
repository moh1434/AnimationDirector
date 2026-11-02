# One-time setup for Windows. Run from this folder in PowerShell:
#   powershell -ExecutionPolicy Bypass -File .\setup.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Have($cmd) { [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }

# --- Node.js (>= 22 required by HyperFrames) ---
if (-not (Have node)) {
    Write-Host "Node.js not found. Install Node 22 LTS or newer:  winget install OpenJS.NodeJS.LTS" -ForegroundColor Red
    exit 1
}
$nodeMajor = [int]((node -v).TrimStart("v").Split(".")[0])
if ($nodeMajor -lt 22) {
    Write-Host "Node $(node -v) is too old; need >= 22.  winget upgrade OpenJS.NodeJS.LTS" -ForegroundColor Red
    exit 1
}

# --- pnpm ---
if (-not (Have pnpm)) {
    Write-Host "Installing pnpm..." -ForegroundColor Cyan
    npm install -g pnpm@12
}

# --- uv ---
if (-not (Have uv)) {
    Write-Host "Installing uv..." -ForegroundColor Cyan
    powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
    $env:Path = "$env:USERPROFILE\.local\bin;$env:Path"
}

# --- FFmpeg (HyperFrames needs it on PATH; Remotion bundles its own) ---
if (-not (Have ffmpeg)) {
    Write-Host "FFmpeg not found (needed by HyperFrames). Install with:  winget install Gyan.FFmpeg" -ForegroundColor Yellow
}

Write-Host "`nInstalling JS packages (pnpm)..." -ForegroundColor Cyan
pnpm install

Write-Host "`nInstalling Python packages (uv)..." -ForegroundColor Cyan
uv sync

Write-Host "`nDone. Try:" -ForegroundColor Green
Write-Host "  pnpm studio                 # Remotion Studio (live preview)"
Write-Host "  pnpm render                 # render the Remotion sample to out/"
Write-Host "  pnpm hf:preview             # HyperFrames Studio"
Write-Host "  uv run audio/make_jingle.py # MIDI + effects audio test"
