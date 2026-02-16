
import { useState, useRef, useCallback } from 'react';

interface UseTextToSpeechReturn {
    isPlaying: boolean;
    speak: (text: string, voiceId?: string) => Promise<void>;
    stop: () => void;
}

export function useTextToSpeech(): UseTextToSpeechReturn {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

    const stop = useCallback(() => {
        if (sourceNodeRef.current) {
            sourceNodeRef.current.stop();
            sourceNodeRef.current = null;
        }
        setIsPlaying(false);
    }, []);

    const speak = useCallback(async (text: string, voiceId?: string) => {
        try {
            // Stop any currently playing audio
            stop();

            if (!text.trim()) return;

            setIsPlaying(true);

            const response = await fetch('/api/interview/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voiceId }),
            });

            if (!response.ok) {
                throw new Error('TTS request failed');
            }

            const arrayBuffer = await response.arrayBuffer();

            // Init Audio Context if needed
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            // Resume context if suspended (browser policy)
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);

            source.onended = () => {
                setIsPlaying(false);
                sourceNodeRef.current = null;
            };

            source.start(0);
            sourceNodeRef.current = source;

        } catch (error) {
            console.error('TTS Playback Error:', error);
            setIsPlaying(false);
        }
    }, [stop]);

    return {
        isPlaying,
        speak,
        stop,
    };
}
