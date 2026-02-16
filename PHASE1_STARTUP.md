1. 프로젝트 초기 설정 (Project Initialization)가장 먼저 개발 환경을 구축하고 필요한 라이브러리를 설치합니다.Bash# 1. Next.js 프로젝트 생성
npx create-next-app@latest personafit-ai --typescript --tailwind --eslint

# 2. 필수 라이브러리 설치
# UI: shadcn/ui, framer-motion, lucide-react
# AI: openai, langchain
# Auth & DB: @supabase/supabase-js
npm install lucide-react framer-motion openai @supabase/supabase-js langchain @langchain/openai
2. 프로젝트 폴더 구조 (Folder Structure)효율적인 협업과 확장을 위해 다음과 같은 구조를 권장합니다.Plaintextpersonafit-ai/
├── src/
│   ├── app/                # Next.js App Router (Pages & Layouts)
│   ├── components/
│   │   ├── interview/      # 면접실 관련 컴포넌트
│   │   ├── dashboard/      # 리포트 및 이력서 관리
│   │   └── ui/             # shadcn/ui 공통 컴포넌트
│   ├── lib/
│   │   ├── supabase/       # Supabase 클라이언트 설정
│   │   ├── openai/         # OpenAI API 유틸리티
│   │   └── prompts/        # 페르소나별 시스템 프롬프트 모음
│   └── types/              # TypeScript 인터페이스 정의
├── public/
│   └── avatars/            # MBTI 페르소나별 아바타 이미지
└── supabase/
    └── schema.sql          # DB 테이블 스키마
3. 데이터베이스 설계 (Supabase Schema)16종 페르소나와 이력서 데이터를 관리하기 위한 핵심 테이블 설계입니다.SQL-- 1. 면접관 페르소나 정보 테이블
CREATE TABLE mbti_personas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mbti_type VARCHAR(4) NOT NULL,
  name VARCHAR(50) NOT NULL,
  role VARCHAR(100), -- 예: 깐깐한 기술 팀장
  description TEXT,
  system_prompt TEXT NOT NULL, -- MBTI 성향이 반영된 AI 지침
  voice_id VARCHAR(50),        -- OpenAI TTS 목소리 설정
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 사용자 이력서 테이블
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  file_url TEXT NOT NULL,
  parsed_content JSONB,        -- AI가 파싱한 이력서 핵심 데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 면접 세션 테이블
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  persona_id UUID REFERENCES mbti_personas(id),
  resume_id UUID REFERENCES resumes(id),
  status VARCHAR(20) DEFAULT 'ongoing', -- ongoing, completed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
4. MBTI 페르소나 시스템 프롬프트 예시lib/prompts/personas.ts에 저장될 데이터의 구조입니다.MBTI페르소나 컨셉질문 스타일ISTJ원칙주의자 기술 팀장사실 관계 확인, 구체적인 기술 스택의 수치적 성과 질문ENTP아이디어 뱅크 창업가"만약 ~라면?" 식의 가설 질문, 도전적인 기술적 대안 제시 요구ENFJ공감형 인사 담당자협업 경험, 갈등 해결 능력, 조직 문화 적합성 위주 질문