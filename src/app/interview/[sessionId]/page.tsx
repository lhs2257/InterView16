'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Clock, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

interface InterviewRoomProps {
    params: Promise<{
        sessionId: string;
    }>;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

interface SessionData {
    session: any;
    persona: any;
    resume: any;
    messages: Message[];
}

export default function InterviewRoom({ params }: InterviewRoomProps) {
    const { sessionId } = use(params);
    const router = useRouter();
    const [sessionData, setSessionData] = useState<SessionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [streaming, setStreaming] = useState(false);
    const [currentAiMessage, setCurrentAiMessage] = useState('');
    const [elapsedTime, setElapsedTime] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const greetingPlayedRef = useRef(false);

    // Check auth on load
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
            }
        };
        checkAuth();
    }, []);

    // STT Hook
    const { isRecording, startRecording, stopRecording } = useAudioRecorder();
    // TTS Hook
    const { isPlaying, speak, stop: stopSpeaking } = useTextToSpeech();
    const [isMuted, setIsMuted] = useState(false);

    const handleStartRecording = async () => {
        stopSpeaking();
        await startRecording();
    };

    const handleStopRecording = async () => {
        const audioBlob = await stopRecording();
        if (audioBlob) {
            // Send to STT API
            try {
                // Show temporary "Processing..." in input?
                setInputText('음성을 분석하고 있습니다...');

                const formData = new FormData();
                formData.append('file', audioBlob, 'recording.webm');

                const response = await fetch('/api/interview/stt', {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();

                if (data.success && data.text) {
                    setInputText(data.text);
                    // Optional: Auto-send if desired
                    // sendMessage(); 
                } else {
                    console.error('STT Failed:', data.error);
                    alert('음성 인식에 실패했습니다.');
                    setInputText('');
                }
            } catch (error) {
                console.error('STT Error:', error);
                alert('음성 인식 중 오류가 발생했습니다.');
                setInputText('');
            }
        }
    };

    // Load session data
    useEffect(() => {
        loadSession();
    }, [sessionId]);

    // Timer
    useEffect(() => {
        const interval = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, currentAiMessage]);

    // Check for interview completion (5 questions)
    const questionCount = Math.max(0, messages.filter(m => m.role === 'assistant').length - 1); // Subtract greeting

    useEffect(() => {
        if (loading || streaming) return;

        // Greeting(1) + Questions(5) + Closing(1) = 7 messages total from assistant
        // questionCount (assistant messages - 1) will be 6 when closing statement is received
        if (questionCount >= 6) {
            const timer = setTimeout(() => {
                alert('면접이 종료되었습니다. 수고하셨습니다! 결과 분석 페이지로 이동합니다.');
                router.push(`/feedback/${sessionId}`);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [questionCount, streaming, loading, sessionId, router]);

    const loadSession = async () => {
        try {
            const response = await fetch(`/api/interview/session/${sessionId}`);
            const data = await response.json();

            if (data.success) {
                setSessionData(data);
                setMessages(data.messages || []);

                // If no messages, send initial greeting
                if (!data.messages || data.messages.length === 0) {
                    await sendInitialGreeting(data.persona);
                }
            } else {
                alert('세션을 불러올 수 없습니다.');
                router.push('/personas');
            }
        } catch (error) {
            console.error('Failed to load session:', error);
            alert('세션 로딩 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const sendInitialGreeting = async (persona: any) => {
        const greeting = `안녕하세요, ${persona.name}입니다. ${persona.role}로서 오늘 면접을 진행하겠습니다. 자기소개 부탁드립니다.`;

        // Add greeting as AI message
        const greetingMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: greeting,
            created_at: new Date().toISOString(),
        };

        setMessages([greetingMessage]);

        // Only play TTS once using ref to prevent duplicate in Strict Mode
        if (!isMuted && !greetingPlayedRef.current) {
            greetingPlayedRef.current = true;
            speak(greeting);
        }
    };

    const sendMessage = async () => {
        if (!inputText.trim() || streaming) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputText,
            created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setStreaming(true);
        setCurrentAiMessage('');

        try {
            const response = await fetch('/api/interview/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: sessionId,
                    userMessage: inputText,
                    mbti_type: sessionData?.persona?.mbti_type,
                    resumeId: sessionData?.session?.resume_id,
                    conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let aiResponseText = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') continue;

                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.content) {
                                    aiResponseText += parsed.content;
                                    setCurrentAiMessage(aiResponseText);
                                }
                            } catch (e) {
                                // Ignore parsing errors
                            }
                        }
                    }
                }
            }

            // Add complete AI response to messages
            const aiMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: aiResponseText,
                created_at: new Date().toISOString(),
            };

            setMessages(prev => [...prev, aiMessage]);
            setCurrentAiMessage('');
            if (!isMuted) speak(aiResponseText);

        } catch (error) {
            console.error('Failed to send message:', error);
            alert('메시지 전송 중 오류가 발생했습니다.');
        } finally {
            setStreaming(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <main className="flex items-center justify-center h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
                <div className="text-center">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-500 border-r-transparent mb-4"></div>
                    <p className="text-gray-400">면접실을 준비하는 중...</p>
                </div>
            </main>
        );
    }

    if (!sessionData) {
        return null;
    }

    const { persona } = sessionData;

    return (
        <main className="relative h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white overflow-hidden flex flex-col">
            {/* Header */}
            <header className="px-6 py-4 bg-black/50 backdrop-blur-md border-b border-gray-800 flex-shrink-0">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/personas" className="text-gray-400 hover:text-white">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-sm">
                                {persona?.mbti_type || 'AI'}
                            </div>
                            <div>
                                <p className="text-sm font-semibold">{persona?.name || '면접관'}</p>
                                <p className="text-xs text-gray-400">{persona?.role || '면접관'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Progress */}
                        <div className="text-center">
                            <p className="text-sm text-gray-400">진행도</p>
                            <p className="font-bold">질문 {questionCount}/5</p>
                        </div>

                        {/* Timer */}
                        <div className="flex items-center gap-2 mr-4">
                            <button
                                onClick={() => {
                                    if (isMuted) {
                                        setIsMuted(false);
                                    } else {
                                        stopSpeaking();
                                        setIsMuted(true);
                                    }
                                }}
                                className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                title={isMuted ? "음소거 해제" : "음소거"}
                            >
                                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                            </button>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <Clock className="h-4 w-4" />
                            <span className="font-mono">{formatTime(elapsedTime)}</span>
                        </div>

                        {/* End Button */}
                        <button
                            onClick={() => router.push(`/feedback/${sessionId}`)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition-colors"
                        >
                            면접 종료
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((questionCount / 5) * 100, 100)}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </header>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
                <div className="container mx-auto max-w-4xl">
                    {messages.map((message) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mb-6 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] p-4 rounded-2xl ${message.role === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-800 text-gray-100'
                                    }`}
                            >
                                <p className="text-sm font-semibold mb-1">
                                    {message.role === 'user' ? '나' : persona?.name || '면접관'}
                                </p>
                                <p className="whitespace-pre-wrap">{message.content}</p>
                            </div>
                        </motion.div>
                    ))}

                    {/* Streaming AI Response */}
                    {streaming && currentAiMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 flex justify-start"
                        >
                            <div className="max-w-[80%] p-4 rounded-2xl bg-gray-800 text-gray-100">
                                <p className="text-sm font-semibold mb-1">{persona?.name || '면접관'}</p>
                                <p className="whitespace-pre-wrap">{currentAiMessage}</p>
                                <span className="inline-block w-2 h-4 bg-purple-500 ml-1 animate-pulse"></span>
                            </div>
                        </motion.div>
                    )}

                    {/* Thinking Indicator */}
                    {streaming && !currentAiMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 flex justify-start"
                        >
                            <div className="max-w-[80%] p-4 rounded-2xl bg-gray-800 text-gray-100">
                                <p className="text-sm font-semibold mb-1">{persona?.name || '면접관'}</p>
                                <div className="flex gap-1">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            className="w-2 h-2 bg-purple-500 rounded-full"
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{
                                                duration: 1.5,
                                                repeat: Infinity,
                                                delay: i * 0.2,
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-gray-900/80 backdrop-blur-xl border-t border-gray-800 p-6 flex-shrink-0">
                <div className="container mx-auto max-w-4xl flex gap-4">
                    <button
                        onClick={isRecording ? handleStopRecording : handleStartRecording}
                        className={`p-4 rounded-full transition-all ${isRecording
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                            : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                        disabled={streaming}
                        title={isRecording ? "녹음 중지" : "음성 입력"}
                    >
                        {isRecording ? (
                            <div className="w-6 h-6 bg-white rounded-sm" /> // Stop Icon
                        ) : (
                            <div className="w-6 h-6">
                                {/* Simple Mic Icon SVG */}
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                    <line x1="12" y1="19" x2="12" y2="23"></line>
                                    <line x1="8" y1="23" x2="16" y2="23"></line>
                                </svg>
                            </div>
                        )}
                    </button>

                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={isRecording ? "듣고 있습니다..." : "답변을 입력하세요... (Enter: 전송, Shift+Enter: 줄바꿈)"}
                        disabled={streaming || isRecording}
                        className="flex-1 p-4 bg-black/40 border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500 disabled:opacity-50"
                        rows={1} // Reduced row count for better alignment
                    />
                    <button
                        onClick={sendMessage}
                        disabled={streaming || !inputText.trim()}
                        className="px-6 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors flex items-center gap-2"
                    >
                        <Send className="h-5 w-5" />
                        전송
                    </button>
                </div>
            </div>
        </main>
    );
}
