'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { ArrowLeft, Star } from 'lucide-react';
import Link from 'next/link';
import { MBTIPersona, MBTIGroup } from '@/types';
import { getMBTIGroupColor } from '@/lib/utils';

type FilterGroup = 'ALL' | MBTIGroup;

export default function PersonasPage() {
    const router = useRouter();
    const [personas, setPersonas] = useState<MBTIPersona[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<FilterGroup>('ALL');
    const [startingInterview, setStartingInterview] = useState(false);


    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
            }
        };
        checkAuth();
        fetchPersonas();
    }, []);

    const fetchPersonas = async () => {
        try {
            const response = await fetch('/api/personas');
            const data = await response.json();
            if (data.success) {
                setPersonas(data.personas);
            }
        } catch (error) {
            console.error('Failed to fetch personas:', error);
        } finally {
            setLoading(false);
        }
    };

    const startInterview = async (persona: MBTIPersona) => {
        setStartingInterview(true);

        try {
            // Check auth again before starting
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }

            // Get resume ID from localStorage
            const resumeId = localStorage.getItem('currentResumeId');

            if (!resumeId) {
                alert('이력서를 먼저 업로드하거나 작성해주세요.');
                router.push('/');
                return;
            }

            // Use authenticated user ID
            const userId = session.user.id;

            // Create interview session
            const response = await fetch('/api/interview/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    resumeId,
                    personaId: persona.id,
                }),
            });

            const data = await response.json();

            if (data.success && data.session) {
                // Navigate to interview room
                router.push(`/interview/${data.session.id}`);
            } else {
                throw new Error(data.error || '면접 시작에 실패했습니다.');
            }
        } catch (error) {
            console.error('Failed to start interview:', error);
            alert(error instanceof Error ? error.message : '면접 시작 중 오류가 발생했습니다.');
        } finally {
            setStartingInterview(false);
        }
    };

    const filteredPersonas = personas.filter(p =>
        activeFilter === 'ALL' || p.mbti_group === activeFilter
    );

    return (
        <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
            <div className="container mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-12">
                    <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        돌아가기
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <h1 className="text-5xl font-bold mb-4">면접관을 선택하세요</h1>
                        <p className="text-xl text-gray-400">
                            16가지 MBTI 성향 중 연습하고 싶은 면접관을 골라보세요
                        </p>
                    </motion.div>
                </div>

                {/* Filter Tabs */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex justify-center gap-4 mb-12 flex-wrap"
                >
                    <FilterButton
                        active={activeFilter === 'ALL'}
                        onClick={() => setActiveFilter('ALL')}
                        color="#FFFFFF"
                    >
                        전체
                    </FilterButton>
                    <FilterButton
                        active={activeFilter === 'SJ'}
                        onClick={() => setActiveFilter('SJ')}
                        color={getMBTIGroupColor('SJ')}
                    >
                        SJ (관리자형)
                    </FilterButton>
                    <FilterButton
                        active={activeFilter === 'SP'}
                        onClick={() => setActiveFilter('SP')}
                        color={getMBTIGroupColor('SP')}
                    >
                        SP (예술가형)
                    </FilterButton>
                    <FilterButton
                        active={activeFilter === 'NF'}
                        onClick={() => setActiveFilter('NF')}
                        color={getMBTIGroupColor('NF')}
                    >
                        NF (이상가형)
                    </FilterButton>
                    <FilterButton
                        active={activeFilter === 'NT'}
                        onClick={() => setActiveFilter('NT')}
                        color={getMBTIGroupColor('NT')}
                    >
                        NT (분석가형)
                    </FilterButton>
                </motion.div>

                {/* Personas Grid */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-500 border-r-transparent"></div>
                        <p className="mt-4 text-gray-400">면접관 정보를 불러오는 중...</p>
                    </div>
                ) : startingInterview ? (
                    <div className="text-center py-20">
                        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent"></div>
                        <p className="mt-4 text-gray-400">면접을 준비하는 중...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredPersonas.map((persona, index) => (
                            <PersonaCard
                                key={persona.id}
                                persona={persona}
                                index={index}
                                onClick={() => startInterview(persona)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}

function FilterButton({
    children,
    active,
    onClick,
    color
}: {
    children: React.ReactNode;
    active: boolean;
    onClick: () => void;
    color: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`
        px-6 py-3 rounded-full font-medium transition-all
        ${active
                    ? 'shadow-lg'
                    : 'bg-gray-800 hover:bg-gray-700'
                }
      `}
            style={active ? {
                backgroundColor: color + '20',
                borderColor: color,
                borderWidth: '2px',
                color: color,
            } : {}}
        >
            {children}
        </button>
    );
}

function PersonaCard({
    persona,
    index,
    onClick
}: {
    persona: MBTIPersona;
    index: number;
    onClick: () => void;
}) {
    const groupColor = getMBTIGroupColor(persona.mbti_group);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            whileHover={{ y: -10, scale: 1.02 }}
            onClick={onClick}
            className="glass-card p-6 rounded-2xl cursor-pointer transition-all hover:shadow-xl"
            style={{
                borderColor: groupColor + '40',
                borderWidth: '1px',
            }}
        >
            {/* Avatar & Badge */}
            <div className="flex items-start justify-between mb-4">
                <div
                    className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg"
                    style={{
                        backgroundColor: groupColor + '20',
                        color: groupColor
                    }}
                >
                    {persona.mbti_type}
                </div>

                {/* Difficulty Stars */}
                <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                            key={i}
                            className={`h-4 w-4 ${i < persona.difficulty
                                ? 'fill-yellow-500 text-yellow-500'
                                : 'text-gray-600'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Name & Role */}
            <h3 className="font-bold text-xl mb-1">{persona.name}</h3>
            <p className="text-sm text-gray-400 mb-4">{persona.role}</p>

            {/* Keywords Tags */}
            <div className="flex flex-wrap gap-2">
                {persona.keywords?.slice(0, 3).map((keyword) => (
                    <span
                        key={keyword}
                        className="text-xs px-3 py-1 rounded-full"
                        style={{
                            backgroundColor: groupColor + '15',
                            color: groupColor,
                        }}
                    >
                        {keyword}
                    </span>
                ))}
            </div>
        </motion.div>
    );
}
