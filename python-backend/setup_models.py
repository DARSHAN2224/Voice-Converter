"""
Setup script to download all required models to B: drive
Run this once: python setup_models.py
"""
import os
import sys

# Set cache directories to B: drive
os.environ['HUGGINGFACE_HUB_CACHE'] = r'B:\ai\cache\huggingface'
os.environ['ARGOS_TRANSLATE_DATA_DIR'] = r'B:\ai\argos'

print("=" * 60)
print("Voice Converter - Model Setup")
print("=" * 60)

# Create directories
print("\n1. Creating directories on B: drive...")
os.makedirs(r'B:\ai\cache\huggingface', exist_ok=True)
os.makedirs(r'B:\ai\argos', exist_ok=True)
os.makedirs(r'B:\ai\piper\voices', exist_ok=True)
print("✓ Directories created")

# Download Whisper model
print("\n2. Downloading Whisper 'small' model (~460 MB)...")
print("   This may take a few minutes depending on your connection.")
try:
    from faster_whisper import WhisperModel  # type: ignore
except ImportError:
    print("✗ faster_whisper not found in this interpreter. Activate Python 3.11 environment with installed dependencies.")
    sys.exit(1)
try:
    model = WhisperModel("small", device="cpu", compute_type="int8")
    print(f"✓ Whisper model ready (cached at {os.environ['HUGGINGFACE_HUB_CACHE']})")
except Exception as e:
    print(f"✗ Error initializing Whisper: {e}")
    sys.exit(1)

# Install Argos language packs
print("\n3. Downloading Argos Translate language packs...")
try:
    import argostranslate.package  # type: ignore
    argostranslate.package.update_package_index()
    available = argostranslate.package.get_available_packages()
    
    # Common language pairs for translation to English
    pairs = [
        ("en", "es"), ("es", "en"),  # Spanish
        ("ja", "en"), ("en", "ja"),  # Japanese
        ("pt", "en"), ("en", "pt"),  # Portuguese
        ("ko", "en"), ("en", "ko"),  # Korean
        ("zh", "en"), ("en", "zh"),  # Chinese
        ("fr", "en"), ("en", "fr"),  # French
        ("de", "en"), ("en", "de"),  # German
        ("it", "en"), ("en", "it"),  # Italian
        ("ru", "en"), ("en", "ru"),  # Russian
    ]
    installed_count = 0
    
    for from_code, to_code in pairs:
        candidates = [p for p in available if p.from_code == from_code and p.to_code == to_code]
        if candidates:
            print(f"   Installing {from_code} → {to_code}...")
            candidates[0].install()
            installed_count += 1
    
    print(f"✓ Installed {installed_count} Argos packs to {os.environ['ARGOS_TRANSLATE_DATA_DIR']}")
except Exception as e:
    print(f"✗ Error installing Argos packs: {e}")
    import traceback
    traceback.print_exc()

# Piper instructions
print("\n4. Piper TTS setup (manual):")
print("   Piper must be downloaded manually:")
print("   ")
print("   A. Download Piper for Windows:")
print("      https://github.com/rhasspy/piper/releases")
print("      Extract piper.exe to: B:\\ai\\piper\\piper.exe")
print("   ")
print("   B. Download voice models (.onnx + .onnx.json):")
print("      https://rhasspy.github.io/piper-samples/")
print("      Recommended voices:")
print("      - en_US-amy-medium")
print("      - es_ES-davefx-medium")
print("      Place in: B:\\ai\\piper\\voices\\")
print("   ")
print("   C. Set environment variables (run in PowerShell):")
print('      setx PIPER_BIN "B:\\ai\\piper\\piper.exe"')
print('      setx PIPER_VOICE_EN "B:\\ai\\piper\\voices\\en_US-amy-medium.onnx"')
print('      setx PIPER_VOICE_ES "B:\\ai\\piper\\voices\\es_ES-davefx-medium.onnx"')

print("\n" + "=" * 60)
print("Setup complete!")
print("=" * 60)
print("\nNext steps:")
print("1. Complete Piper setup (see instructions above)")
print("2. Ensure FFmpeg is installed and on PATH")
print("3. Start backend: uvicorn main:app --host 0.0.0.0 --port 8000")
print("4. Start frontend: npm run dev (in parent directory)")
print("5. Open http://localhost:3000")
