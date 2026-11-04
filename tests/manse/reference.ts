/* ──────────────────────────────────────────────────────────
   독립 기준 계산기 (테스트 전용 — 앱 코드 · HRUM 을 전혀 쓰지 않음)
   - 절기: 태양 겉보기 황경 (Meeus, Astronomical Algorithms 25장 저정밀식, 오차 약 0.01° ≈ 15분)
     입춘 = 황경 315°, 이후 30°마다 다음 달(寅 → 卯 → …)
   - 연주: 입춘 기준 (입춘 전이면 전년)
   - 월주: 절기 월지 + 오호둔 (甲己년 丙寅월 시작 …)
   - 일주: 율리우스 일수(JDN) 60일 순환, (JDN + 49) mod 60 = 0 이 甲子
     교차 확인: 1949-10-01 甲子 · 2000-01-01 戊午 · 1900-01-01 甲戌
   - 시주: 시계 시각(표준시, 진태양시 보정 없음), 子시 = 23:00–00:59, 오서둔 (甲己일 甲子시 시작 …)
   - 자시: 전통 규칙 — 23시 이후는 다음 날 일주
   - 서머타임: 한국 1987 · 1988 시행 기간이면 1시간 뺌 (공식 문서 규칙과 같음)
   - 음력: 이 시험에 쓰는 날짜만 공개 역법 자료(한국천문연구원 음양력) 대응표로 변환
   ────────────────────────────────────────────────────────── */

export const STEM = "甲乙丙丁戊己庚辛壬癸";
export const BRANCH = "子丑寅卯辰巳午未申酉戌亥";
const STEM_EL = ["wood", "wood", "fire", "fire", "earth", "earth", "metal", "metal", "water", "water"];
const BRANCH_EL = ["water", "earth", "wood", "wood", "earth", "fire", "fire", "earth", "metal", "metal", "earth", "water"];

/** 그레고리력 날짜 → 율리우스 일수 (정오 기준 정수) */
export function jdn(y: number, m: number, d: number) {
  const a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}
const gz = (i: number) => STEM[((i % 10) + 10) % 10] + BRANCH[((i % 12) + 12) % 12];
const ganzhiIndex = (s: number, b: number) => { for (let i = 0; i < 60; i++) if (i % 10 === s && i % 12 === b) return i; return -1; };

/** 태양 겉보기 황경(도) — jd 는 율리우스일(TT ≈ UT, ΔT 1분 남짓은 무시) */
export function sunLongitude(jd: number) {
  const T = (jd - 2451545.0) / 36525, r = Math.PI / 180;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * r) + (0.019993 - 0.000101 * T) * Math.sin(2 * M * r) + 0.000289 * Math.sin(3 * M * r);
  const om = 125.04 - 1934.136 * T;
  const lam = L0 + C - 0.00569 - 0.00478 * Math.sin(om * r);
  return ((lam % 360) + 360) % 360;
}
/** KST(UTC+9) 시각 → 율리우스일 */
const jdKst = (y: number, m: number, d: number, h: number, mi: number) => jdn(y, m, d) - 0.5 + (h - 9 + mi / 60) / 24;

/** 가장 가까운 절기(315° + 30°k) 까지 남은 시간(시간 단위, 하루 황경 이동 ≈ 0.9856°) */
export function hoursToNearestTerm(lam: number) {
  const off = (((lam - 315) % 30) + 30) % 30; return (Math.min(off, 30 - off) / 0.9856) * 24;
}

const KOREA_DST: [string, string][] = [["1987-05-10T02:00", "1987-10-11T03:00"], ["1988-05-08T02:00", "1988-10-09T03:00"]];
const stamp = (y: number, m: number, d: number, h: number, mi: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;

/** 음력 → 양력 (시험 사례용 대응표 · 출처: 한국천문연구원 음양력 정보) */
const LUNAR_TABLE: Record<string, [number, number, number]> = {
  "2024-1-1-평": [2024, 2, 10], // 2024 설날
  "2023-2-1-윤": [2023, 3, 22], // 2023 윤2월 초하루
};

export type RefInput = { calendar: "solar" | "lunar"; leap: boolean | null; birth: { y: number; m: number; d: number }; time: { h: number; m: number } | null };
export type RefResult = {
  pillars: { year: string; month: string; day: string; hour: string | null };
  ohaeng: Record<string, number>;
  stemSipsin: Record<string, string>;
  solar: string; dstApplied: boolean; zasiNextDay: boolean; hoursFromTerm: number;
} | { error: "INVALID_LUNAR_DATE" };

const SIPSIN = [["비견", "겁재"], ["식신", "상관"], ["편재", "정재"], ["편관", "정관"], ["편인", "정인"]];
/** 일간 기준 천간 십신 — 오행 생극(같음 · 내가 생함 · 내가 극함 · 나를 극함 · 나를 생함) + 음양 같으면 앞, 다르면 뒤 */
export function sipsinOf(dayStem: number, s: number) {
  const a = Math.floor(dayStem / 2), b = Math.floor(s / 2); const rel = (b - a + 5) % 5;
  return SIPSIN[rel][dayStem % 2 === s % 2 ? 0 : 1];
}

export function reference(inp: RefInput): RefResult {
  let { y, m, d } = inp.birth;
  if (inp.calendar === "lunar") {
    const hit = LUNAR_TABLE[`${y}-${m}-${d}-${inp.leap ? "윤" : "평"}`];
    if (!hit) {
      if (inp.leap) return { error: "INVALID_LUNAR_DATE" }; // 대응표에 없는 윤달 = 그해에 없는 윤달 (2024년은 윤달 없음)
      throw new Error("대응표에 없는 음력 날짜");
    }
    [y, m, d] = hit;
  }
  let h = inp.time?.h ?? 12, mi = inp.time?.m ?? 0;
  const solar = stamp(y, m, d, h, mi);
  const dstApplied = !!inp.time && KOREA_DST.some(([a, b]) => solar >= a && solar < b);
  let J = jdn(y, m, d);
  if (dstApplied) { h -= 1; if (h < 0) { h += 24; J -= 1; } }
  // 연 · 월: 실제 순간의 태양 황경
  const lam = sunLongitude(jdKst(y, m, d, h, mi) + (J - jdn(y, m, d)));
  const monthIdx = Math.floor((((lam - 315) % 360) + 360) % 360 / 30); // 0 = 寅
  const solarYear = m <= 2 && monthIdx >= 10 ? y - 1 : y; // 1~2월에 아직 子 · 丑월이면 입춘 전
  const ys = (solarYear - 4) % 10, yb = (solarYear - 4) % 12;
  const ms = ((ys % 5) * 2 + 2 + monthIdx) % 10, mb = (2 + monthIdx) % 12;
  // 일 · 시
  const zasiNextDay = !!inp.time && h >= 23;
  const di = ((J + (zasiNextDay ? 1 : 0) + 49) % 60 + 60) % 60;
  const ds = di % 10, dbr = di % 12;
  let hour: string | null = null;
  if (inp.time) { const hb = Math.floor(((h * 60 + mi + 60) % 1440) / 120); hour = STEM[((ds % 5) * 2 + hb) % 10] + BRANCH[hb]; }
  const pillars = { year: STEM[ys] + BRANCH[yb], month: STEM[ms] + BRANCH[mb], day: gz(di), hour };
  const ohaeng: Record<string, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  for (const g of Object.values(pillars)) if (g) { ohaeng[STEM_EL[STEM.indexOf(g[0])]]++; ohaeng[BRANCH_EL[BRANCH.indexOf(g[1])]]++; }
  const stemSipsin: Record<string, string> = {};
  for (const k of ["year", "month", "hour"] as const) { const g = pillars[k]; if (g) stemSipsin[k] = sipsinOf(ds, STEM.indexOf(g[0])); }
  void ganzhiIndex; void dbr;
  return { pillars, ohaeng, stemSipsin, solar: stamp(y, m, d, h, mi), dstApplied, zasiNextDay, hoursFromTerm: hoursToNearestTerm(lam) };
}

/** 일진 기준점 자체 점검 (계산기 자체가 맞는지) */
export const dayAnchors = () => ({ "1949-10-01": gz(jdn(1949, 10, 1) + 49), "2000-01-01": gz(jdn(2000, 1, 1) + 49), "1900-01-01": gz(jdn(1900, 1, 1) + 49) });
/** 입춘 시각 (KST, 분 단위) — 이분법으로 황경 315° 통과 시각 */
export function ipchun(year: number) {
  let lo = jdKst(year, 2, 2, 0, 0), hi = jdKst(year, 2, 6, 0, 0);
  for (let i = 0; i < 50; i++) { const mid = (lo + hi) / 2; const l = sunLongitude(mid); if (l >= 315 && l < 345) hi = mid; else lo = mid; }
  const kst = (hi + 0.5 + 9 / 24); const z = Math.floor(kst), frac = kst - z;
  const mins = Math.round(frac * 1440); return { jdnDay: z, h: Math.floor(mins / 60), m: mins % 60 };
}
