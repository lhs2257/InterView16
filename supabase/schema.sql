-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Vector extension for RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- =========================================
-- Table 1: MBTI Personas (16종 면접관 정보)
-- =========================================
CREATE TABLE mbti_personas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mbti_type VARCHAR(4) NOT NULL UNIQUE,
  mbti_group VARCHAR(2) NOT NULL, -- SJ, SP, NF, NT
  name VARCHAR(100) NOT NULL,
  role VARCHAR(200) NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  voice_id VARCHAR(50) DEFAULT 'alloy', -- OpenAI TTS voice
  difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5),
  keywords TEXT[], -- 질문 스타일 키워드 배열
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_mbti_type ON mbti_personas(mbti_type);
CREATE INDEX idx_mbti_group ON mbti_personas(mbti_group);

-- =========================================
-- Table 2: Resumes (사용자 이력서)
-- =========================================
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- 추후 auth.users 연결 예정
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  parsed_content JSONB NOT NULL, -- AI가 파싱한 구조화된 데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_resume_user ON resumes(user_id);

-- =========================================
-- Table 3: Resume Embeddings (Vector Store for RAG)
-- =========================================
CREATE TABLE resume_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  content TEXT NOT NULL, -- 원본 텍스트 청크
  embedding vector(1536), -- OpenAI embedding dimension
  metadata JSONB, -- 섹션 정보 등
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vector similarity search index
-- Note: Create this index AFTER inserting data for better performance
-- For now, we'll use a simpler index that works with empty tables
CREATE INDEX idx_resume_embedding ON resume_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX idx_embedding_resume ON resume_embeddings(resume_id);

-- =========================================
-- Table 4: Interview Sessions (면접 세션)
-- =========================================
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  persona_id UUID NOT NULL REFERENCES mbti_personas(id),
  resume_id UUID NOT NULL REFERENCES resumes(id),
  status VARCHAR(20) DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_questions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_session_user ON interview_sessions(user_id);
CREATE INDEX idx_session_status ON interview_sessions(status);

-- =========================================
-- Table 5: Interview Messages (질문/답변 로그)
-- =========================================
CREATE TABLE interview_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('interviewer', 'candidate')),
  content TEXT NOT NULL,
  audio_url TEXT, -- TTS/STT 음성 파일 URL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_message_session ON interview_messages(session_id);
CREATE INDEX idx_message_created ON interview_messages(created_at);

-- =========================================
-- Table 6: Feedback Reports (면접 결과 리포트)
-- =========================================
CREATE TABLE feedback_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL UNIQUE REFERENCES interview_sessions(id) ON DELETE CASCADE,
  overall_score DECIMAL(3, 1) CHECK (overall_score >= 0 AND overall_score <= 100),
  
  -- Competency Scores (역량별 점수)
  job_fit_score INTEGER CHECK (job_fit_score >= 0 AND job_fit_score <= 100),
  logic_score INTEGER CHECK (logic_score >= 0 AND logic_score <= 100),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  attitude_score INTEGER CHECK (attitude_score >= 0 AND attitude_score <= 100),
  problem_solving_score INTEGER CHECK (problem_solving_score >= 0 AND problem_solving_score <= 100),
  
  mbti_comment TEXT NOT NULL, -- 페르소나의 한 줄 총평
  recommendations JSONB, -- 보완점 및 추천사항
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_report_session ON feedback_reports(session_id);

-- =========================================
-- Table 7: Refined Answers (교정된 답변)
-- =========================================
CREATE TABLE refined_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES feedback_reports(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES interview_messages(id) ON DELETE CASCADE,
  original_answer TEXT NOT NULL,
  refined_answer TEXT NOT NULL,
  feedback_tags TEXT[], -- #수치활용부족, #STAR기법권장 등
  improvements JSONB, -- 개선 사항 상세
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_refined_report ON refined_answers(report_id);

-- =========================================
-- RLS (Row Level Security) - 추후 활성화
-- =========================================
-- ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE feedback_reports ENABLE ROW LEVEL SECURITY;

-- =========================================
-- Trigger: Update timestamp
-- =========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_resume_updated_at 
BEFORE UPDATE ON resumes 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();
