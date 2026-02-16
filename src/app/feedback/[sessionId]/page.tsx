'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, RotateCcw, Users, TrendingUp, Award, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
} from 'recharts';

interface FeedbackProps {
    params: Promise<{
        sessionId: string;
    }>;
}

interface FeedbackData {
    overallScore: number;
    competencies: {
        subject: string;
        score: number;
        fullMark: number;
    }[];
    mbtiComments: {
        strengths: string[];
        improvements: string[];
    };
    questionFeedback: {
        question: string;
        answer: string;
        grade: string;
        feedback: string;
        strengths?: string[]; // Optional in case API doesn't return it yet, though prompt asks for it as part of feedback text usually or separate
        improvements?: string[];
    }[];
    persona: {
        name: string;
        mbti_type: string;
        role: string;
    };
    interviewDate: string;
    duration: string;
}

export default function FeedbackPage({ params }: FeedbackProps) {
    const { sessionId } = use(params);
    const router = useRouter();
    const [feedback, setFeedback] = useState<FeedbackData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
    const fetchedRef = useRef(false);


    useEffect(() => {
        // Auth check
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
            }
        };
        checkAuth();

        if (fetchedRef.current) return;
        fetchedRef.current = true;

        const fetchFeedback = async () => {
            try {
                // 1. Fetch Feedback Data (Generate if not exists)
                const response = await fetch('/api/interview/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(
                        `${errorData.error || '피드백을 불러오는데 실패했습니다.'}${errorData.details ? '\nDetails: ' + errorData.details : ''
                        }`
                    );
                }

                const data = await response.json();

                if (!data.success || !data.feedback) {
                    throw new Error('피드백 데이터가 없습니다.');
                }

                // 2. Fetch Session/Persona Info to display metadata (handled inside API logic usually, but here we assume API returns combined or we fetch separately. 
                // The current API implementation returns `feedback` object from DB. 
                // We might need an extra call to get persona details if not embedded, or update API to return it.
                // For now, let's fetch session details to get persona info.

                const sessionRes = await fetch(`/api/interview/session/${sessionId}`);
                const sessionData = await sessionRes.json();

                if (!sessionData.success) throw new Error('세션 정보를 불러올 수 없습니다.');

                const rawFeedback = data.feedback;

                // Transform DB data to UI format
                const competencyScores = rawFeedback.competency_scores;
                const formattedCompetencies = [
                    { subject: '기술역량', score: competencyScores.technical || 0, fullMark: 100 },
                    { subject: '커뮤니케이션', score: competencyScores.communication || 0, fullMark: 100 },
                    { subject: '문제해결', score: competencyScores.problemSolving || 0, fullMark: 100 },
                    { subject: '리더십', score: competencyScores.leadership || 0, fullMark: 100 },
                    { subject: '열정', score: competencyScores.passion || 0, fullMark: 100 },
                    { subject: '논리적사고', score: competencyScores.logicalThinking || 0, fullMark: 100 },
                ];

                setFeedback({
                    overallScore: rawFeedback.overall_score,
                    competencies: formattedCompetencies,
                    mbtiComments: rawFeedback.mbti_analysis,
                    questionFeedback: rawFeedback.question_feedback,
                    persona: sessionData.persona,
                    interviewDate: new Date(sessionData.session.created_at).toLocaleDateString(),
                    duration: '15분 00초', // Placeholder, ideally calculated from start/end time
                });

            } catch (err) {
                console.error('Error fetching feedback:', err);
                setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchFeedback();
    }, [sessionId]);

    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">면접 결과를 분석하고 있습니다...</h2>
                    <p className="text-gray-400">AI가 답변을 상세히 검토중입니다. 잠시만 기다려주세요.</p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2 text-red-500">오류가 발생했습니다</h2>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <Link href="/personas" className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg">
                        메인으로 돌아가기
                    </Link>
                </div>
            </main>
        );
    }

    if (!feedback) return null;

    const getGrade = (score: number) => {
        if (score >= 90) return 'S';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 60) return 'C';
        return 'D';
    };

    const grade = getGrade(feedback.overallScore);

    return (
        <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
            <div className="container mx-auto px-6 py-12 max-w-7xl">
                {/* Header */}
                <Link href="/personas" className="inline-flex items-center text-gray-400 hover:text-white mb-8">
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    돌아가기
                </Link>

                {/* Success Message */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-5xl font-bold mb-4">
                        면접 분석 결과 📊
                    </h1>
                    <p className="text-xl text-gray-400 mb-6">
                        {feedback.persona.mbti_type} {feedback.persona.name}님과의 면접 • {feedback.interviewDate}
                    </p>

                    {/* Overall Score */}
                    <div className="inline-flex items-center gap-8 p-8 glass-card rounded-3xl">
                        <div className="relative">
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="60"
                                    stroke="#1f2937"
                                    strokeWidth="8"
                                    fill="none"
                                />
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="60"
                                    stroke="url(#gradient)"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${(feedback.overallScore / 100) * 377} 377`}
                                    strokeLinecap="round"
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#8B5CF6" />
                                        <stop offset="100%" stopColor="#3B82F6" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-bold">{feedback.overallScore}</span>
                                <span className="text-gray-400 text-sm">/ 100</span>
                            </div>
                        </div>

                        <div className="text-left">
                            <p className="text-sm text-gray-400 mb-1">총점</p>
                            <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-transparent bg-clip-text">
                                {grade} 등급
                            </p>
                            <p className="text-sm text-gray-400 mt-2">
                                {grade === 'S' || grade === 'A' ? '탁월한 성취도입니다!' : '무난한 성취도입니다.'}
                            </p>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Competency Radar Chart */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card p-8 rounded-3xl"
                    >
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <TrendingUp className="h-6 w-6 text-purple-500" />
                            역량별 평가
                        </h2>

                        <ResponsiveContainer width="100%" height={300}>
                            <RadarChart data={feedback.competencies}>
                                <PolarGrid stroke="#374151" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9CA3AF' }} />
                                <Radar
                                    name="점수"
                                    dataKey="score"
                                    stroke="#8B5CF6"
                                    fill="#8B5CF6"
                                    fillOpacity={0.6}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* MBTI Interviewer Comments */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-card p-8 rounded-3xl"
                    >
                        <h2 className="text-2xl font-bold mb-6">{feedback.persona.mbti_type} 면접관의 총평</h2>

                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                                {feedback.persona.mbti_type}
                            </div>
                            <div>
                                <p className="font-semibold">{feedback.persona.name}</p>
                                <p className="text-sm text-gray-400">{feedback.persona.role}</p>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-6 mb-6">
                            <p className="text-gray-300 font-medium mb-3">Strong Point</p>
                            <ul className="space-y-2">
                                {feedback.mbtiComments.strengths.map((s, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                                        <span className="text-green-500">✓</span> {s}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-white/5 rounded-xl p-6">
                            <p className="text-gray-300 font-medium mb-3">Needs Improvement</p>
                            <ul className="space-y-2">
                                {feedback.mbtiComments.improvements.map((s, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                                        <span className="text-red-500">!</span> {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                </div>

                {/* Question-by-Question Review */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-8"
                >
                    <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                        <Award className="h-7 w-7 text-purple-500" />
                        답변 상세 분석
                    </h2>

                    <div className="space-y-4">
                        {feedback.questionFeedback.map((q, index) => (
                            <QuestionCard
                                key={index}
                                question={q}
                                index={index}
                                isExpanded={expandedQuestion === index}
                                onToggle={() => setExpandedQuestion(expandedQuestion === index ? null : index)}
                            />
                        ))}
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-wrap justify-center gap-4"
                >
                    <button className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-full font-semibold transition-colors flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        PDF 다운로드
                    </button>
                    <button className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-full font-semibold transition-colors flex items-center gap-2">
                        <RotateCcw className="h-5 w-5" />
                        다시 면접 보기
                    </button>
                    <Link href="/personas" className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-full font-semibold transition-colors flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        다른 면접관 선택
                    </Link>
                </motion.div>
            </div>
        </main>
    );
}

function QuestionCard({ question, index, isExpanded, onToggle }: any) {
    const gradeColors: Record<string, string> = {
        A: 'text-green-500 bg-green-500/20',
        B: 'text-blue-500 bg-blue-500/20',
        C: 'text-yellow-500 bg-yellow-500/20',
        D: 'text-red-500 bg-red-500/20',
        F: 'text-gray-500 bg-gray-500/20',
    };

    const grade = question.grade || 'C';

    return (
        <div className="glass-card rounded-2xl overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full p-6 text-left hover:bg-white/5 transition-colors"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm text-gray-400">질문 {index + 1}</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${gradeColors[grade] || gradeColors.C}`}>
                                {grade}
                            </span>
                        </div>
                        <p className="font-semibold text-lg text-white">{question.question}</p>
                    </div>
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-gray-400"
                    >
                        ▼
                    </motion.div>
                </div>
            </button>

            {isExpanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 pb-6 border-t border-gray-700/50"
                >
                    <div className="pt-4 space-y-6">
                        <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-sm text-gray-400 mb-2">귀하의 답변:</p>
                            <p className="text-gray-300 whitespace-pre-wrap">{question.answer}</p>
                        </div>

                        <div>
                            <p className="text-sm text-purple-400 mb-2 font-semibold">💡 AI 피드백:</p>
                            <p className="text-gray-300 bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
                                {question.feedback}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
