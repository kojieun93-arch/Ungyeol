import type { ChatState } from "./reducer";

/* ──────────────────────────────────────────────────────────
   재진입 정책 (메모리 전용)

   · 앱 안에서 이동했다가 /chat 으로 돌아오면   → 대화를 이어서 보여줌
     (이미 본 메시지는 애니메이션 없이 즉시, 진행 중이던 메시지는 이어서)
   · 새로고침 / 탭 닫기                         → 처음부터 (모듈 메모리가 사라짐)
   · 마지막 활동 후 30분 경과                    → 처음부터
   · 메뉴 '처음부터 다시'                        → 즉시 삭제

   localStorage·sessionStorage·쿠키·서버에는 아무것도 저장하지 않습니다.
   (서버 렌더링 시에는 읽지도 쓰지도 않음 → 사용자 간 공유 불가)
   ────────────────────────────────────────────────────────── */

export const RESUME_TTL_MS = 30 * 60 * 1000;

let snapshot: { state: ChatState; savedAt: number } | null = null;

const isBrowser = () => typeof window !== "undefined";

export function loadChat(now = Date.now()): ChatState | null {
  if (!isBrowser() || !snapshot) return null;
  if (now - snapshot.savedAt > RESUME_TTL_MS) {
    snapshot = null;
    return null;
  }
  // 이전 버전 구조(상담 맥락 없음)는 이어 보지 않음
  if (!snapshot.state.consult) {
    snapshot = null;
    return null;
  }
  return snapshot.state;
}

export function saveChat(state: ChatState, now = Date.now()) {
  if (!isBrowser()) return;
  snapshot = { state, savedAt: now };
}

export function clearChat() {
  snapshot = null;
}
