'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateResumePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        introduction: '',
        skills: [] as string[],
        experience: [] as string[],
    });

    const [skillInput, setSkillInput] = useState('');
    const [expInput, setExpInput] = useState('');

    const handleAddSkill = () => {
        if (skillInput.trim()) {
            setFormData(prev => ({
                ...prev,
                skills: [...prev.skills, skillInput.trim()]
            }));
            setSkillInput('');
        }
    };

    const handleRemoveSkill = (index: number) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter((_, i) => i !== index)
        }));
    };

    const handleAddExp = () => {
        if (expInput.trim()) {
            setFormData(prev => ({
                ...prev,
                experience: [...prev.experience, expInput.trim()]
            }));
            setExpInput('');
        }
    };

    const handleRemoveExp = (index: number) => {
        setFormData(prev => ({
            ...prev,
            experience: prev.experience.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const tempUserId = localStorage.getItem('tempUserId') || crypto.randomUUID();
            localStorage.setItem('tempUserId', tempUserId);

            const response = await fetch('/api/resume/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    tempUserId
                }),
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('currentResumeId', data.resume.id);
                alert('이력서가 작성되었습니다! 면접관 선택 페이지로 이동합니다.');
                router.push('/personas');
            } else {
                throw new Error(data.error || '저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white p-6">
            <div className="max-w-3xl mx-auto">
                <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white mb-8">
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    홈으로 돌아가기
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-8 rounded-3xl border border-gray-800 bg-black/50"
                >
                    <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                        이력서 직접 작성하기
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">이름</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none"
                                    placeholder="홍길동"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">희망 직무</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none"
                                    placeholder="프론트엔드 개발자"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">자기소개</label>
                            <textarea
                                required
                                value={formData.introduction}
                                onChange={e => setFormData({ ...formData, introduction: e.target.value })}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none h-32 resize-none"
                                placeholder="간단한 자기소개와 포부를 작성해주세요."
                            />
                        </div>

                        {/* Skills Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">보유 기술 (스킬)</label>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={skillInput}
                                    onChange={e => setSkillInput(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none"
                                    placeholder="예: React, TypeScript, Python"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddSkill}
                                    className="px-4 bg-gray-800 hover:bg-gray-700 rounded-lg"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.skills.map((skill, index) => (
                                    <span key={index} className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm flex items-center gap-2">
                                        {skill}
                                        <button type="button" onClick={() => handleRemoveSkill(index)} className="hover:text-white">
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Experience Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">주요 경력 / 프로젝트</label>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={expInput}
                                    onChange={e => setExpInput(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddExp())}
                                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none"
                                    placeholder="예: 스타트업 인턴 (6개월) - 프론트엔드 개발 담당"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddExp}
                                    className="px-4 bg-gray-800 hover:bg-gray-700 rounded-lg"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                            <ul className="space-y-2">
                                {formData.experience.map((exp, index) => (
                                    <li key={index} className="flex items-center justify-between bg-gray-900 p-3 rounded-lg">
                                        <span className="text-sm">{exp}</span>
                                        <button type="button" onClick={() => handleRemoveExp(index)} className="text-gray-500 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-purple-900/50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    작성 완료 및 면접 시작
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        </main>
    );
}
