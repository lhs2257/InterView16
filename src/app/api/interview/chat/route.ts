import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai/client';
import { buildInterviewContext, formatResumeContext } from '@/lib/prompts/mbti-personas';
import { getResumeById } from '@/lib/supabase/rag';
import { supabaseAdmin } from '@/lib/supabase/server';
import { MBTIType } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/interview/chat
 * 실시간 면접 대화 API (스트리밍 지원)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            sessionId,
            userMessage,
            mbti_type,
            resumeId,
            conversationHistory = [],
        } = body;

        if (!sessionId || !mbti_type || !resumeId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // 1. 이력서 정보 가져오기
        const resume = await getResumeById(resumeId);
        const resumeContext = formatResumeContext(resume.parsed_content);

        // 2. 면접 컨텍스트 구성
        const messages = buildInterviewContext(
            mbti_type as MBTIType,
            resumeContext,
            conversationHistory
        );

        // 3. 사용자 메시지 추가 (있는 경우)
        if (userMessage) {
            messages.push({
                role: 'user',
                content: userMessage,
            });

            // 사용자 답변 저장
            await supabaseAdmin.from('interview_messages').insert({
                session_id: sessionId,
                role: 'candidate',
                content: userMessage,
            });
        }

        // 4. 면접 질문 개수 확인 및 종료 로직
        const assistantMessageCount = conversationHistory.filter((m: any) => m.role === 'assistant').length;

        // Greeting(1) + Questions(5) = 6. 
        // 이미 5개의 질문을 했고, 그에 대한 답변이 userMessage로 들어온 상황이면 마무리를 해야 함.
        if (assistantMessageCount >= 6) {
            console.log('Finalizing interview...');
            // 시스템 메시지에 종료 지침 추가
            // messages[0]은 보통 system prompt
            if (messages.length > 0 && messages[0].role === 'system') {
                messages[0].content += `
                
                [IMPORTANT INSTRUCTION]
                The interview is now over. The candidate has answered the final question.
                Please provide a polite closing statement thanking the candidate for their time.
                Do NOT ask any more questions.
                Start your response with "면접이 모두 종료되었습니다."
                `;
            }
        }

        // 5. GPT-4o 스트리밍 응답 생성
        const stream = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages,
            stream: true,
            temperature: 0.7,
            max_tokens: 500,
        });

        // 5. 스트림을 ReadableStream으로 변환
        let fullResponse = '';

        const encoder = new TextEncoder();
        const customStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const content = chunk.choices[0]?.delta?.content || '';
                        fullResponse += content;

                        // 클라이언트에 청크 전송
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                    }

                    // 완료 신호
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));

                    // AI 질문 저장
                    if (fullResponse) {
                        await supabaseAdmin.from('interview_messages').insert({
                            session_id: sessionId,
                            role: 'interviewer',
                            content: fullResponse,
                        });

                        // 세션의 질문 카운트 증가
                        await supabaseAdmin
                            .from('interview_sessions')
                            .update({ total_questions: conversationHistory.length / 2 + 1 })
                            .eq('id', sessionId);
                    }

                    controller.close();
                } catch (error) {
                    console.error('Stream error:', error);
                    controller.error(error);
                }
            },
        });

        return new Response(customStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('Interview chat error:', error);

        return NextResponse.json(
            {
                error: 'Failed to generate response',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
