import type { Pending } from "./types";

/**
 * 메시지 리듬 — 사람이 타이핑하는 것처럼, 그러나 기다림처럼 느껴지지 않게
 *
 * - 채팅방이 열리고 400ms 뒤 '입력 중', 700ms 뒤 첫 메시지
 * - 짧은 메시지(25자 이하): 입력 중 350~550ms
 * - 긴 메시지: 입력 중 600~1000ms (글이 길수록 조금 더)
 * - 카드: 입력 중 800~1000ms
 * - 메시지 사이 짧은 숨 80~200ms
 * - 사용자가 답한 뒤에는 300~450ms 쉬고 입력 중, 그 첫 답장은 최소 650ms 입력 중
 * - 같은 간격이 반복되지 않도록 메시지 id 로 정한 흔들림(jitter)을 더함
 *   → 같은 메시지는 항상 같은 값 (StrictMode 재실행·화면 복귀에도 순서·리듬이 바뀌지 않음)
 * - 모션 최소화 설정이면 전체 리듬을 절반으로 (순서는 그대로)
 */
export const TIMING = {
  openDelay: 400,
  firstTyping: 700,
  shortChars: 25,
  short: [350, 550] as const,
  long: [600, 1000] as const,
  card: [800, 1000] as const,
  between: [80, 200] as const,
  afterUser: [300, 450] as const,
  leadMinTyping: 650,
  reducedFactor: 0.5,
};

/** id → 0~1 사이의 고정된 값 */
export function jitter(id: string, salt = 0) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

const within = ([a, b]: readonly [number, number], t: number) => Math.round(a + (b - a) * t);

export function beforeTyping(item: Pending, isFirstEver: boolean) {
  if (isFirstEver) return TIMING.openDelay;
  return within(item.lead ? TIMING.afterUser : TIMING.between, jitter(item.id, 1));
}

export function typingDuration(item: Pending, isFirstEver: boolean) {
  if (isFirstEver) return TIMING.firstTyping;
  const j = jitter(item.id, 2);
  let ms: number;
  if (item.kind === "card") ms = within(TIMING.card, j);
  else if (item.text.length <= TIMING.shortChars) ms = within(TIMING.short, j);
  else {
    // 길이에 비례(최대 60자에서 상한)하고, 흔들림은 범위의 25% 안에서
    const byLength = Math.min(1, (item.text.length - TIMING.shortChars) / 35);
    ms = within(TIMING.long, Math.min(1, byLength * 0.75 + j * 0.25));
  }
  return item.lead ? Math.max(ms, TIMING.leadMinTyping) : ms;
}
