import { BRANCHES, ELEMENT_ORDER, STEMS } from "./elements";
import type { DemoProfile, ElementDistribution, ElementKey, ManseInput, ManseResult, Pillar } from "./types";

/** 데모 결과의 기준 — 특정 인물이 아니고, 사용자가 입력한 생년월일과 무관한 고정 사주 */
export const DEMO_PROFILE: DemoProfile = {
  id: "demo-eul-wood",
  label: "운결 데모 사주",
  description: "년 甲戌 · 월 丁卯 · 일 乙丑 · 시 辛亥 (일간 乙木). 화면 구성을 보여드리기 위한 고정 샘플이에요.",
};

/* ──────────────────────────────────────────────────────────
   만세력 제공자

   ManseProvider     : 화면은 이 인터페이스에만 의존
   MockManseProvider : 지금 사용. 입력과 무관한 '고정 샘플'을 돌려줌 (isSample: true)
   실제 계산       : 서버 전용 src/server/manse (POST /api/manse → HRUM 공식 만세력 API)
                     키는 서버 환경 변수 HRUM_API_KEY 로만 읽음 → 클라이언트 번들에 넣지 않음
                     실제 호출 검증 · 기준 만세력 대조(HRUM_MAPPING_VERIFIED) 전에는 화면을 샘플에서 바꾸지 않음
   ────────────────────────────────────────────────────────── */

export interface ManseProvider {
  readonly name: "mock" | "hrum";
  getManse(input: ManseInput): Promise<ManseResult>;
}

/** 여덟 글자에서 오행 개수 세기 (빈 칸 = 시주 미상은 제외) */
export function countElements(pillars: Pillar[]): ElementDistribution {
  const counts = new Map<ElementKey, number>(ELEMENT_ORDER.map((k) => [k, 0]));
  let basis = 0;
  for (const p of pillars) {
    for (const gl of [p.stem, p.branch]) {
      if (!gl) continue;
      basis++;
      counts.set(gl.element, (counts.get(gl.element) ?? 0) + 1);
    }
  }
  const list = ELEMENT_ORDER.map((key) => ({ key, count: counts.get(key) ?? 0 }));
  const max = Math.max(...list.map((c) => c.count));
  const min = Math.min(...list.map((c) => c.count));
  return {
    counts: list,
    basis,
    strongest: list.filter((c) => c.count === max).map((c) => c.key),
    weakest: list.filter((c) => c.count === min).map((c) => c.key),
  };
}

/**
 * 샘플 사주 — 특정 인물의 것이 아니며, 입력한 생년월일로 계산한 것도 아님.
 * 년 甲戌 · 월 丁卯 · 일 乙丑 · 시 辛亥  (일간 乙木)
 */
const SAMPLE_PILLARS: Pillar[] = [
  { key: "hour", label: "시주", stem: STEMS["辛"], branch: BRANCHES["亥"] },
  { key: "day", label: "일주", stem: STEMS["乙"], branch: BRANCHES["丑"] },
  { key: "month", label: "월주", stem: STEMS["丁"], branch: BRANCHES["卯"] },
  { key: "year", label: "년주", stem: STEMS["甲"], branch: BRANCHES["戌"] },
];

/**
 * 동기 버전 — 채팅 카드처럼 즉시 그려야 하는 곳에서 사용.
 * hourKnown=false 이면 샘플의 시주를 '미확정'으로 비워, 시간 미상일 때 화면이 어떻게 달라지는지 보여줌.
 */
export function getSampleManse(hourKnown: boolean): ManseResult {
  const pillars = SAMPLE_PILLARS.map((p) => (p.key === "hour" && !hourKnown ? { ...p, stem: null, branch: null } : p));
  return {
    isSample: true,
    source: "mock",
    pillars,
    dayMaster: STEMS["乙"],
    hourKnown,
    elements: countElements(pillars),
  };
}

export class MockManseProvider implements ManseProvider {
  readonly name = "mock" as const;
  async getManse(input: ManseInput): Promise<ManseResult> {
    // 입력값은 쓰지 않음: 가짜 계산값을 실제 결과처럼 만들지 않기 위해 항상 같은 샘플
    return getSampleManse(input.time !== null);
  }
}

/**
 * 브라우저에서 쓰는 제공자 — 항상 샘플 (실제 계산은 서버 /api/manse 에서만, 키는 서버 환경 변수)
 * 실제 계산 결과를 화면에 쓰기 시작할 때는 이 값이 아니라 서버 응답의 resultStatus 로 판단
 */
export const manseProvider: ManseProvider = new MockManseProvider();

/** 지금 화면의 사주가 샘플인지 — 채팅 문구를 '내 사주'처럼 말하지 않게 */
export const SAJU_SAMPLE_MODE = manseProvider.name === "mock";
