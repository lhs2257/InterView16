
import { NextRequest, NextResponse } from 'next/server';
import { structureResumeData } from '@/lib/openai/client';
import { saveResume, storeResumeEmbeddings } from '@/lib/supabase/rag';
import { parsePdf } from '@/lib/pdf-parse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/resume/upload
 * 이력서 PDF를 업로드하고 텍스트를 추출하여 분석합니다.
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const userId = formData.get('userId') as string;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        console.log(`Processing resume upload: ${file.name} (${file.size} bytes)`);

        // 1. PDF 파일을 Buffer로 변환
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 2. PDF 텍스트 추출 (Server-side)
        console.log('Extracting text from PDF...');
        let rawText = '';
        try {
            // Check if buffer is valid
            if (!Buffer.isBuffer(buffer)) {
                throw new Error('File conversion to buffer failed');
            }
            console.log('Buffer created, size:', buffer.length);

            rawText = await parsePdf(buffer);
            console.log('PDF text extracted successfully, length:', rawText.length);
        } catch (e: any) {
            console.error('PDF parsing failed:', e);
            console.error('Error stack:', e.stack);

            // Return JSON error even if parsing fails
            return NextResponse.json(
                {
                    error: 'Failed to extract text from PDF',
                    details: e.message
                },
                { status: 500 }
            );
        }

        if (!rawText || rawText.trim().length === 0) {
            return NextResponse.json(
                { error: 'PDF content is empty or unreadable' },
                { status: 400 }
            );
        }

        console.log(`Extracted ${rawText.length} characters.`);

        // 3. GPT-4o로 구조화된 데이터 생성
        console.log('Structuring resume data with GPT-4o...');
        const structuredData = await structureResumeData(rawText);

        if (!structuredData) {
            return NextResponse.json(
                { error: 'Failed to structure resume data' },
                { status: 500 }
            );
        }

        // 4. 이력서 저장 (DB)
        const fileUrl = `uploaded://${file.name}`; // Placeholder logic

        console.log('Saving resume to database...');
        const savedResume = await saveResume(
            userId,
            fileUrl,
            file.name,
            structuredData
        );

        // 5. RAG용 청크 생성 및 임베딩 저장
        const chunks = rawText.split(/\n\s*\n/).filter(c => c.trim().length > 50);

        if (chunks.length === 0 && rawText.trim().length > 0) {
            chunks.push(rawText);
        }

        const chunksWithMetadata = chunks.map((chunk, index) => ({
            content: chunk,
            metadata: {
                chunkIndex: index,
                section: '전체',
            },
        }));

        console.log(`Storing ${chunksWithMetadata.length} chunks in vector database...`);
        await storeResumeEmbeddings(savedResume.id, chunksWithMetadata);

        // 성공 응답
        return NextResponse.json({
            success: true,
            resume: {
                id: savedResume.id,
                fileName: file.name,
                parsedContent: structuredData,
                totalChunks: chunks.length,
            },
        });

    } catch (error) {
        console.error('Resume upload error:', error);

        return NextResponse.json(
            {
                error: 'Failed to process resume',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
