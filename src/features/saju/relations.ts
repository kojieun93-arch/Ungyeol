import type { ElementKey } from "./types";

/* 오행의 상생 · 상극과, 일간 기준 다섯 갈래 관계(전통 십성의 큰 분류) */

export const GENERATES: Record<ElementKey, ElementKey> = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" };
export const CONTROLS: Record<ElementKey, ElementKey> = { wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" };

export type GodGroup = "비겁" | "식상" | "재성" | "관성" | "인성";

export const GOD_TEXT: Record<GodGroup, string> = {
  비겁: "나와 같은 기운 — 나를 지탱하는 힘, 곁의 동료",
  식상: "내가 만들어 내는 기운 — 표현과 재능",
  재성: "내가 다루는 기운 — 재물과 성과",
  관성: "나를 다듬는 기운 — 규범과 책임",
  인성: "나를 돕는 기운 — 배움과 보살핌",
};

export function relationTo(dm: ElementKey, other: ElementKey): { name: GodGroup; text: string } {
  const name: GodGroup =
    dm === other ? "비겁" : GENERATES[dm] === other ? "식상" : CONTROLS[dm] === other ? "재성" : CONTROLS[other] === dm ? "관성" : "인성";
  return { name, text: GOD_TEXT[name] };
}

/** 일간 기준으로 그 갈래에 해당하는 오행 */
export function elementOf(dm: ElementKey, group: GodGroup): ElementKey {
  const all: ElementKey[] = ["wood", "fire", "earth", "metal", "water"];
  return all.find((k) => relationTo(dm, k).name === group)!;
}

/* ── 천간 십신 (일간 기준, 표준 규칙) ──
   같은 갈래 안에서 음양이 같으면 앞의 것(비견 · 식신 · 편재 · 편관 · 편인), 다르면 뒤의 것(겁재 · 상관 · 정재 · 정관 · 정인)
   지지 십신은 지장간 · 음양 해석이 학파마다 달라 운결이 따로 계산하지 않음 (HRUM 값을 그대로 씀) */
export const SIPSIN_PAIR: Record<GodGroup, [string, string]> = {
  비겁: ["비견", "겁재"],
  식상: ["식신", "상관"],
  재성: ["편재", "정재"],
  관성: ["편관", "정관"],
  인성: ["편인", "정인"],
};
export const SIPSIN_NAMES = Object.values(SIPSIN_PAIR).flat();

export function stemSipsin(dm: { element: ElementKey; yinYang: "yang" | "yin" }, g: { element: ElementKey; yinYang: "yang" | "yin" }): string {
  const [same, diff] = SIPSIN_PAIR[relationTo(dm.element, g.element).name];
  return dm.yinYang === g.yinYang ? same : diff;
}
