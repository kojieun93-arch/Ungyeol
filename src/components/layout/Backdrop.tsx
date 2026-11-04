/** 배경: 채팅 화면과 같은 딥 플럼 단색 (그라데이션·장식 없음). 고정 레이어. */
export function Backdrop() {
  return <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-plum-950" />;
}
