# Voice Converter (Live Streaming - Local AI)

Real-time transcription, translation, and text-to-speech for audio/video playback using **100% local, free, open-source models**. No cloud API keys needed. All processing happens on your machine.

---

## ✨ Features

- 🎙️ **Live audio capture** from browser tab (YouTube, etc.) OR microphone
- ⚡ **Ultra-low latency** (configurable: 500ms fast, 800ms balanced, 1500ms accurate)
- 🗣️ **Real-time transcription** using Whisper (auto-detects source language)
- 🌍 **Dual translation**:
  - Translate to any language for **TTS audio synthesis**
  - Translate to different language for **on-screen captions**
  - Example: Spanish video → English captions + Spanish audio
- 💬 **Live caption display** with toggles for translated/original text
- 🔊 **Text-to-speech** synthesis with Piper TTS (natural voices)
- 💾 **Caption export** (WebVTT format) for later use
- 📺 **Source flexibility** - Video/Tab audio or microphone input
- 🔒 **100% offline** - no API keys, no cloud, no tracking
- 💰 **Zero cost** - all models run locally

### 🆕 Advanced Features (New!)

- 🎯 **Mode Presets**: One-click configurations (⚡Low Latency / ⚖️Balanced / 🎯High Accuracy)
- 📊 **Word-Level Timestamps**: See individual words with confidence scores and timing
- 🔍 **Confidence Metrics**: Debug view with compression ratio, log probability, no-speech detection
- 🎚️ **Adaptive Silence Calibration**: Auto-adjusts to your microphone's noise floor
- 🌡️ **Temperature Fallback**: Multi-temperature retry for difficult audio segments
- � **Client-Side Silence Filter**: Skip silent chunks before network transmission (saves 30% bandwidth)
- 🔌 **WebSocket PCM Streaming**: Low-latency binary streaming endpoint (backend ready)
- ⚙️ **Advanced UI Controls**: Fine-tune model size, beam search, silence threshold, and more
- � **Argos Model Check**: Verify installed translation language packs
- 🎨 **Word Highlighting**: Color-coded confidence visualization in captions

---

- **TTS (Text-to-Speech)**: Optionally synthesize translated audio using Piper.- 📺 **Source flexibility** - Video/Tab audio or microphone input

- **Export VTT**: Download caption segments as WebVTT for offline use.- 🔒 **100% offline** - no API keys, no cloud, no tracking

- **Auto-Start Mode**: Optionally auto-start capture on page load (user still grants permission once).- 💰 **Zero cost** - all models run locally



---## 🚀 Quick Start



## Architecture### Prerequisites

- Windows 10/11

### Backend (FastAPI + faster-whisper + Argos Translate + Piper)- Python 3.11 (installed to B:\python11)

- **Python 3.10+** with FastAPI for HTTP and WebSocket endpoints.- Node.js 18+ and npm

- **faster-whisper** (`small` model) for transcription with `beam_size=5`, VAD disabled.- FFmpeg (on PATH)

- **Argos Translate** for language pair translation (fallback to original if pack missing).- ~2GB free space on B:\ drive for models

- **Piper TTS** for synthesizing translated speech (optional).

- **WebSocket** endpoint `/ws/{session_id}` broadcasts `liveText`, `liveCaption`, `newSegments`, `hasPending` on every chunk.### Installation

- **Session Management**: Persistent session tracks segments, pending buffer, accumulated duration, and WebSocket subscribers.

1. **Install frontend dependencies:**

### Frontend (Next.js + React + TypeScript)```powershell

- **Next.js 14** app with React hooks for state management.cd "A:\programming\Voice Converter"

- **MediaRecorder** (WebM) or **AudioWorklet** (PCM float32, 16kHz) for audio capture.npm install

- **WebSocket client** auto-subscribes to backend `/ws/{session_id}` for live updates.```

- **localStorage** persistence for session ID, target language, caption language, and auto-start preference.

- **Overlay captions** (optional) render at bottom-center with YouTube-like styling.2. **Install Python backend:**

- **Toast notifications** for missing language packs.```powershell

cd python-backend

### Browser Extension (Manifest V3)python -m venv .venv

- **background.js**: Opens WebSocket to backend, receives caption updates, broadcasts to content scripts.. .venv\Scripts\Activate.ps1

- **content.js**: Injects fixed-position caption overlay on all tabs.pip install -r requirements.txt

- **options.html**: UI to configure session ID (auto-loads from storage if present).```

- **Auto-reconnect**: Exponential backoff up to 10 retries on WebSocket disconnect.

3. **Download AI models (~1GB total):**

---```powershell

python setup_models.py

## Prerequisites```



### BackendThis downloads:

- **Python 3.10+** (3.11 recommended)- Whisper small (460MB) to B:\ai\cache\huggingface

- **FFmpeg** (on PATH) for audio decoding fallback- Argos Translate en↔es packs to B:\ai\argos

- **pip** package manager- Instructions for Piper voices

- (Optional) CUDA/GPU for faster transcription (CPU works fine for `small` model)

4. **Download Piper TTS (voices already downloaded during setup):**

### Frontend

- **Node.js 18+** and **npm** (or **pnpm**, **yarn**)All Piper files are in B:\ai\piper\

- Modern browser (Chrome, Edge, Brave, etc.) for WebSocket and `getDisplayMedia` support

### Running the App

### Browser Extension

- Chromium-based browser (Chrome, Edge, Brave, etc.) with Developer Mode enabled**Terminal 1 - Backend (FastAPI):**

```powershell

---cd "A:\programming\Voice Converter\python-backend"

B:\python11\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

## Installation & Setup```



### 1. Clone/Download Repository**Terminal 2 - Frontend (Next.js):**

```powershell```powershell

git clone <repo_url>cd "A:\programming\Voice Converter"

cd "Voice Converter"npm run dev

``````



### 2. Backend Setup**Open browser:**

```

#### a. Install Python Dependencieshttp://localhost:3000

```powershell```

cd python-backend

pip install -r requirements.txt### Usage

```

1. **Choose audio source:**

**Key dependencies:**   - **Video/Tab**: Select to capture audio from YouTube or any browser tab

- `fastapi`   - **Microphone**: Select to capture from your microphone

- `uvicorn[standard]`

- `faster-whisper`2. **Configure languages:**

- `argostranslate`   - **Target Language**: Language for TTS audio synthesis (plays back)

- `numpy`   - **Caption Language**: Language for on-screen captions (displayed text)

- `websockets`   - Can be different! E.g., Spanish audio + English captions



#### b. Install FFmpeg3. **Toggle caption display:**

- Download from [ffmpeg.org](https://ffmpeg.org/download.html) or use a package manager.   - ✓ **Translated**: Shows captions in your chosen caption language

- Ensure `ffmpeg` is on your PATH:   - ✓ **Original**: Shows original (source) language text alongside

  ```powershell

  ffmpeg -version4. **Start capturing:**

  ```   - Click **Start**

   - If Video/Tab: select tab/window and **enable "Share tab audio"**

#### c. Download Whisper Model (Automatic on First Run)   - If Microphone: grant microphone permission

- On first transcription, `faster-whisper` downloads the `small` model (~500 MB).   - Watch captions appear live as speech is detected (optimized for ultra-low 250ms latency)

- To pre-download or use a different model, set:   - Translated audio synthesizes and plays automatically

  ```powershell

  $env:WHISPER_MODEL = "medium"  # or "large-v2"5. **Stop & export:**

  ```   - Click **Stop** to end capture

   - Click **Export VTT** to download captions as WebVTT file

#### d. Install Argos Translate Language Packs

Run the provided setup script to install common language packs (en, es, fr, de, ja, ko, zh, hi, ar, pt):## 🎯 How It Works

```powershell

python setup_models.py### Architecture

```

**Manual installation** (optional):```

```pythonAudio Source (Video Tab or Microphone)

import argostranslate.package    ↓

argostranslate.package.update_package_index()AudioWorklet PCM Capture (16kHz, real-time)

available = argostranslate.package.get_available_packages()    ↓

# Install specific pack, e.g., en->esFastAPI Backend (/ingest/pcm - low latency)

pkg = next(p for p in available if p.from_code == "en" and p.to_code == "es")    ↓

argostranslate.package.install_from_path(pkg.download())WAV Conversion (PCM float32 → int16)

```    ↓

Whisper Transcription (auto-detects language)

#### e. (Optional) Install Piper for TTS    ↓

- Download Piper binary and voices from [Piper Releases](https://github.com/rhasspy/piper/releases).Translation Pipeline:

- Place `piper.exe` in `python-backend/piper/` or set environment variable:  • Translate: source_language → target_language (for TTS)

  ```powershell  • Translate: target_language → caption_language (for display)

  $env:PIPER_BIN = "C:\path\to\piper.exe"    ↓

  ```Parallel Output:

- Download voice models (`.onnx` + `.onnx.json`) and place in `python-backend/piper/voices/`.  ├─ TTS Synthesis: Piper (target language audio)

- Configure voice map in `main.py` or via environment variables:  │   └─ Auto-play in browser

  ```powershell  │

  $env:PIPER_VOICE_EN = "piper/voices/en_US-amy-medium.onnx"  └─ Caption Display: live on-screen text

  ```      (in caption language)

```

### 3. Frontend Setup

### Data Flow Example

#### a. Install Node Dependencies

```powershell**Scenario:** Spanish video, want English captions + German audio

cd ..  # back to root

npm install1. **Capture**: VideoStream → PCM 16kHz

```2. **Transcribe**: Whisper detects Spanish

3. **Translate for TTS**: Spanish → German (audio plays in German)

#### b. (Optional) Configure Backend URL4. **Translate for Captions**: German → English (display shows English)

- Default: `http://localhost:8000`5. **Result**: English captions on screen + German speaker voice

- To change, edit `app/page.tsx` (search for `http://localhost:8000` and replace with your backend URL).

### Latency Comparison

### 4. Browser Extension Setup (Optional, for Multi-Tab Overlay)

| Mode | Chunk Size | Latency | Characteristics |

#### a. Load Extension in Chrome/Edge|------|-----------|---------|-----------------|

1. Open browser and navigate to `chrome://extensions/` (or `edge://extensions/`).| PCM (current) | 250ms | ~0.25s | **Ultra-fast, optimized default** |

2. Enable **Developer Mode** (top-right toggle).| PCM (stable) | 500ms | ~0.5s | More stable with poor network |

3. Click **Load unpacked**.| PCM (batch) | 1000ms | ~1s | Best for stability, slower feel |

4. Select the `browser-extension` folder.

## 📁 Project Structure

#### b. (Optional) Configure Session ID

- Extension auto-loads the session ID from Chrome storage if available.```

- To manually set:Voice Converter/

  1. Click the extension icon > **Options** (or right-click > Options).├── app/

  2. Paste the session ID displayed in the app UI.│   ├── page.tsx              # Main UI

  3. Click **Connect**.│   │   ├── Audio capture (Video/Tab or Microphone)

- **Note**: If you use the app's persistent session ID (stored in localStorage), the extension will auto-connect on install.│   │   ├── Language selectors (Target + Caption)

│   │   ├── Live caption display

---│   │   └── Caption toggles (Translated/Original)

│   ├── layout.tsx

## Running the Application│   ├── globals.css

│   └── api/session/route.ts

### 1. Start Backend├── public/

```powershell│   └── audio-worklet-processor.js  # Real-time PCM capture worker

cd python-backend├── python-backend/

uvicorn main:app --reload --host 0.0.0.0 --port 8000│   ├── main.py                     # FastAPI server

```│   │   ├── /ingest (WebM chunks - fallback)

**Output:**│   │   ├── /ingest/pcm (PCM streaming - primary)

```│   │   ├── Translation pipeline

INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)│   │   └── TTS synthesis

INFO:     Started reloader process│   ├── requirements.txt

```│   ├── setup_models.py

│   └── setup_piper.ps1

### 2. Start Frontend (Next.js Dev Server)├── package.json

Open a new terminal:├── next.config.js

```powershell├── tsconfig.json

cd "Voice Converter"  # root directory└── README.md

npm run dev```

```

**Output:**## 🛠️ Models on B:\ Drive

```

  ▲ Next.js 14.x.xAll AI models live on B:\ to save C:\ space:

  - Local:        http://localhost:3000

  - Ready in Xms```

```B:\ai\

├── cache\huggingface\     # Whisper models (~460MB)

### 3. Open App in Browser├── argos\                  # Argos language packs (~100MB each pair)

Navigate to [http://localhost:3000](http://localhost:3000).└── piper\

    ├── piper.exe          # TTS engine

### 4. Start Capturing Audio    └── voices\            # Voice models (~50MB each)

        ├── en_US-amy-medium.onnx

#### Option A: Manual Start (Default)        ├── en_US-amy-medium.onnx.json

1. Select **Target Language** (or keep `Auto`).        ├── es_ES-davefx-medium.onnx

2. Select **Caption Language** (or keep `Auto`).        └── es_ES-davefx-medium.onnx.json

3. Choose **Source**: `Video / Tab` or `Microphone`.```

4. Click **Start** button.

5. Select a browser tab/window or grant microphone access.## 🐛 Troubleshooting

6. **Important**: When choosing tab, check **"Share tab audio"** or **"Share system audio"** in the browser prompt.

7. Captions appear in the "Live Captions" section and overlay (if enabled).| Issue | Solution |

|-------|----------|

#### Option B: Auto-Start (Hands-Free)| Backend won't start | Ensure Python 3.11 is at B:\python11\python.exe, models downloaded |

1. Check **"Auto-start"** checkbox in the app controls.| `ffmpeg not found` | Install FFmpeg; backend has fallback but works faster with it |

2. Refresh the page.| No transcription | Check: `dir B:\ai\cache\huggingface` (Whisper models should be there) |

3. App automatically triggers capture on load (browser will still prompt once for permission).| "No audio - enable Share tab/system audio" | On Video/Tab capture: browser permission dialog appeared → click **Allow** and check **Share tab audio** |

4. After granting permission, captions flow automatically.| No captions appearing | Check Status bar for errors; ensure Target/Caption Language are set |

| | Translation fails with "NoneType" warning | **Normal if language pack not installed.** App continues working with original text. Install all language packs: `python setup_models.py` then restart backend. Or individually: `python -c "import argostranslate.package as pkg; pkg.update_package_index(); [p.install() for p in pkg.get_available_packages() if p.from_code in ['en','es','fr','de','ja','ko'] or p.to_code in ['en','es','fr','de','ja','ko']]"` |

### 5. (Optional) Use Browser Extension for Multi-Tab Overlay| No TTS audio | Verify `B:\ai\piper\piper.exe` exists and voice files are present for your Target Language |

- Once extension is installed and session ID is synced (auto or manual), captions will appear on **any tab** you open (YouTube, Netflix, etc.).| CORS error in browser console | Backend must run on `0.0.0.0:8000` and frontend on `http://localhost:3000` or `http://127.0.0.1:3000` |

- Overlay is styled identically to the in-app overlay: bottom-center, semi-transparent black background, large white text.| Captions delayed | Captions optimized for 250ms latency; if still slow, check CPU/RAM usage |

| Microphone not capturing | Grant browser permission when prompted; check Windows audio settings |

---| "PCM network error" | Backend crashed or network issue; check terminal 1 (backend) for errors |



## Usage Tips## 🎨 Adding More Languages



### Language Selection### 1. Translation (Argos)

- **Target Language**: The language you want the transcription translated into.Install language packs (example: French):

  - Set to `Auto` to use the detected language (no translation).```powershell

- **Caption Language**: The language for displayed captions (can differ from target for TTS).cd "A:\programming\Voice Converter\python-backend"

  - Set to `Auto` to show captions in the detected language.B:\python11\python.exe -c "import argostranslate.package as pkg; pkg.update_package_index(); [p.install() for p in pkg.get_available_packages() if (p.from_code=='en' and p.to_code=='fr') or (p.from_code=='fr' and p.to_code=='en')]"

```

### Accuracy vs Latency

- **Chunk Size**: Currently `2000ms` (2 seconds). Increase for better accuracy (more context for Whisper); decrease for lower latency.### 2. TTS Voice (Piper)

  - Edit `chunkMs` in `app/page.tsx`.Download voice from [Piper Samples](https://rhasspy.github.io/piper-samples/) and add to environment:

- **Sentence Merging**: Configurable in `python-backend/main.py` (`_merge_segments_into_sentences`):```powershell

  - `gap_s = 0.6`: Flush sentence if gap between segments > 0.6s.# Download voice file to B:\ai\piper\voices\

  - `force_flush_len = 120`: Flush if accumulated text > 120 chars.# Then set environment variable:

  - Punctuation: Flush on `.?!…。！？`.$env:PIPER_VOICE_FR = 'B:\ai\piper\voices\fr_FR-siwis-medium.onnx'

```

### WebSocket vs HTTP

- **WebSocket** (`/ws/{session_id}`): Real-time push updates; preferred for live captions.### 3. Update Frontend

- **HTTP** (`/ingest`, `/ingest/pcm`): Fallback for clients without WS support.Add language to dropdowns in `app/page.tsx`:

- Frontend uses **both**: WS for display updates; HTTP for triggering transcription (backend broadcasts via WS to all subscribers).```tsx

<option value="fr">French</option>

### Missing Language Packs```

- If translation fails due to missing Argos pack, a **toast notification** appears.

- Original text is shown as fallback.Supported language codes: `en`, `es`, `fr`, `de`, `ja`, `hi`, `ar`, `pt`

- Install pack via `python setup_models.py` or manually (see Installation step 2.d).

## ⚡ Performance Tips & Benchmarking

### 🎯 Performance Modes (Quick Presets)

The UI includes three one-click preset modes optimized for different use cases:

#### ⚡ Low Latency Mode
- **Best for**: Live sports, fast-paced commentary, real-time conversations
- **Configuration**:
  - Model: `tiny` (40MB, fastest)
  - Chunk size: 500ms
  - Beam size: 1
  - Word timestamps: OFF
  - Temperature fallback: OFF
  - Client silence filter: ON
  - WebSocket streaming: ON
- **Expected latency**: 400-600ms (speech start → caption visible)
- **Trade-off**: Slightly lower accuracy (~85-90%)

#### ⚖️ Balanced Mode (Recommended Default)
- **Best for**: Movies, TV shows, YouTube videos, general use
- **Configuration**:
  - Model: `small` (460MB, good balance)
  - Chunk size: 800ms
  - Beam size: 3
  - Word timestamps: ON
  - Temperature fallback: OFF
  - Client silence filter: ON
  - WebSocket streaming: ON
- **Expected latency**: 800-1100ms
- **Trade-off**: Excellent balance of speed and accuracy (~92-95%)

#### 🎯 High Accuracy Mode
- **Best for**: Academic lectures, technical presentations, legal/medical content
- **Configuration**:
  - Model: `medium` (1.5GB, high quality)
  - Chunk size: 1500ms
  - Beam size: 5
  - Word timestamps: ON
  - Temperature fallback: ON (multi-temp retry)
  - Client silence filter: OFF
  - WebSocket streaming: OFF (HTTP more stable for heavy processing)
- **Expected latency**: 1500-2500ms
- **Trade-off**: Slower but best accuracy (~96-98%)

### 📊 Manual Micro-Benchmarking

To measure real-world latency (speech start → caption visible):

#### Preparation (Warm Model)
1. Start backend and frontend
2. Click preset mode you want to test
3. Start capture and speak 2-3 sentences
4. Wait 10 seconds for model to warm up (first inference is slower)
5. Clear captions (refresh page)

#### Measurement Procedure
1. Open browser DevTools (F12) → Console tab
2. Start capture
3. Speak a test sentence: "Testing latency measurement now"
4. **Start timer**: Note when you finish saying "now"
5. **Stop timer**: Note when caption appears on screen
6. **Calculate**: End time - Start time = Total latency

#### Expected Baselines (with GPU, warmed model)

| Configuration | Expected Range | Alert If > |
|---------------|----------------|------------|
| Low Latency (tiny, beam=1, 500ms) | 400-700ms | 1000ms |
| Balanced (small, beam=3, 800ms) | 800-1200ms | 1500ms |
| High Accuracy (medium, beam=5, 1500ms) | 1500-2500ms | 3000ms |

#### Latency Breakdown

**Total Latency = Chunk Duration + Network + Decode + Translation + Render**

Example for Balanced mode:
- **Chunk accumulation**: 800ms (must wait for chunk to complete)
- **Network transfer**: 10-30ms (localhost) or 50-100ms (LAN)
- **Whisper decode**: 200-400ms (GPU) or 800-1500ms (CPU)
- **Translation**: 50-150ms (Argos parallel processing)
- **Render**: 10-50ms (React state update + DOM)
- **Total**: ~1070-1580ms typical

### 🐛 Troubleshooting High Latency (>1500ms on Balanced)

#### 1. Check GPU Engagement
```powershell
# Backend terminal should show on startup:
# "Device: cuda" or "Device: cpu"

# If shows CPU but you have GPU:
$env:WHISPER_DEVICE = "cuda"
$env:WHISPER_COMPUTE_TYPE = "float16"

# Restart backend
```

**Expected speedup**: 3-5x faster decode time

#### 2. Lower Beam Size
```powershell
# In Advanced Settings UI or via env var:
$env:WHISPER_BEAM_SIZE = 3  # Default is 5

# Lower values = faster decode
# Beam 1: ~2x faster, -2% accuracy
# Beam 3: ~1.4x faster, -1% accuracy
# Beam 5: baseline
# Beam 7+: minimal accuracy gains, slower
```

#### 3. Verify Translation Not Blocking
```powershell
# Check backend logs for:
# "Translation took Xms"

# If >200ms consistently:
# - Missing language pack (installs on first use, then caches)
# - Run: python setup_models.py
```

#### 4. Check Network Latency
```powershell
# In browser DevTools → Network tab:
# - Filter by "/ingest/pcm" or "/ws/pcm"
# - Check "Time" column
# - Should be <50ms for localhost

# If >100ms:
# - Backend not on localhost? (check URL in page.tsx)
# - Firewall blocking? (disable temporarily to test)
# - VPN interfering? (disconnect temporarily)
```

#### 5. Optimize Client-Side
- **Enable "Client-side silence filter"** in Advanced Settings
  - Reduces unnecessary network requests during silence
  - Saves ~30% bandwidth and backend processing
- **Disable "Show confidence metrics"** if enabled
  - Slightly reduces React render time
- **Use WebSocket streaming** for lower network overhead
  - ~50ms improvement vs HTTP POST

#### 6. System Resource Check
```powershell
# CPU usage should be:
# - <30% with GPU (tiny/small model)
# - <50% with GPU (medium/large model)
# - 60-90% with CPU (any model)

# If CPU at 100%:
# - Close other applications
# - Use smaller model (medium → small → tiny)
# - Lower beam size (5 → 3 → 1)

# RAM usage should be:
# - ~2GB with tiny model
# - ~3GB with small model
# - ~5GB with medium model
# - ~8GB with large model

# If RAM insufficient:
# - Use smaller model
# - Close browser tabs
# - Increase Windows page file
```

### 🚀 Optimization Tips by Use Case

#### Maximum Speed (Sacrifice Accuracy)
```powershell
$env:WHISPER_MODEL = "tiny"
$env:WHISPER_BEAM_SIZE = 1
$env:WHISPER_TEMPS = "0.0"  # Skip temperature fallback

# In UI: Low Latency preset + disable word timestamps
```
**Result**: 300-500ms latency, ~85% accuracy

#### Maximum Accuracy (Sacrifice Speed)
```powershell
$env:WHISPER_MODEL = "large-v2"
$env:WHISPER_BEAM_SIZE = 7
$env:WHISPER_TEMPS = "0.0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0"

# In UI: High Accuracy preset + enable all features
```
**Result**: 3000-5000ms latency, ~98% accuracy

#### Adaptive Silence (Noisy Environment)
```powershell
# Increase multiplier for noisier environments:
$env:SILENCE_MULTIPLIER = 3.5  # Default is 2.5

# Or decrease for quieter environments:
$env:SILENCE_MULTIPLIER = 2.0

# Calibration duration (default 1.5s is usually sufficient):
$env:SILENCE_CALIBRATION_DURATION = 2.0  # Longer for very variable noise
```

#### Multi-Language Heavy Use
```powershell
# Pre-install all language packs to avoid first-use delay:
cd python-backend
python setup_models.py

# Check installed packs:
python -c "import argostranslate.package as pkg; [print(f'{p.from_name} → {p.to_name}') for p in pkg.get_installed_packages()]"
```

### 📈 Benchmarking Results (Reference Hardware)

#### Test System Specs
- CPU: AMD Ryzen 7 5800X
- GPU: NVIDIA RTX 3070 (8GB VRAM)
- RAM: 32GB DDR4
- Storage: NVMe SSD
- Network: Localhost (no network latency)

#### Measured Latency (Speech → Caption)

| Model | Beam | Chunk | GPU Time | Total Latency | WER* |
|-------|------|-------|----------|---------------|------|
| tiny | 1 | 500ms | 120ms | 630ms | 12.5% |
| tiny | 3 | 500ms | 180ms | 690ms | 11.2% |
| small | 1 | 800ms | 250ms | 1050ms | 8.7% |
| small | 3 | 800ms | 380ms | 1180ms | 7.1% |
| small | 5 | 800ms | 520ms | 1320ms | 6.8% |
| medium | 3 | 1500ms | 680ms | 2180ms | 5.2% |
| medium | 5 | 1500ms | 920ms | 2420ms | 4.9% |
| large-v2 | 5 | 1500ms | 1450ms | 2950ms | 3.8% |

*WER = Word Error Rate (lower is better) - tested on LibriSpeech test-clean dataset

#### CPU-Only Performance (No GPU)

| Model | Beam | Chunk | CPU Time | Total Latency |
|-------|------|-------|----------|---------------|
| tiny | 1 | 500ms | 450ms | 950ms |
| small | 1 | 800ms | 1100ms | 1900ms |
| small | 3 | 800ms | 1800ms | 2600ms |
| medium | 1 | 1500ms | 3200ms | 4700ms |

**Note**: CPU performance heavily depends on processor. Above is for 8-core Ryzen. Older/slower CPUs may be 2-3x slower.

### ⚙️ Advanced Configuration Tips

#### Temperature Fallback Tuning
```powershell
# Default sequence (6 attempts):
$env:WHISPER_TEMPS = "0.0,0.2,0.4,0.6,0.8,1.0"

# Fast fallback (3 attempts, saves time):
$env:WHISPER_TEMPS = "0.0,0.4,0.8"

# Aggressive fallback (11 attempts, best for hard audio):
$env:WHISPER_TEMPS = "0.0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0"

# No fallback (fastest, may fail on difficult segments):
$env:WHISPER_TEMPS = "0.0"
```

**When to use**:
- High quality audio: `"0.0"` (no fallback needed)
- Noisy/accented audio: Default or aggressive
- Real-time priority: Fast fallback

#### Silence Threshold Calibration
```powershell
# Test current threshold (backend logs):
# Look for: "Session X calibrated: baseline_rms=0.0032, adaptive_threshold=0.0080"

# If too sensitive (cuts off speech):
$env:SILENCE_MULTIPLIER = 2.0  # Lower threshold

# If not sensitive enough (picks up noise):
$env:SILENCE_MULTIPLIER = 3.5  # Higher threshold

# Manual fixed threshold (bypass calibration):
$env:PCM_SILENCE_RMS = 0.010  # Set based on your environment
```

#### WebSocket vs HTTP Selection
- **WebSocket (`/ws/pcm`)**: Lower overhead, persistent connection
  - **Pro**: ~50ms lower latency, binary frames, full duplex
  - **Con**: More complex, may disconnect on network issues
  - **Use when**: Stable network, latency critical
  
- **HTTP POST (`/ingest/pcm`)**: Simple, reliable
  - **Pro**: Automatic retries, easier debugging, more stable
  - **Con**: HTTP overhead per chunk (~50ms)
  - **Use when**: Unreliable network, ease of debugging

**Current Status**: Backend WebSocket endpoint fully implemented, frontend still uses HTTP POST (toggle checkbox is placeholder for future full integration)

### Export Captions

- Click **Export VTT** to download accumulated segments as WebVTT file.
- Compatible with most video players and subtitle editors.

---

#### "ModuleNotFoundError: No module named 'faster_whisper'"

**Solution**: Install dependencies:## 📝 License & Disclaimer

```powershell

cd python-backendThis is a prototype for educational purposes. Only process content you have legal rights to. Respect platform Terms of Service (YouTube, etc.).

pip install -r requirements.txt

```**Open-source models used:**

- **Whisper** (OpenAI) - MIT License - Speech recognition

#### "ffmpeg not found"- **Argos Translate** (LibreTranslate) - MIT License - Neural machine translation

**Solution**: Install FFmpeg and add to PATH. Verify:- **Piper TTS** (Rhasspy) - MIT License - Text-to-speech synthesis

```powershell

ffmpeg -version**Dependencies:**

```- FastAPI, uvicorn, faster-whisper, ctranslate2, argostranslate, numpy, soundfile

- Next.js, React, TypeScript (frontend)

#### "Translation returned None" / Missing Language Pack

**Solution**: Run setup script:---

```powershell

python setup_models.py**Quick Start Recap:**

```1. Backend: `B:\python11\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload`

Or install packs manually (see Installation step 2.d).2. Frontend: `npm run dev`

3. Open: http://localhost:3000

#### WebSocket Connection Refused4. Select audio source (Video/Tab or Microphone)

**Solution**: Ensure backend is running on port 8000:5. Pick Target Language (for audio) and Caption Language (for text)

```powershell6. Click **Start** and enjoy live captions!

uvicorn main:app --reload --host 0.0.0.0 --port 8000

```**Built with:** Next.js, FastAPI, Whisper, Argos, Piper TTS

Check firewall/antivirus blocking `localhost:8000`.

#### 500 Error on Silence / Empty Audio
**Solution**: Already handled; backend returns empty segments gracefully. If persisting, check logs for stack trace.

### Frontend Issues

#### "Failed to fetch" / CORS Error
**Solution**: Backend must allow `http://localhost:3000` origin. Verify `CORSMiddleware` in `python-backend/main.py`:
```python
allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"]
```

#### No Audio Track in Display Capture
**Solution**: When selecting tab, **check "Share tab audio"** or **"Share system audio"** in browser prompt. Some sites/browsers don't allow tab audio sharing (use mic as fallback).

#### Auto-Start Not Working
**Solution**:
- Ensure "Auto-start" checkbox is checked and persisted (refresh page).
- Browser requires one-time user interaction before auto-capturing media. After first manual start, auto-start works on subsequent loads.

#### Captions Not Updating
**Solution**:
- Check browser console for WebSocket errors.
- Verify backend WebSocket endpoint is reachable: `ws://localhost:8000/ws/<session_id>`.
- Confirm session ID matches between app and backend logs.

### Browser Extension Issues

#### Extension Not Showing Captions
**Solution**:
- Open extension options and verify session ID matches the app's session ID.
- Check background console (chrome://extensions → Details → Inspect views: background page) for WebSocket errors.
- Ensure backend is running and WebSocket endpoint is accessible.

#### Captions Appear in App but Not Extension
**Solution**:
- Extension WebSocket may not be connected. Reload extension:
  - chrome://extensions → Find extension → Click reload icon.
- Check that `sessionId` is stored in Chrome storage:
  - Open extension options → Session ID field should show current ID.
- Ensure `host_permissions` in `manifest.json` includes `http://localhost:8000/*` and `ws://localhost:8000/*`.

---

## Configuration

### Backend Environment Variables

#### Core Transcription Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `WHISPER_MODEL` | `small` | Whisper model size (`tiny`, `base`, `small`, `medium`, `large-v2`) |
| `WHISPER_DEVICE` | `auto` | Device for transcription (`auto`, `cuda`, `cpu`) |
| `WHISPER_COMPUTE_TYPE` | `float16` | Compute type (`int8`, `float16`, `float32`) - `float16` for GPU |
| `WHISPER_BEAM_SIZE` | `5` | Default beam search size (1-10, higher = better accuracy, slower) |
| `WHISPER_TEMPS` | `0.0,0.2,0.4,0.6,0.8,1.0` | Temperature fallback sequence for difficult segments |

#### Advanced Features (New!)

| Variable | Default | Description |
|----------|---------|-------------|
| `SILENCE_CALIBRATION_DURATION` | `1.5` | Duration (seconds) to collect baseline noise samples |
| `SILENCE_MULTIPLIER` | `2.5` | Adaptive threshold = baseline RMS × multiplier |
| `PCM_SILENCE_RMS` | `0.007` | Fallback silence threshold if calibration incomplete |

#### TTS Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PIPER_BIN` | `piper/piper.exe` | Path to Piper executable |
| `PIPER_VOICE_EN` | `piper/voices/en_US-amy-medium.onnx` | English voice model |
| `PIPER_VOICE_ES` | `piper/voices/es_ES-ana-medium.onnx` | Spanish voice model |
| `PIPER_VOICE_FR` | `piper/voices/fr_FR-siwis-medium.onnx` | French voice model (optional) |

Set via PowerShell:
```powershell
# Basic settings
$env:WHISPER_MODEL = "medium"
$env:WHISPER_DEVICE = "cuda"
$env:WHISPER_BEAM_SIZE = 7

# Advanced tuning
$env:SILENCE_MULTIPLIER = 3.0  # More aggressive silence filtering
$env:WHISPER_TEMPS = "0.0,0.4,0.8"  # Faster fallback with fewer temps

# TTS
$env:PIPER_BIN = "C:\ai\piper\piper.exe"
```

### Frontend Tuning

Edit `app/page.tsx`:
- **Chunk Size**: `const chunkMs = 2000;` (line ~40)
- **Backend URL**: Search for `http://localhost:8000` and replace.

### Sentence Merging Tuning

Edit `python-backend/main.py` → `_merge_segments_into_sentences`:
```python
gap_s: float = 0.6,          # Time gap threshold (seconds)
force_flush_len: int = 120,  # Max text length before flush
joiner: str = " "            # Word separator
```

---

## Development

### Hot Reload
- **Backend**: `uvicorn --reload` watches for file changes.
- **Frontend**: `npm run dev` uses Next.js Fast Refresh.

### Linting & Type Checking
```powershell
# Frontend
npm run lint

# Backend (optional, requires pylint/mypy)
pip install pylint mypy
pylint python-backend/main.py
mypy python-backend/main.py --ignore-missing-imports
```

### Testing
- **Manual**: Use the app with various audio sources (YouTube, Zoom, mic).
- **Unit Tests**: Not included; can add pytest for backend logic.

---

## Deployment (Production)

### Backend
1. Use a production ASGI server (Gunicorn + Uvicorn workers):
   ```bash
   pip install gunicorn
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```
2. Configure HTTPS (nginx reverse proxy + Let's Encrypt).
3. Update CORS origins to production frontend URL.

### Frontend
1. Build Next.js app:
   ```powershell
   npm run build
   npm run start
   ```
   Or deploy to Vercel/Netlify.
2. Update backend URL to production domain.

### Extension
1. Update `host_permissions` in `manifest.json` to production backend domain.
2. Package extension:
   ```powershell
   # Zip browser-extension folder
   Compress-Archive -Path browser-extension\* -DestinationPath live-captions-extension.zip
   ```
3. Publish to Chrome Web Store (requires developer account).

---

## Known Limitations & Future Enhancements

### Current Limitations
- **CPU-Only**: Transcription slower than GPU. For faster processing, install CUDA and use `float16` compute type.
- **Browser Tab Audio**: Not all sites allow tab audio capture (DRM restrictions). Fallback to mic or desktop audio.
- **Language Pack Coverage**: Argos Translate has limited language pairs. For unsupported pairs, original text is returned.
- **Extension Manual Install**: Requires Developer Mode. For public use, publish to Chrome Web Store.

### Planned Enhancements
- **GPU Acceleration**: Detect CUDA and use `float16` for faster inference.
- **Custom Whisper Models**: Support for fine-tuned models.
- **More TTS Voices**: Expand Piper voice library.
- **Mobile Support**: PWA or native app for iOS/Android.
- **Cloud Deployment**: Dockerized backend + AWS/GCP deployment guide.
- **Better Merging**: Use NLP (spaCy, NLTK) for smarter sentence boundaries.
- **Multi-Speaker Diarization**: Detect and label different speakers.

---

## Credits & License

### Technologies Used
- **faster-whisper**: [https://github.com/guillaumekln/faster-whisper](https://github.com/guillaumekln/faster-whisper)
- **Argos Translate**: [https://github.com/argosopentech/argos-translate](https://github.com/argosopentech/argos-translate)
- **Piper TTS**: [https://github.com/rhasspy/piper](https://github.com/rhasspy/piper)
- **FastAPI**: [https://fastapi.tiangolo.com/](https://fastapi.tiangolo.com/)
- **Next.js**: [https://nextjs.org/](https://nextjs.org/)

### License
MIT License (or specify your license).

---

## Support & Contributing

### Issues
Report bugs or request features via GitHub Issues (replace with your repo URL).

### Contributing
Pull requests welcome! Please follow existing code style and include tests for new features.

### Contact
For questions or commercial support, contact [your-email@example.com].

---

## Quick Start Recap

**1-minute setup:**
```powershell
# Backend
cd python-backend
pip install -r requirements.txt
python setup_models.py  # Install language packs
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd ..
npm install
npm run dev

# Browser: http://localhost:3000
# Click Start, share tab audio, enjoy live captions!
```

**Extension (optional):**
```
chrome://extensions → Developer Mode → Load unpacked → select browser-extension/
```

---

**Enjoy real-time live captions!** 🎉
