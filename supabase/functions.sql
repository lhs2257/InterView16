-- Vector similarity search function for RAG
-- This function searches for resume embeddings similar to a query

CREATE OR REPLACE FUNCTION match_resume_embeddings(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 3,
  filter_resume_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  resume_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    resume_embeddings.id,
    resume_embeddings.resume_id,
    resume_embeddings.content,
    resume_embeddings.metadata,
    1 - (resume_embeddings.embedding <=> query_embedding) as similarity
  FROM resume_embeddings
  WHERE 
    (filter_resume_id IS NULL OR resume_embeddings.resume_id = filter_resume_id)
    AND 1 - (resume_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY resume_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
