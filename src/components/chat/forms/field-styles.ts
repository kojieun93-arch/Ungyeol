/*
  입력 폼 (원본에 없는 요소) — 원본 입력창의 재료로 구성
  면 #3f2a31 · 크림 분홍 테두리 #e7c3bb · 보내기 #a15768
  글자는 16px 이상 (iOS 입력 시 화면 확대 방지), 높이 48px (터치 영역)
*/
export const fieldBase =
  "h-12 w-full rounded-full border border-chat-field-stroke/80 bg-chat-surface px-4 text-[1rem] text-white " +
  "placeholder:text-chat-subtle outline-none transition-[border-color] duration-200 " +
  "focus:border-chat-field-stroke aria-[invalid=true]:border-chat-error disabled:opacity-40";

export const labelBase = "mb-1.5 block pl-1 text-[0.8125rem] font-medium text-chat-muted";

export const errorBase = "mt-1.5 pl-1 text-[0.8125rem] leading-snug text-chat-error";

export const submitBase =
  "flex min-h-12 w-full items-center justify-center rounded-full bg-chat-send px-4 text-[0.9375rem] font-semibold text-white " +
  "transition-[filter,scale] duration-200 active:scale-[0.985] active:brightness-110 disabled:opacity-40 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-accent";

export const secondaryBase =
  "flex min-h-12 w-full items-center justify-center rounded-full bg-chat-chip px-4 text-[0.9375rem] font-medium text-white " +
  "shadow-[inset_0_0_0_1px_var(--color-chat-chip-stroke)] transition-[filter] duration-200 active:brightness-125 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-accent";
