import React from 'react';

interface SettingsDrawerProps {
    open: boolean;
    onClose: () => void;
    config: any;
    setConfig: (key: string, val: any) => void;
}

export default function SettingsDrawer({ open, onClose, config, setConfig }: SettingsDrawerProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-80 glass-panel shadow-2xl z-50 transform transition-transform animate-fade-up border-l border-r-0 border-y-0 text-sm">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="font-semibold text-lg">Configuration</h2>
                <button onClick={onClose} className="hover:text-white text-secondary">✕</button>
            </div>

            <div className="p-6 flex flex-col gap-6 overflow-y-auto h-full pb-20">

                {/* Source */}
                <div className="space-y-2">
                    <label className="text-secondary uppercase text-xs font-bold tracking-wider">Input Source</label>
                    <select
                        className="w-full bg-white/5 border border-white/10 rounded p-2 text-white"
                        value={config.captureSource}
                        onChange={(e) => setConfig('captureSource', e.target.value)}
                    >
                        <option value="video" className="bg-slate-900">System Audio (Video/Tab)</option>
                        <option value="mic" className="bg-slate-900">Microphone</option>
                    </select>
                </div>

                {/* Model */}
                <div className="space-y-2">
                    <label className="text-secondary uppercase text-xs font-bold tracking-wider">AI Model</label>
                    <select
                        className="w-full bg-white/5 border border-white/10 rounded p-2 text-white"
                        value={config.whisperModel}
                        onChange={(e) => setConfig('whisperModel', e.target.value)}
                    >
                        <option value="tiny" className="bg-slate-900">Tiny (Fastest)</option>
                        <option value="small" className="bg-slate-900">Small (Balanced)</option>
                        <option value="medium" className="bg-slate-900">Medium (Best Standard)</option>
                        <option value="deepdml/faster-whisper-large-v3-turbo-ct2" className="bg-slate-900 font-bold text-cyan-400">⚡ Turbo V3 (Recommended)</option>
                        <option value="large-v2" className="bg-slate-900">Large-V2 (Slow, Pro)</option>
                    </select>
                </div>

                {/* Toggles */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={config.autoStart} onChange={(e) => setConfig('autoStart', e.target.checked)} />
                        <span>Auto-Start on Load</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={config.showOriginal} onChange={(e) => setConfig('showOriginal', e.target.checked)} />
                        <span>Show Original Text</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={config.showOverlayCaptions} onChange={(e) => setConfig('showOverlayCaptions', e.target.checked)} />
                        <span>Enable Overlay</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={config.useWebSocket} onChange={(e) => setConfig('useWebSocket', e.target.checked)} />
                        <span>Use WebSocket (Faster)</span>
                    </label>
                </div>

            </div>
        </div>
    );
}
