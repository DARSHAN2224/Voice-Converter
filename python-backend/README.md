# Python Backend (Local, Free Stack)

This backend provides local, offline processing for:
- ASR: faster-whisper (Whisper small model, CPU-friendly)
- Translation: Argos Translate (offline language packs)
- TTS: Piper (fast, small-footprint, many languages)

It exposes a simple HTTP API to ingest short audio chunks and returns incremental transcription, translations, and TTS audio file URLs.

## 1) Prepare directories on B:\ (to save space on C:)
Create folders where models and caches will live:
```
B:\ai\cache\huggingface
B:\ai\argos
B:\ai\piper\voices
```

Persist environment variables so downloads/cache land on B:\ (run PowerShell as your user):
```powershell
setx HUGGINGFACE_HUB_CACHE "B:\ai\cache\huggingface"
setx ARGOS_TRANSLATE_DATA_DIR "B:\ai\argos"
# Optional for this shell session immediately:
$env:HUGGINGFACE_HUB_CACHE = "B:\ai\cache\huggingface"; $env:ARGOS_TRANSLATE_DATA_DIR = "B:\ai\argos"
```

## 2) Install Python and FFmpeg (Windows)
- **Install Python 3.11 or 3.12** from python.org (NOT 3.14 - too new; many ML packages lack pre-built wheels). Ensure `python` is in PATH.
- Install FFmpeg for Windows and add `ffmpeg.exe` and `ffprobe.exe` to PATH.
  Test: `ffmpeg -version`

## 3) Create a virtual environment
```powershell
python -m venv .venv
. .venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## 4) Download models
### Whisper (faster-whisper)
The first run will auto-download the model. We recommend `small` (multilingual) for balance:
- Model name: `small`
- Device: CPU
- Compute type: `int8`

To force pre-download to the B:\ cache, run once:
```powershell
python - << 'PY'
import os
os.environ.setdefault('HUGGINGFACE_HUB_CACHE', r'B:\ai\cache\huggingface')
from faster_whisper import WhisperModel
model = WhisperModel('small', device='cpu', compute_type='int8')
print('Whisper small loaded and cached to', os.environ['HUGGINGFACE_HUB_CACHE'])
PY
```

### Argos Translate language packs
Install packs for your desired language pairs (example: English -> Spanish and Spanish -> English):
```powershell
python - << 'PY'
import argostranslate.package, argostranslate.translate
# Download and install en<->es packages
packages = argostranslate.package.get_available_packages()
for pair in [("en", "es"), ("es", "en")]:
    candidates = list(filter(lambda p: p.from_code == pair[0] and p.to_code == pair[1], packages))
    if candidates:
        pkg = candidates[0]
        path = argostranslate.package.download(pkg.download_url)
        argostranslate.package.install_from_path(path)
print("Installed Argos packages for en<->es")
PY
```
You can repeat for other pairs (fr, de, ja, hi, ar, pt, etc.).

### Piper TTS
Download Piper for Windows and voice models. Place them on B:\ to save C:\ space:
```
B:\ai\piper\piper.exe
B:\ai\piper\voices\en_US-amy-medium.onnx
B:\ai\piper\voices\es_ES-ana-medium.onnx
```

Tell the backend where they are via environment variables:
```powershell
setx PIPER_BIN "B:\ai\piper\piper.exe"
setx PIPER_VOICE_EN "B:\ai\piper\voices\en_US-amy-medium.onnx"
setx PIPER_VOICE_ES "B:\ai\piper\voices\es_ES-ana-medium.onnx"
# Also set for current shell session now:
$env:PIPER_BIN = "B:\ai\piper\piper.exe"; $env:PIPER_VOICE_EN = "B:\ai\piper\voices\en_US-amy-medium.onnx"; $env:PIPER_VOICE_ES = "B:\ai\piper\voices\es_ES-ana-medium.onnx"
```

## 5) Run the server
```powershell
. .venv\Scripts\Activate.ps1
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 6) Endpoints
- POST /ingest?session=SESSION_ID&target=es
  - Body: binary audio/webm chunk from the browser recorder.
  - Response JSON: liveText, newSegments, ttsUrls
- GET /sessions/{session_id}/tts/{file}
  - Serves TTS wav files.

## 7) Notes
- This is a prototype. For better latency, consider AudioWorklet PCM streaming rather than MediaRecorder webm.
- For different languages, install Argos packs and Piper voices, then adjust `VOICE_MAP`.
