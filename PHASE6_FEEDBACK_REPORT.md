1. 리포트 핵심 대시보드 (Overall Analytics)
면접이 끝나자마자 사용자의 성적을 시각화하여 한눈에 파악하게 합니다.

MBTI 면접관의 총평: 선택한 페르소나의 말투를 유지한 한 줄 평 (예: ISTJ 면접관 - "기술적 근거는 명확하나 협업에서의 구체적 사례가 부족함").

역량 오각형 차트: 직무 적합성, 논리력, 자신감, 태도, 문제 해결 능력을 5개 축으로 점수화.

합격 확률 시뮬레이터: "현재 답변 수준으로는 해당 기업 합격 확률 65%입니다"와 같은 흥미 요소 배치.

2. 답변 교정 시스템 (The Rewriting Feature)
사용자가 했던 답변을 AI가 'A급 답변'으로 다시 써주는 핵심 기능입니다.

Before & After 비교 뷰: * Original: 사용자가 실제로 했던 답변 (텍스트).

Rewritten: AI가 직무 키워드를 강화하고 구조화(STAR 기법 등)하여 교정한 답변.

핵심 피드백 태그: "수치 활용 부족", "두괄식 구성 권장", "전문 용어 적절" 등 각 문장별 피드백 제공.

3. MBTI 페르소나별 상세 분석
선택한 16종의 면접관 성향에 따라 사용자가 어떻게 대응했는지 분석합니다.

성향 대응도: "사고형(T) 면접관의 압박 질문에 당황하지 않고 논리적으로 대응했습니다."

보완점 가이드: 다음 면접에서 다른 MBTI 면접관(예: 감정형 F)을 만났을 때 주의해야 할 점 제안.

4. 사후 관리 및 공유
PDF 리포트 다운로드: 면접 결과와 교정된 답변을 파일로 저장하여 오프라인 학습 지원.

다시 도전하기: 교정된 답변을 숙지한 후 동일한 면접관과 재면접 유도.

🛠 Phase 6 구현을 위한 주요 코드 스니펫
답변 교정 로직 (GPT-4o Prompt):

TypeScript
// /api/interview/refine
export async function POST(req: Request) {
  const { originalAnswer, question, jobDescription } = await req.json();

  const refinement = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { 
        role: "system", 
        content: `너는 채용 전문가야. 사용자의 답변을 STAR 기법을 활용해 논리적이고 전문적인 답변으로 수정해줘. 
                  반드시 구체적인 수치나 성과가 드러나도록 보완해.` 
      },
      { role: "user", content: `질문: ${question}\n사용자 답변: ${originalAnswer}` }
    ]
  });

  return Response.json({ refined: refinement.choices[0].message.content });
}
결과 시각화 UI (Recharts 활용):

TypeScript
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

const CompetencyChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
      <PolarGrid stroke="#333" />
      <PolarAngleAxis dataKey="subject" tick={{ fill: '#999', fontSize: 12 }} />
      <Radar
        name="Score"
        dataKey="A"
        stroke="#8884d8"
        fill="#8884d8"
        fillOpacity={0.6}
      />
    </RadarChart>
  </ResponsiveContainer>
);