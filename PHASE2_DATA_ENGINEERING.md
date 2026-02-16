1\. PDF 텍스트 추출 (Parsing Strategy)

이력서는 레이아웃이 다양하므로, 구조를 최대한 보존하며 텍스트를 추출해야 합니다.



Tool: PyMuPDF (성능 및 한글 지원 우수) 또는 LangChain PDF Loader



추출 전략:



섹션별 분리 (인적사항, 경력, 프로젝트, 기술 스택)



표(Table) 데이터의 선형화 처리



2\. 이력서 구조화 프롬프트 (Structuring JSON)

추출된 텍스트를 GPT-4o에 전달하여 정해진 JSON 스키마로 변환합니다. 이는 나중에 '꼬리 질문'을 생성할 때 특정 프로젝트나 기술을 즉시 참조하기 위함입니다.



TypeScript

// Prompt: "다음 이력서 텍스트에서 주요 정보를 추출하여 JSON으로 변환해줘."

interface ParsedResume {

&nbsp; summary: string;           // 전체적인 인상/강점

&nbsp; tech\_stacks: string\[];    // 보유 기술 (React, Python 등)

&nbsp; experience: {

&nbsp;   company: string;

&nbsp;   role: string;

&nbsp;   period: string;

&nbsp;   achievements: string\[]; // 수치화된 성과 위주 추출

&nbsp; }\[];

&nbsp; projects: {

&nbsp;   title: string;

&nbsp;   description: string;

&nbsp;   key\_tech: string\[];

&nbsp;   contribution: string;   // 본인의 역할 및 기여도

&nbsp; }\[];

}

3\. RAG(Retrieval-Augmented Generation) 시스템 설계

면접관 AI가 사용자의 이력서 내용을 망각하지 않고 정확하게 질문하게 만듭니다.



Step 1 (Embedding): 분석된 JSON 데이터를 벡터화하여 Supabase Vector Store에 저장합니다.



Step 2 (Context Retrieval): 면접 진행 중, 질문을 생성하기 전에 현재 문맥과 가장 관련 있는 이력서 구절을 검색합니다.



Step 3 (Prompt Injection): "사용자의 \[A 프로젝트]에서 \[B 기술]을 썼다고 되어 있는데, 이와 관련해 MBTI 성격에 맞춰 질문해줘"라고 AI에게 명령합니다.



4\. 꼬리 질문 생성 알고리즘 (Follow-up Logic)

단순 질문이 아닌, 답변의 허점을 파고드는 정교한 로직을 구현합니다.



Deep Drill 로직:



사용자의 첫 답변 수집.



답변 내 '기술적 키워드' 또는 '모호한 표현' 감지.



이력서 데이터와 대조하여 사실관계 확인 질문 생성.



선택된 MBTI 페르소나의 톤 적용 (예: ISTJ라면 "방금 말씀하신 수치가 이력서의 기록과 어떤 연관이 있습니까?"라고 질문).



🛠 Phase 2 구현을 위한 주요 코드 스니펫

이력서 분석 API (Next.js Edge Route):



TypeScript

import { OpenAIEmbeddings } from "@langchain/openai";

import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";



export async function POST(req: Request) {

&nbsp; const { pdfText, userId } = await req.json();

&nbsp; 

&nbsp; // 1. LLM을 통한 JSON 구조화

&nbsp; const structuredData = await llm.invoke(`Extract info into JSON: ${pdfText}`);

&nbsp; 

&nbsp; // 2. 벡터 저장 (Supabase 연동)

&nbsp; await SupabaseVectorStore.fromTexts(

&nbsp;   \[pdfText], 

&nbsp;   \[{ userId, structuredData }], 

&nbsp;   new OpenAIEmbeddings(),

&nbsp;   { client: supabaseClient }

&nbsp; );



&nbsp; return Response.json({ success: true, data: structuredData });

}

