import type { CSSProperties } from "react";

/* ──────────────────────────────────────────────────────────
   채팅 화면 치수 — 디자인 원본 design/source/03-chat.png (954×1649) 실측값

   모든 길이는 '원본 픽셀' 단위로 적고 u() 로 변환합니다.
   --u = 화면 폭 / 954  →  390px 화면에서 1u ≈ 0.409px
   그래서 375 · 390 · 430px 어디서나 원본과 같은 비율로 그려집니다.
   ────────────────────────────────────────────────────────── */

export const MOCK_W = 954;

/** 원본 픽셀 → CSS 길이 */
export const u = (n: number) => `calc(var(--u) * ${n})`;

export const SPEC = {
  header: { h: 188, line: 188 },
  back: { x: 40, y: 71, w: 15, h: 29, stroke: 3.4 },
  dots: { cx: 898, cy: 84.5, d: 8.5, gap: 15 },
  logo: { left: 267, top: -21, w: 393 }, // 로고 이미지 배치 (헤더 기준)

  pad: { left: 51, right: 35 },
  date: { mt: 33, h: 51, px: 25, font: 23.5, mb: 37 },

  avatar: { d: 108, ring: 1.8, gap: 25 },
  name: { font: 24, mt: 4, mb: 14 },

  bubble: { font: 29.4, line: 41.5, px: 31, py: 19.25, radius: 37, maxW: 556, gap: 13 },
  userBubble: { px: 32, radius: 40, border: 2 },
  time: { font: 21, gap: 14 },
  groupGap: 37,

  chips: { h: 66, gap: 23, px: 26, iconGap: 16, icon: 29, font: 23, stroke: 2.5, grid: 72, gridGap: 21 },
  composer: { h: 89, plus: 77, plusGap: 22, sendD: 72, sendInset: 12, font: 27, px: 40, border: 1.8, icon: 32 },
  bottom: { chipsToComposer: 34, below: 69, listToChips: 40 },
} as const;

/*
  읽기 크기 (모바일 사용성 보정)
  원본 비율 그대로면 390px 화면에서 본문이 약 12px 이라 작습니다.
  글자만 키우고, 말풍선 여백·모서리·꼬리는 원본 비율(글자 크기 대비)을 em 으로 유지합니다.
    본문 29.4 → 14~15px  (375px 이하 14px, 390px 이상 15px)
    줄간격 1.5 (읽기 편하게), 상하 여백 0.6em → 한 줄 말풍선 높이 2.7em 으로 원본 비율 유지
    좌우 여백 31/29.4 = 1.055em
    모서리 37/29.4 = 1.26em
*/
export const READ = {
  body: "clamp(14px, 3.85vw, 15px)",
  line: 1.5,
  padX: "1.055em",
  padY: "0.6em",
  userPadX: "1.09em",
  radius: "1.26em",
  userRadius: "1.36em",
  /** 말풍선 최대 폭: 한 줄 약 15~17자. 시간 표시가 붙으면 남는 폭으로 자연스럽게 줄어듦 */
  maxW: "min(17.5em, 100%)",
  name: "12px",
  time: "11px",
  date: "12px",
  /** 보조 글자 최소 크기 */
  chip: `max(calc(var(--u) * 23), 11px)`,
} as const;

/** 채팅 루트에 --u 를 정의 */
export const chatRootVars = {
  ["--u" as string]: `calc(min(100vw, 480px) / ${MOCK_W})`,
} as CSSProperties;
