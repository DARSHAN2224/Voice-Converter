# 🎙️ Voice Converter

> Real-time speech transcription, translation, and text-to-speech for live audio using **100% local AI models**. No cloud APIs, no subscription fees, complete privacy.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Demo](#-demo)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Usage](#-usage)
- [Architecture](#-architecture)
- [Configuration](#-configuration)
- [Browser Extension](#-browser-extension)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

Voice Converter is a powerful real-time audio processing system that captures audio from browser tabs (YouTube, podcasts, streams) or your microphone, transcribes it using Whisper AI, translates it to any language, and synthesizes natural-sounding speech - all running locally on your machine.

**Perfect for:**
- 🎬 Watching foreign language content with live translated audio
- 🎓 Creating accessible captions for live streams
- 🗣️ Real-time translation for meetings and calls
- 📚 Learning languages with dual-language captions
- 🔒 Privacy-conscious users who want offline AI processing

---

## ✨ Features

### Core Features

- 🎙️ **Dual Audio Sources**: Capture from browser tabs (Chrome tab audio) OR microphone input
- ⚡ **Ultra-Low Latency**: Configurable modes (500ms fast, 800ms balanced, 1500ms accurate)
- 🗣️ **Real-Time Transcription**: Powered by faster-whisper with automatic language detection
- 🌍 **Intelligent Translation**: Dual-language support using Argos Translate
  - Translate audio to one language for TTS synthesis
  - Display captions in a different language simultaneously
  - Example: Watch Spanish video → hear English audio + see French captions
- 🔊 **Natural TTS**: High-quality voice synthesis with Piper TTS
- 💬 **Live Captions**: YouTube-style overlay with toggle for translated/original text
- 💾 **Export Captions**: Download WebVTT format for video editing
- 🔒 **100% Offline**: No API keys, no internet required after setup
- 💰 **Zero Cost**: All models run locally, no subscription fees

### Advanced Features

- 🎯 **Smart Presets**: One-click optimization (Low Latency / Balanced / High Accuracy)
- 📊 **Word-Level Timestamps**: Individual word timing with confidence scores
- 🔍 **Confidence Metrics**: Real-time quality indicators (compression ratio, log probability)
- 🎚️ **Adaptive Calibration**: Auto-adjusts to your microphone's background noise
- 🌡️ **Temperature Fallback**: Multi-pass transcription for challenging audio
- 🔇 **Smart Silence Detection**: Client-side filtering saves 30% bandwidth
- 🔌 **WebSocket Streaming**: Low-latency binary PCM audio streaming
- ⚙️ **Fine-Grained Controls**: Adjust model size, beam search, silence threshold
- 🔍 **Model Verification**: Check installed Argos translation language packs
- 🎨 **Visual Feedback**: Color-coded confidence highlighting in captions
- 🔄 **Session Management**: Persistent sessions with automatic reconnection

---

## 🎥 Demo

**Use Cases:**
- Watch anime with English audio + Japanese subtitles for language learning
- Live-translate international news broadcasts
- Create accessibility captions for online meetings
- Transcribe and translate podcasts in real-time

---

## 📦 Prerequisites

### System Requirements

- **OS**: Windows 10/11 (scripts are PowerShell-based)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: ~2GB for AI models
- **CPU**: Multi-core processor recommended (GPU optional for faster processing)

### Required Software

1. **Python 3.10 or higher**
   - Download from [python.org](https://www.python.org/downloads/)
   - Add to PATH during installation

2. **Node.js 18+ and npm**
   - Download from [nodejs.org](https://nodejs.org/)

3. **FFmpeg**
   - Download from [ffmpeg.org](https://ffmpeg.org/download.html)
   - Add to system PATH

4. **Git** (for cloning the repository)
   - Download from [git-scm.com](https://git-scm.com/)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/DARSHAN2224/Voice-Converter.git
cd Voice-Converter
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Setup Python Backend

```bash
cd python-backend
python -m venv .venv
.venv\Scripts\Activate.ps1  # Windows
# OR
source .venv/bin/activate   # Mac/Linux

pip install -r requirements.txt
```

### 4. Download AI Models

This will download Whisper, Argos Translate language packs, and Piper TTS voices (~1-2GB):

```bash
python setup_models.py
```

**Available Models:**
- `tiny` - Fastest, lowest accuracy (~75MB)
- `small` - Balanced (default) (~244MB)
- `medium` - High accuracy (~769MB)
- `large` - Best quality (~1.5GB)

### 5. Optional: Setup Piper TTS

For text-to-speech functionality:

```bash
.\setup_piper.ps1
```

---

## 🎯 Quick Start

### One-Command Startup (Recommended)

```bash
.\start.ps1
```

This automatically starts both backend and frontend servers in separate terminals.

Then open your browser to: **http://localhost:3000**

### Manual Startup

**Terminal 1 - Backend:**
```bash
cd python-backend
.\start_backend.ps1
```

**Terminal 2 - Frontend:**
```bash
.\start_frontend.ps1
```

---

## 📖 Usage

### Basic Workflow

1. **Open the Web Interface**: Navigate to `http://localhost:3000`

2. **Select Audio Source**:
   - **Browser Tab**: Choose "Tab Audio" and select the Chrome tab
   - **Microphone**: Choose "Mic" and select your input device

3. **Configure Languages**:
   - **Source Language**: Auto-detected by Whisper (or manually select)
   - **TTS Language**: Language for synthesized audio output
   - **Caption Language**: Language for on-screen captions

4. **Choose Quality Preset**:
   - ⚡ **Low Latency**: 500ms chunks, tiny model
   - ⚖️ **Balanced**: 800ms chunks, small model (default)
   - 🎯 **High Accuracy**: 1500ms chunks, medium model

5. **Start Capture**: Click "Start" and grant browser permissions

6. **Live Features**:
   - View real-time captions at the bottom
   - Hear synthesized translated audio
   - Monitor confidence scores
   - Export captions as WebVTT

### Advanced Settings

Access the settings drawer (⚙️ icon) to adjust:

- **Whisper Model Size**: tiny/small/medium/large
- **Beam Size**: Higher = more accurate, slower
- **Silence Threshold**: Adjust for your environment
- **Temperature Fallback**: Enable multi-pass transcription
- **Word Timestamps**: Show word-level timing data
- **Auto-start**: Begin capture on page load

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Web Browser                          │
│  ┌───────────────┐      ┌──────────────────┐          │
│  │  Next.js UI   │◄────►│ Audio Capture    │          │
│  │  (Port 3000)  │      │ (MediaRecorder)  │          │
│  └───────┬───────┘      └──────────────────┘          │
└──────────┼─────────────────────────────────────────────┘
           │ WebSocket/HTTP
           ▼
┌─────────────────────────────────────────────────────────┐
│              FastAPI Backend (Port 8000)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Whisper    │→ │    Argos     │→ │   Piper      │ │
│  │ Transcription│  │  Translation │  │     TTS      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 14 (React framework)
- TypeScript
- Tailwind CSS
- Web Audio API / MediaRecorder API
- WebSocket client

**Backend:**
- FastAPI (Python web framework)
- faster-whisper (Whisper implementation)
- Argos Translate (offline translation)
- Piper TTS (text-to-speech)
- WebSocket server

---

## ⚙️ Configuration

### Backend Configuration

Edit `python-backend/start_backend.ps1`:

```powershell
$env:WHISPER_MODEL = "small"       # tiny/small/medium/large
$env:WHISPER_DEVICE = "cpu"        # cpu/cuda
$env:WHISPER_COMPUTE = "int8"      # int8/float16/float32
$env:WHISPER_BEAM_SIZE = "5"       # 1-10 (higher = slower, more accurate)
$env:WHISPER_TEMPS = "0.0,0.2,0.4,0.6,0.8,1.0"  # Temperature fallback
```

### Frontend Configuration

Edit `next.config.js` or use environment variables:

```javascript
module.exports = {
  env: {
    NEXT_PUBLIC_BACKEND_URL: 'http://localhost:8000',
  },
}
```

### Performance Tuning

**For low latency:**
- Use `tiny` model
- Set chunk size to 500ms
- Reduce beam size to 1-3

**For accuracy:**
- Use `medium` or `large` model
- Set chunk size to 1500ms
- Increase beam size to 5-10
- Enable temperature fallback

---

## 🧩 Browser Extension

### Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `browser-extension` folder
5. Open extension options to configure session ID

### Features

- Inject captions directly on any webpage
- Auto-reconnect to backend WebSocket
- Configurable caption positioning and styling
- Syncs with main web app via session ID

---

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
- Ensure Python 3.10+ is installed: `python --version`
- Activate virtual environment first
- Check if port 8000 is available

**Models not downloading:**
- Check internet connection (needed for initial download)
- Ensure sufficient disk space (~2GB)
- Run `python setup_models.py` again

**No audio capture:**
- Grant browser microphone/tab audio permissions
- Check browser console for errors
- Try different audio source

**Poor transcription quality:**
- Use larger Whisper model
- Increase chunk size
- Adjust silence threshold
- Enable temperature fallback

**Translation not working:**
- Verify language pack installed: Check `/api/translation/available`
- Install pack: `argospm install translate-en_es` (example)

### Debug Mode

Enable verbose logging:

```bash
$env:LOG_LEVEL = "DEBUG"
.\start_backend.ps1
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests (if applicable)
5. Commit: `git commit -m "Add feature"`
6. Push: `git push origin feature-name`
7. Open a Pull Request

### Areas for Contribution

- Additional TTS voice models
- Support for more languages
- Performance optimizations
- UI/UX improvements
- Documentation
- Bug fixes

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **faster-whisper**: High-performance Whisper implementation
- **Argos Translate**: Offline translation engine
- **Piper TTS**: Neural text-to-speech
- **Next.js**: React framework
- **FastAPI**: Modern Python web framework

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/DARSHAN2224/Voice-Converter/issues)
- **Discussions**: [GitHub Discussions](https://github.com/DARSHAN2224/Voice-Converter/discussions)

---

## 🗺️ Roadmap

- [ ] Multi-speaker detection and labeling
- [ ] GPU acceleration for faster processing
- [ ] More TTS voice options
- [ ] Mobile app support
- [ ] Real-time diarization
- [ ] Custom vocabulary support
- [ ] Streaming service integrations

---

**Made with ❤️ by developers who believe in privacy, accessibility, and open-source AI**
