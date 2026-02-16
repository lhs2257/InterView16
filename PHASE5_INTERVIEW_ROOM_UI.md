1. 인터페이스 레이아웃 (Room Layout)
사용자가 면접관과 1:1로 대화하는 느낌을 주도록 집중도 높은 화면을 구성합니다.

중앙 영역: 선택된 MBTI 면접관의 고화질 아바타 이미지 또는 루핑 애니메이션.

상단 영역: 현재 면접 진행 상태(예: 전체 5질문 중 3번째)를 나타내는 프로그레스 바.

하단 영역: 사용자의 음성 입력 상태를 보여주는 오디오 비주얼라이저(Audio Visualizer) 및 실시간 자막(STT 결과).

사이드바 (선택형): 이력서 핵심 키워드 메모 및 면접 타이머.

2. 인터랙티브 애니메이션 (Framer Motion)
AI의 상태에 따라 시각적인 변화를 주어 생동감을 부여합니다.

AI가 말할 때 (TTS 재생 중): 아바타 이미지에 미세한 흔들림이나 파동 효과를 주어 '말하고 있음'을 표현합니다.

사용자가 답변할 때 (녹음 중): 오디오 파형이 사용자 목소리 크기에 따라 실시간으로 반응하도록 구현합니다.

생각 중 (LLM 처리 중): "면접관이 답변을 분석 중입니다..."라는 메시지와 함께 부드러운 로딩 애니메이션을 제공합니다.

3. 실시간 자막 및 상태 관리 (STT & State)
음성 인터페이스의 불안함을 해소하기 위해 텍스트 정보를 병행합니다.

실시간 STT: OpenAI Whisper를 통해 변환된 텍스트를 하단에 즉시 표시하여 사용자가 본인의 답변이 제대로 인식되었는지 확인하게 합니다.

대화 로그: 현재까지 오간 질문과 답변을 작게 리스트화하여 문맥을 파악하도록 돕습니다.

4. 면접 종료 제어
수동 종료: "면접 종료" 버튼을 통해 언제든 중단하고 리포트로 넘어갈 수 있게 합니다.

자동 종료: 설정된 질문 갯수(보통 5~7개)가 완료되면 자동으로 Phase 6로 리다이렉트합니다.

🛠 Phase 5 구현을 위한 주요 코드 스니펫
오디오 비주얼라이저 컴포넌트 (React):

TypeScript
const AudioVisualizer = ({ stream }: { stream: MediaStream }) => {
  // Web Audio API를 이용해 stream의 주파수 데이터를 분석하고 
  // Framer Motion의 높이(height) 값에 연결하여 시각화
  return (
    <div className="flex items-center gap-1 h-12">
      {bars.map((bar) => (
        <motion.div
          key={bar.id}
          animate={{ height: bar.value }}
          className="w-1 bg-primary rounded-full"
        />
      ))}
    </div>
  );
};
면접실 메인 컨테이너 구조:

TypeScript
<main className="relative flex flex-col items-center justify-between h-screen p-8 bg-black">
  {/* 상단: 상태 바 */}
  <InterviewHeader progress={60} />

  {/* 중앙: 면접관 아바타 */}
  <section className="flex-1 flex flex-col items-center justify-center">
    <AvatarDisplay mbtiType="ISTJ" isTalking={isAiTalking} />
    <h2 className="mt-6 text-2xl font-semibold text-white">"방금 말씀하신 프로젝트의 구체적 성과는 무엇인가요?"</h2>
  </section>

  {/* 하단: 사용자 입력 및 자막 */}
  <footer className="w-full max-w-3xl p-6 rounded-t-3xl bg-zinc-900/50 backdrop-blur-md">
    <Subtitle text={currentSttResult} />
    <AudioVisualizer stream={micStream} />
    <p className="mt-2 text-xs text-center text-zinc-500">마이크가 켜져 있습니다. 답변을 말씀해 주세요.</p>
  </footer>
</main>