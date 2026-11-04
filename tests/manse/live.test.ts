import CHECK from "@/content/manse-check-cases.json";
import { STEMS, BRANCHES } from "@/features/saju/elements";
import { stemSipsin } from "@/features/saju/relations";
import { buildHrumBody, parseHrumResponse } from "@/server/manse/hrum";
import { validateManseRequest } from "@/server/manse/input";
import { handleMansePost, handleManseStatus } from "@/server/manse/handler";
import { __resetMemoryStore as resetRateLimit } from "@/server/manse/store";
import { clearManseCache } from "@/server/manse/service";
import { __resetLive, ensureLiveMode, requestLive, getLiveEntry, toLiveEntry, isSampleMode } from "@/features/saju/live";
import { resultFor } from "@/features/chat/consultation";
import { buildMyReport } from "@/features/report/build";
import { buildProductReport } from "@/features/products/build";
import type { ProductSource } from "@/features/products/source";
import { fakeUpstash, UP_TOKEN, UP_URL } from "./fakeUpstash";
import { DAY_MASTER_TRAITS } from "@/features/saju/personality";

const R: string[] = []; let pass = 0, fail = 0;
const t = async (name: string, fn: () => unknown | Promise<unknown>) => { try { const v = await fn(); if (v === false) throw new Error("false"); pass++; R.push("✅ " + name); } catch (e: any) { fail++; R.push("❌ " + name + " — " + (e?.message ?? e)); } };
const eq = (a: unknown, b: unknown) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`); return true; };
const NOW = new Date(2026, 10, 5);
const K: any = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" };
// 공식 응답 형식의 가짜 응답을 '검증된 기준값'으로 만듦 (천간 십신은 표준 규칙 값)
function officialFor(e: Record<string, string | null>) {
  const dm = STEMS[e.day![0]];
  const pil = (k: string) => { const g = e[k]; if (!g) return null; const s = STEMS[g[0]], b = BRANCHES[g[1]]; return { stem: s.hangul, branch: b.hangul, stemHanja: g[0], branchHanja: g[1], ohaeng: K[s.element], stemSipsin: k === "day" ? null : stemSipsin(dm, s), branchSipsin: "정재" }; };
  const counts: any = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 }; for (const k of ["year", "month", "day", "hour"]) { const g = e[k]; if (g) for (const ch of g) counts[K[(STEMS[ch] ?? BRANCHES[ch]).element]]++; }
  return { success: true, data: { wonkuk: { year: pil("year"), month: pil("month"), day: pil("day"), hour: pil("hour") }, ohaengBalance: counts, trueSolarTime: null, ...(e.hour ? {} : { birthHour: { known: false } }) } };
}
// ── 1. 검증된 네 사례 고정 (사용자 실제 호출 4/4 일치 · 2026-11-05)
const PINNED: Record<string, { pillars: string[]; ohaeng: Record<string, number>; stemSipsin: Record<string, string> }> = {
  c1: { pillars: ["壬午", "庚辰", "辛巳", "庚午"], ohaeng: { wood: 0, fire: 3, earth: 1, metal: 3, water: 1 }, stemSipsin: { year: "비견", month: "겁재", hour: "식신" } },
  c2: { pillars: ["戊辰", "甲寅", "癸巳", "丙子"], ohaeng: { wood: 2, fire: 2, earth: 2, metal: 0, water: 2 }, stemSipsin: { year: "식신", month: "정인", hour: "편재" } },
  c3: { pillars: ["", "壬辰", "丙戌", "乙丑"], ohaeng: { wood: 1, fire: 1, earth: 3, metal: 0, water: 1 }, stemSipsin: { year: "상관", month: "편재" } },
  c4: { pillars: ["己巳", "甲辰", "丙寅", "甲辰"], ohaeng: { wood: 3, fire: 2, earth: 3, metal: 0, water: 0 }, stemSipsin: { year: "비견", month: "식신", hour: "정재" } },
};
for (const c of CHECK.cases as any[]) {
  await t(`고정 ${c.id} ${c.name}: 요청 본문 · 원국 · 오행 개수 · 천간 십신 · 점검 통과`, () => {
    const v = (validateManseRequest(c.body, NOW) as any).value; const body = buildHrumBody(v);
    const calc = parseHrumResponse(officialFor(c.expect), c.body.time !== null);
    const P = PINNED[c.id];
    return eq(body.year, c.body.birth.y) && (c.body.calendar === "lunar" ? body.calendar === "lunar" && body.isLeapMonth === false : !("calendar" in body)) && (c.body.time ? body.hour === c.body.time.h : !("hour" in body))
      && eq(calc.manse.pillars.map((p) => (p.stem ? p.stem.hanja + p.branch!.hanja : "")), P.pillars)
      && eq(Object.fromEntries(calc.manse.elements.counts.map((x) => [x.key, x.count])), P.ohaeng)
      && eq(Object.fromEntries(calc.pillars.filter((p) => p.stemSipsin).map((p) => [p.key, p.stemSipsin]).sort()), Object.fromEntries(Object.entries(P.stemSipsin).sort()))
      && calc.checks.ohaengBalanceMatches === true && calc.checks.stemSipsinMatches === true && calc.checks.sipsinNamesKnown === true && calc.checks.hangulMatches === true;
  });
}
await t("십신 표준 규칙: 천간 십신이 다르면(예: 정재↔편재 뒤바뀜) stemSipsinMatches false · 10종 밖 이름이면 sipsinNamesKnown false", () => {
  const j: any = officialFor((CHECK.cases[0] as any).expect); j.data.wonkuk.hour.stemSipsin = "상관"; const a = parseHrumResponse(j, true);
  const k: any = officialFor((CHECK.cases[0] as any).expect); k.data.wonkuk.year.branchSipsin = "칠살"; const b = parseHrumResponse(k, true);
  return a.checks.stemSipsinMatches === false && b.checks.sipsinNamesKnown === false; });
await t("추가 사례 기준값 데이터: 절기 경계(입춘 전/후 연 · 월주 바뀜) · 자시 다음 날 일주 · 윤달 · 서머타임 · 없는 윤달 오류", () => {
  const x = Object.fromEntries((CHECK.extra as any[]).map((c) => [c.id, c])); return x.e1.expect.year === "癸卯" && x.e2.expect.year === "甲辰" && x.e1.expect.day === x.e2.expect.day && x.e3.expect.day === "乙卯" && x.e4.body.leap === true && x.e5.expectError === "INVALID_LUNAR_DATE" && x.e6.expect.hour === "癸巳"; });

// ── 2. 공개 사용 보호 (과금 방지)
const TOKEN = "check-token-0123456789abcdef";
const BASE = { MANSE_PROVIDER: "hrum", HRUM_API_KEY: "k", MANSE_CHECK_TOKEN: TOKEN };
const okHrum = (async () => new Response(JSON.stringify(officialFor((CHECK.cases[0] as any).expect)), { status: 200 })) as typeof fetch;
const body1 = (CHECK.cases[0] as any).body;
const req = (h: Record<string, string> = {}) => new Request("https://ungyeol.test/api/manse", { method: "POST", headers: { "content-type": "application/json", host: "ungyeol.test", ...h }, body: JSON.stringify(body1) });
const code = async (r: Response) => (await r.json()).error?.code ?? (await Promise.resolve("OK"));
await t("공개: 검증 전(VERIFIED 없음) → screen sample · 공개 요청 403 CHECK_TOKEN_REQUIRED", async () => { resetRateLimit(); const s = await (await handleManseStatus(BASE)).json(); const r = await handleMansePost(req({ origin: "https://ungyeol.test" }), BASE, okHrum); return s.screen === "sample" && s.publicEnabled === false && r.status === 403 && (await r.json()).error.code === "CHECK_TOKEN_REQUIRED"; });
await t("공개: VERIFIED=true 이어도 MANSE_PUBLIC_ENABLED 없으면 screen sample · 403 PUBLIC_DISABLED (토큰 요청은 가능)", async () => { resetRateLimit(); clearManseCache(); const env = { ...BASE, HRUM_MAPPING_VERIFIED: "true" }; const s = await (await handleManseStatus(env)).json(); const r = await handleMansePost(req({ origin: "https://ungyeol.test" }), env, okHrum); const tk = await handleMansePost(req({ "x-manse-check-token": TOKEN }), env, okHrum); return s.screen === "sample" && r.status === 403 && (await r.json()).error.code === "PUBLIC_DISABLED" && tk.status === 200; });
const UP = fakeUpstash();
const LIVE = { ...BASE, HRUM_MAPPING_VERIFIED: "true", MANSE_PUBLIC_ENABLED: "true", UPSTASH_REDIS_REST_URL: UP_URL, UPSTASH_REDIS_REST_TOKEN: UP_TOKEN, MANSE_SIGNING_SECRET: "signing-secret-0123456789abcdefghijklmnop" };
/** 화면처럼: 상태 조회로 서명 쿠키를 받고 같은 IP 로 계산 */
const livePost = async (h: Record<string, string> = {}, ip = "9.9.9.9") => { const s = await handleManseStatus(LIVE, new Request("https://ungyeol.test/api/manse", { headers: { "x-forwarded-for": ip } })); const cookie = (s.headers.get("set-cookie") ?? "").split(";")[0]; return handleMansePost(req({ origin: "https://ungyeol.test", "sec-fetch-site": "same-origin", "x-forwarded-for": ip, cookie, ...h }), LIVE, okHrum, { storeFetch: UP.fetch }); };
await t("공개 허용(VERIFIED + PUBLIC + 공유 저장소 + 서명 비밀값): screen live · 화면을 거친 같은 사이트 요청 200 calculated · 쿠키 없는 직접 호출 403", async () => { UP.reset(); clearManseCache(); const s = await (await handleManseStatus(LIVE)).json(); const c = await livePost(); const d = await handleMansePost(req({ origin: "https://ungyeol.test", "x-forwarded-for": "9.9.9.9" }), LIVE, okHrum, { storeFetch: UP.fetch }); return s.screen === "live" && c.status === 200 && (await c.json()).status === "calculated" && d.status === 403 && (await d.json()).error.code === "TICKET_REQUIRED"; });
await t("공개: 응답 · 상태에 키 · 토큰 없음", async () => { UP.reset(); clearManseCache(); const a = await (await livePost()).text(); const b = await (await handleManseStatus(LIVE)).text(); return !a.includes(TOKEN) && !b.includes(TOKEN) && !a.includes('"k"') && !b.includes("HRUM_API_KEY=") && !b.includes(UP_TOKEN); });

// ── 3. 브라우저 쪽 저장소 (샘플 ↔ 실제 전환)
const profile: any = { nickname: "지은", calendar: "solar", leap: undefined, birth: { y: 1990, m: 5, d: 15 }, time: { h: 12, m: 0 }, gender: "male", mbti: "INFP" };
const statusFetch = (screen: string, post?: unknown, seen?: string[]) => (async (u: any, init?: any) => { seen?.push(init?.method ?? "GET"); if (!init || init.method !== "POST") return new Response(JSON.stringify({ screen }), { status: 200 }); return new Response(JSON.stringify(post), { status: 200 }); }) as typeof fetch;
const serverCalc = async () => { UP.reset(); clearManseCache(); return (await livePost()).json(); };
await t("저장소: 서버 screen sample → 계산 요청 안 함 · 결과는 샘플(demo) · 채팅 문구 샘플", async () => { __resetLive(); const seen: string[] = []; const f = statusFetch("sample", null, seen); await ensureLiveMode(f); await requestLive(profile, f); const r = resultFor(profile); return isSampleMode() && eq(seen, ["GET"]) && getLiveEntry(profile) === null && r.resultStatus === "demo" && r.manseResult.isSample === true && !r.liveExtras; });
await t("저장소: screen live + 서버 calculated → 실제 원국(庚辰 일주) · resultStatus calculated · 십신 · 근거 · 같은 입력 재요청 없음", async () => { __resetLive(); const post = await serverCalc(); const seen: string[] = []; const f = statusFetch("live", post, seen); await ensureLiveMode(f); await requestLive(profile, f); await requestLive({ ...profile }, f); const r = resultFor(profile); return !isSampleMode() && eq(seen, ["GET", "POST"]) && r.resultStatus === "calculated" && r.manseResult.dayMaster.hanja === "庚" && r.manseResult.source === "hrum" && r.liveExtras!.tenGods.find((x) => x.key === "hour")!.stem === "식신" && r.liveExtras!.basis.length === 3; });
await t("저장소: 서버 unverified · 오류 · 형식 이상 → 샘플 + 이유 (실제처럼 보이지 않음)", async () => { const a = toLiveEntry({ status: "unverified" }); const b = toLiveEntry({ status: "error", error: { code: "DAILY_LIMIT" } }); const c = toLiveEntry({ status: "calculated", calculation: { manse: { pillars: [{ key: "day", stem: { hanja: "X" }, branch: { hanja: "子" } }] } } }); return a.phase === "fallback" && b.phase === "fallback" && b.reason.includes("오늘") && c.phase === "fallback"; });
await t("저장소: 음력 윤달 모름 → 요청 없이 샘플 + ‘윤달 여부를 몰라’ · 생년월일 없음도 요청 없음", async () => { __resetLive(); const seen: string[] = []; const f = statusFetch("live", {}, seen); await ensureLiveMode(f); const lunar = { ...profile, calendar: "lunar", leap: null }; await requestLive(lunar, f); await requestLive({ ...profile, birth: undefined }, f); const e = getLiveEntry(lunar); return eq(seen, ["GET"]) && e?.phase === "fallback" && (e as any).reason.includes("윤달") && resultFor(lunar).resultStatus === "demo"; });
await t("저장소: 서명 쿠키 만료(TICKET_REQUIRED) → 상태 다시 조회 후 한 번만 재시도 → calculated · 두 번 다 실패면 샘플 + 이유", async () => { __resetLive(); const post = await serverCalc(); const seen: string[] = []; let n = 0; const f = (async (_u: any, init?: any) => { seen.push(init?.method ?? "GET"); if (!init?.method) return new Response(JSON.stringify({ screen: "live" }), { status: 200 }); return new Response(JSON.stringify(++n === 1 ? { status: "error", error: { code: "TICKET_REQUIRED" } } : post), { status: 200 }); }) as typeof fetch; await ensureLiveMode(f); await requestLive(profile, f);
  __resetLive(); const g = (async (_u: any, init?: any) => new Response(JSON.stringify(init?.method ? { status: "error", error: { code: "TICKET_REQUIRED" } } : { screen: "live" }), { status: 200 })) as typeof fetch; await ensureLiveMode(g); const p2 = { ...profile, birth: { y: 1991, m: 1, d: 1 } }; await requestLive(p2, g); const e = getLiveEntry(p2) as any;
  return eq(seen, ["GET", "POST", "GET", "POST"]) && e.phase === "fallback" && e.reason.includes("만료"); });
await t("저장소: 상태 조회 실패(네트워크) → sample", async () => { __resetLive(); await ensureLiveMode((async () => { throw new Error("x"); }) as any); return isSampleMode(); });
await t("출처 분리: 실제 계산 → 원국 · 오행 · 십신 = hrum, 참고 MBTI = 운결 비유 시안(draft), 고른 MBTI = 사용자, 대운 · 세운 · 용신 = 미연결 · 샘플 → sample", async () => { __resetLive(); const post = await serverCalc(); await ensureLiveMode(statusFetch("live")); await requestLive(profile, statusFetch("live", post)); const a = resultFor(profile); __resetLive(); await ensureLiveMode(statusFetch("sample")); const b = resultFor(profile);
  return eq(a.provenance, { manse: "hrum", fiveElements: "hrum", tenGods: "hrum", dayMasterText: "ungyeol-table", referenceMbti: "ungyeol-analogy-draft", selfMbti: "user-selected", fortune: "unconnected", unconnected: ["대운", "세운", "월운", "용신", "격국", "신강약", "지장간", "12운성", "신살", "상대방 원국"] })
    && a.sajuMBTIReference.ruleStatus === "draft" && a.sajuMBTIReference.method === "ungyeol-day-master-analogy" && a.selfReportedMBTI.type === "INFP" && a.selfReportedMBTI.source === "user-selected"
    && b.provenance.manse === "sample" && b.provenance.tenGods === "unconnected" && b.provenance.referenceMbti === "ungyeol-analogy-draft"; });
await t("출처 분리: HRUM 응답에 MBTI 관련 값이 섞여 있어도 참고 MBTI 는 일간 → 운결 표에서만 나옴", async () => { __resetLive(); const post = await serverCalc(); post.calculation.mbti = "ESTJ"; await ensureLiveMode(statusFetch("live")); await requestLive(profile, statusFetch("live", post)); const r = resultFor(profile); return r.sajuMBTIReference.type === DAY_MASTER_TRAITS["庚"].referenceMbti && r.sajuMBTIReference.basis[0].startsWith("일간 庚") && r.provenance.referenceMbti === "ungyeol-analogy-draft"; });
// ── 4. 리포트 연결
await t("리포트(종합): 실제 계산이면 사주 칸 ‘실제 계산’ · 10 대운 · 11 월운 관계는 미연결 그대로 · 샘플이면 demo", async () => { __resetLive(); const post = await serverCalc(); await ensureLiveMode(statusFetch("live")); await requestLive(profile, statusFetch("live", post)); const rep = buildMyReport(profile, "integrated")!; const slots = Object.fromEntries(rep.chapters.map((c) => [c.id, c.dataSlot.status])); __resetLive(); await ensureLiveMode(statusFetch("sample")); const rep2 = buildMyReport(profile, "integrated")!; return slots["01"] === "calculated" && slots["10"] === "unconnected" && slots["11"] === "unconnected" && rep.payload.resultStatus === "calculated" && rep2.chapters[0].dataSlot.status === "demo"; });
await t("리포트(재회 · 궁합): 실제 계산이면 ‘나의 일간’ 문구 · 상대 사주는 여전히 미확정 · 대운 등은 쓰지 않음", async () => { __resetLive(); const post = await serverCalc(); await ensureLiveMode(statusFetch("live")); await requestLive(profile, statusFetch("live", post));
  const src: ProductSource = { reportId: "my", payload: resultFor(profile), mbti: "INFP", timeUnknown: false, partner: { mbti: "ESTJ" }, reunion: { breakup: { y: 2025, m: 3 }, contact: "some", reason: "talk", question: "missed" }, concern: "unsure", now: NOW };
  const re = buildProductReport("reunion", src); const co = buildProductReport("compat", { ...src, reunion: undefined });
  const c1 = re.chapters[0]; const c4 = re.chapters.find((c) => c.id === "04")!; const c7 = re.chapters.find((c) => c.id === "07")!;
  return c1.dataSlot.status === "calculated" && c1.summary.startsWith("나는") && !c1.summary.includes("샘플") && c4.dataSlot.status === "needs-input" && c7.summary.includes("나의 일간") && co.chapters.find((c) => c.id === "02")!.dataSlot.status === "unconnected"; });
console.log(R.join("\n")); console.log(`\n${pass} ok / ${fail} fail`);
