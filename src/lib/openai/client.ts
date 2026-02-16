import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({
    apiKey,
});

// GPT-4o를 사용한 구조화된 응답 생성
export async function structureResumeData(rawText: string) {
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: `너는 이력서 분석 전문가야. 주어진 이력서 텍스트를 분석하여 정확한 JSON 형식으로 변환해줘.

다음 형식으로 반환해:
{
  "summary": "전체적인 인상과 강점 요약 (2-3문장)",
  "techStacks": ["기술스택1", "기술스택2", ...],
  "experience": [
    {
      "company": "회사명",
      "role": "직책",
      "period": "기간 (예: 2020.01 - 2022.12)",
      "achievements": ["성과1", "성과2", ...]
    }
  ],
  "projects": [
    {
      "title": "프로젝트명",
      "description": "프로젝트 설명",
      "keyTech": ["핵심기술1", "핵심기술2", ...],
      "contribution": "본인의 역할 및 기여도"
    }
  ]
}

중요: 수치화된 성과가 있다면 반드시 포함하고, 모호한 표현은 구체적으로 재구성해줘.`,
            },
            {
                role: 'user',
                content: `다음 이력서를 분석해줘:\n\n${rawText}`,
            },
        ],
        response_format: { type: 'json_object' },
    });

    const result = completion.choices[0].message.content;
    return result ? JSON.parse(result) : null;
}

// 텍스트를 임베딩으로 변환
export async function createEmbedding(text: string) {
    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
    });

    return response.data[0].embedding;
}

// 텍스트를 청크로 분할 (벡터 저장용)
export function chunkText(text: string, maxLength: number = 1000): string[] {
    const chunks: string[] = [];
    const lines = text.split('\n');
    let currentChunk = '';

    for (const line of lines) {
        if ((currentChunk + line).length > maxLength && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = line + '\n';
        } else {
            currentChunk += line + '\n';
        }
    }

    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}
