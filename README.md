# InterView16 🎯

**16가지 MBTI 성향의 AI 면접관과 함께하는 실전 면접 연습 서비스**

## 프로젝트 개요

InterView16은 16종의 MBTI 성향을 가진 AI 면접관과 실시간 음성 면접을 진행하고, 답변을 분석하여 A급 답변으로 교정해주는 AI 면접 준비 플랫폼입니다.

### 핵심 기능

- 🎭 **16종 MBTI 면접관**: 각 성향별로 다른 질문 스타일과 평가 기준
- 📄 **이력서 분석 (RAG)**: AI가 이력서를 분석하여 맞춤형 질문 생성
- 🎙️ **실시간 음성 면접**: Whisper STT + GPT-4o + OpenAI TTS
- 🔄 **적응형 꼬리 질문**: 답변 내용에 따라 동적으로 심화 질문 생성
- 📊 **상세 피드백**: 역량별 점수, MBTI 총평, 답변 교정 (STAR 기법)

## 기술 스택

### Backend
- **Next.js 15+** (App Router, TypeScript)
- **Supabase** (PostgreSQL + Vector Store)
- **GPT-4o** (대화 엔진, 이력서 분석, 답변 교정)
- **Whisper** (음성→텍스트)
- **OpenAI TTS** (텍스트→음성)
- **LangChain** (RAG 시스템)

### Frontend
- **React 18+**
- **Tailwind CSS** (MBTI 그룹별 컬러 테마)
- **shadcn/ui** (UI 컴포넌트)
- **Framer Motion** (애니메이션)
- **Recharts** (데이터 시각화)
- **Stitch MCP** (UI 디자인 프로토타이핑)

## 시작하기

### 사전 요구사항

- Node.js 18.17 이상
- npm 또는 yarn
- Supabase 계정
- OpenAI API 키

### 설치

```bash
# 1. 의존성 설치
npm install --legacy-peer-deps

# 2. 환경 변수 설정
cp .env.local.example .env.local

# .env.local 파일을 열고 다음 값을 설정하세요:
# - OPENAI_API_KEY
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY

# 3. Supabase 데이터베이스 설정
# Supabase SQL Editor에서 다음 파일들을 순서대로 실행:
# 1. supabase/schema.sql
# 2. supabase/seed-personas.sql

# 4. 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

```
InterView16/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # 메인 랜딩
│   │   ├── personas/          # 면접관 선택 (예정)
│   │   ├── interview/         # 면접실 (예정)
│   │   └── report/            # 피드백 리포트 (예정)
│   ├── components/
│   │   ├── interview/         # 면접 관련 컴포넌트
│   │   ├── dashboard/         # 대시보드/리포트
│   │   └── ui/                # shadcn/ui 공통 컴포넌트
│   ├── lib/
│   │   ├── supabase/          # Supabase 클라이언트
│   │   ├── openai/            # OpenAI 유틸
│   │   └── prompts/           # MBTI 페르소나 프롬프트
│   └── types/                 # TypeScript 타입 정의
├── public/
│   └── avatars/               # MBTI 아바타 이미지
└── supabase/
    ├── schema.sql             # DB 스키마
    └── seed-personas.sql      # 16종 페르소나 데이터
```

## 개발 단계

### Phase 1: 프로젝트 초기 설정 ✅
- [x] Next.js 프로젝트 구조
- [x] Supabase 스키마 및 16종 페르소나
- [x] 기본 설정 파일

### Phase 2: 데이터 엔지니어링 (진행 예정)
- [ ] PDF 이력서 파싱
- [ ] RAG 시스템 구축
- [ ] 벡터 임베딩 저장

### Phase 3: 면접 엔진 (진행 예정)
- [ ] MBTI 페르소나 프롬프트
- [ ] 실시간 대화 API
- [ ] 꼬리 질문 알고리즘

### Phase 4-6: 프론트엔드 (Stitch MCP) (진행 예정)
- [ ] 랜딩 페이지 & 페르소나 선택
- [ ] 면접실 UI
- [ ] 피드백 리포트

## MBTI 페르소나

### SJ (관리자형) - 블루
- **ISTJ**: 원칙주의자 기술 팀장
- **ISFJ**: 공감형 인사 담당자
- **ESTJ**: 직설적 경영진
- **ESFJ**: 친화적 팀 리더

### SP (예술가형) - 옐로우
- **ISTP**: 실용적 기술자
- **ISFP**: 창의적 디자이너
- **ESTP**: 도전적 영업 리더
- **ESFP**: 활기찬 엔터테이너

### NF (이상가형) - 그린
- **INFJ**: 통찰력 있는 멘토
- **INFP**: 이상주의 기획자
- **ENFJ**: 카리스마 있는 리더
- **ENFP**: 아이디어 뱅크 창업가

### NT (분석가형) - 퍼플
- **INTJ**: 전략적 설계자
- **INTP**: 논리적 분석가
- **ENTJ**: 비판적 CEO
- **ENTP**: 논쟁적 혁신가

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.
