'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { LogIn, Lock, Mail, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (signInError) {
                throw signInError;
            }

            // Login successful
            router.push('/');
            router.refresh();
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="mb-8 text-center">
                    <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        홈으로
                    </Link>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text mb-2">
                        InterView16
                    </h1>
                    <p className="text-gray-400">
                        AI 면접관과 함께하는 실전 모의 면접
                    </p>
                </div>

                <div className="glass-card p-8 rounded-3xl border border-gray-800 bg-black/50">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <LogIn className="w-6 h-6 text-purple-500" />
                        로그인
                    </h2>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">이메일</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">비밀번호</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-purple-900/50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                '로그인하기'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        <p>
                            현재 회원가입은 비활성화되어 있습니다.<br />
                            관리자에게 계정 생성을 요청하세요.
                        </p>
                    </div>
                </div>
            </motion.div>
        </main>
    );
}
