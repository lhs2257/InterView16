'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Upload, FileText, TrendingUp, CheckCircle, AlertCircle, ArrowLeft, Lock } from 'lucide-react';

export default function HomePage() {
    const router = useRouter();
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [resumeId, setResumeId] = useState<string | null>(null);
    const [uploadMode, setUploadMode] = useState(false);
    const [showResumeOptions, setShowResumeOptions] = useState(false);

    // Auth state
    const [user, setUser] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);


    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setAuthLoading(false);
        };
        checkUser();
    }, []);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            await uploadResume(files[0]);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            await uploadResume(files[0]);
        }
    };

    const uploadResume = async (file: File) => {
        // Validate file type
        if (file.type !== 'application/pdf') {
            setUploadError('PDF 파일만 업로드 가능합니다.');
            return;
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            setUploadError('파일 크기는 10MB 이하여야 합니다.');
            return;
        }

        setUploading(true);
        setUploadError(null);
        setUploadSuccess(false);

        try {
            const formData = new FormData();
            formData.append('file', file);

            // Use authenticated user ID if available, otherwise temp ID (legacy)
            const userId = user?.id || crypto.randomUUID();
            formData.append('userId', userId);

            const response = await fetch('/api/resume/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Upload failed:', data);
                throw new Error(data.error || '업로드에 실패했습니다.\n' + (data.details || ''));
            }

            if (data.success) {
                setResumeId(data.resume.id);
                setUploadSuccess(true);

                // Store resume ID in localStorage for later use
                localStorage.setItem('currentResumeId', data.resume.id);

                // Redirect to personas page after 2 seconds
                setTimeout(() => {
                    router.push('/personas');
                }, 2000);
            }
        } catch (error) {
            console.error('Upload error:', error);
            setUploadError(error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
            {/* Header / Nav */}
            <header className="container mx-auto px-6 py-4 flex justify-between items-center relative z-20">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                    InterView16
                </div>
                <div>
                    {!authLoading && (
                        user ? (
                            <div className="flex items-center gap-4">
                                <span className="text-base mr-4 text-gray-400 hidden md:inline">{user.email}</span>
                                <button
                                    onClick={async () => {
                                        await supabase.auth.signOut();
                                        setUser(null);
                                        router.refresh();
                                    }}
                                    className="px-6 py-3 text-base bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
                                >
                                    로그아웃
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="px-8 py-3 text-base bg-gradient-to-r from-blue-600 to-purple-600 rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                            >
                                로그인
                            </Link>
                        )
                    )}
                </div>
            </header>

            {/* Hero Section */}
            <section className="container mx-auto px-6 pt-10 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center max-w-5xl mx-auto"
                >
                    <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
                        <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
                            나에게 맞는 면접관을 선택하세요
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-400 mb-4">
                        16가지 MBTI 성향의 AI 면접관과 함께하는 실전 면접 연습
                    </p>

                    {!showResumeOptions && (
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {user ? (
                                <button
                                    onClick={() => setShowResumeOptions(true)}
                                    className="inline-block px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/50"
                                >
                                    면접 시작하기
                                </button>
                            ) : (
                                <Link
                                    href="/login"
                                    className="inline-block px-12 py-4 bg-gray-800 border border-gray-700 rounded-full text-lg font-semibold hover:bg-gray-700 transition-all"
                                >
                                    로그인하고 시작하기
                                </Link>
                            )}
                        </motion.div>
                    )}
                </motion.div>
            </section>

            {/* Resume Action Section */}
            <section className="container mx-auto px-6 py-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="max-w-4xl mx-auto"
                >
                    {authLoading ? (
                        <div className="flex justify-center p-12">
                            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : !user ? (
                        <div className="text-center p-12 glass-card rounded-3xl border border-gray-800">
                            <Lock className="w-12 h-12 mx-auto text-gray-500 mb-4" />
                            <h3 className="text-2xl font-bold mb-2">로그인이 필요합니다</h3>
                            <p className="text-gray-400 mb-8 max-w-md mx-auto">
                                AI 면접 서비스를 이용하려면 로그인이 필요합니다.<br />
                                테스트 계정으로 로그인해주세요.
                            </p>
                            <Link
                                href="/login"
                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full font-bold hover:shadow-lg transition-all"
                            >
                                로그인 페이지로 이동
                            </Link>
                        </div>
                    ) : !showResumeOptions ? (
                        // Initial state - show nothing
                        null
                    ) : !uploadMode ? (
                        // Show resume selection options
                        <div>
                            <div className="text-center mb-6">
                                <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                                    이력서를 어떻게 준비하시겠어요?
                                </h2>
                                <p className="text-gray-400">
                                    두 가지 방법 중 하나를 선택해주세요
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Option 1: PDF Upload */}
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setUploadMode(true)}
                                    className="glass-card p-10 rounded-3xl cursor-pointer border border-gray-700 hover:border-blue-500 transition-all group text-center"
                                >
                                    <div className="w-20 h-20 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-500/30 transition-colors">
                                        <FileText className="w-10 h-10 text-blue-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3">내 이력서 파일로 시작</h3>
                                    <p className="text-gray-400 mb-6">
                                        PDF 이력서를 업로드하면 AI가 자동으로 분석하여 면접을 준비합니다.
                                    </p>
                                    <span className="text-blue-400 font-semibold group-hover:underline">
                                        업로드하러 가기 &rarr;
                                    </span>
                                </motion.div>

                                {/* Option 2: Manual Create */}
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => router.push('/resume/create')}
                                    className="glass-card p-10 rounded-3xl cursor-pointer border border-gray-700 hover:border-purple-500 transition-all group text-center"
                                >
                                    <div className="w-20 h-20 mx-auto bg-purple-500/20 rounded-full flex items-center justify-center mb-6 group-hover:bg-purple-500/30 transition-colors">
                                        <div className="relative">
                                            <FileText className="w-10 h-10 text-purple-400" />
                                            <div className="absolute -right-2 -bottom-2 bg-purple-600 rounded-full p-1">
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3">직접 작성하고 시작</h3>
                                    <p className="text-gray-400 mb-6">
                                        이력서가 없으신가요? 핵심 내용만 빠르게 입력하고 바로 시작하세요.
                                    </p>
                                    <span className="text-purple-400 font-semibold group-hover:underline">
                                        작성하러 가기 &rarr;
                                    </span>
                                </motion.div>
                            </div>
                        </div>
                    ) : (
                        <div className="relative">
                            <button
                                onClick={() => setUploadMode(false)}
                                className="absolute -top-12 left-0 text-gray-400 hover:text-white flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                뒤로가기
                            </button>
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`
                  relative p-12 rounded-3xl border-2 border-dashed transition-all
                  ${isDragging
                                        ? 'border-purple-500 bg-purple-500/10'
                                        : uploadSuccess
                                            ? 'border-green-500 bg-green-500/10'
                                            : uploadError
                                                ? 'border-red-500 bg-red-500/10'
                                                : 'border-gray-700 bg-gray-900/30'
                                    }
                  backdrop-blur-sm hover:border-purple-500/50 cursor-pointer
                `}
                            >
                                <div className="text-center">
                                    {uploading ? (
                                        <>
                                            <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-purple-500 border-r-transparent mb-4"></div>
                                            <h3 className="text-2xl font-semibold mb-2">
                                                이력서 분석 중...
                                            </h3>
                                            <p className="text-gray-400">
                                                PDF 파싱 및 AI 구조화 진행 중입니다. 잠시만 기다려주세요.
                                            </p>
                                        </>
                                    ) : uploadSuccess ? (
                                        <>
                                            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                                            <h3 className="text-2xl font-semibold mb-2 text-green-400">
                                                업로드 완료!
                                            </h3>
                                            <p className="text-gray-400 mb-4">
                                                면접관 선택 페이지로 이동합니다...
                                            </p>
                                        </>
                                    ) : uploadError ? (
                                        <>
                                            <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
                                            <h3 className="text-2xl font-semibold mb-2 text-red-400">
                                                업로드 실패
                                            </h3>
                                            <p className="text-gray-400 mb-6">
                                                {uploadError}
                                            </p>
                                            <button
                                                onClick={() => setUploadError(null)}
                                                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
                                            >
                                                다시 시도
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mx-auto h-16 w-16 text-gray-500 mb-4" />
                                            <h3 className="text-2xl font-semibold mb-2">
                                                PDF 이력서를 업로드하세요
                                            </h3>
                                            <p className="text-gray-400 mb-6">
                                                드래그 앤 드롭하거나 클릭하여 파일을 선택하세요
                                            </p>
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                className="hidden"
                                                id="resume-upload"
                                                onChange={handleFileChange}
                                                disabled={uploading}
                                            />
                                            <label
                                                htmlFor="resume-upload"
                                                className="inline-block px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-full cursor-pointer transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-5 w-5" />
                                                    파일 선택
                                                </div>
                                            </label>
                                            <p className="text-sm text-gray-500 mt-4">
                                                최대 10MB, PDF 형식만 지원
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )} {/* Closing main content block */}
                </motion.div>
            </section>

            {/* Popular Interviewers Ranking */}
            <section className="container mx-auto px-6 py-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                >
                    <div className="flex items-center justify-center mb-8">
                        <TrendingUp className="h-6 w-6 text-orange-500 mr-2" />
                        <h2 className="text-3xl font-bold">인기 면접관 랭킹</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                        {popularInterviewers.map((interviewer, index) => (
                            <motion.div
                                key={interviewer.mbti}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                                whileHover={{ y: -10 }}
                                className="glass-card p-6 rounded-2xl hover:border-opacity-100 transition-all"
                                style={{ borderColor: interviewer.color + '40' }}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm"
                                        style={{ backgroundColor: interviewer.color + '20', color: interviewer.color }}
                                    >
                                        {interviewer.mbti}
                                    </div>
                                    <div className="flex">
                                        {Array.from({ length: interviewer.difficulty }).map((_, i) => (
                                            <span key={i} className="text-yellow-500">★</span>
                                        ))}
                                        {Array.from({ length: 5 - interviewer.difficulty }).map((_, i) => (
                                            <span key={i} className="text-gray-600">★</span>
                                        ))}
                                    </div>
                                </div>

                                <h3 className="font-bold text-lg mb-1">{interviewer.name}</h3>
                                <p className="text-sm text-gray-400 mb-3">{interviewer.role}</p>

                                <div className="flex flex-wrap gap-2">
                                    {interviewer.tags.slice(0, 2).map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-xs px-2 py-1 rounded-full"
                                            style={{
                                                backgroundColor: interviewer.color + '15',
                                                color: interviewer.color
                                            }}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section className="container mx-auto px-6 py-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                            className="text-center p-8"
                        >
                            <div className="text-4xl mb-4">{feature.icon}</div>
                            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                            <p className="text-gray-400">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </section>
        </main>
    );
}

const popularInterviewers = [
    {
        mbti: 'ENTJ',
        name: '장도현',
        role: '비판적 CEO',
        difficulty: 5,
        color: '#8B5CF6',
        tags: ['#비판면접', '#성과중심', '#냉정평가'],
    },
    {
        mbti: 'ISTJ',
        name: '김철수',
        role: '원칙주의자 기술 팀장',
        difficulty: 4,
        color: '#3B82F6',
        tags: ['#압박면접', '#논리중심', '#수치확인'],
    },
    {
        mbti: 'ENTP',
        name: '홍수민',
        role: '논쟁적 혁신가',
        difficulty: 5,
        color: '#8B5CF6',
        tags: ['#논쟁면접', '#도전적질문', '#혁신요구'],
    },
    {
        mbti: 'ENFJ',
        name: '오준영',
        role: '카리스마 있는 리더',
        difficulty: 3,
        color: '#10B981',
        tags: ['#리더십면접', '#영향력평가', '#비전제시'],
    },
];

const features = [
    {
        icon: '🎭',
        title: '16종 MBTI 면접관',
        description: '성향별로 다른 질문 스타일과 평가 기준을 경험하세요',
    },
    {
        icon: '🎙️',
        title: '실시간 AI 면접',
        description: '음성 기반 실전 면접으로 긴장감 있는 연습',
    },
    {
        icon: '📊',
        title: '상세한 피드백',
        description: 'A급 답변으로 교정하고 역량별 분석 제공',
    },
];
