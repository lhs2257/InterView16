import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/interview/session/[id]
 * 면접 세션 정보를 조회합니다
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: sessionId } = await params;

        // 세션 정보 조회
        const { data: session, error: sessionError } = await supabase
            .from('interview_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (sessionError || !session) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        // 페르소나 정보 조회
        const { data: persona, error: personaError } = await supabase
            .from('mbti_personas')
            .select('*')
            .eq('id', session.persona_id)
            .single();

        if (personaError) {
            console.error('Failed to load persona:', personaError);
        }

        // 이력서 정보 조회
        const { data: resume, error: resumeError } = await supabase
            .from('resumes')
            .select('*')
            .eq('id', session.resume_id)
            .single();

        if (resumeError) {
            console.error('Failed to load resume:', resumeError);
        }

        // 메시지 히스토리 조회
        const { data: messages, error: messagesError } = await supabase
            .from('interview_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (messagesError) {
            console.error('Failed to load messages:', messagesError);
        }

        return NextResponse.json({
            success: true,
            session,
            persona,
            resume,
            messages: messages || [],
        });

    } catch (error) {
        console.error('Session load error:', error);

        return NextResponse.json(
            {
                error: 'Failed to load session',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
