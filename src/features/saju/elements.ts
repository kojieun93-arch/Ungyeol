import type { ElementKey, Glyph } from "./types";

/** 오행 메타 — 색은 운결 팔레트(크림 카드 위)에 맞춘 절제된 톤 */
export const ELEMENTS: Record<ElementKey, { hanja: string; hangul: string; color: string; tint: string; tendency: string }> = {
  wood: { hanja: "木", hangul: "목", color: "#5f7d63", tint: "#e3eadf", tendency: "성장 · 시작 · 뻗어 나감" },
  fire: { hanja: "火", hangul: "화", color: "#a8505b", tint: "#f2dfe0", tendency: "표현 · 열정 · 드러냄" },
  earth: { hanja: "土", hangul: "토", color: "#9a7647", tint: "#efe3d0", tendency: "안정 · 중재 · 품음" },
  metal: { hanja: "金", hangul: "금", color: "#7b7680", tint: "#e8e5e8", tendency: "결단 · 정리 · 기준" },
  water: { hanja: "水", hangul: "수", color: "#4c5a78", tint: "#dfe3ec", tendency: "지혜 · 유연 · 스며듦" },
};

export const ELEMENT_ORDER: ElementKey[] = ["wood", "fire", "earth", "metal", "water"];

export const elementLabel = (k: ElementKey) => `${ELEMENTS[k].hangul}(${ELEMENTS[k].hanja})`;

/* 천간 · 지지 (샘플 구성과 다음 단계 API 응답 변환에 사용) */
const g = (hanja: string, hangul: string, element: ElementKey, yinYang: "yang" | "yin"): Glyph => ({ hanja, hangul, element, yinYang });

export const STEMS: Record<string, Glyph> = {
  甲: g("甲", "갑", "wood", "yang"),
  乙: g("乙", "을", "wood", "yin"),
  丙: g("丙", "병", "fire", "yang"),
  丁: g("丁", "정", "fire", "yin"),
  戊: g("戊", "무", "earth", "yang"),
  己: g("己", "기", "earth", "yin"),
  庚: g("庚", "경", "metal", "yang"),
  辛: g("辛", "신", "metal", "yin"),
  壬: g("壬", "임", "water", "yang"),
  癸: g("癸", "계", "water", "yin"),
};

export const BRANCHES: Record<string, Glyph> = {
  子: g("子", "자", "water", "yang"),
  丑: g("丑", "축", "earth", "yin"),
  寅: g("寅", "인", "wood", "yang"),
  卯: g("卯", "묘", "wood", "yin"),
  辰: g("辰", "진", "earth", "yang"),
  巳: g("巳", "사", "fire", "yin"),
  午: g("午", "오", "fire", "yang"),
  未: g("未", "미", "earth", "yin"),
  申: g("申", "신", "metal", "yang"),
  酉: g("酉", "유", "metal", "yin"),
  戌: g("戌", "술", "earth", "yang"),
  亥: g("亥", "해", "water", "yin"),
};
