'use client';
import React, { useRef, useState, useEffect } from 'react';
import Visualizer from './components/Visualizer';
import LiveStage from './components/LiveStage';
import ControlDeck from './components/ControlDeck';
import LanguageBar from './components/LanguageBar';
import SettingsDrawer from './components/SettingsDrawer';
import PiPCaptions from './components/PiPCaptions';

// --- Type Definitions ---
interface CaptionSegment {
  start: number;
  end: number;
  text: string;
  translated?: string;
  caption_text?: string;
  detected_lang?: string;
}
interface Toast { id: string; message: string; type: 'info' | 'success' | 'error'; }

export default function Home() {
  // --- State ---
  const [capturing, setCapturing] = useState(false);
  const [segments, setSegments] = useState<CaptionSegment[]>([]);
  const [liveText, setLiveText] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pipActive, setPipActive] = useState(false);

  // Load saved settings from localStorage
  const loadSetting = <T,>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') return fallback;
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch { return fallback; }
  };

  // Config State (loaded from localStorage)
  const [targetLang, setTargetLang] = useState(() => loadSetting('vc_targetLang', 'en'));
  const [captionLang, setCaptionLang] = useState(() => loadSetting('vc_captionLang', 'en'));
  const [chunkMs, setChunkMs] = useState(() => loadSetting('vc_chunkMs', 1200));
  const [showSettings, setShowSettings] = useState(false);

  // Consolidated Config Object (loaded from localStorage)
  const [config, setConfig] = useState(() => loadSetting('vc_config', {
    captureSource: 'video',
    whisperModel: 'deepdml/faster-whisper-large-v3-turbo-ct2',
    beamSize: 2,
    autoStart: false,
    showOriginal: false,
    showOverlayCaptions: false,
    useWebSocket: true,
    clientSilenceFilter: true,
    useTempFallback: false
  }));

  // Save settings to localStorage when they change
  useEffect(() => { localStorage.setItem('vc_targetLang', JSON.stringify(targetLang)); }, [targetLang]);
  useEffect(() => { localStorage.setItem('vc_captionLang', JSON.stringify(captionLang)); }, [captionLang]);
  useEffect(() => { localStorage.setItem('vc_chunkMs', JSON.stringify(chunkMs)); }, [chunkMs]);
  useEffect(() => { localStorage.setItem('vc_config', JSON.stringify(config)); }, [config]);

  const updateConfig = (k: string, v: any) => setConfig(prev => ({ ...prev, [k]: v }));

  // --- Refs ---
  const sessionIdRef = useRef<string>('');
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const wsPcmRef = useRef<WebSocket | null>(null);
  const pipRef = useRef<{ requestPiP: () => Promise<void> } | null>(null);
  const popupRef = useRef<Window | null>(null);

  // --- IO Logic ---
  useEffect(() => {
    // Session Init
    const existing = localStorage.getItem('sessionId');
    const sid = existing || crypto.randomUUID();
    sessionIdRef.current = sid;
    if (!existing) localStorage.setItem('sessionId', sid);

    // Main WS for Captions
    const connectWs = () => {
      try {
        const ws = new WebSocket(`ws://localhost:8000/ws/${sid}`);
        ws.onerror = () => { }; // Suppress connection errors in console
        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.event === 'segments') {
              const txt = data.liveCaption || data.liveTranslated || data.liveText || '';
              if (txt) setLiveText(txt);
              if (data.newSegments?.length) setSegments(prev => [...prev, ...data.newSegments]);
            }
            // Handle TTS
            if (data.ttsUrls?.length) {
              data.ttsUrls.forEach((url: string) => {
                new Audio(`http://localhost:8000${url}`).play().catch(() => { });
              });
            }
          } catch { }
        };
        wsRef.current = ws;
      } catch { }
    };
    connectWs();

    // Cleanup - safely close WebSocket
    return () => {
      try {
        if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
          wsRef.current.close();
        }
      } catch { }
    };
  }, []);

  // --- Capture Logic ---
  const startCapturePCM = async () => {
    try {
      setCapturing(true);
      setSegments([]);
      setLiveText('');

      let stream: MediaStream;
      if (config.captureSource === 'video') {
        stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: true });
        // Check for audio track
        if (stream.getAudioTracks().length === 0) {
          showToast('No audio! Please check "Share tab audio".', 'error');
          setCapturing(false);
          return;
        }
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      await audioCtx.audioWorklet.addModule('/audio-worklet-processor.js');
      const worklet = new AudioWorkletNode(audioCtx, 'pcm-capture-processor');

      // Calculate chunks
      const actualSr = audioCtx.sampleRate;
      const samplesPerChunk = Math.floor(actualSr * (chunkMs / 1000));
      worklet.port.postMessage({ chunkSize: samplesPerChunk, silenceThreshold: 0.007, skipSilence: config.clientSilenceFilter });
      workletNodeRef.current = worklet;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(worklet);

      // Stream handling
      worklet.port.onmessage = async (e) => {
        if (e.data.skipped) return;
        const pcm = e.data.pcm;

        // Params
        const params = new URLSearchParams({
          session: sessionIdRef.current,
          target: targetLang,
          caption_lang: captionLang,
          sample_rate: String(actualSr),
          beam_size: String(config.beamSize),
          use_temp_fallback: String(config.useTempFallback),
          model: config.whisperModel // Send selected model
        });

        if (config.useWebSocket) {
          // WS Stream - Properly wait for connection
          if (!wsPcmRef.current || wsPcmRef.current.readyState === WebSocket.CLOSED || wsPcmRef.current.readyState === WebSocket.CLOSING) {
            const ws = new WebSocket(`ws://localhost:8000/ws/pcm?${params}`);
            ws.binaryType = 'arraybuffer';
            ws.onmessage = (msg) => {
              try {
                const data = JSON.parse(msg.data);
                console.log('[DEBUG] WS Response:', data); // DEBUG
                // Prioritize liveCaption (translated) over liveText (original)
                const text = data.liveCaption || data.liveTranslated || data.liveText || '';
                if (text) {
                  console.log('[DEBUG] WS Setting liveText:', text);
                  setLiveText(text);
                  (window as any).voiceConverterCaption = text; // Sync to popup
                }
                if (data.newSegments?.length) {
                  console.log('[DEBUG] WS New segments:', data.newSegments); // DEBUG
                  setSegments(prev => [...prev, ...data.newSegments]);
                }
              } catch (e) { console.error("WS parse error", e); }
            };
            ws.onerror = (e) => console.error("WebSocket error", e);
            wsPcmRef.current = ws;
            // Wait for connection to actually open
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => reject(new Error("WS timeout")), 5000);
              ws.onopen = () => { clearTimeout(timeout); resolve(); };
            }).catch(() => { /* Ignore timeout, will fallback to HTTP */ });
          }
          // Only send if actually OPEN
          if (wsPcmRef.current?.readyState === WebSocket.OPEN) {
            wsPcmRef.current.send(pcm);
          }
        } else {
          // HTTP Fallback
          fetch(`http://localhost:8000/ingest/pcm?${params}`, {
            method: 'POST',
            body: new Uint8Array(pcm.buffer)
          }).then(r => r.json()).then(data => {
            console.log('[DEBUG] Backend response:', data); // DEBUG
            const text = data.liveCaption || data.liveText || '';
            if (text) {
              console.log('[DEBUG] Setting liveText:', text); // DEBUG
              setLiveText(text);
            }
            if (data.newSegments?.length) {
              console.log('[DEBUG] New segments:', data.newSegments); // DEBUG
              setSegments(prev => [...prev, ...data.newSegments]);
            }
          }).catch(err => console.error('[DEBUG] Fetch error:', err));
        }
      };

      // Auto-stop on stream end
      stream.getTracks().forEach(t => t.onended = stopCapture);

    } catch (err) {
      console.error(err);
      setCapturing(false);
      showToast('Capture failed. See console.', 'error');
    }
  };

  const stopCapture = () => {
    try { workletNodeRef.current?.disconnect(); } catch { }
    try {
      if (audioContextRef.current?.state !== 'closed') audioContextRef.current?.close();
    } catch { }
    try {
      if (wsPcmRef.current?.readyState === WebSocket.OPEN) wsPcmRef.current?.close();
    } catch { }
    wsPcmRef.current = null;
    audioContextRef.current = null;
    workletNodeRef.current = null;
    setCapturing(false);
    setLiveText('');
  };

  const handlePreset = (mode: 'low-latency' | 'balanced' | 'high-accuracy') => {
    if (mode === 'low-latency') {
      setChunkMs(500); updateConfig('beamSize', 1); updateConfig('whisperModel', 'tiny'); updateConfig('clientSilenceFilter', true);
    } else if (mode === 'balanced') {
      setChunkMs(600); updateConfig('beamSize', 2); updateConfig('whisperModel', 'small'); updateConfig('clientSilenceFilter', true);
    } else {
      setChunkMs(1000); updateConfig('beamSize', 3); updateConfig('whisperModel', 'medium'); updateConfig('clientSilenceFilter', true);
    }
  };

  const showToast = (msg: string, type: 'info' | 'error' = 'info') => {
    const id = Date.now().toString();
    setToasts(p => [...p, { id, message: msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  // --- Render ---
  return (
    <main className="h-screen w-full flex flex-col relative overflow-hidden">

      {/* Background Visualizer Layer */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <Visualizer isRecording={capturing} />
      </div>

      {/* Header */}
      <header className="z-10 p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${capturing ? 'bg-red-500 animate-pulse' : 'bg-secondary'}`} />
          <h1 className="text-xl font-bold tracking-tight">VOICE <span className="text-cyan-400">CONVERTER</span></h1>
        </div>
        <LanguageBar
          fromLang={captionLang} setFromLang={setCaptionLang}
          toLang={targetLang} setToLang={setTargetLang}
          disabled={capturing}
        />
      </header>

      {/* Main Stage */}
      <section className="flex-1 flex flex-col z-10 container mx-auto max-w-4xl">
        <LiveStage
          liveText={liveText}
          segments={segments}
          showTranslated={true}
          showOriginal={config.showOriginal}
        />
      </section>

      {/* Controls */}
      <ControlDeck
        capturing={capturing}
        onStart={startCapturePCM}
        onStop={stopCapture}
        onPreset={handlePreset}
        onToggleSettings={() => setShowSettings(true)}
      />

      {/* Settings */}
      <SettingsDrawer
        open={showSettings}
        onClose={() => setShowSettings(false)}
        config={config}
        setConfig={updateConfig}
      />

      {/* PiP Captions */}
      <PiPCaptions
        ref={pipRef}
        text={liveText}
        onClose={() => setPipActive(false)}
      />

      {/* Float Buttons */}
      {capturing && (
        <div className="fixed bottom-28 right-6 z-50 flex flex-col gap-2">
          {/* PiP Button */}
          {!pipActive && (
            <button
              onClick={() => {
                setPipActive(true);
                pipRef.current?.requestPiP();
              }}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all"
            >
              <span>🪟</span> Float (Tab)
            </button>
          )}

          {/* Popup Window Button */}
          <button
            onClick={() => {
              // Set global caption for popup to read
              (window as any).voiceConverterCaption = liveText;

              // Open popup window
              if (!popupRef.current || popupRef.current.closed) {
                popupRef.current = window.open(
                  '/caption-popup.html',
                  'VoiceConverterCaptions',
                  'width=700,height=120,top=50,left=100,toolbar=no,menubar=no,resizable=yes,scrollbars=no'
                );
              } else {
                popupRef.current.focus();
              }

              // Setup interval to sync captions
              const syncInterval = setInterval(() => {
                if (popupRef.current && !popupRef.current.closed) {
                  popupRef.current.postMessage({ type: 'caption', text: (window as any).voiceConverterCaption }, '*');
                } else {
                  clearInterval(syncInterval);
                }
              }, 100);
            }}
            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all"
          >
            <span>📺</span> Float (Window)
          </button>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed top-24 right-6 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className="bg-slate-800 text-white px-4 py-2 rounded shadow-lg border border-white/10 text-sm animate-fade-up">
            {t.message}
          </div>
        ))}
      </div>

    </main>
  );
}
