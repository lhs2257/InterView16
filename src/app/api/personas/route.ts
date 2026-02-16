import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/personas
 * 모든 MBTI 페르소나 목록을 조회합니다
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const group = searchParams.get('group'); // SJ, SP, NF, NT

        let query = supabase
            .from('mbti_personas')
            .select('*')
            .order('mbti_type', { ascending: true });

        // 그룹 필터링
        if (group) {
            query = query.eq('mbti_group', group.toUpperCase());
        }

        const { data: personas, error } = await query;

        if (error) {
            throw new Error(`Failed to fetch personas: ${error.message}`);
        }

        return NextResponse.json({
            success: true,
            personas,
            count: personas.length,
        });

    } catch (error) {
        console.error('Personas fetch error:', error);

        return NextResponse.json(
            {
                error: 'Failed to fetch personas',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
