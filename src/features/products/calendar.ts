import { BRANCHES, ELEMENTS, STEMS } from "@/features/saju/elements";
import type { Glyph } from "@/features/saju/types";

/* ──────────────────────────────────────────────────────────
   달력으로 정해지는 간지 — 연 간지 · 절기 월
   - 연 간지: 60갑자 순환 (서기 4년 = 갑자). 사주에서 해는 양력 1월 1일이 아니라 입춘(2월 4일 무렵)에 바뀜
   - 월: 절기(節)로 바뀜. 달력 월과 절기 월은 어긋나므로, 날짜(일)를 모르면 두 달이 모두 가능
   - 월 천간: 연 천간으로 정해짐 (갑기년 병인월 · 을경년 무인월 · 병신년 경인월 · 정임년 임인월 · 무계년 갑인월)
   - 절기 날짜는 해마다 하루 안팎 달라지므로 '무렵'으로만 표시
   이 파일은 개인의 원국을 계산하지 않음 (원국은 HRUM 연동 후)
   ────────────────────────────────────────────────────────── */

const STEM_ORDER = "甲乙丙丁戊己庚辛壬癸".split("");
const BRANCH_ORDER = "子丑寅卯辰巳午未申酉戌亥".split("");
/** 절기 월 순서 (寅월 = 0) */
const MONTH_BRANCHES = "寅卯辰巳午未申酉戌亥子丑".split("");

/** 달력 월에 들어 있는 절(節) — 그날 무렵부터 다음 절기 월 */
export const MONTH_TERMS: { m: number; term: string; day: number; branch: string }[] = [
  { m: 1, term: "소한", day: 6, branch: "丑" },
  { m: 2, term: "입춘", day: 4, branch: "寅" },
  { m: 3, term: "경칩", day: 6, branch: "卯" },
  { m: 4, term: "청명", day: 5, branch: "辰" },
  { m: 5, term: "입하", day: 6, branch: "巳" },
  { m: 6, term: "망종", day: 6, branch: "午" },
  { m: 7, term: "소서", day: 7, branch: "未" },
  { m: 8, term: "입추", day: 8, branch: "申" },
  { m: 9, term: "백로", day: 8, branch: "酉" },
  { m: 10, term: "한로", day: 8, branch: "戌" },
  { m: 11, term: "입동", day: 7, branch: "亥" },
  { m: 12, term: "대설", day: 7, branch: "子" },
];

export type GanJi = { stem: Glyph; branch: Glyph; hanja: string; hangul: string };

const gj = (s: string, b: string): GanJi => ({ stem: STEMS[s], branch: BRANCHES[b], hanja: `${s}${b}`, hangul: `${STEMS[s].hangul}${BRANCHES[b].hangul}` });

/** 절기 기준 해의 간지 (입춘 ~ 다음 입춘) */
export function yearGanJi(y: number): GanJi {
  const i = (((y - 4) % 60) + 60) % 60;
  return gj(STEM_ORDER[i % 10], BRANCH_ORDER[i % 12]);
}

/** 절기 해 y 의 k번째 절기 월 (寅월 = 0 … 丑월 = 11) */
export function monthGanJi(y: number, k: number): GanJi {
  const ys = STEM_ORDER.indexOf(yearGanJi(y).stem.hanja);
  const base = ((ys % 5) * 2 + 2) % 10; // 寅월 천간
  return gj(STEM_ORDER[(base + k) % 10], MONTH_BRANCHES[k]);
}

export type MonthWindow = {
  calendar: string;
  term: string;
  termDay: number;
  before: { year: number; ganji: GanJi; label: string };
  after: { year: number; ganji: GanJi; label: string };
};

/**
 * 달력 y년 m월 → 절기 기준으로 걸치는 두 달
 * 예) 2025년 3월: 경칩(3월 6일 무렵) 전은 戊寅월, 뒤는 己卯월
 *     1월 · 2월 초는 아직 전년 절기 해
 */
export function monthWindow(y: number, m: number): MonthWindow {
  const t = MONTH_TERMS[m - 1];
  const kAfter = MONTH_BRANCHES.indexOf(t.branch);
  const kBefore = (kAfter + 11) % 12;
  const afterYear = m === 1 ? y - 1 : y;
  const beforeYear = m <= 2 ? y - 1 : y;
  const after = monthGanJi(afterYear, kAfter);
  const before = monthGanJi(beforeYear, kBefore);
  return {
    calendar: `${y}년 ${m}월`,
    term: t.term,
    termDay: t.day,
    before: { year: beforeYear, ganji: before, label: `${m}월 ${t.day}일 무렵 전` },
    after: { year: afterYear, ganji: after, label: `${t.term}(${m}월 ${t.day}일 무렵)부터` },
  };
}

export const ganjiText = (g: GanJi) => `${g.hanja} ${g.hangul}`;
export const ganjiReading = (g: GanJi) => `${ELEMENTS[g.stem.element].hangul}(${ELEMENTS[g.stem.element].hanja}) · ${ELEMENTS[g.branch.element].hangul}(${ELEMENTS[g.branch.element].hanja})`;

/** 두 연월 사이의 개월 수 (달 단위) */
export function monthsBetween(from: { y: number; m: number }, to: Date): number {
  return (to.getFullYear() - from.y) * 12 + (to.getMonth() + 1 - from.m);
}
