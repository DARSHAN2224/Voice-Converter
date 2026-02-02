import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
    isRecording: boolean;
    audioData?: Float32Array; // Optional real PCM data hook if we want to pass it down
}

export default function Visualizer({ isRecording }: VisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        let width = canvas.width;
        let height = canvas.height;

        // Resize handler
        const resize = () => {
            width = canvas.width = canvas.offsetWidth;
            height = canvas.height = canvas.offsetHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Simulated visualization loop (since we might not have raw PCM in this component easily)
        // In a real integration, we'd pass the AnalyserNode data here.
        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            if (!isRecording) {
                // Flat line
                ctx.beginPath();
                ctx.moveTo(0, height / 2);
                ctx.lineTo(width, height / 2);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.stroke();
                return;
            }

            // Dynamic wave
            const time = Date.now() / 100;
            ctx.beginPath();
            ctx.moveTo(0, height / 2);

            for (let i = 0; i < width; i++) {
                // Create a nice looking wave interaction
                const amplitude = 20 + Math.sin(time * 2) * 10;
                const wave1 = Math.sin(i * 0.02 + time) * amplitude;
                const wave2 = Math.sin(i * 0.05 - time) * (amplitude / 2);
                const y = height / 2 + wave1 + wave2;
                ctx.lineTo(i, y);
            }

            ctx.strokeStyle = '#06b6d4'; // Cyan
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#06b6d4';
            ctx.stroke();
            ctx.shadowBlur = 0;

            animationId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationId);
        };
    }, [isRecording]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ width: '100%', height: '100%', display: 'block' }}
        />
    );
}
