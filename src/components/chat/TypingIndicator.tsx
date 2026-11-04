import { READ } from "./spec";

/** 상담자 입력 중 — 상담자 말풍선과 같은 크림 면 안의 점 세 개 */
export function TypingIndicator() {
  return (
    <div
      role="status"
      aria-label="운결이 입력 중이에요"
      className="inline-flex animate-msg-in items-center bg-chat-advisor"
      // 한 줄 말풍선과 같은 높이 (줄 1.5em + 상하 여백 0.6em×2)
      style={{ fontSize: READ.body, height: "2.7em", borderRadius: READ.radius, padding: `0 ${READ.padX}`, gap: "0.3em" }}
    >
      {[0, 160, 320].map((d) => (
        <span
          key={d}
          data-motion="loop"
          className="animate-typing-dot rounded-full bg-chat-advisor-soft"
          style={{ width: "0.37em", height: "0.37em", animationDelay: `${d}ms` }}
        />
      ))}
    </div>
  );
}
