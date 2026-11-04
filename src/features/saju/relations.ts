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
