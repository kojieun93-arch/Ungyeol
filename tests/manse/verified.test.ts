/* 실제 HRUM 검증 10건(2026-11-05) 고정 + 독립 기준 계산기 대조
   - 기대값(manse-check-cases.json)은 운영자가 실제 HRUM 응답과 대조해 확인한 값
   - reference.ts 는 앱 코드를 쓰지 않는 별도 계산기 → 둘이 같아야 함
   - 앱의 응답 해석(parseHrumResponse)이 같은 값에서 같은 원국 · 오행 · 천간 십신을 내는지도 확인 */
import CHECK from "@/content/manse-check-cases.json";
import { STEMS, BRANCHES } from "@/features/saju/elements";
import { stemSipsin } from "@/features/saju/relations";
import { parseHrumResponse, mapHrumError } from "@/server/manse/hrum";
import { validateManseRequest, boundaryWarnings } from "@/server/manse/input";
import { calculateManse, clearManseCache } from "@/server/manse/service";
import { readManseConfig } from "@/server/manse/config";
import { reference, dayAnchors, ipchun, sipsinOf, STEM } from "./reference";

const R: string[] = []; let pass = 0, fail = 0;
const t = async (name: string, fn: () => unknown | Promise<unknown>) => { try { const v = await fn(); if (v === false) throw new Error("false"); pass++; R.push("✅ " + name); } catch (e: any) { fail++; R.push("❌ " + name + " — " + (e?.message ?? e)); } };
const eq = (a: unknown, b: unknown) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`); return true; };
const sorted = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).sort());
const NOW = new Date(2026, 10, 5);
const K: any = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" };

const RUN = (CHECK as any).verifiedRuns[0];
const ALL = [...CHECK.cases, ...CHECK.extra] as any[];
const VERIFIED = ALL.filter((c) => RUN.ids.includes(c.id));

// 공식 응답 형식 (값은 기대값, 천간 십신은 독립 계산기 값 — 실제 HRUM 이 이 값을 돌려줬음)
function officialFrom(e: Record<string, string | null>) {
  const ds = STEM.indexOf(e.day![0]);
  const pil = (k: string) => { const g = e[k]; if (!g) return null; const s = STEMS[g[0]], b = BRANCHES[g[1]]; return { stem: s.hangul, branch: b.hangul, stemHanja: g[0], branchHanja: g[1], ohaeng: K[s.element], stemSipsin: k === "day" ? null : sipsinOf(ds, STEM.indexOf(g[0])), branchSipsin: "비견" }; };
  const counts: any = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 }; for (const k of ["year", "month", "day", "hour"]) { const g = e[k]; if (g) for (const ch of g) counts[K[(STEMS[ch] ?? BRANCHES[ch]).element]]++; }
  return { success: true, data: { wonkuk: { year: pil("year"), month: pil("month"), day: pil("day"), hour: pil("hour") }, ohaengBalance: counts, trueSolarTime: null, ...(e.hour ? {} : { birthHour: { known: false } }) } };
}

// ── 0. 독립 계산기 자체 점검
await t("기준 계산기: 일진 기준점 1949-10-01 甲子 · 2000-01-01 戊午 · 1900-01-01 甲戌", () => eq(dayAnchors(), { "1949-10-01": "甲子", "2000-01-01": "戊午", "1900-01-01": "甲戌" }));
await t("기준 계산기: 2024 입춘 2월 4일 17시 무렵 (천문 자료 17:27 과 15분 이내)", () => { const p = ipchun(2024); const mins = p.h * 60 + p.m; return Math.abs(mins - (17 * 60 + 27)) <= 15; });
await t("기준 계산기: 천간 십신 규칙이 앱 규칙(relations.stemSipsin)과 100쌍 모두 같음", () => { for (let a = 0; a < 10; a++) for (let b = 0; b < 10; b++) if (sipsinOf(a, b) !== stemSipsin(STEMS[STEM[a]], STEMS[STEM[b]])) throw new Error(`${STEM[a]}-${STEM[b]}`); return true; });

// ── 1. 검증 기록
await t("검증 기록: 2026-11-05 실제 HRUM 10건 (정상 9 · 의도한 오류 1) · 기본 4건 + 경계 6건", () => RUN.ids.length === 10 && VERIFIED.length === 10 && VERIFIED.filter((c) => c.expectError).length === 1);

// ── 2. 10건 각각: 기대값 = 독립 계산기 = 앱 해석
for (const c of VERIFIED) {
  await t(`${c.id} ${c.topic ?? "기본"} · ${c.name}`, () => {
    const r: any = reference(c.body);
    if (c.expectError) {
      // 의도한 오류: 독립 계산기도 없는 날짜로 판단 · 앱은 HRUM 400 을 같은 코드로 바꿈
      const m = mapHrumError(400, { success: false, statusCode: 400, code: "INVALID_LUNAR_DATE" });
      return eq(r, { error: c.expectError }) && m.code === "INVALID_LUNAR_DATE" && m.httpStatus === 400;
    }
    eq(r.pillars, c.expect);
    const calc = parseHrumResponse(officialFrom(c.expect), c.body.time !== null);
    const app = calc.manse.pillars;
    const byKey = Object.fromEntries(app.map((p) => [p.key, p.stem ? p.stem.hanja + p.branch!.hanja : null]));
    eq(sorted(byKey), sorted(c.expect));
    eq(sorted(Object.fromEntries(calc.manse.elements.counts.map((x) => [x.key, x.count]))), sorted(r.ohaeng));
    eq(sorted(Object.fromEntries(calc.pillars.filter((p) => p.stemSipsin).map((p) => [p.key, p.stemSipsin]))), sorted(r.stemSipsin));
    return calc.checks.hangulMatches && calc.checks.ohaengBalanceMatches && calc.checks.stemSipsinMatches && calc.checks.sipsinNamesKnown;
  });
}

// ── 3. 경계 조건이 실제로 경계를 시험하는지 (독립 계산기 근거)
const by = Object.fromEntries(ALL.map((c) => [c.id, c]));
await t("절기 경계: e1(입춘 전) · e2(입춘 후) 같은 날 다른 연 · 월주, 둘 다 절입 시각과 1시간 넘게 떨어져 계산 오차 영향 없음", () => { const a: any = reference(by.e1.body), b: any = reference(by.e2.body); return a.pillars.year !== b.pillars.year && a.pillars.month !== b.pillars.month && a.pillars.day === b.pillars.day && a.hoursFromTerm > 1 && b.hoursFromTerm > 1; });
await t("자시: e3 23:30 은 다음 날 일주(乙卯) · 子시, 같은 날 08:00(c2)은 甲寅", () => { const a: any = reference(by.e3.body); return a.zasiNextDay && a.pillars.day === "乙卯" && a.pillars.hour === "丙子" && by.c2.expect.day === "甲寅"; });
await t("윤달: e4 2023 윤2월 1일 = 양력 2023-03-22 · 평달 c4 = 2024-02-10", () => (reference(by.e4.body) as any).solar.startsWith("2023-03-22") && (reference(by.c4.body) as any).solar.startsWith("2024-02-10"));
await t("서머타임: e6 1988-07-15 11:30 → 1시간 빼서 10:30 巳시 (빼지 않으면 甲午시)", () => { const a: any = reference(by.e6.body); return a.dstApplied && a.pillars.hour === "癸巳" && a.solar.endsWith("10:30"); });
await t("시각 모름: c3 시주 없음 · 오행 6자만 셈", () => { const a: any = reference(by.c3.body); return a.pillars.hour === null && Object.values(a.ohaeng).reduce((x: number, y: any) => x + y, 0) === 6; });
await t("앱 경고 코드가 경계 사례마다 붙음: NEAR_IPCHUN(e1 · e2) · ZASI_BOUNDARY(e3) · KOREA_DST(e6) · TIME_UNKNOWN(c3) · LUNAR_CONVERTED_BY_PROVIDER(c4 · e4)", () => {
  const w = (id: string) => boundaryWarnings((validateManseRequest(by[id].body, NOW) as any).value).map((x: any) => x.code);
  return w("e1").includes("NEAR_IPCHUN") && w("e2").includes("NEAR_IPCHUN") && w("e3").includes("ZASI_BOUNDARY") && w("e6").includes("KOREA_DST") && w("c3").includes("TIME_UNKNOWN") && w("c4").includes("LUNAR_CONVERTED_BY_PROVIDER") && w("e4").includes("LUNAR_CONVERTED_BY_PROVIDER");
});
await t("선택 사례 e7(09:15): 독립 계산기 기대값 己巳 (정각 시 경계) — 아직 실제 호출 기록 없음", () => { const a: any = reference(by.e7.body); return a.pillars.hour === "己巳" && by.e7.expect.hour === "己巳" && !RUN.ids.includes("e7"); });

// ── 4. 응답 필드 누락 · 계산 기준 불일치 → calculated 안 됨 (운결이 대신 채우지 않음)
const VCFG: any = readManseConfig({ MANSE_PROVIDER: "hrum", HRUM_API_KEY: "k", HRUM_MAPPING_VERIFIED: "true" });
const run = async (c: any, mutate: (j: any) => void) => { clearManseCache(); const j: any = officialFrom(c.expect); mutate(j); const v = (validateManseRequest(c.body, NOW) as any).value; return calculateManse(v, VCFG, (async () => new Response(JSON.stringify(j), { status: 200 })) as typeof fetch); };
await t("필드 완전: 9건 모두 calculated · missing 없음 · reasons 없음", async () => { for (const c of VERIFIED.filter((x) => !x.expectError)) { const r = await run(c, (j) => { if (c.body.calendar === "lunar") j.data.lunarInput = { year: c.body.birth.y }; if (!c.expect.hour) j.data.birthHour = { known: false }; }); if (r.status !== "calculated" || r.calculation.missing.length || r.verification.reasons.length) throw new Error(c.id + " " + r.verification.reasons.join(",")); } return true; });
await t("누락: ohaengBalance · 시주 지지 십신 · 월주 천간 십신 · 기둥 오행 빠지면 unverified + missing 에 이름", async () => { const c = by.c1; const out = [await run(c, (j) => delete j.data.ohaengBalance), await run(c, (j) => delete j.data.wonkuk.hour.branchSipsin), await run(c, (j) => (j.data.wonkuk.month.stemSipsin = null)), await run(c, (j) => delete j.data.wonkuk.year.ohaeng)];
  return out.every((r) => r.status === "unverified" && r.verification.reasons.includes("FIELD_MISSING")) && eq(out.map((r) => r.calculation.missing[0]), ["ohaengBalance", "hour.branchSipsin", "month.stemSipsin", "year.ohaeng"]); });
await t("기준 불일치: 진태양시 보정 적용 · 음력인데 lunarInput 없음 → unverified BASIS_MISMATCH", async () => { const a = await run(by.c1, (j) => (j.data.trueSolarTime = { applied: true })); const b = await run(by.c4, () => {}); return a.status === "unverified" && a.verification.reasons.includes("BASIS_MISMATCH") && b.status === "unverified" && b.verification.reasons.includes("BASIS_MISMATCH"); });
await t("검증 플래그 없음: 값이 모두 맞아도 unverified MAPPING_NOT_VERIFIED", async () => { clearManseCache(); const v = (validateManseRequest(by.c1.body, NOW) as any).value; const r = await calculateManse(v, readManseConfig({ MANSE_PROVIDER: "hrum", HRUM_API_KEY: "k", MANSE_CHECK_TOKEN: "x".repeat(24) }) as any, (async () => new Response(JSON.stringify(officialFrom(by.c1.expect)), { status: 200 })) as typeof fetch); return r.status === "unverified" && eq(r.verification.reasons, ["MAPPING_NOT_VERIFIED"]); });

// ── 5. 경계 규칙 안내 문구
const W = (body: any) => boundaryWarnings((validateManseRequest(body, NOW) as any).value);
await t("서머타임 안내: 1988-07-15(기간 안) 있음 · 1988-01-15(기간 밖) 없음 · 1956 은 '기간 안이면' 조건부 안내", () => { const s = (d: any) => ({ calendar: "solar", leap: null, birth: d, time: { h: 11, m: 30 }, gender: "male" }); const a = W(s({ y: 1988, m: 7, d: 15 })), b = W(s({ y: 1988, m: 1, d: 15 })), c = W(s({ y: 1956, m: 7, d: 1 })); return a.some((w) => w.code === "KOREA_DST" && w.message.includes("1시간을 빼서")) && !b.some((w) => w.code === "KOREA_DST") && c.some((w) => w.code === "KOREA_DST" && w.message.includes("기간") && w.message.includes("안의 출생이면")); });
await t("시각 모름 + 절기 무렵: 월주(입춘이면 연주) 미확정 안내 · 시각 모름 안내는 여섯 글자 기준", () => { const a = W({ calendar: "solar", leap: null, birth: { y: 2024, m: 2, d: 4 }, time: null, gender: "female" }); return a.some((w) => w.message.includes("절기 전후를 가를 수 없어요")) && a.some((w) => w.code === "TIME_UNKNOWN" && w.message.includes("여섯 글자")); });
await t("자시 안내: 23시대만 (22:59 없음 · 23:00 있음)", () => { const s = (h: number, m: number) => W({ calendar: "solar", leap: null, birth: { y: 1996, m: 5, d: 17 }, time: { h, m }, gender: "female" }).some((w) => w.code === "ZASI_BOUNDARY"); return !s(22, 59) && s(23, 0); });

console.log(R.join("\n")); console.log(`\n${pass} ok / ${fail} fail`); if (fail) process.exit(1);
