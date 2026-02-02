Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   VOICE CONVERTER - ULTIMATE INSTALLER (Turbo V3)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Python
Write-Host "1. Checking Python..." -ForegroundColor Yellow
$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    Write-Host "Error: Python not found. Please install Python 3.10+ and add it to PATH." -ForegroundColor Red
    exit 1
}
$ver = python --version
Write-Host "   Found: $ver" -ForegroundColor Green

# 2. Setup Virtual Environment
Write-Host "`n2. Setting up Python Virtual Environment (venv)..." -ForegroundColor Yellow
if (-not (Test-Path "venv")) {
    Write-Host "   Creating new venv..."
    python -m venv venv
} else {
    Write-Host "   Using existing venv."
}

# 3. Install Dependencies
Write-Host "`n3. Installing Dependencies..." -ForegroundColor Yellow
& ".\venv\Scripts\python" -m pip install --upgrade pip
& ".\venv\Scripts\pip" install -r "python-backend\requirements.txt"

if ($LASTEXITCODE -ne 0) {
    Write-Host "   Error installing dependencies!" -ForegroundColor Red
    exit 1
}
Write-Host "   Dependencies installed successfully." -ForegroundColor Green

# 4. Download AI Models (Turbo V3)
Write-Host "`n4. Downloading AI Models (Turbo V3) to B: drive..." -ForegroundColor Yellow
& ".\venv\Scripts\python" "python-backend\setup_pro.py"

if ($LASTEXITCODE -ne 0) {
    Write-Host "   Error downloading models!" -ForegroundColor Red
    exit 1
}

# 5. Frontend Setup (Optional check)
if (Test-Path "package.json") {
    Write-Host "`n5. Installing Frontend Dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "   INSTALLATION COMPLETE!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "To start the app, run: .\start.ps1" -ForegroundColor Yellow
Read-Host "Press Enter to exit..."
