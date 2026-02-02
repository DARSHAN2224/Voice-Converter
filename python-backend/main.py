"""FastAPI backend for real-time transcription + translation + TTS"""

import os
import uuid
import tempfile
import logging
import asyncio
import shutil
import subprocess
import struct
import io
import array
import math
import wave
import numpy as np
import soundfile as sf
from typing import List, Dict, Any, Set, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, UploadFile, File, Query, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from faster_whisper import WhisperModel
import argostranslate.translate as argos_translate
import argostranslate.package

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s: %(message)s")

# ============================================================================
# Configuration
# ============================================================================

WHISPER_MODEL_SIZE = os.environ.get("WHISPER_MODEL", "small")
DEVICE = "cpu"  # Force CPU mode - cuDNN issues on this system
WHISPER_COMPUTE_TYPE = os.environ.get("WHISPER_COMPUTE_TYPE", "int8")
WHISPER_BEAM_SIZE = int(os.environ.get("WHISPER_BEAM_SIZE", "5"))
WHISPER_TEMPS = [0.0, 0.2]  # Reduced from 0.0-1.0 to prevent hallucinations

# Adaptive silence calibration
SILENCE_CALIBRATION_DURATION = float(os.environ.get("SILENCE_CALIBRATION_DURATION", "1.5"))
SILENCE_MULTIPLIER = float(os.environ.get("SILENCE_MULTIPLIER", "1.5"))  # Lowered from 2.5
MAX_SILENCE_THRESHOLD = 0.05  # Cap the threshold to avoid over-calibration

# Piper TTS configuration
PIPER_BIN = os.environ.get("PIPER_BIN", "piper/piper.exe")
VOICE_MAP = {
    "en": os.environ.get("PIPER_VOICE_EN", "piper/voices/en_US-amy-medium.onnx"),
    "es": os.environ.get("PIPER_VOICE_ES", "piper/voices/es_ES-ana-medium.onnx"),
}

_whisper_model = None
sessions: Dict[str, Dict[str, Any]] = {}

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Base Helpers
# ============================================================================

def ensure_session(session_id: str) -> Dict[str, Any]:
    if session_id not in sessions:
        sessions[session_id] = {
            "segments": [],
            "pending_buf": None,
            "accumulated_duration": 0.0,
            "subscribers": set(),
            "calibration_samples": [],
            "baseline_rms": None,
            "adaptive_threshold": None,
        }
    return sessions[session_id]


def ensure_argos_languages():
    logging.info("Argos Translate ready; install missing packs via setup_models.py if needed.")


def translate_text(text: str, source_lang: str, target_lang: str) -> tuple[str, bool]:
    if not text.strip():
        return "", False
    if source_lang == target_lang:
        return text, False
    try:
        out = argos_translate.translate(text, from_code=source_lang, to_code=target_lang)
        if not out:
            return text, True
        return out, False
    except Exception as e:
        msg = str(e).lower()
        missing = any(k in msg for k in ["no translation", "not found", "not available"])
        return text, missing


def run_piper(text: str, lang: str, out_dir: str) -> str:
    voice = VOICE_MAP.get(lang)
    if not voice or not os.path.exists(voice):
        return ""
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"tts_{uuid.uuid4().hex}.wav")
    try:
        cmd = [PIPER_BIN, "--model", voice, "--output", out_path]
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        proc.communicate(text)
        if proc.returncode == 0 and os.path.exists(out_path):
            return out_path
    except Exception:
        return ""
    return ""



# Global state for model
_whisper_model = None
_current_model_name = None

def get_model(model_name: str = None):
    global _whisper_model, _current_model_name
    
    # Default to env var if not specified
    target_model = model_name or WHISPER_MODEL_SIZE
    
    # If we already have the correct model loaded, return it
    if _whisper_model is not None and _current_model_name == target_model:
        return _whisper_model

    logging.info(f"Switching Whisper model: {_current_model_name} -> {target_model}")
    
    # Unload previous model if exists
    if _whisper_model is not None:
        del _whisper_model
        import gc
        gc.collect()
        if DEVICE == "cuda":
            import torch
            torch.cuda.empty_cache()

    # Load new model
    try:
        compute_type = WHISPER_COMPUTE_TYPE or ("float16" if DEVICE in ("cuda", "auto") else "int8")
        _whisper_model = WhisperModel(target_model, device=DEVICE, compute_type=compute_type)
        _current_model_name = target_model
        logging.info(f"Model {target_model} loaded successfully.")
    except Exception as e:
        logging.error(f"Failed to load model {target_model}: {e}")
        # Fallback to small if custom fails
        if target_model != "small":
            logging.info("Falling back to 'small' model...")
            return get_model("small")
        raise e

    return _whisper_model


async def _broadcast_segments(session_id: str, payload: Dict[str, Any]):
    sess = ensure_session(session_id)
    dead: Set[WebSocket] = set()
    for ws in tuple(sess.get("subscribers", set())):
        try:
            await ws.send_json(payload)
        except Exception:
            dead.add(ws)
    for ws in dead:
        try:
            sess["subscribers"].discard(ws)
        except Exception:
            pass


async def _write_temp(data: bytes) -> str:
    path = os.path.join(tempfile.gettempdir(), f"tmp_{uuid.uuid4().hex}.webm")
    def _w():
        with open(path, 'wb') as f:
            f.write(data)
    await asyncio.to_thread(_w)
    return path


# ============================================================================
# Transcription Logic (Advanced Features)
# ============================================================================

def _model_transcribe(model, path: str, word_timestamps: bool = False, beam_size: Optional[int] = None, temperature: Optional[float] = None):
    """Transcribe with configurable word timestamps, beam size, and temperature."""
    try:
        logging.info(f"[DEBUG] Starting transcription of {path}")
        kwargs = {
            "word_timestamps": word_timestamps,
            "beam_size": beam_size or WHISPER_BEAM_SIZE,
            "vad_filter": False,
        }
        if temperature is not None:
            kwargs["temperature"] = temperature
        
        segments, info = model.transcribe(path, **kwargs)
        lang = getattr(info, 'language', 'en')
        logging.info(f"[DEBUG] Transcription complete, lang={lang}, iterating segments...")
        segs = list(segments) if segments else []
        logging.info(f"[DEBUG] Got {len(segs)} segments")
        for i, s in enumerate(segs):
            logging.info(f"[DEBUG] Segment {i}: {getattr(s, 'text', '')}")
        return segs, lang, info
    except Exception as e:
        logging.error(f"[DEBUG] Transcribe error: {e}", exc_info=True)
        return [], 'en', None


def _model_transcribe_with_temp_fallback(model, path: str, word_timestamps: bool = False, beam_size: Optional[int] = None) -> Tuple[List, str, Any]:
    """Try multiple temperatures if initial decode fails or returns low confidence."""
    for temp in WHISPER_TEMPS:
        segs, lang, info = _model_transcribe(model, path, word_timestamps=word_timestamps, beam_size=beam_size, temperature=temp)
        if segs:
            # Check if we got reasonable output
            if len(segs) > 0:
                # If compression ratio or avg_logprob indicates good quality, accept
                compression = getattr(info, 'compression_ratio', 1.0) if info else 1.0
                if compression < 2.5:  # reasonable threshold
                    logging.info(f"Accepted transcription at temp={temp}, compression={compression:.2f}")
                    return segs, lang, info
        logging.info(f"Temp {temp} failed or low quality, trying next...")
    
    # If all fail, return whatever we got from last attempt
    return segs, lang, info


def _ffmpeg_decode_to_wav(src: str, dst: str):
    ffmpeg = shutil.which("ffmpeg") or "ffmpeg"
    cmd = [ffmpeg, "-hide_banner", "-loglevel", "error", "-nostdin", "-y", "-i", src, "-vn", "-ar", "16000", "-ac", "1", dst]
    proc = subprocess.run(cmd, capture_output=True)
    if proc.returncode != 0 or not os.path.exists(dst):
        raise RuntimeError(proc.stderr.decode(errors="ignore")[:200])


def _try_transcribe_with_fallback(model, path: str, *, keep: bool = False, word_timestamps: bool = False, beam_size: Optional[int] = None, use_temp_fallback: bool = True):
    """Try transcription with optional ffmpeg fallback and temperature fallback."""
    try:
        if use_temp_fallback:
            return _model_transcribe_with_temp_fallback(model, path, word_timestamps=word_timestamps, beam_size=beam_size)
        else:
            segs, lang, info = _model_transcribe(model, path, word_timestamps=word_timestamps, beam_size=beam_size)
            return segs, lang, info
    except Exception:
        wav = path + ".wav"
        try:
            _ffmpeg_decode_to_wav(path, wav)
            if use_temp_fallback:
                return _model_transcribe_with_temp_fallback(model, wav, word_timestamps=word_timestamps, beam_size=beam_size)
            else:
                segs, lang, info = _model_transcribe(model, wav, word_timestamps=word_timestamps, beam_size=beam_size)
                return segs, lang, info
        finally:
            if not keep and os.path.exists(wav):
                try: os.remove(wav)
                except Exception: pass


def _process_transcribed_segments(segments, lang: str) -> List[Dict[str, Any]]:
    """Process segments with optional confidence metrics and word-level data."""
    out: List[Dict[str, Any]] = []
    for s in segments or []:
        txt = (getattr(s, 'text', '') or '').strip()
        if not txt: continue
        
        seg_data = {
            "start": float(getattr(s, 'start', 0.0)),
            "end": float(getattr(s, 'end', 0.0)),
            "text": txt,
            "detected_lang": lang
        }
        
        # Add confidence metrics if available
        if hasattr(s, 'avg_logprob'):
            seg_data["avg_logprob"] = float(s.avg_logprob)
        if hasattr(s, 'compression_ratio'):
            seg_data["compression_ratio"] = float(s.compression_ratio)
        if hasattr(s, 'no_speech_prob'):
            seg_data["no_speech_prob"] = float(s.no_speech_prob)
        
        # Add word-level timestamps if available
        if hasattr(s, 'words') and s.words:
            seg_data["words"] = [
                {
                    "word": w.word,
                    "start": float(w.start),
                    "end": float(w.end),
                    "probability": float(getattr(w, 'probability', 1.0))
                }
                for w in s.words
            ]
        
        out.append(seg_data)
    return out


def _merge_segments_into_sentences(segs: List[Dict[str, Any]], gap_s: float = 0.6, force_flush_len: int = 120) -> List[Dict[str, Any]]:
    if not segs: return []
    end_marks = (".", "?", "!", "…", "。", "？", "！")
    def ends_sentence(t: str) -> bool: return t.strip().endswith(end_marks)
    merged: List[Dict[str, Any]] = []
    buf: Dict[str, Any] | None = None
    for seg in segs:
        if buf is None:
            buf = seg.copy(); continue
        gap = seg["start"] - buf["end"]
        if gap > gap_s or ends_sentence(buf["text"]) or len(buf["text"]) >= force_flush_len:
            merged.append(buf); buf = seg.copy(); continue
        buf["text"] = f"{buf['text']} {seg['text']}".strip()
        buf["end"] = seg["end"]
        if ends_sentence(buf["text"]):
            merged.append(buf); buf = None
    if buf: merged.append(buf)
    return merged


def _apply_target_translation(segs: List[Dict[str, Any]], target: str):
    if not segs: return
    tasks = []
    for i, seg in enumerate(segs):
        src = seg.get("detected_lang", "en")
        eff = src if target == "auto" else target
        txt = seg.get("text", "")
        if not txt.strip(): seg["translated"] = ""; continue
        if src == eff: seg["translated"] = txt
        else: tasks.append((i, txt, src, eff))
    def _do(t): idx, txt, s, d = t; out,_ = translate_text(txt, s, d); return idx, out
    if tasks:
        with ThreadPoolExecutor(max_workers=min(4, len(tasks))) as ex:
            for idx, out in ex.map(_do, tasks): segs[idx]["translated"] = out


def _apply_caption_language(segs: List[Dict[str, Any]], target: str, caption_lang: str) -> bool:
    missing = False
    tasks = []
    for i, seg in enumerate(segs):
        src = seg.get("detected_lang", "en")
        eff = src if target == "auto" else target
        if caption_lang == 'auto': seg["caption_text"] = seg.get("text", ""); continue
        if caption_lang == eff: seg["caption_text"] = seg.get("translated", seg.get("text", "")); continue
        if caption_lang == src: seg["caption_text"] = seg.get("text", ""); continue
        base = seg.get("translated", seg.get("text", ""))
        tasks.append((i, base, eff, caption_lang))
    def _do(t): idx, txt, s, d = t; out, miss = translate_text(txt, s, d); return idx, out, miss
    if tasks:
        with ThreadPoolExecutor(max_workers=min(4, len(tasks))) as ex:
            for idx, out, miss in ex.map(_do, tasks): segs[idx]["caption_text"] = out; missing = missing or miss
    return missing


def _finalize_segments(raw: List[Dict[str, Any]], sess: Dict[str, Any], *, target: str, caption_lang: str, offset: float = 0.0) -> tuple[List[Dict[str, Any]], bool]:
    for seg in raw:
        seg["start"] = float(seg.get("start", 0.0)) + offset
        seg["end"] = float(seg.get("end", 0.0)) + offset
    pending = sess.get("pending_buf")
    combined = ([] if not pending else [pending]) + raw
    merged = _merge_segments_into_sentences(combined)
    end_marks = (".", "?", "!", "…", "。", "？", "！")
    def complete(t: str) -> bool: return t.strip().endswith(end_marks)
    completed = merged; new_pending = None
    if merged:
        last = merged[-1]
        if not complete(last.get("text", "")):
            new_pending = last; completed = merged[:-1]
    _apply_target_translation(completed, target)
    missing_pack = _apply_caption_language(completed, target, caption_lang)
    if completed: sess["segments"].extend(completed)
    sess["pending_buf"] = new_pending
    return completed, missing_pack


def _compute_live_from_pending(pending: Dict[str, Any] | None, *, target: str, caption_lang: str) -> Dict[str, str]:
    if not pending: return {"liveText": "", "liveTranslated": "", "liveCaption": ""}
    src = pending.get("detected_lang", "en")
    txt = pending.get("text", "")
    
    # Translate to target language (or keep if auto/same)
    eff = src if target == "auto" else target
    translated = txt if src == eff else translate_text(txt, src, eff)[0]
    
    # ALWAYS translate to caption_lang (English) if different from source
    if src == caption_lang:
        caption = txt  # Source is already English
    elif caption_lang == 'auto':
        caption = txt  # Auto means show original
    else:
        # Translate from source language directly to caption_lang (English)
        caption, _ = translate_text(txt, src, caption_lang)
    
    logging.info(f"[CAPTION DEBUG] src={src}, caption_lang={caption_lang}, txt[:30]='{txt[:30] if txt else ''}', caption[:30]='{caption[:30] if caption else ''}'")
    return {"liveText": txt, "liveTranslated": translated, "liveCaption": caption}


def _maybe_synthesize_tts(segs: List[Dict[str, Any]], target: str, session: str) -> List[str]:
    urls = []
    out_dir = "tts"; os.makedirs(out_dir, exist_ok=True)
    for seg in segs:
        text = seg.get("translated", "").strip()
        if not text: continue
        path = run_piper(text, target, out_dir)
        if path: urls.append(f"/sessions/{session}/tts/{os.path.basename(path)}")
    return urls


# ============================================================================
# PCM Helpers
# ============================================================================

def _calculate_pcm_rms(pcm_float) -> float:
    """Calculate RMS (root mean square) of PCM audio samples."""
    if not pcm_float:
        return 0.0
    return math.sqrt(sum(s * s for s in pcm_float) / len(pcm_float))


def _update_calibration(sess: dict, rms: float, chunk_duration: float) -> bool:
    """Update adaptive silence calibration with new RMS sample."""
    if sess["baseline_rms"] is not None:
        return False  # Already calibrated
    
    sess["calibration_samples"].append(rms)
    calibration_duration = len(sess["calibration_samples"]) * chunk_duration
    
    if calibration_duration >= SILENCE_CALIBRATION_DURATION:
        # Finish calibration
        sess["baseline_rms"] = sum(sess["calibration_samples"]) / len(sess["calibration_samples"])
        raw_threshold = sess["baseline_rms"] * SILENCE_MULTIPLIER
        sess["adaptive_threshold"] = min(raw_threshold, MAX_SILENCE_THRESHOLD)  # Cap it
        logging.info(
            f"Session {sess.get('session_id', 'unknown')}: calibrated "
            f"baseline_rms={sess['baseline_rms']:.4f}, "
            f"raw_threshold={raw_threshold:.4f}, "
            f"capped_threshold={sess['adaptive_threshold']:.4f}"
        )
        sess["calibration_samples"] = []  # Free memory
        return True
    
    return False


def _get_silence_threshold(sess: dict) -> float:
    """Get the current silence threshold (adaptive or fallback)."""
    if sess["adaptive_threshold"] is not None:
        return sess["adaptive_threshold"]
    return float(os.environ.get("PCM_SILENCE_RMS", "0.007"))


def _pcm_to_wav(pcm_float, sample_rate: int) -> str:
    """Convert PCM float32 data to temporary WAV file. Returns path."""
    wav_path = os.path.join(tempfile.gettempdir(), f"tmp_{uuid.uuid4().hex}.wav")
    with wave.open(wav_path, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        pcm_int16 = (np.array(pcm_float, dtype=np.float32) * 32767).astype(np.int16)
        wf.writeframes(pcm_int16.tobytes())
    return wav_path


def _build_silence_response(sess: dict, rms: float, silence_threshold: float, target: str, caption_lang: str) -> dict:
    """Build JSON response for silent PCM chunk."""
    live_bundle = _compute_live_from_pending(sess.get("pending_buf"), target=target, caption_lang=caption_lang)
    return {
        "silence": True,
        "rms": rms,
        "threshold": silence_threshold,
        "calibrating": sess["baseline_rms"] is None,
        "newSegments": [],
        **live_bundle
    }


def _build_transcription_response(
    sess: dict,
    finalized_segments: list[dict],
    tts_urls: list[str],
    missing_pack: bool,
    rms: float,
    silence_threshold: float,
    target: str,
    caption_lang: str
) -> dict:
    """Build JSON response for successfully transcribed PCM chunk."""
    live_bundle = _compute_live_from_pending(sess.get("pending_buf"), target=target, caption_lang=caption_lang)
    
    if live_bundle["liveText"]:
        live_text = live_bundle["liveText"]
        live_translated = live_bundle["liveTranslated"]
        live_caption = live_bundle["liveCaption"]
    else:
        live_text = finalized_segments[-1]["text"] if finalized_segments else ""
        live_translated = finalized_segments[-1].get("translated") if finalized_segments else ""
        live_caption = finalized_segments[-1].get("caption_text", live_translated) if finalized_segments else ""
    
    return {
        "liveText": live_text,
        "liveTranslated": live_translated,
        "liveCaption": live_caption,
        "newSegments": finalized_segments,
        "ttsUrls": tts_urls,
        "missingLanguagePack": f"{target}-{caption_lang}" if finalized_segments and missing_pack else None,
        "rms": rms,
        "threshold": silence_threshold,
        "calibrating": sess["baseline_rms"] is None
    }


# ============================================================================
# Endpoints
# ============================================================================

@app.on_event("startup")
def startup():
    ensure_argos_languages()


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/ingest/pcm")
async def ingest_pcm(
    request: Request,
    session: str = Query(...),
    target: str = Query("es"),
    caption_lang: str = Query("es"),
    sample_rate: int = Query(16000),
    word_timestamps: bool = Query(False),
    beam_size: Optional[int] = Query(None),
    use_temp_fallback: bool = Query(True),
    model: str = Query("small"),  # New param
):
    """
    Ingest raw PCM float32 [-1,1] and transcribe with adaptive silence gating.
    """
    # Parse PCM data
    body = await request.body()
    if not body:
        return JSONResponse({"error": "empty PCM data"}, status_code=400)
    
    if len(body) % 4 != 0:
        return {"silence": True, "newSegments": []}
    
    pcm_float = array.array('f', body)
    if not pcm_float:
        return {"silence": True, "newSegments": []}
    
    # Initialize session and timing
    sess = ensure_session(session)
    chunk_duration = len(pcm_float) / sample_rate
    time_offset = sess.get("accumulated_duration", 0.0)
    
    # Calculate RMS and update calibration
    rms = _calculate_pcm_rms(pcm_float)
    _update_calibration(sess, rms, chunk_duration)
    
    # Determine silence threshold and check for silence
    silence_threshold = _get_silence_threshold(sess)
    
    if rms < silence_threshold:
        sess["accumulated_duration"] = time_offset + chunk_duration
        return _build_silence_response(sess, rms, silence_threshold, target, caption_lang)
    
    # Transcribe the audio chunk
    wav_path = None
    try:
        # Convert PCM to WAV
        wav_path = _pcm_to_wav(pcm_float, sample_rate)
        
        # Transcribe with advanced features
        model_instance = get_model(model)
        segs, lang, _ = _try_transcribe_with_fallback(
            model_instance, wav_path, keep=False,
            word_timestamps=word_timestamps,
            beam_size=beam_size,
            use_temp_fallback=use_temp_fallback
        )
        raw_segments = _process_transcribed_segments(segs, lang)
        
        # Finalize segments (sentence merging, translation)
        finalized_segments, missing_pack = _finalize_segments(
            raw_segments, sess, target=target, caption_lang=caption_lang, offset=time_offset
        )
        sess["accumulated_duration"] = time_offset + chunk_duration
        
    except Exception as e:
        logging.error(f"PCM transcription failed: {e}")
        return JSONResponse({"error": f"PCM transcription failed: {e}"}, status_code=500)
    
    finally:
        if wav_path:
            try: os.remove(wav_path)
            except Exception: pass
    
    # Synthesize TTS and build response
    tts_urls = _maybe_synthesize_tts(finalized_segments, target, session)
    response = _build_transcription_response(
        sess, finalized_segments, tts_urls, missing_pack, rms, silence_threshold, target, caption_lang
    )
    
    # Broadcast to WebSocket subscribers
    await _broadcast_segments(session, {
        "event": "segments",
        "liveText": response["liveText"],
        "liveTranslated": response["liveTranslated"],
        "liveCaption": response["liveCaption"],
        "newSegments": finalized_segments,
        "hasPending": bool(sess.get("pending_buf")),
    })
    
    return response


@app.post("/ingest")
async def ingest(
    session: str = Query(...),
    target: str = Query("es"),
    caption_lang: str = Query("es"),
    keep: bool = Query(False),
    file: UploadFile = File(...),
):
    """
    Standard ingestion for file uploads (non-PCM).
    """
    data = await file.read()
    if not data: return JSONResponse({"error": "empty chunk"}, status_code=400)
    sess = ensure_session(session)
    in_path = await _write_temp(data)
    try:
        # Use the rich transcription fallback
        model = get_model()
        segs, lang, _ = _try_transcribe_with_fallback(model, in_path, keep=keep)
        raw = _process_transcribed_segments(segs, lang)
        
        finalized, missing_pack = _finalize_segments(raw, sess, target=target, caption_lang=caption_lang, offset=sess.get("accumulated_duration", 0.0))
        # approximate duration using last end
        if raw: sess["accumulated_duration"] = raw[-1]["end"]
    except Exception as e:
        return JSONResponse({"error": f"transcription failed: {e}"}, status_code=500)
    finally:
        if not keep:
            try: os.remove(in_path)
            except Exception: pass
            
    tts_urls = _maybe_synthesize_tts(finalized, target, session)
    live = _compute_live_from_pending(sess.get("pending_buf"), target=target, caption_lang=caption_lang)
    live_text = live["liveText"] or (finalized[-1]["text"] if finalized else "")
    live_translated = live["liveTranslated"] or (finalized[-1].get("translated", "") if finalized else "")
    live_caption = live["liveCaption"] or (finalized[-1].get("caption_text", live_translated) if finalized else "")
    
    await _broadcast_segments(session, {
        "event": "segments",
        "liveText": live_text,
        "liveTranslated": live_translated,
        "liveCaption": live_caption,
        "newSegments": finalized,
        "hasPending": bool(sess.get("pending_buf")),
    })
    return {
        "liveText": live_text,
        "liveTranslated": live_translated,
        "liveCaption": live_caption,
        "newSegments": finalized,
        "ttsUrls": tts_urls,
        "missingLanguagePack": f"{target}-{caption_lang}" if finalized and missing_pack else None
    }


@app.websocket("/ws/pcm")
async def websocket_pcm_stream(websocket: WebSocket):
    """WebSocket endpoint for streaming binary PCM chunks (lower overhead than HTTP POST)."""
    await websocket.accept()
    
    # Parse query params from websocket
    session_id = websocket.query_params.get("session", str(uuid.uuid4()))
    target = websocket.query_params.get("target", "es")
    caption_lang = websocket.query_params.get("caption_lang", "es")
    sample_rate = int(websocket.query_params.get("sample_rate", "16000"))
    word_timestamps = websocket.query_params.get("word_timestamps", "false").lower() == "true"
    beam_size = websocket.query_params.get("beam_size")
    if beam_size:
        beam_size = int(beam_size)
    use_temp_fallback = websocket.query_params.get("use_temp_fallback", "true").lower() == "true"
    
    sess = ensure_session(session_id)
    logging.info(f"WS PCM stream started: session={session_id}, target={target}, sample_rate={sample_rate}")
    
    try:
        while True:
            # Receive binary PCM data
            data = await websocket.receive_bytes()
            if not data: continue
            
            import array
            if len(data) % 4 != 0:
                await websocket.send_json({"silence": True, "newSegments": []})
                continue
            
            pcm_float = array.array('f', data)
            if not pcm_float:
                await websocket.send_json({"silence": True, "newSegments": []})
                continue
            
            # Calculate timing and RMS
            chunk_duration = len(pcm_float) / sample_rate
            time_offset = sess.get("accumulated_duration", 0.0)
            
            rms = _calculate_pcm_rms(pcm_float)
            _update_calibration(sess, rms, chunk_duration)
            
            # Check for silence
            silence_threshold = _get_silence_threshold(sess)
            logging.info(f"[DEBUG] RMS={rms:.4f}, threshold={silence_threshold:.4f}, is_silence={rms < silence_threshold}")
            
            if rms < silence_threshold:
                sess["accumulated_duration"] = time_offset + chunk_duration
                response = _build_silence_response(sess, rms, silence_threshold, target, caption_lang)
                await websocket.send_json(response)
                continue
            
            logging.info(f"[DEBUG] Audio is NOT silent, proceeding to transcription...")
            
            # Transcribe the audio chunk
            wav_path = None
            try:
                # Convert PCM to WAV (using helper)
                wav_path = _pcm_to_wav(pcm_float, sample_rate)
                
                # Get model from query params
                model_name = websocket.query_params.get("model", "small")
                
                # Transcribe with advanced features
                model_instance = get_model(model_name)
                segs, lang, _ = _try_transcribe_with_fallback(
                    model_instance, wav_path, keep=False,
                    word_timestamps=word_timestamps,
                    beam_size=beam_size,
                    use_temp_fallback=use_temp_fallback
                )
                raw_segments = _process_transcribed_segments(segs, lang)
                logging.info(f"WS PCM transcribed: lang={lang}, segments={len(raw_segments)}, text={[s.get('text','') for s in raw_segments]}")
                
                # Finalize segments
                finalized_segments, missing_pack = _finalize_segments(
                    raw_segments, sess, target=target, caption_lang=caption_lang, offset=time_offset
                )
                sess["accumulated_duration"] = time_offset + chunk_duration
                
            except Exception as e:
                logging.error(f"WS PCM transcription failed: {e}")
                await websocket.send_json({"error": f"Transcription failed: {e}"})
                continue
            
            finally:
                if wav_path:
                    try: os.remove(wav_path)
                    except Exception: pass
            
            # Synthesize TTS and build response
            tts_urls = _maybe_synthesize_tts(finalized_segments, target, session_id)
            response = _build_transcription_response(
                sess, finalized_segments, tts_urls, missing_pack, rms, silence_threshold, target, caption_lang
            )
            
            # Send response via WebSocket
            await websocket.send_json(response)
            
            # Also broadcast to other subscribers
            await _broadcast_segments(session_id, {
                "event": "segments",
                "liveText": response["liveText"],
                "liveTranslated": response["liveTranslated"],
                "liveCaption": response["liveCaption"],
                "newSegments": finalized_segments,
                "hasPending": bool(sess.get("pending_buf")),
            })
    
    except WebSocketDisconnect:
        logging.info(f"WS PCM stream disconnected: session={session_id}")
    except Exception as e:
        logging.error(f"WS PCM stream error: {e}")
        try: await websocket.close()
        except Exception: pass


@app.websocket("/ws/{session_id}")
async def ws_session(session_id: str, websocket: WebSocket):
    await websocket.accept()
    sess = ensure_session(session_id)
    sess["subscribers"].add(websocket)
    logging.info(f"WS accepted session={session_id} active_subscribers={len(sess['subscribers'])}")
    try:
        try:
            await websocket.send_json({"event": "hello", "session": session_id})
        except Exception: pass
        while True:
            try: await websocket.receive_text()
            except WebSocketDisconnect: break
            except Exception: await asyncio.sleep(0.1)
    finally:
        try: sess["subscribers"].discard(websocket)
        except Exception: pass
        logging.info(f"WS closed session={session_id}")


@app.get("/sessions/{session_id}/tts/{file_name}")
async def get_tts_file(session_id: str, file_name: str):
    path = os.path.join("tts", file_name)
    if not os.path.exists(path):
        return JSONResponse({"error": "not found"}, status_code=404)
    return FileResponse(path, media_type="audio/wav")


@app.get("/sessions/{session_id}/segments")
async def list_segments(session_id: str):
    sess = ensure_session(session_id)
    return {"segments": sess["segments"]}


@app.get("/api/translation/available")
async def get_available_translations():
    """Return list of installed Argos Translate language packs."""
    try:
        installed = argostranslate.package.get_installed_packages()
        packs = []
        for pkg in installed:
            packs.append({
                "from_code": pkg.from_code,
                "to_code": pkg.to_code,
                "from_name": pkg.from_name,
                "to_name": pkg.to_name,
                "package_version": getattr(pkg, 'package_version', 'unknown')
            })
        return {"available": True, "packs": packs, "count": len(packs)}
    except Exception as e:
        return {"available": False, "error": str(e), "packs": []}


@app.get("/api/config/models")
async def get_available_models():
    """Return available Whisper model sizes and current configuration."""
    return {
        "available_models": ["tiny", "tiny.en", "base", "base.en", "small", "small.en", "medium", "medium.en", "large-v1", "large-v2", "large-v3"],
        "current_model": WHISPER_MODEL_SIZE,
        "current_device": DEVICE,
        "current_compute_type": WHISPER_COMPUTE_TYPE or "auto",
        "current_beam_size": WHISPER_BEAM_SIZE,
        "temperature_sequence": WHISPER_TEMPS
    }
