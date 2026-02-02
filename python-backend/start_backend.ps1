# Voice Converter Backend Startup Script
# Sets optimal environment variables and starts uvicorn

Write-Host "🚀 Starting Voice Converter Backend..." -ForegroundColor Cyan

# Suppress CUDA warnings (we're using CPU mode)
$env:CUDA_VISIBLE_DEVICES = ""
$env:TF_CPP_MIN_LOG_LEVEL = "3"

# Whisper configuration
$env:WHISPER_MODEL = "tiny"           # tiny=fast, small=balanced, medium=accurate
$env:WHISPER_DEVICE = "cpu"           # cpu (no GPU) or cuda (with GPU)
$env:WHISPER_COMPUTE_TYPE = "int8"    # int8 for CPU, float16 for GPU

# Advanced features
$env:SILENCE_CALIBRATION_DURATION = "1.5"
$env:SILENCE_MULTIPLIER = "2.5"
$env:WHISPER_TEMPS = "0.0,0.2,0.4,0.6,0.8,1.0"

# Suppress symlink warning
$env:HF_HUB_DISABLE_SYMLINKS_WARNING = "1"

Write-Host "✓ Configuration:" -ForegroundColor Green
Write-Host "  Model: $env:WHISPER_MODEL"
Write-Host "  Device: $env:WHISPER_DEVICE"
Write-Host "  Compute: $env:WHISPER_COMPUTE_TYPE"
Write-Host ""

# Activate virtual environment if not already active
if (-not $env:VIRTUAL_ENV) {
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & .\.venv\Scripts\Activate.ps1
}

# Start uvicorn
Write-Host "Starting server on http://0.0.0.0:8000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
