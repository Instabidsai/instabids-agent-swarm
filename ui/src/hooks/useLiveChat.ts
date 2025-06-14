// ui/src/hooks/useLiveChat.ts
import { useState, useEffect, useRef, useCallback } from 'react';

export enum ConnectionStatus {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
    CLOSING,
}

export const useLiveChat = (projectId: string) => {
    const [status, setStatus] = useState(ConnectionStatus.DISCONNECTED);
    const [agentTranscript, setAgentTranscript] = useState<string[]>([]);
    const socketRef = useRef<WebSocket | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    const connect = useCallback(() => {
        if (socketRef.current) return;

        setStatus(ConnectionStatus.CONNECTING);
        const ws = new WebSocket(`ws://localhost:8000/ws/live-chat/${projectId}`);

        ws.onopen = () => {
            setStatus(ConnectionStatus.CONNECTED);
            startRecording();
        };

        ws.onmessage = async (event: MessageEvent) => {
            // This assumes the backend sends audio data directly
            const audioData = await new Response(event.data).arrayBuffer();
            playAudio(audioData);
        };

        ws.onerror = (err) => {
            console.error("WebSocket error:", err);
            setStatus(ConnectionStatus.DISCONNECTED);
        };

        ws.onclose = () => {
            setStatus(ConnectionStatus.DISCONNECTED);
            stopRecording();
        };

        socketRef.current = ws;
    }, [projectId]);

    const disconnect = () => {
        if (socketRef.current) {
            setStatus(ConnectionStatus.CLOSING);
            socketRef.current.close();
            socketRef.current = null;
        }
    };
    
    const playAudio = (audioData: ArrayBuffer) => {
        if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext();
        }
        audioContextRef.current.decodeAudioData(audioData, (buffer) => {
            const source = audioContextRef.current!.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current!.destination);
            source.start(0);
        });
    };

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });

        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0 && socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(event.data);
            }
        };

        mediaRecorderRef.current.start(1000); // Send data every 1 second
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            disconnect();
        };
    }, []);

    return { status, connect, disconnect, agentTranscript };
};