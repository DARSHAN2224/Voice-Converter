import React from 'react';

interface LanguageBarProps {
    fromLang: string;
    setFromLang: (l: string) => void;
    toLang: string;
    setToLang: (l: string) => void;
    disabled: boolean;
}

const LANGUAGES = [
    { code: 'auto', name: '✨ Auto-Detect' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'ja', name: 'Japanese' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ko', name: 'Korean' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ar', name: 'Arabic' },
    { code: 'pt', name: 'Portuguese' },
];

export default function LanguageBar({ fromLang, setFromLang, toLang, setToLang, disabled }: LanguageBarProps) {
    return (
        <div className="flex flex-wrap items-center justify-center gap-4 py-4">

            {/* Target Lang */}
            <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-lg">
                <span className="text-secondary text-sm font-semibold uppercase tracking-wider">Target</span>
                <select
                    value={toLang}
                    onChange={(e) => setToLang(e.target.value)}
                    disabled={disabled}
                    className="bg-transparent border-none text-white font-medium focus:ring-0 cursor-pointer"
                >
                    {LANGUAGES.map(l => (
                        <option key={l.code} value={l.code} className="bg-slate-900 text-white">{l.name}</option>
                    ))}
                </select>
            </div>

            {/* Arrow */}
            <svg className="w-5 h-5 text-secondary opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>

            {/* Caption Lang */}
            <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-lg">
                <span className="text-secondary text-sm font-semibold uppercase tracking-wider">Caps</span>
                <select
                    value={fromLang}
                    onChange={(e) => setFromLang(e.target.value)}
                    disabled={disabled}
                    className="bg-transparent border-none text-white font-medium focus:ring-0 cursor-pointer"
                >
                    {LANGUAGES.map(l => (
                        <option key={l.code} value={l.code} className="bg-slate-900 text-white">{l.name}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
