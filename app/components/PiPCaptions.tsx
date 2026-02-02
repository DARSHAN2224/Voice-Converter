'use client';
import React, { useEffect, useRef, useCallback, useImperativeHandle, forwardRef, useState } from 'react';

export interface PiPCaptionsRef {
    requestPiP: () => Promise<void>;
}

interface PiPCaptionsProps {
    text: string;
    onClose: () => void;
}

const PiPCaptions = forwardRef<PiPCaptionsRef, PiPCaptionsProps>(({ text, onClose }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isReady, setIsReady] = useState(false);

    // Draw captions on canvas
    const drawCaption = useCallback((captionText: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear and draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw border
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Word wrap
        const words = captionText.split(' ');
        const maxWidth = canvas.width - 40;
        let lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);

        // Draw lines
        const lineHeight = 30;
        const startY = (canvas.height - lines.length * lineHeight) / 2;
        lines.forEach((line, i) => {
            ctx.fillText(line, canvas.width / 2, startY + i * lineHeight + lineHeight / 2);
        });
    }, []);

    // Update caption when text changes
    useEffect(() => {
        drawCaption(text || '🎤 Listening...');
    }, [text, drawCaption]);

    // Setup canvas stream once on mount
    useEffect(() => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        // Initialize canvas with something
        drawCaption('🎤 Listening...');

        // Create video stream from canvas
        const stream = canvas.captureStream(30);
        video.srcObject = stream;
        video.muted = true;

        // Wait for video to be ready
        const handleMetadata = () => {
            setIsReady(true);
            video.play().catch(() => { });
        };

        video.addEventListener('loadedmetadata', handleMetadata);

        // Handle PiP close
        const handleLeavePiP = () => onClose();
        video.addEventListener('leavepictureinpicture', handleLeavePiP);

        return () => {
            video.removeEventListener('loadedmetadata', handleMetadata);
            video.removeEventListener('leavepictureinpicture', handleLeavePiP);
            if (document.pictureInPictureElement) {
                document.exitPictureInPicture().catch(() => { });
            }
        };
    }, [onClose, drawCaption]);

    // Expose requestPiP method to parent via ref
    useImperativeHandle(ref, () => ({
        requestPiP: async () => {
            const video = videoRef.current;
            if (!video) return;

            try {
                // Wait for ready state
                if (!isReady) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }

                // Ensure video is playing
                if (video.paused) {
                    await video.play();
                }

                // Request PiP
                if (document.pictureInPictureEnabled && !document.pictureInPictureElement) {
                    await video.requestPictureInPicture();
                }
            } catch (err) {
                console.error('PiP request failed:', err);
            }
        }
    }), [isReady]);

    return (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <canvas ref={canvasRef} width={600} height={80} />
            <video ref={videoRef} width={600} height={80} playsInline autoPlay muted />
        </div>
    );
});

PiPCaptions.displayName = 'PiPCaptions';
export default PiPCaptions;
