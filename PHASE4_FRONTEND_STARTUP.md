1. 비주얼 테마 및 디자인 시스템
컨셉: "Professional yet Personal" (전문적이면서도 개인화된 경험)

컬러 팔레트: 다크 모드를 기본으로 하되, MBTI 성격 그룹별 포인트 컬러 사용

SJ(관리자형): 신뢰감 있는 블루

SP(예술가형): 활기찬 옐로우/오렌지

NF(이상가형): 따뜻한 그린/민트

NT(분석가형): 이성적인 퍼플/인디고

컴포넌트: shadcn/ui의 Card, Button, Input, Badge를 커스텀하여 사용

2. 메인 페이지 (Landing Section)
Hero Message: "당신의 이력서를 가장 잘 파고들 면접관은 누구입니까?"

Action: 간단한 서비스 소개 후 즉시 이력서 업로드 영역(Drag & Drop) 노출

Social Proof: 현재 지원자들이 가장 많이 선택한 '인기 면접관(MBTI)' 실시간 랭킹 표시

3. MBTI 면접관 선택 인터페이스 (The 16 Personas)
16종의 면접관을 한눈에 보거나 필터링할 수 있는 그리드 시스템을 설계합니다.

Persona Card 구성:

상단: MBTI 타입 및 아바타 이미지 (Framer Motion으로 호버 시 살짝 확대)

중앙: 면접관 이름 및 직함 (예: "냉철한 기술 팀장, ISTJ 김철수")

하단: 성격 키워드 태그 (예: #논리중심, #압박면접, #수치확인)

난이도: 별점(1~5)으로 표시하여 사용자의 도전 욕구 자극

Interaction: 카드 클릭 시 상세 페르소나 설명이 Drawer나 Modal로 등장

4. 면접 설정 및 프리라이트 (Setup & Pre-flight)
면접실 입장 전 최종 점검 단계입니다.

이력서 데이터 확인: Phase 2에서 파싱된 핵심 키워드를 사용자에게 보여주며 "이 내용 위주로 질문이 준비되었습니다"라고 안내

장치 체크: 마이크 입력 상태 시각화(Visualizer), 스피커 테스트 버튼

면접 모드 선택: * 연습 모드: 실시간 자막 노출 및 답변 힌트 제공

실전 모드: 자막 없이 음성으로만 진행, 나중에 교정 리포트만 제공

🛠 Phase 4 구현을 위한 주요 코드 스니펫
MBTI 카드 그리드 컴포넌트 (React/Tailwind):

TypeScript
const MbtiSelector = ({ onSelect }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
      {mbtiPersonas.map((persona) => (
        <motion.div
          key={persona.id}
          whileHover={{ y: -10 }}
          className="cursor-pointer border-2 border-transparent hover:border-primary rounded-3xl overflow-hidden glass-card"
          onClick={() => onSelect(persona)}
        >
          <div className="p-4 flex flex-col items-center">
            <Avatar src={persona.avatarUrl} className="w-24 h-24 mb-4" />
            <Badge variant="outline" className="mb-2">{persona.mbtiType}</Badge>
            <h3 className="font-bold text-lg">{persona.name}</h3>
            <p className="text-xs text-muted-foreground text-center">{persona.role}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};