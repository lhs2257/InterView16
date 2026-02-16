1\. 16종 MBTI 페르소나 로직 (Persona Logic)

각 MBTI 유형에 맞는 시스템 프롬프트를 구성하여 AI의 행동 지침을 설정합니다.



T(사고형) vs F(감정형): T형은 기술적 정교함과 효율성을, F형은 팀워크와 가치관을 중심으로 질문합니다.



J(판단형) vs P(인식형): J형은 계획과 구조화된 답변을 선호하며, P형은 상황 대응력과 유연한 사고를 묻는 질문을 던집니다.



MBTI 프롬프트 예시:



\[ENTP - 아이디어 뱅크 창업가]

"너는 비판적이고 논쟁을 즐기는 ENTP 면접관이야. 후보자의 답변에 대해 항상 '더 나은 대안은 없었을까요?'라며 도전적인 질문을 던져. 격식보다는 창의적인 발상을 높게 평가해."



2\. 멀티모달 대화 흐름 (Multimodal Workflow)

음성과 텍스트가 결합된 실시간 면접 프로세스를 설계합니다.



Input (Whisper): 사용자의 음성 답변을 실시간으로 텍스트화합니다.



Context (LangChain): 현재 질문, 사용자 답변, 그리고 Phase 2에서 분석한 이력서 데이터를 결합합니다.



Brain (GPT-4o): 페르소나를 유지한 채 다음 질문을 생성합니다.



Output (OpenAI TTS): 생성된 질문을 페르소나의 목소리 톤에 맞춰 음성으로 변환합니다.



3\. 실시간 꼬리 질문 알고리즘 (Adaptive Follow-up)

단순 질문 리스트가 아니라 답변에 반응하는 가변적 로직을 구현합니다.



답변 분석: 답변 내 모호한 단어나 강조된 성과를 키워드로 추출합니다.



MBTI 필터링: 추출된 키워드를 기반으로 해당 성격 유형이 궁금해할 법한 질문으로 재구성합니다.



예 (ISTJ): "프로젝트 A를 하셨다고 했는데, 정확히 어느 정도의 리소스가 투입되었나요?"



예 (ENFP): "그 프로젝트를 하면서 팀원들과 어떤 감정적인 유대감을 느끼셨나요?"



4\. 음성 지연 시간 최적화 (Latency Handling)

면접의 몰입도를 위해 대기 시간을 최소화합니다.



Streaming: 텍스트가 생성되는 즉시 TTS로 한 문장씩 읽어주어 끊김 없는 느낌을 줍니다.



VAD (Voice Activity Detection): 사용자가 말을 멈추는 순간을 감지하여 즉시 AI의 턴으로 넘깁니다.



🛠 Phase 3 구현을 위한 주요 코드 스니펫

페르소나 기반 대화 생성 핸들러:



TypeScript

// /api/interview/chat

export async function POST(req: Request) {

&nbsp; const { userSpeech, mbtiType, resumeContext, history } = await req.json();



&nbsp; const response = await openai.chat.completions.create({

&nbsp;   model: "gpt-4o",

&nbsp;   messages: \[

&nbsp;     { role: "system", content: getMbtiPrompt(mbtiType) }, // MBTI 지침 주입

&nbsp;     { role: "system", content: `Context: ${resumeContext}` }, // 이력서 지식 주입

&nbsp;     ...history,

&nbsp;     { role: "user", content: userSpeech }

&nbsp;   ],

&nbsp;   stream: true,

&nbsp; });



&nbsp; return new Response(response.toReadableStream());

}

