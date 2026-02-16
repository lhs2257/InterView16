import { NextRequest, NextResponse } from 'next/server';
import { getUserResumes } from '@/lib/supabase/rag';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/resume/list?userId=xxx
 * 사용자의 이력서 목록을 조회합니다
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        const resumes = await getUserResumes(userId);

        return NextResponse.json({
            success: true,
            resumes,
            count: resumes.length,
        });

    } catch (error) {
        console.error('Resume list error:', error);

        return NextResponse.json(
            {
                error: 'Failed to fetch resumes',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
