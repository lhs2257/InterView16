import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/interview/start
 * 새로운 면접 세션을 시작합니다
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, personaId, resumeId } = body;

        if (!userId || !personaId || !resumeId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // 면접 세션 생성
        const { data: session, error } = await supabase
            .from('interview_sessions')
            .insert({
                user_id: userId,
                persona_id: personaId,
                resume_id: resumeId,
                status: 'ongoing',
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create session: ${error.message}`);
        }

        // 페르소나 정보도 함께 반환
        const { data: persona } = await supabase
            .from('mbti_personas')
            .select('*')
            .eq('id', personaId)
            .single();

        return NextResponse.json({
            success: true,
            session,
            persona,
        });

    } catch (error) {
        console.error('Interview start error:', error);

        return NextResponse.json(
            {
                error: 'Failed to start interview',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
