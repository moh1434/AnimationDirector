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

Write-Host "`nInstalling JS packages..." -ForegroundColor Cyan
$ok = $false
if (Have pnpm) {
    pnpm install
    if ($LASTEXITCODE -eq 0) { $ok = $true } else { Write-Host "pnpm failed, trying npm..." -ForegroundColor Yellow }
}
if (-not $ok) {
    npm install --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { Write-Host "npm install failed." -ForegroundColor Red; exit 1 }
}

Write-Host "`nInstalling Python packages (uv)..." -ForegroundColor Cyan
uv sync

Write-Host "`nDownloading the headless browser Remotion renders with (one time)..." -ForegroundColor Cyan
node node_modules/@remotion/cli/remotion-cli.js browser ensure

if (-not (Have ffmpeg)) {
    Write-Host "`nOptional: FFmpeg is not on PATH. The story pipeline works without it, but HyperFrames renders need it:  winget install Gyan.FFmpeg" -ForegroundColor Yellow
}

Write-Host "`nChecking..." -ForegroundColor Cyan
node pipeline/cli.mjs doctor

Write-Host "`nDone. Make a video:  make-video.bat demo-game" -ForegroundColor Green
