import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import pdfParse from 'pdf-parse';

/**
 * PDF 파일에서 텍스트를 추출합니다
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    // PDF 파싱
    const data = await pdfParse(pdfBuffer);

    // 텍스트 반환
    return data.text;
}

/**
 * 텍스트를 semantic한 청크로 분할합니다 (RAG용)
 */
export async function splitTextIntoChunks(text: string): Promise<string[]> {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
        separators: ['\n\n', '\n', '. ', ' ', ''],
    });

    const chunks = await splitter.splitText(text);
    return chunks;
}

/**
 * 이력서 텍스트에서 섹션을 감지하고 구분합니다
 */
export function detectResumeSections(text: string): {
    section: string;
    content: string;
}[] {
    const sections: { section: string; content: string }[] = [];

    // 일반적인 이력서 섹션 패턴
    const sectionPatterns = [
        /^(인적사항|개인정보|Personal Information)/im,
        /^(학력|Education)/im,
        /^(경력|경력사항|Work Experience|Experience)/im,
        /^(프로젝트|Projects)/im,
        /^(기술|기술스택|Skills|Technical Skills)/im,
        /^(자격증|Certifications)/im,
    ];

    const lines = text.split('\n');
    let currentSection = '기타';
    let currentContent = '';

    for (const line of lines) {
        let foundSection = false;

        for (const pattern of sectionPatterns) {
            if (pattern.test(line)) {
                // 이전 섹션 저장
                if (currentContent.trim()) {
                    sections.push({
                        section: currentSection,
                        content: currentContent.trim(),
                    });
                }

                // 새 섹션 시작
                currentSection = line.trim();
                currentContent = '';
                foundSection = true;
                break;
            }
        }

        if (!foundSection) {
            currentContent += line + '\n';
        }
    }

    // 마지막 섹션 저장
    if (currentContent.trim()) {
        sections.push({
            section: currentSection,
            content: currentContent.trim(),
        });
    }

    return sections;
}
