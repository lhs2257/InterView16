import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/test/supabase
 * Supabase 연결 테스트
 */
export async function GET(request: NextRequest) {
    try {
        const { supabase } = await import('@/lib/supabase/client');

        // 테이블 존재 확인
        const { data: personas, error: personasError } = await supabase
            .from('mbti_personas')
            .select('count')
            .limit(1);

        const { data: resumes, error: resumesError } = await supabase
            .from('resumes')
            .select('count')
            .limit(1);

        const { data: embeddings, error: embeddingsError } = await supabase
            .from('resume_embeddings')
            .select('count')
            .limit(1);

        return NextResponse.json({
            success: true,
            tables: {
                mbti_personas: personasError ? `Error: ${personasError.message}` : 'OK',
                resumes: resumesError ? `Error: ${resumesError.message}` : 'OK',
                resume_embeddings: embeddingsError ? `Error: ${embeddingsError.message}` : 'OK',
            },
            env: {
                hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                hasOpenAIKey: !!process.env.OPENAI_API_KEY,
            }
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
