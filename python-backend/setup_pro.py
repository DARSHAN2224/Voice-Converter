"""
Setup script to download optimized Pro models (large-v3-turbo) to B: drive.
Run this: python setup_pro.py
"""
import os
import sys

# Force cache to B: drive (Open Source, Local)
os.environ['HUGGINGFACE_HUB_CACHE'] = r'B:\ai\cache\huggingface'

print("=" * 60)
print("Voice Converter - Pro Model Setup (High Accuracy / Low Latency)")
print("=" * 60)

print(f"\nTarget Directory: {os.environ['HUGGINGFACE_HUB_CACHE']}")

try:
    from faster_whisper import WhisperModel
except ImportError:
    print("✗ faster_whisper not found. Please activate your environment.")
    sys.exit(1)

MODEL_NAME = "deepdml/faster-whisper-large-v3-turbo-ct2"

print(f"\nDownloading {MODEL_NAME}...")
print("This provides near-Large accuracy with ~4x faster speed.")
print("Size: ~1.5 GB")

try:
    # This triggers the specific download
    model = WhisperModel(MODEL_NAME, device="cpu", compute_type="int8")
    print("\n✓ Model downloaded successfully!")
    print(f"✓ Location: {os.environ['HUGGINGFACE_HUB_CACHE']}")
except Exception as e:
    print(f"\n✗ Error downloading model: {e}")
    print("\nTip: Ensure you have ~2GB free space on adjacent B: drive.")
