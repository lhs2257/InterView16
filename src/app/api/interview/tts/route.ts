
import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text, voiceId } = body;

        if (!text) {
            return NextResponse.json(
                { error: 'Text is required' },
                { status: 400 }
            );
        }

        // Map generic voice IDs or leave as is if it matches OpenAI voices
        // OpenAI voices: alloy, echo, fable, onyx, nova, shimmer
        let openaiVoice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova';

        // Simple mapping if we were using ElevenLabs IDs, or just default to nova
        // If user passed a specific OpenAI voice name, use it.
        const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
        if (voiceId && validVoices.includes(voiceId)) {
            openaiVoice = voiceId as any;
        }

        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: openaiVoice,
            input: text,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': buffer.byteLength.toString(),
            },
        });

    } catch (error) {
        console.error('OpenAI TTS Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate speech using OpenAI',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
