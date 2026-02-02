Write-Host "🎉 Voice Converter - Starting All Services" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 1. Start Backend
Write-Host "🚀 Starting Backend..." -ForegroundColor Cyan
# We use the venv created by install_everything.ps1 in the root
$venvPython = "$PSScriptRoot\venv\Scripts\python.exe"

if (-not (Test-Path $venvPython)) {
    Write-Host "⚠️  Virtual environment not found!" -ForegroundColor Red
    Write-Host "    Please run: .\install_everything.ps1" -ForegroundColor Yellow
    exit 1
}

# Launch backend in a new window using the correct python exe
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'python-backend'; & '$venvPython' -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

# 2. Start Frontend
Write-Host "🎨 Starting Frontend..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules not found. Installing..." -ForegroundColor Yellow
    npm install
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host ""
Write-Host "✅ Services launching in separate windows." -ForegroundColor Green
Write-Host "   Backend: http://localhost:8000"
Write-Host "   Frontend: http://localhost:3000"
Write-Host ""
Write-Host "Press Ctrl+C in those windows to stop." -ForegroundColor Gray
