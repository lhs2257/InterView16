import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, role, introduction, skills, experience, tempUserId } = body;

        if (!name || !role) {
            return NextResponse.json(
                { error: '이름과 직무는 필수 입력 항목입니다.' },
                { status: 400 }
            );
        }

        // Construct parsed_content structure to match PDF parser output
        const parsedContent = {
            userInfo: {
                name: name,
                email: '', // Optional or added field
                phone: '',
            },
            education: [], // Not implemented in simple form yet
            experience: experience || [], // Array of strings or objects
            skills: skills || [], // Array of strings
            projects: [],
            awards: [],
            rawText: `이름: ${name}\n직무: ${role}\n자기소개: ${introduction}\n스킬: ${skills.join(', ')}\n경력:\n${experience.join('\n')}`,
            introduction: introduction || '',
        };

        // Insert into resumes table
        const { data, error } = await supabaseAdmin
            .from('resumes')
            .insert({
                user_id: tempUserId || crypto.randomUUID(), // Handle temp user ID
                file_url: 'manual_entry', // Placeholder for manual entry
                file_name: '직접 작성한 이력서',
                parsed_content: parsedContent
            })
            .select()
            .single();


        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: `Database Error: ${error.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            resume: data
        });

    } catch (error: any) {
        console.error('Resume creation error:', error);
        return NextResponse.json(
            { error: error.message || '이력서 생성 실패' },
            { status: 500 }
        );
    }
}
