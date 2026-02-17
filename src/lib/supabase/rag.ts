import { supabase } from '../supabase/client';
import { supabaseAdmin } from '../supabase/server';
import { createEmbedding } from '../openai/client';

/**
 * 이력서 임베딩을 Supabase Vector Store에 저장합니다
 */
export async function storeResumeEmbeddings(
    resumeId: string,
    chunks: Array<{ content: string; metadata?: any }>
) {
    const embeddings = await Promise.all(
        chunks.map(async (chunk) => {
            const embedding = await createEmbedding(chunk.content);
            return {
                resume_id: resumeId,
                content: chunk.content,
                embedding,
                metadata: chunk.metadata,
            };
        })
    );

    const { data, error } = await supabaseAdmin
        .from('resume_embeddings')
        .insert(embeddings);

    if (error) {
        throw new Error(`Failed to store embeddings: ${error.message}`);
    }

    return data;
}

/**
 * 쿼리와 유사한 이력서 내용을 검색합니다 (RAG)
 */
export async function searchResumeContext(
    resumeId: string,
    query: string,
    limit: number = 3
) {
    // 쿼리를 임베딩으로 변환
    const queryEmbedding = await createEmbedding(query);

    // Vector similarity search
    const { data, error } = await supabase.rpc('match_resume_embeddings', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: limit,
        filter_resume_id: resumeId,
    });

    if (error) {
        console.error('Search error:', error);
        return [];
    }

    return data || [];
}

/**
 * 이력서 데이터를 저장합니다
 */
export async function saveResume(
    userId: string,
    fileUrl: string,
    fileName: string,
    parsedContent: any
) {
    const { data, error } = await supabaseAdmin
        .from('resumes')
        .insert({
            user_id: userId,
            file_url: fileUrl,
            file_name: fileName,
            parsed_content: parsedContent,
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to save resume: ${error.message}`);
    }

    return data;
}

/**
 * 사용자의 이력서 목록을 가져옵니다
 */
export async function getUserResumes(userId: string) {
    const { data, error } = await supabaseAdmin
        .from('resumes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(`Failed to fetch resumes: ${error.message}`);
    }

    return data;
}

/**
 * 특정 이력서를 조회합니다
 */
export async function getResumeById(resumeId: string) {
    const { data, error } = await supabaseAdmin
        .from('resumes')
        .select('*')
        .eq('id', resumeId)
        .single();

    if (error) {
        throw new Error(`Failed to fetch resume: ${error.message}`);
    }

    return data;
}
