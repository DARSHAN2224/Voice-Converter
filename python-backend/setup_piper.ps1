# Piper TTS Auto-Setup Script
# Downloads Piper binary and voices to B:\ai\piper

Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host "Piper TTS Auto-Setup" -ForegroundColor Yellow
Write-Host ("=" * 60) -ForegroundColor Cyan

# Create directory
New-Item -ItemType Directory -Force -Path "B:\ai\piper\voices" | Out-Null

# Download Piper executable
Write-Host "`n1. Downloading Piper for Windows..." -ForegroundColor Green
$piperUrl = "https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip"
$piperZip = "$env:TEMP\piper.zip"
try {
    Invoke-WebRequest -Uri $piperUrl -OutFile $piperZip -UseBasicParsing
    Expand-Archive -Path $piperZip -DestinationPath "$env:TEMP\piper_extract" -Force
    Copy-Item "$env:TEMP\piper_extract\piper\piper.exe" -Destination "B:\ai\piper\piper.exe" -Force
    Remove-Item $piperZip -Force
    Remove-Item "$env:TEMP\piper_extract" -Recurse -Force
    Write-Host "   ✓ Piper.exe installed to B:\ai\piper\piper.exe" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Failed to download Piper: $_" -ForegroundColor Red
    exit 1
}

# Download English voice
Write-Host "`n2. Downloading English voice (en_US-amy-medium)..." -ForegroundColor Green
$voiceEnUrl = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx"
$voiceEnJsonUrl = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json"
try {
    Invoke-WebRequest -Uri $voiceEnUrl -OutFile "B:\ai\piper\voices\en_US-amy-medium.onnx" -UseBasicParsing
    Invoke-WebRequest -Uri $voiceEnJsonUrl -OutFile "B:\ai\piper\voices\en_US-amy-medium.onnx.json" -UseBasicParsing
    Write-Host "   ✓ English voice downloaded" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Failed to download English voice: $_" -ForegroundColor Red
}

# Download Spanish voice
Write-Host "`n3. Downloading Spanish voice (es_ES-davefx-medium)..." -ForegroundColor Green
$voiceEsUrl = "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/davefx/medium/es_ES-davefx-medium.onnx"
$voiceEsJsonUrl = "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/davefx/medium/es_ES-davefx-medium.onnx.json"
try {
    Invoke-WebRequest -Uri $voiceEsUrl -OutFile "B:\ai\piper\voices\es_ES-davefx-medium.onnx" -UseBasicParsing
    Invoke-WebRequest -Uri $voiceEsJsonUrl -OutFile "B:\ai\piper\voices\es_ES-davefx-medium.onnx.json" -UseBasicParsing
    Write-Host "   ✓ Spanish voice downloaded" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Failed to download Spanish voice: $_" -ForegroundColor Red
}

# Set environment variables
Write-Host "`n4. Setting environment variables..." -ForegroundColor Green
[System.Environment]::SetEnvironmentVariable('PIPER_BIN', 'B:\ai\piper\piper.exe', 'User')
[System.Environment]::SetEnvironmentVariable('PIPER_VOICE_EN', 'B:\ai\piper\voices\en_US-amy-medium.onnx', 'User')
[System.Environment]::SetEnvironmentVariable('PIPER_VOICE_ES', 'B:\ai\piper\voices\es_ES-davefx-medium.onnx', 'User')
$env:PIPER_BIN = 'B:\ai\piper\piper.exe'
$env:PIPER_VOICE_EN = 'B:\ai\piper\voices\en_US-amy-medium.onnx'
$env:PIPER_VOICE_ES = 'B:\ai\piper\voices\es_ES-davefx-medium.onnx'
Write-Host "   ✓ Environment variables set" -ForegroundColor Green

Write-Host "`n" -NoNewline
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "Piper TTS setup complete!" -ForegroundColor Yellow
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "`nFiles installed:" -ForegroundColor White
Write-Host "  • B:\ai\piper\piper.exe" -ForegroundColor Gray
Write-Host "  • B:\ai\piper\voices\en_US-amy-medium.onnx" -ForegroundColor Gray
Write-Host "  • B:\ai\piper\voices\es_ES-davefx-medium.onnx" -ForegroundColor Gray
Write-Host "`nNext: Close and reopen your terminal, then start the backend!" -ForegroundColor Yellow
