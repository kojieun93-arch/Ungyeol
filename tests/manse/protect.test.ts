/* 공개 사용 보호 · 공유 과금 제한 시험 (실제 HRUM · Upstash · Turnstile 을 부르지 않음) */
import CHECK from "@/content/manse-check-cases.json";
import { STEMS, BRANCHES } from "@/features/saju/elements";
import { stemSipsin } from "@/features/saju/relations";
import { handleMansePost, handleManseStatus } from "@/server/manse/handler";
import { clearManseCache } from "@/server/manse/service";
import { __resetMemoryStore, kstDay, memoryStore, upstashStore, resolveUpstash } from "@/server/manse/store";
import { readManseConfig } from "@/server/manse/config";
import { fakeUpstash, UP_TOKEN, UP_URL } from "./fakeUpstash";

const R: string[] = []; let pass = 0, fail = 0;
const t = async (name: string, fn: () => unknown | Promise<unknown>) => { try { const v = await fn(); if (v === false) throw new Error("false"); pass++; R.push("✅ " + name); } catch (e: any) { fail++; R.push("❌ " + name + " — " + (e?.message ?? e)); } };
const eq = (a: unknown, b: unknown) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`); return true; };
const K: any = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" };
function officialFor(e: Record<string, string | null>) {
  const dm = STEMS[e.day![0]];
  const pil = (k: string) => { const g = e[k]; if (!g) return null; const s = STEMS[g[0]], b = BRANCHES[g[1]]; return { stem: s.hangul, branch: b.hangul, stemHanja: g[0], branchHanja: g[1], ohaeng: K[s.element], stemSipsin: k === "day" ? null : stemSipsin(dm, s), branchSipsin: "정재" }; };
  const counts: any = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 }; for (const k of ["year", "month", "day", "hour"]) { const g = e[k]; if (g) for (const ch of g) counts[K[(STEMS[ch] ?? BRANCHES[ch]).element]]++; }
  return { success: true, data: { wonkuk: { year: pil("year"), month: pil("month"), day: pil("day"), hour: pil("hour") }, ohaengBalance: counts, trueSolarTime: null } };
}
const EXP = (CHECK.cases[0] as any).expect;
/** 가짜 HRUM: 호출 수 · 동시 진행 최대치 · 초별 호출 수 기록 */
function hrum(opts: { status?: number; body?: unknown; delayMs?: number; headers?: Record<string, string> } = {}) {
  const s = { calls: 0, live: 0, maxLive: 0, perSec: new Map<number, number>(), sawKeyInBody: false };
  const f = (async (_u: any, init: any) => {
    s.calls++; s.live++; s.maxLive = Math.max(s.maxLive, s.live);
    const sec = Math.floor(Date.now() / 1000); s.perSec.set(sec, (s.perSec.get(sec) ?? 0) + 1);
    if (String(init?.body ?? "").includes("hrum-secret")) s.sawKeyInBody = true;
    if (opts.delayMs) await new Promise((r) => setTimeout(r, opts.delayMs));
    s.live--;
    return new Response(JSON.stringify(opts.body ?? officialFor(EXP)), { status: opts.status ?? 200, headers: opts.headers });
  }) as typeof fetch;
  return { f, s };
}

const UP = fakeUpstash();
const TOKEN = "check-token-0123456789abcdef";
const SECRET = "signing-secret-0123456789abcdefghijklmnop";
const BASE = { MANSE_PROVIDER: "hrum", HRUM_API_KEY: "hrum-secret-key", MANSE_CHECK_TOKEN: TOKEN };
const LIVE = { ...BASE, HRUM_MAPPING_VERIFIED: "true", MANSE_PUBLIC_ENABLED: "true", UPSTASH_REDIS_REST_URL: UP_URL, UPSTASH_REDIS_REST_TOKEN: UP_TOKEN, MANSE_SIGNING_SECRET: SECRET };
const ORIGIN = "https://ungyeol.test";
const bodyFor = (d = 15) => ({ ...(CHECK.cases[0] as any).body, birth: { y: 1990, m: 5, d } });
const mk = (h: Record<string, string>, body: unknown = bodyFor()) => new Request(`${ORIGIN}/api/manse`, { method: "POST", headers: { "content-type": "application/json", host: "ungyeol.test", ...h }, body: typeof body === "string" ? body : JSON.stringify(body) });
/** 화면처럼: 상태 조회로 서명 쿠키를 받고 같은 IP 로 계산 요청 */
async function ticketFor(ip: string, env: any = LIVE) {
  const s = await handleManseStatus(env, new Request(`${ORIGIN}/api/manse`, { headers: { "x-forwarded-for": ip } }));
  return (s.headers.get("set-cookie") ?? "").split(";")[0];
}
async function pub(ip: string, f: typeof fetch, o: { env?: any; body?: unknown; h?: Record<string, string>; turnstileFetch?: typeof fetch } = {}) {
  const env = o.env ?? LIVE;
  const cookie = await ticketFor(ip, env);
  return handleMansePost(mk({ origin: ORIGIN, "sec-fetch-site": "same-origin", "x-forwarded-for": ip, cookie, ...(o.h ?? {}) }, o.body), env, f, { storeFetch: UP.fetch, turnstileFetch: o.turnstileFetch });
}
const tokenPost = (f: typeof fetch, body: unknown = bodyFor(), env: any = LIVE, ip = "7.7.7.7") => handleMansePost(mk({ "x-manse-check-token": TOKEN, "x-forwarded-for": ip }, body), env, f, { storeFetch: UP.fetch });
const codeOf = async (r: Response) => (r.status === 200 ? "200" : (await r.json()).error.code);
const fresh = () => { UP.reset(); clearManseCache(); __resetMemoryStore(); };
const budgetKey = () => `ungyeol:manse:budget:${kstDay()}`;

// ── 1. 공개 조건
await t("공개 조건: VERIFIED + PUBLIC 이어도 공유 저장소 · 서명 비밀값이 없으면 screen sample · 막힌 이유(이름만)", async () => {
  const a = await (await handleManseStatus({ ...BASE, HRUM_MAPPING_VERIFIED: "true", MANSE_PUBLIC_ENABLED: "true" })).json();
  const b = await (await handleManseStatus({ ...LIVE, MANSE_SIGNING_SECRET: "short" })).json();
  const c = await (await handleManseStatus({ ...LIVE, UPSTASH_REDIS_REST_URL: "https://evil.example.com" })).json();
  const d = await (await handleManseStatus(LIVE)).json();
  return a.screen === "sample" && a.publicBlockers.some((x: string) => x.startsWith("UPSTASH")) && a.publicBlockers.some((x: string) => x.startsWith("MANSE_SIGNING_SECRET"))
    && b.screen === "sample" && c.screen === "sample" && c.protection.sharedStore === "memory" && d.screen === "live" && eq(d.publicBlockers, []) && d.protection.sharedStore === "upstash";
});
await t("공개 조건: 검증 전(VERIFIED 없음)이면 다른 설정이 다 있어도 403 CHECK_TOKEN_REQUIRED · HRUM 호출 0", async () => { fresh(); const h = hrum(); const env = { ...LIVE, HRUM_MAPPING_VERIFIED: "false" }; const r = await handleMansePost(mk({ origin: ORIGIN, "x-forwarded-for": "1.1.1.1" }), env, h.f, { storeFetch: UP.fetch }); return r.status === 403 && (await r.json()).error.code === "CHECK_TOKEN_REQUIRED" && h.s.calls === 0; });
await t("저장소 주소: https://*.upstash.io 만 허용 (http · 다른 호스트 · 계정 정보 포함 → 사용 안 함)", () => eq([resolveUpstash({ UPSTASH_REDIS_REST_URL: UP_URL, UPSTASH_REDIS_REST_TOKEN: "x" }) !== null, resolveUpstash({ KV_REST_API_URL: UP_URL, KV_REST_API_TOKEN: "x" }) !== null, resolveUpstash({ UPSTASH_REDIS_REST_URL: "http://a.upstash.io", UPSTASH_REDIS_REST_TOKEN: "x" }), resolveUpstash({ UPSTASH_REDIS_REST_URL: "https://upstash.io.evil.com", UPSTASH_REDIS_REST_TOKEN: "x" }), resolveUpstash({ UPSTASH_REDIS_REST_URL: UP_URL })], [true, true, null, null, null]));

// ── 2. 요청 위조 · 직접 호출
await t("위조: Origin 없음(curl) · 다른 사이트 Origin · Sec-Fetch-Site cross-site · text/plain 폼 → 모두 거절 · HRUM 0", async () => { fresh(); const h = hrum(); const cookie = await ticketFor("1.1.1.1");
  const r = [await handleMansePost(mk({ cookie, "x-forwarded-for": "1.1.1.1" }), LIVE, h.f, { storeFetch: UP.fetch }), await handleMansePost(mk({ cookie, origin: "https://evil.example", "x-forwarded-for": "1.1.1.1" }), LIVE, h.f, { storeFetch: UP.fetch }), await handleMansePost(mk({ cookie, origin: ORIGIN, "sec-fetch-site": "cross-site", "x-forwarded-for": "1.1.1.1" }), LIVE, h.f, { storeFetch: UP.fetch }), await handleMansePost(mk({ cookie, origin: ORIGIN, "content-type": "text/plain", "x-forwarded-for": "1.1.1.1" }), LIVE, h.f, { storeFetch: UP.fetch })];
  return eq(await Promise.all(r.map(codeOf)), ["FORBIDDEN_ORIGIN", "FORBIDDEN_ORIGIN", "FORBIDDEN_ORIGIN", "UNSUPPORTED_MEDIA_TYPE"]) && h.s.calls === 0; });
await t("서명 쿠키: 없음 · 변조 · 다른 IP · 30분 지남 → 403 TICKET_REQUIRED(이유별) · 화면에서 받은 쿠키 → 200", async () => { fresh(); const h = hrum(); const cookie = await ticketFor("1.1.1.1"); const post = (c: string, ip = "1.1.1.1") => handleMansePost(mk({ origin: ORIGIN, "x-forwarded-for": ip, ...(c ? { cookie: c } : {}) }), LIVE, h.f, { storeFetch: UP.fetch });
  const reasons: string[] = []; for (const [c, ip] of [["", "1.1.1.1"], [cookie.slice(0, -2) + "xx", "1.1.1.1"], [cookie, "5.5.5.5"]] as const) { const r = await post(c, ip); reasons.push((await r.json()).error.reason); }
  const real = Date.now; (Date as any).now = () => real() + 31 * 60_000; let exp: string; try { exp = (await (await post(cookie)).json()).error.reason; } finally { (Date as any).now = real; }
  const ok = await post(cookie); return eq(reasons, ["missing", "invalid", "ip-changed"]) && exp === "expired" && ok.status === 200 && h.s.calls === 1; });
await t("서명 쿠키 속성: HttpOnly · Secure · SameSite=Strict · Path=/api/manse · 30분 · 공개 전에는 발급 안 함", async () => { const s = await handleManseStatus(LIVE, new Request(`${ORIGIN}/api/manse`)); const c = s.headers.get("set-cookie") ?? ""; const off = await handleManseStatus(BASE, new Request(`${ORIGIN}/api/manse`)); return /HttpOnly/.test(c) && /Secure/.test(c) && /SameSite=Strict/.test(c) && /Path=\/api\/manse/.test(c) && /Max-Age=1800/.test(c) && off.headers.get("set-cookie") === null; });

// ── 3. 공유 전체 예산 (인스턴스 전체)
await t("공유 예산: 서로 다른 '인스턴스'(저장소 객체 2개)가 같은 숫자를 봄 · 메모리 저장소는 따로 셈", async () => { fresh(); const a = upstashStore({ url: UP_URL, token: UP_TOKEN }, UP.fetch), b = upstashStore({ url: UP_URL, token: UP_TOKEN }, UP.fetch); const r = [await a.take("k", 2, 60), await b.take("k", 2, 60), await a.take("k", 2, 60)].map((x) => x.ok); const m1 = memoryStore(), m2 = memoryStore(); const m = [await m1.take("k", 1, 60), await m2.take("k", 1, 60)].map((x) => x.ok); return eq(r, [true, true, false]) && eq(m, [true, true]); });
await t("공유 예산: 하루 6 · 운영자 몫 2 → 공개 4건까지(다른 IP · 다른 입력), 5번째 BUDGET_EXCEEDED · 토큰 요청은 6건까지 · HRUM 호출 = 예산 수", async () => { fresh(); const h = hrum(); const env = { ...LIVE, MANSE_DAILY_BUDGET: "6", MANSE_OPERATOR_RESERVE: "2" }; const real = Date.now; let now = real(); (Date as any).now = () => (now += 1500); const codes: string[] = [];
  try { for (let i = 0; i < 5; i++) codes.push(await codeOf(await pub(`2.2.2.${i}`, h.f, { env, body: bodyFor(1 + i) }))); for (let i = 0; i < 3; i++) codes.push(await codeOf(await tokenPost(h.f, bodyFor(10 + i), env))); } finally { (Date as any).now = real; }
  return eq(codes, ["200", "200", "200", "200", "BUDGET_EXCEEDED", "200", "200", "BUDGET_EXCEEDED"]) && h.s.calls === 6 && UP.peek(budgetKey()) === 6; });
await t("예산 환불: HRUM 400(없는 윤달) · 500 두 번 → 예산 0 · 멱등 재응답 → 0 · 200 → 1 · 시간 초과 → 1(과금됐을 수 있어 환불 안 함)", async () => {
  const used: number[] = [];
  for (const h of [hrum({ status: 400, body: { success: false, statusCode: 400, code: "INVALID_LUNAR_DATE" } }), hrum({ status: 500, body: {} }), hrum({ headers: { "Idempotent-Replayed": "true" } }), hrum()]) { fresh(); await tokenPost(h.f); used.push(UP.peek(budgetKey())); }
  fresh(); const slow = ((_u: any, init: any) => new Promise((_, rej) => init.signal.addEventListener("abort", () => rej(Object.assign(new Error("a"), { name: "AbortError" }))))) as typeof fetch; const r = await tokenPost(slow, bodyFor(), { ...LIVE, HRUM_TIMEOUT_MS: "1000" }); used.push(UP.peek(budgetKey()));
  return eq(used, [0, 0, 0, 1, 1]) && (await r.json()).error.code === "TIMEOUT"; });
await t("캐시 · 같은 입력: 캐시 응답은 예산을 쓰지 않음", async () => { fresh(); const h = hrum(); const real = Date.now; let now = real(); (Date as any).now = () => (now += 61_000); try { await tokenPost(h.f); await tokenPost(h.f); } finally { (Date as any).now = real; } return h.s.calls === 1 && UP.peek(budgetKey()) === 1; });
await t("예산 날짜: 한국 자정 기준 (UTC 14:59 → 그날, 15:00 → 다음 날)", () => eq([kstDay(Date.UTC(2026, 10, 5, 14, 59)), kstDay(Date.UTC(2026, 10, 5, 15, 0))], ["2026-11-05", "2026-11-06"]));

// ── 4. 반복 호출 · 동시 요청 폭주
await t("반복: 같은 IP 분당 3회 → 4번째 429 RATE_LIMITED(Retry-After) · 하루 5회 → DAILY_LIMIT (인스턴스가 달라도 공유)", async () => { fresh(); const h = hrum(); const real = Date.now; let now = real(); const out: string[] = [];
  (Date as any).now = () => now;
  try { for (let i = 0; i < 4; i++) { now += 1500; out.push(await codeOf(await pub("3.3.3.3", h.f, { body: bodyFor(1 + i) }))); } for (let i = 0; i < 3; i++) { now += 61_000; out.push(await codeOf(await pub("3.3.3.3", h.f, { body: bodyFor(10 + i) }))); } } finally { (Date as any).now = real; }
  return eq(out, ["200", "200", "200", "RATE_LIMITED", "200", "200", "DAILY_LIMIT"]); });
await t("동시: 같은 IP 동시 5건 → 1건만 진행, 나머지는 분당 한도(429 RATE_LIMITED) 또는 동시 잠금(429 CONCURRENT) · HRUM 1", async () => { fresh(); const h = hrum({ delayMs: 150 }); const rs = await Promise.all([0, 1, 2, 3, 4].map((i) => pub("4.4.4.4", h.f, { body: bodyFor(1 + i) }))); const codes = (await Promise.all(rs.map(codeOf))).sort(); return eq(codes, ["200", "CONCURRENT", "CONCURRENT", "RATE_LIMITED", "RATE_LIMITED"]) && h.s.calls === 1 && rs.every((r) => r.status === 200 || r.status === 429); });
await t("동시: 서로 다른 IP 8건 폭주 → HRUM 동시 진행 ≤ 2 · 초당 ≤ 1 · 넘친 요청은 HRUM 없이 거절 · 예산은 실제 호출 수만큼", async () => { fresh(); const h = hrum({ delayMs: 120 }); const rs = await Promise.all([0, 1, 2, 3, 4, 5, 6, 7].map((i) => pub(`6.6.6.${i}`, h.f, { body: bodyFor(1 + i) }))); const codes = await Promise.all(rs.map(codeOf)); const ok = codes.filter((c) => c === "200").length; return h.s.maxLive <= 2 && [...h.s.perSec.values()].every((n) => n <= 1) && ok === h.s.calls && ok >= 1 && codes.every((c) => c === "200" || c === "RATE_LIMITED") && UP.peek(budgetKey()) === h.s.calls && UP.peek("ungyeol:manse:inflight") === 0; });
await t("동시: 같은 입력을 여러 IP가 동시에 → HRUM 1번 (진행 중인 계산 공유) · 예산 1", async () => { fresh(); const h = hrum({ delayMs: 150 }); const rs = await Promise.all([0, 1, 2].map((i) => pub(`8.8.8.${i}`, h.f))); return (await Promise.all(rs.map(codeOf))).every((c) => c === "200") && h.s.calls === 1 && UP.peek(budgetKey()) === 1; });

// ── 5. 저장소 장애 (fail-closed)
await t("저장소 장애: 연결 실패 · 500 · 토큰 틀림 → 공개 · 토큰 요청 모두 503 LIMIT_STORE_UNAVAILABLE · HRUM 0", async () => { const out: string[] = []; const h = hrum();
  for (const set of [() => (UP.st.down = true), () => (UP.st.bad = true)]) { fresh(); const cookie = await ticketFor("1.1.1.1"); set(); out.push(await codeOf(await handleMansePost(mk({ origin: ORIGIN, "x-forwarded-for": "1.1.1.1", cookie }), LIVE, h.f, { storeFetch: UP.fetch }))); out.push(await codeOf(await tokenPost(h.f))); }
  fresh(); out.push(await codeOf(await tokenPost(h.f, bodyFor(), { ...LIVE, UPSTASH_REDIS_REST_TOKEN: "wrong" })));
  return eq(out, Array(5).fill("LIMIT_STORE_UNAVAILABLE")) && h.s.calls === 0; });

// ── 6. 봇 확인 (Turnstile, 선택)
const TS = { ...LIVE, TURNSTILE_SITE_KEY: "0x4AAAA-site", TURNSTILE_SECRET_KEY: "0x4AAAA-turnstile-secret" };
const siteverify = (ok: boolean, seen?: any[], o: { hostname?: string; action?: string; codes?: string[] } = {}) => (async (u: any, init: any) => { seen?.push({ u: String(u), body: String(init.body) }); return new Response(JSON.stringify({ success: ok, action: o.action ?? "manse", hostname: o.hostname ?? "ungyeol.test", "error-codes": o.codes ?? [] }), { status: 200 }); }) as typeof fetch;
await t("봇 확인: 설정 시 토큰 없음 · 실패 · 확인 서버 장애 → 403 BOT_CHECK_FAILED (HRUM 0) · 성공 → 200 · 확인 요청에 비밀 키 · IP 포함", async () => { fresh(); const h = hrum(); const seen: any[] = [];
  const a = await pub("9.9.9.1", h.f, { env: TS, turnstileFetch: siteverify(true) }); fresh();
  const b = await pub("9.9.9.2", h.f, { env: TS, h: { "x-turnstile-token": "tok" }, turnstileFetch: siteverify(false) }); fresh();
  const c = await pub("9.9.9.3", h.f, { env: TS, h: { "x-turnstile-token": "tok" }, turnstileFetch: (async () => { throw new Error("down"); }) as any }); const before = h.s.calls; fresh();
  const d = await pub("9.9.9.4", h.f, { env: TS, h: { "x-turnstile-token": "tok" }, turnstileFetch: siteverify(true, seen) });
  return eq(await Promise.all([a, b, c].map(codeOf)), ["BOT_CHECK_FAILED", "BOT_CHECK_FAILED", "BOT_CHECK_FAILED"]) && before === 0 && d.status === 200 && seen[0].u.includes("challenges.cloudflare.com") && seen[0].body.includes("secret=0x4AAAA-turnstile-secret") && seen[0].body.includes("remoteip=9.9.9.4"); });
await t("봇 확인: 상태 응답엔 사이트 키(공개값)만 · 비밀 키 없음 · 공개 전에는 사이트 키도 없음", async () => { const a = await (await handleManseStatus(TS, new Request(ORIGIN))).text(); const b = await (await handleManseStatus({ ...TS, MANSE_PUBLIC_ENABLED: "false" }, new Request(ORIGIN))).text(); return a.includes("0x4AAAA-site") && !a.includes("turnstile-secret") && JSON.parse(a).protection.botCheck === "turnstile" && !b.includes("0x4AAAA-site"); });

// ── 7. 운영자 확인 (공유 저장소 점검 — HRUM 호출 없음)
await t("저장소 점검(?probe=store): 토큰 없으면 403 · 토큰 있으면 shared · 쓰기/읽기 · 오늘 예산 · 응답에 비밀값 없음", async () => { fresh(); const url = `${ORIGIN}/api/manse?probe=store`; const a = await handleManseStatus(LIVE, new Request(url), UP.fetch); const b = await handleManseStatus({ ...LIVE, MANSE_PUBLIC_ENABLED: "false" }, new Request(url, { headers: { "x-manse-check-token": TOKEN } }), UP.fetch); const text = await b.text(); const j = JSON.parse(text);
  return a.status === 403 && b.status === 200 && j.shared === true && j.writeRead === true && j.budget.limit === 18 && j.budget.publicLimit === 15 && j.publicBlockers.includes("MANSE_PUBLIC_ENABLED") && !text.includes(UP_TOKEN) && !text.includes("upstash.io") && !text.includes(TOKEN) && !text.includes(SECRET); });
await t("저장소 점검: 저장소 장애면 503 shared:false", async () => { fresh(); UP.st.down = true; const r = await handleManseStatus(LIVE, new Request(`${ORIGIN}/api/manse?probe=store`, { headers: { "x-manse-check-token": TOKEN } }), UP.fetch); const j = await r.json(); UP.st.down = false; return r.status === 503 && j.shared === false; });

// ── 8. 비밀값 노출
await t("노출: 응답 · 상태 · 로그(console)에 HRUM 키 · 확인 토큰 · 서명 비밀값 · 저장소 토큰 · IP 없음, HRUM 요청 본문에도 키 없음(헤더로만)", async () => { fresh(); const logs: string[] = []; const ow = console.warn, oe = console.error, ol = console.log; console.warn = console.error = console.log = (...a: any[]) => logs.push(a.join(" ")); const h = hrum(); const texts: string[] = [];
  try { texts.push(await (await pub("10.0.0.1", h.f)).text()); texts.push(await (await handleManseStatus(LIVE, new Request(ORIGIN))).text()); UP.st.down = true; texts.push(await (await tokenPost(h.f, bodyFor(3))).text()); UP.st.down = false; texts.push(await (await pub("10.0.0.2", hrum({ status: 401, body: {} }).f, { body: bodyFor(4) })).text()); } finally { console.warn = ow; console.error = oe; console.log = ol; }
  const all = texts.join("\n") + "\n" + logs.join("\n"); return !["hrum-secret-key", TOKEN, SECRET, UP_TOKEN, "10.0.0.1", "10.0.0.2"].some((s) => all.includes(s)) && !h.s.sawKeyInBody && logs.length > 0 && logs.every((l) => /^\[manse\] [A-Z_]+$/.test(l)); });
await t("설정 기본값: 하루 예산 18(HRUM 콘솔 20보다 작게) · 운영자 몫 3 · 초당 1 · 동시 2 · IP 하루 5", () => { const c = readManseConfig(LIVE) as any; return c.dailyBudget === 18 && c.operatorReserve === 3 && c.upstreamPerSecond === 1 && c.maxConcurrent === 2 && c.ipDailyLimit === 5; });

// ── 9. PHASE 6-5 연결 점검 — 지금 운영 설정(보호 설정 완료 · VERIFIED/PUBLIC 꺼짐)과 같은 조건
const PRE = { ...TS, HRUM_MAPPING_VERIFIED: "false", MANSE_PUBLIC_ENABLED: "false" };
const opReq = (path: string, h: Record<string, string> = {}, method = "GET", body?: unknown) => new Request(`${ORIGIN}${path}`, { method, headers: { host: "ungyeol.test", "x-forwarded-for": "11.0.0.1", ...h }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
async function opTicket(env: any = PRE, ip = "11.0.0.1") { const r = await handleManseStatus(env, opReq("/api/manse?probe=ticket", { "x-manse-check-token": TOKEN, "x-forwarded-for": ip }), UP.fetch); return { r, j: await r.clone().json(), cookie: (r.headers.get("set-cookie") ?? "").split(";")[0] }; }
const rehearse = (h: Record<string, string>, f: { turnstileFetch?: typeof fetch } = {}, env: any = PRE, body: unknown = bodyFor()) => handleMansePost(opReq("/api/manse?rehearsal=1", { origin: ORIGIN, "sec-fetch-site": "same-origin", "content-type": "application/json", "x-manse-check-token": TOKEN, ...h }, "POST", body), env, hrum().f, { storeFetch: UP.fetch, turnstileFetch: f.turnstileFetch });

await t("현재 설정 상태: configured · sharedStore upstash · signedTicket · botCheck turnstile · VERIFIED false · screen sample · 공개 요청 403 · 사이트 키 안 나감", async () => { fresh(); const s = await (await handleManseStatus(PRE, new Request(ORIGIN))).json(); const h = hrum(); const r = await pub("12.0.0.1", h.f, { env: PRE }); return s.configured && s.protection.sharedStore === "upstash" && s.protection.signedTicket && s.protection.botCheck === "turnstile" && s.mappingVerified === false && s.screen === "sample" && !("turnstileSiteKey" in s) && r.status === 403 && h.s.calls === 0; });
await t("서버 검증: Turnstile 응답 hostname 이 다른 사이트 → HOSTNAME_MISMATCH · action 다름 → ACTION_MISMATCH · success false → REJECTED(+Cloudflare 오류 코드) · 모두 HRUM 0", async () => { const h = hrum(); const out: string[] = [];
  for (const sv of [siteverify(true, undefined, { hostname: "evil.example" }), siteverify(true, undefined, { action: "login" }), siteverify(false, undefined, { codes: ["timeout-or-duplicate"] })]) { fresh(); const r = await pub("13.0.0.1", h.f, { env: TS, h: { "x-turnstile-token": "tok" }, turnstileFetch: sv }); const e = (await r.json()).error; out.push(`${e.code}:${e.reason}`); }
  return eq(out, ["BOT_CHECK_FAILED:HOSTNAME_MISMATCH", "BOT_CHECK_FAILED:ACTION_MISMATCH", "BOT_CHECK_FAILED:REJECTED"]) && h.s.calls === 0; });
await t("순서: 봇 확인 실패 요청은 Redis 를 쓰지 않음 (저장소 호출 0 · 실제 사용자 IP 한도 그대로)", async () => { fresh(); const cookie = await ticketFor("14.0.0.1", TS); const before = UP.st.calls; const r = await handleMansePost(mk({ origin: ORIGIN, "sec-fetch-site": "same-origin", "x-forwarded-for": "14.0.0.1", cookie }), TS, hrum().f, { storeFetch: UP.fetch, turnstileFetch: siteverify(false) }); return r.status === 403 && UP.st.calls === before && [...UP.kv.keys()].every((k) => !k.includes(":ipm:") && !k.includes(":ipd:")); });
await t("저장소 점검(전체 명령): 증가 · 한도 거절 · 환불 · 만료 · 동시 잠금 · 남의 잠금 보호 · 해제 · 예산 키 만료 모두 ✓ · HRUM 0", async () => { fresh(); const r = await handleManseStatus(PRE, opReq("/api/manse?probe=store", { "x-manse-check-token": TOKEN }), UP.fetch); const j = await r.json(); return r.status === 200 && j.allOk === true && Object.values(j.checks).every(Boolean) && Object.keys(j.checks).length === 7 && j.shared === true; });
await t("저장소 점검: 만료가 안 걸리는 저장소(TTL -1)면 expiry ✗ · allOk false (자정에 예산이 안 풀리는 사고를 미리 발견)", async () => { fresh(); const noExpire = (async (u: any, init: any) => { const a = JSON.parse(init.body); if (a[0] === "TTL") return new Response(JSON.stringify({ result: -1 }), { status: 200 }); return UP.fetch(u, init); }) as typeof fetch; const j = await (await handleManseStatus(PRE, opReq("/api/manse?probe=store", { "x-manse-check-token": TOKEN }), noExpire)).json(); return j.allOk === false && j.checks.expiry === false; });
await t("잠금: 만료 뒤 다른 요청이 잡은 잠금은 앞 요청이 풀지 못함", async () => { fresh(); const st = upstashStore({ url: UP_URL, token: UP_TOKEN }, UP.fetch); const a = await st.lock("L", 30); await new Promise((r) => setTimeout(r, 40)); const b = await st.lock("L", 5000); await st.unlock("L", a!); const c = await st.lock("L", 5000); return !!a && !!b && c === null; });
await t("쿠키 점검(?probe=ticket): 토큰 없으면 403 · 공개 전에도 서명 쿠키 발급(HttpOnly · Secure · Strict) · 사이트 키(공개값)만, 비밀 키 없음", async () => { const no = await handleManseStatus(PRE, opReq("/api/manse?probe=ticket"), UP.fetch); const { r, j, cookie } = await opTicket(); const text = JSON.stringify(j); const sc = r.headers.get("set-cookie") ?? ""; return no.status === 403 && r.status === 200 && j.ticketIssued && j.turnstileSiteKey === "0x4AAAA-site" && cookie.startsWith("ungyeol_mt=") && /HttpOnly/.test(sc) && /Secure/.test(sc) && /SameSite=Strict/.test(sc) && !text.includes("turnstile-secret") && !text.includes(SECRET); });
await t("리허설: 토큰 없으면 403 · HRUM 호출 없음", async () => { fresh(); const r = await handleMansePost(opReq("/api/manse?rehearsal=1", { origin: ORIGIN, "content-type": "application/json" }, "POST", bodyFor()), PRE, hrum().f, { storeFetch: UP.fetch }); return r.status === 403 && (await r.json()).error.code === "CHECK_TOKEN_REQUIRED"; });
await t("리허설 ① 정상(쿠키 + Turnstile 성공): 6단계 모두 통과 · HRUM 0 · 예산 예약 후 원래대로 환불 · 실제 사용자 IP 키는 안 씀", async () => { fresh(); const h = hrum(); const { cookie } = await opTicket(); const r = await handleMansePost(opReq("/api/manse?rehearsal=1", { origin: ORIGIN, "sec-fetch-site": "same-origin", "content-type": "application/json", "x-manse-check-token": TOKEN, cookie, "x-turnstile-token": "tok" }, "POST", bodyFor()), PRE, h.f, { storeFetch: UP.fetch, turnstileFetch: siteverify(true) }); const j = await r.json(); const b = j.steps.find((x: any) => x.id === "budget").detail;
  return j.allOk === true && j.hrumCalled === false && h.s.calls === 0 && eq(j.steps.map((x: any) => x.id), ["screen", "sharedStore", "input", "botCheck", "ipLimits", "budget"]) && b.reservedTo === b.before + 1 && b.refundedTo === b.before && UP.peek(budgetKey()) === 0 && b.ttlSec > 0 && [...UP.kv.keys()].filter((k) => k.includes("ipm:") || k.includes("ipd:")).every((k) => k.includes(":rh:")) && j.flags.mappingVerified === false && j.flags.publicEnabled === false; });
await t("리허설 ② Turnstile 토큰 없음 → botCheck 에서 멈춤(NO_TOKEN) · ③ 쿠키 없음 → screen 에서 멈춤(missing) · ④ 다른 IP 쿠키 → ip-changed", async () => { fresh(); const { cookie } = await opTicket(); const a = await (await rehearse({ cookie }, { turnstileFetch: siteverify(true) })).json(); const b = await (await rehearse({ "x-turnstile-token": "tok" }, { turnstileFetch: siteverify(true) })).json(); const c = await (await rehearse({ cookie, "x-forwarded-for": "11.9.9.9", "x-turnstile-token": "tok" }, { turnstileFetch: siteverify(true) })).json();
  return a.stoppedAt === "botCheck" && a.steps.at(-1).detail.reason === "NO_TOKEN" && b.stoppedAt === "screen" && b.steps[0].detail.reason === "missing" && c.stoppedAt === "screen" && c.steps[0].detail.reason === "ip-changed"; });
await t("리허설 ⑤ 공개 예산이 찬 날 → budget 에서 BUDGET_EXCEEDED · 값 그대로 · ⑥ 저장소 장애 → ipLimits 에서 멈춤", async () => { fresh(); const { cookie } = await opTicket(); UP.kv.set(budgetKey(), { v: 15, exp: Date.now() + 3600_000 }); const a = await (await rehearse({ cookie, "x-turnstile-token": "tok" }, { turnstileFetch: siteverify(true) })).json(); const after = UP.peek(budgetKey()); UP.st.down = true; const b = await (await rehearse({ cookie, "x-turnstile-token": "tok" }, { turnstileFetch: siteverify(true) })).json(); UP.st.down = false;
  return a.stoppedAt === "budget" && a.steps.at(-1).detail.error === "BUDGET_EXCEEDED" && after === 15 && b.stoppedAt === "ipLimits"; });
await t("리허설: 분당 3회를 넘기면 ipLimits 에서 RATE_LIMITED (리허설 전용 키)", async () => { fresh(); const { cookie } = await opTicket(); const st: string[] = []; for (let i = 0; i < 4; i++) st.push((await (await rehearse({ cookie, "x-turnstile-token": "tok" }, { turnstileFetch: siteverify(true) })).json()).stoppedAt ?? "ok"); return eq(st, ["ok", "ok", "ok", "ipLimits"]); });

console.log(R.join("\n")); console.log(`\n${pass} ok / ${fail} fail`); if (fail) process.exit(1);
