import React from 'react';

interface ControlDeckProps {
    capturing: boolean;
    onStart: () => void;
    onStop: () => void;
    onPreset: (mode: 'low-latency' | 'balanced' | 'high-accuracy') => void;
    onToggleSettings: () => void;
}

export default function ControlDeck({ capturing, onStart, onStop, onPreset, onToggleSettings }: ControlDeckProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 p-6 z-20 pointer-events-none">
            <div className="max-w-4xl mx-auto glass-panel rounded-full p-2 flex items-center justify-between pointer-events-auto">

                {/* Presets */}
                <div className="flex gap-2 hidden md:flex">
                    <button onClick={() => onPreset('low-latency')} className="glass-button px-4 py-2 rounded-full text-xs font-semibold text-green-400 hover:text-green-300">
                        ⚡ Fast
                    </button>
                    <button onClick={() => onPreset('balanced')} className="glass-button px-4 py-2 rounded-full text-xs font-semibold text-blue-400 hover:text-blue-300">
                        ⚖️ Bal
                    </button>
                    <button onClick={() => onPreset('high-accuracy')} className="glass-button px-4 py-2 rounded-full text-xs font-semibold text-purple-400 hover:text-purple-300">
                        🎯 Best
                    </button>
                </div>

                {/* Main Action */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    {!capturing ? (
                        <button
                            onClick={onStart}
                            className="w-16 h-16 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all transform hover:scale-110"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        </button>
                    ) : (
                        <button
                            onClick={onStop}
                            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-400 text-white flex items-center justify-center recording-pulse shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-all"
                        >
                            <div className="w-6 h-6 bg-white rounded-md"></div>
                        </button>
                    )}
                </div>

                {/* Settings Toggle */}
                <button onClick={onToggleSettings} className="glass-button ml-auto px-6 py-2 rounded-full flex items-center gap-2">
                    <span>Settings</span>
                    <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
            </div>
        </div>
    );
}
