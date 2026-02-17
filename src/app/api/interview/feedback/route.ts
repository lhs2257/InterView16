import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai/client';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/interview/feedback
 * 면접 대화를 분석하여 피드백을 생성합니다
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sessionId } = body;

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID is required' },
                { status: 400 }
            );
        }

        // 1. 세션 정보 조회
        const { data: session, error: sessionError } = await supabaseAdmin
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

        // 이미 피드백이 생성되었는지 확인
        const { data: existingFeedback } = await supabaseAdmin
            .from('feedback_reports')
            .select('*')
            .eq('session_id', sessionId)
            .single();

        if (existingFeedback) {
            return NextResponse.json({
                success: true,
                feedback: existingFeedback,
                cached: true,
            });
        }

        // 2. 페르소나 정보 조회
        const { data: persona } = await supabaseAdmin
            .from('mbti_personas')
            .select('*')
            .eq('id', session.persona_id)
            .single();

        // 3. 메시지 히스토리 조회
        const { data: messages } = await supabaseAdmin
            .from('interview_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (!messages || messages.length === 0) {
            return NextResponse.json(
                { error: 'No interview data found' },
                { status: 404 }
            );
        }

        // 4. 대화 내용 포맷팅
        const conversationText = messages
            .map((m) => `${m.role === 'interviewer' ? '면접관' : '지원자'}: ${m.content}`)
            .join('\n\n');

        // 5. GPT-4o로 피드백 생성
        console.log('Generating feedback with GPT-4o...');
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `너는 면접 전문가이자 HR 컨설턴트야. 다음 면접 대화를 분석하고 객관적이고 구체적인 피드백을 제공해줘.

면접관 정보:
- 이름: ${persona?.name || '면접관'}
- MBTI: ${persona?.mbti_type || 'N/A'}
- 역할: ${persona?.role || '면접관'}
- 특징: ${persona?.keywords?.join(', ') || '일반 면접'}

다음 형식의 JSON으로 응답해줘:
{
  "overallScore": 0-100 사이의 점수,
  "competencies": {
    "technical": 0-100,
    "communication": 0-100,
    "problemSolving": 0-100,
    "leadership": 0-100,
    "passion": 0-100,
    "logicalThinking": 0-100
  },
  "mbtiComments": {
    "strengths": ["강점1", "강점2", "강점3"],
    "improvements": ["개선점1", "개선점2", "개선점3"]
  },
  "questionFeedback": [
    {
      "question": "면접관의 질문",
      "answer": "지원자의 답변",
      "grade": "A" | "B" | "C" | "D",
      "feedback": "이 답변에 대한 구체적인 피드백"
    }
  ]
}

중요:
- 점수는 실제 답변 내용을 기반으로 객관적으로 평가
- 강점과 개선점은 구체적인 예시와 함께 제시
- 각 질문에 대한 피드백은 건설적이고 실행 가능한 조언 포함
- grade는 답변의 완성도와 깊이를 기준으로 평가`,
                },
                {
                    role: 'user',
                    content: `다음 면접 대화를 분석해줘:\n\n${conversationText}`,
                },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
        });

        const feedbackContent = completion.choices[0].message.content;
        if (!feedbackContent) {
            throw new Error('Failed to generate feedback');
        }

        const generatedFeedback = JSON.parse(feedbackContent);

        // 6. 피드백 저장
        const { data: savedFeedback, error: saveError } = await supabaseAdmin
            .from('feedback_reports')
            .insert({
                session_id: sessionId,
                overall_score: generatedFeedback.overallScore,
                competency_scores: generatedFeedback.competencies,
                mbti_analysis: generatedFeedback.mbtiComments,
                question_feedback: generatedFeedback.questionFeedback,
            })
            .select()
            .single();

        if (saveError) {
            // Check for unique constraint violation (code 23505)
            if (saveError.code === '23505') {
                console.log('Feedback already exists, returning existing data.');
                const { data: existingData } = await supabaseAdmin
                    .from('feedback_reports')
                    .select('*')
                    .eq('session_id', sessionId)
                    .single();

                if (existingData) {
                    return NextResponse.json({
                        success: true,
                        feedback: existingData,
                        cached: true,
                    });
                }
            }

            console.error('Failed to save feedback:', saveError);
            throw new Error(`Failed to save feedback: ${saveError.message || JSON.stringify(saveError)}`);
        }

        // 7. 세션 상태 업데이트
        await supabaseAdmin
            .from('interview_sessions')
            .update({ status: 'completed' })
            .eq('id', sessionId);

        return NextResponse.json({
            success: true,
            feedback: savedFeedback,
            cached: false,
        });

    } catch (error: any) {
        console.error('Feedback generation full error:', error);

        // 상세 에러 메시지 구성
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
            errorMessage = error.message;
            if ((error as any).response) {
                // OpenAI API Error
                errorMessage += ` (OpenAI: ${JSON.stringify((error as any).response.data)})`;
            }
        } else {
            errorMessage = JSON.stringify(error);
        }

        return NextResponse.json(
            {
                error: 'Failed to generate feedback',
                details: errorMessage,
                step: 'Check server logs for more info', // 어느 단계에서 에러났는지 힌트
            },
            { status: 500 }
        );
    }
}
