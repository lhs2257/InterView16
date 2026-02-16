
import { useState, useRef, useCallback } from 'react';

interface UseAudioRecorderReturn {
    isRecording: boolean;
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<Blob | null>;
    hasMicrophoneAccess: boolean;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
    const [isRecording, setIsRecording] = useState(false);
    const [hasMicrophoneAccess, setHasMicrophoneAccess] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setHasMicrophoneAccess(true);

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus' // Use webm for broad support
            });

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            setHasMicrophoneAccess(false);
            alert('마이크 접근 권한이 필요합니다.');
        }
    }, []);

    const stopRecording = useCallback(async (): Promise<Blob | null> => {
        return new Promise((resolve) => {
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
                resolve(null);
                return;
            }

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                chunksRef.current = [];
                setIsRecording(false);

                // Stop all tracks to release microphone
                mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());

                resolve(blob);
            };

            mediaRecorderRef.current.stop();
        });
    }, []);

    return {
        isRecording,
        startRecording,
        stopRecording,
        hasMicrophoneAccess,
    };
}
