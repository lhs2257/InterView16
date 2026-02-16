
import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'File is required' },
                { status: 400 }
            );
        }

        // Convert File to Blob/Buffer for OpenAI API
        // Note: OpenAI Node SDK expects a File-like object or ReadStream.
        // We can pass the file directly if it's a standard File object.

        console.log('Sending audio to Whisper API...', file.name, file.type, file.size);

        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: 'whisper-1',
            language: 'ko', // Korean language hint
            response_format: 'text',
        });

        console.log('Whisper transcription:', transcription);

        return NextResponse.json({
            success: true,
            text: transcription,
        });

    } catch (error) {
        console.error('STT Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to transcribe audio',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
