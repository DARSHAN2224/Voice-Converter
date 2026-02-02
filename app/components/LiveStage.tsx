import React, { useEffect, useRef } from 'react';

interface Segment {
    text: string;
    translated?: string;
    caption_text?: string;
}

interface LiveStageProps {
    liveText: string;
    segments: Segment[];
    showTranslated: boolean;
    showOriginal: boolean;
}

export default function LiveStage({ liveText, segments, showTranslated, showOriginal }: LiveStageProps) {
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [liveText, segments]);

    return (
        <div className="flex-1 flex flex-col p-4 overflow-y-auto scroll-hide relative">
            {/* History */}
            <div className="flex flex-col gap-3 mb-6 text-base text-secondary opacity-70">
                {segments.slice(-10).map((s, i) => ( // Show last 10
                    <div key={i} className="animate-fade-up">
                        {showTranslated && (
                            <div className="text-white text-lg font-medium leading-relaxed">
                                {s.caption_text || s.translated || s.text}
                            </div>
                        )}
                        {showOriginal && (
                            <div className="text-xs text-cyan-400 opacity-60 font-mono mt-1">
                                {s.text}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Live Active Line */}
            <div className="mt-auto">
                <h3 className="text-secondary text-[10px] uppercase tracking-widest mb-2 opacity-50">Live feed</h3>
                <div className="glass-panel p-4 rounded-xl border-l-4 border-l-cyan-500">
                    {liveText ? (
                        <span className="text-2xl md:text-3xl text-white font-semibold leading-tight neon-text">
                            {liveText}
                            <span className="animate-pulse inline-block w-2 h-6 bg-cyan-400 ml-2 align-middle"></span>
                        </span>
                    ) : (
                        <span className="text-xl text-gray-600 italic">Listening for audio...</span>
                    )}
                </div>
            </div>
            <div ref={endRef} />
        </div>
    );
}
