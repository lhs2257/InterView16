import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/test/pdf
 * PDF 파싱 테스트
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file' }, { status: 400 });
        }

        // 파일 정보
        console.log('File info:', {
            name: file.name,
            type: file.type,
            size: file.size,
        });

        // Buffer 변환
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.log('Buffer created, size:', buffer.length);

        // pdf-parse 로딩 테스트
        let pdfParse;
        try {
            pdfParse = (await import('pdf-parse')).default;
            console.log('pdf-parse loaded successfully');
        } catch (error) {
            return NextResponse.json({
                error: 'Failed to load pdf-parse',
                details: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            }, { status: 500 });
        }

        // PDF 파싱 테스트
        try {
            const data = await pdfParse(buffer);
            console.log('PDF parsed successfully, text length:', data.text.length);

            return NextResponse.json({
                success: true,
                textLength: data.text.length,
                preview: data.text.substring(0, 200),
                numpages: data.numpages,
            });
        } catch (error) {
            return NextResponse.json({
                error: 'Failed to parse PDF',
                details: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Test error:', error);
        return NextResponse.json({
            error: 'Test failed',
            details: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        }, { status: 500 });
    }
}
