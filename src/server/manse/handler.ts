import { timingSafeEqual } from "node:crypto";
import { readManseConfig, type ManseConfig } from "./config";
import { ManseError } from "./hrum";
import { validateManseRequest, type ManseRequest } from "./input";
import { checkTicket, clientIp, ipHash, issueTicket, requestHost, ticketCookie, verifyTurnstile, type BotCheck } from "./protect";
import { calculateManse, type UpstreamHooks } from "./service";
import { getLimitStore, kstDay, secondsToKstMidnight, StoreError, type LimitStore } from "./store";

/* ──────────────────────────────────────────────────────────
   /api/manse 처리 (Route Handler 가 이 함수만 부름 — 테스트에서도 그대로 사용)

   POST 공개 요청 순서 (앞 단계에서 걸리면 HRUM 을 부르지 않음)
     1 같은 출처 · Content-Type: application/json (단순 폼 위조 차단) · 크기 제한
     2 공개 조건(검증 완료 + MANSE_PUBLIC_ENABLED + 공유 저장소 + 서명 비밀값)
       Origin 필수 · Sec-Fetch-Site same-origin · 서명 쿠키(화면에서 받은 것, IP 일치)
     3 입력 검증 → 봇 확인(Turnstile: 성공 · 이 사이트 호스트 · action "manse")
       ↑ 저장소를 쓰기 전에 걸러서, 봇 요청이 Redis 사용량과 실제 사용자 IP 한도를 쓰지 못하게
     4 사용량(공유 저장소): IP당 분당 · IP당 하루 → IP당 동시 1건 잠금
     5 HRUM 직전: 동시 호출 수 · 하루 전체 예산(공개는 운영자 몫을 뺀 만큼) · 초당 호출 수
       HRUM 직후: 과금되지 않은 호출(4xx · 5xx · 멱등 재응답)은 예산 환불
     저장소에 닿지 못하면 거절 (fail-closed)

   운영자 확인 (확인 토큰 필요 · HRUM 호출 없음 · 과금 없음)
     GET  ?probe=store   공유 저장소 명령 전체(증가 · 한도 거절 · 환불 · 잠금 · 만료) 실제 점검
     GET  ?probe=ticket  서명 쿠키 발급(공개 전에도) + 봇 확인 사이트 키
     POST ?rehearsal=1   공개 요청과 같은 함수로 2~5 단계를 실제로 돌리고, HRUM 직전에서 멈춤(예산 환불)
   응답 · 로그에 API 키 · 토큰 · 생년월일 · IP 를 넣지 않음. 응답은 캐시 금지(no-store)
   ────────────────────────────────────────────────────────── */

const MAX_BODY = 2048;
const NS = "ungyeol:manse";

const json = (status: number, body: unknown, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra } });

/** 다른 사이트의 브라우저가 운결 키로 계산을 부르지 못하게 (Origin 이 있으면 같은 호스트만) */
function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === requestHost(req);
  } catch {
    return false;
  }
}

const fail = (status: number, code: string, message: string, extra: Record<string, unknown> = {}, headers: Record<string, string> = {}) =>
  json(status, { status: code === "NOT_CONFIGURED" ? "not-configured" : "error", error: { code, message, ...extra } }, headers);

/** 상수 시간 비교 (토큰 추측 방지) */
function tokenOk(given: string | null, expected: string) {
  if (!given) return false;
  const a = Buffer.from(given), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const storeDown = () => fail(503, "LIMIT_STORE_UNAVAILABLE", "지금은 계산할 수 없어요. 잠시 뒤 다시 시도해 주세요.");
const logCode = (e: unknown) => console.warn(`[manse] ${e instanceof StoreError ? e.message : e instanceof ManseError ? e.code : "STORE_ERROR"}`);

type Hrum = Extract<ManseConfig, { provider: "hrum" }>;
type Env = Record<string, string | undefined>;
type Opts = { turnstileFetch?: typeof fetch; storeFetch?: typeof fetch };
const isOperator = (req: Request, cfg: Hrum) => !!cfg.checkToken && tokenOk(req.headers.get("x-manse-check-token"), cfg.checkToken);

/* ── 공개 요청 단계 (실제 요청 · 리허설이 같은 함수를 씀) */

/** 2 브라우저 화면에서 온 요청인지: Origin · Sec-Fetch-Site · 서명 쿠키 */
function screenGate(req: Request, cfg: Hrum, who: string): Response | null {
  const sfs = req.headers.get("sec-fetch-site");
  if (!req.headers.get("origin") || (sfs && sfs !== "same-origin")) return fail(403, "FORBIDDEN_ORIGIN", "허용되지 않은 요청이에요.");
  if (!cfg.signingSecret) return fail(403, "PUBLIC_DISABLED", "실제 계산은 아직 공개되지 않았어요.");
  const tk = checkTicket(req, cfg.signingSecret, who);
  if (tk !== "ok") return fail(403, "TICKET_REQUIRED", "화면을 새로 열어 다시 시도해 주세요.", { reason: tk });
  return null;
}

/** 3 입력 (본문은 한 번만 읽음) */
async function readInput(req: Request): Promise<{ v: ManseRequest } | { res: Response }> {
  let raw: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY) return { res: fail(413, "PAYLOAD_TOO_LARGE", "요청이 너무 커요.") };
    raw = JSON.parse(text);
  } catch {
    return { res: fail(400, "INVALID_JSON", "요청 형식이 올바르지 않아요.") };
  }
  const v = validateManseRequest(raw);
  if (!v.ok) return { res: fail(v.errors.some((e) => e.code === "LEAP_UNKNOWN") ? 422 : 400, "INVALID_INPUT", "입력 정보를 확인해 주세요.", { fields: v.errors }) };
  return { v: v.value };
}

/** 3 봇 확인 (설정돼 있을 때) */
async function botGate(req: Request, cfg: Hrum, ip: string, opts: Opts): Promise<{ res: Response | null; check: BotCheck | null }> {
  if (!cfg.turnstile) return { res: null, check: null };
  const check = await verifyTurnstile(req.headers.get("x-turnstile-token"), cfg.turnstile.secretKey, ip, requestHost(req), opts.turnstileFetch);
  if (!check.ok) console.warn(`[manse] BOT_CHECK_${check.reason}`);
  return { res: check.ok ? null : fail(403, "BOT_CHECK_FAILED", "확인이 필요해요. 화면을 새로 열어 다시 시도해 주세요.", { reason: check.reason }), check };
}

/** 4 IP당 사용량 + 동시 1건 잠금. prefix 로 리허설 키를 실제 사용자 키와 분리 */
async function ipGate(store: LimitStore, cfg: Hrum, who: string, publicReq: boolean, prefix = ""): Promise<{ res: Response } | { busyKey: string; owner: string }> {
  try {
    const perMinute = publicReq ? Math.min(cfg.rateLimitPerMinute, 3) : cfg.rateLimitPerMinute;
    const m = await store.take(`${NS}:${prefix}ipm:${who}:${Math.floor(Date.now() / 60_000)}`, perMinute, 70);
    if (!m.ok) return { res: fail(429, "RATE_LIMITED", "잠시 뒤 다시 시도해 주세요.", {}, { "Retry-After": String(m.retryAfterSec) }) };
    if (publicReq) {
      const d = await store.take(`${NS}:${prefix}ipd:${who}:${kstDay()}`, cfg.ipDailyLimit, secondsToKstMidnight());
      if (!d.ok) return { res: fail(429, "DAILY_LIMIT", "오늘 계산 횟수를 모두 썼어요. 내일 다시 시도해 주세요.", {}, { "Retry-After": String(d.retryAfterSec) }) };
    }
    const busyKey = `${NS}:${prefix}busy:${who}`;
    const owner = await store.lock(busyKey, 15_000);
    if (!owner) return { res: fail(429, "CONCURRENT", "이전 계산이 끝난 뒤 다시 시도해 주세요.", {}, { "Retry-After": "2" }) };
    return { busyKey, owner };
  } catch (e) {
    logCode(e);
    return { res: storeDown() };
  }
}

/** 5 HRUM 직전 · 직후 (동시 호출 수 · 하루 예산 · 초당 호출 수) */
function upstreamGuard(store: LimitStore, cfg: Hrum, publicReq: boolean): UpstreamHooks & { state: () => { reserved: boolean; flying: boolean } } {
  const budgetKey = `${NS}:budget:${kstDay()}`, flightKey = `${NS}:inflight`;
  let reserved = false, flying = false;
  async function release(billed: boolean) {
    try {
      if (reserved && !billed) await store.give(budgetKey);
      if (flying) await store.give(flightKey);
    } catch {
      /* 만료(TTL)로 정리됨 */
    }
    reserved = flying = false;
  }
  return {
    async before() {
      try {
        const f = await store.take(flightKey, cfg.maxConcurrent, 30);
        if (!f.ok) throw new ManseError("RATE_LIMITED", 503, "요청이 많아 잠시 뒤 다시 시도해 주세요.");
        flying = true;
        // 하루 전체 예산 (토큰 요청은 전체 한도까지, 공개는 운영자 몫을 뺀 만큼 — 같은 키를 씀)
        const b = await store.take(budgetKey, publicReq ? cfg.dailyBudget - cfg.operatorReserve : cfg.dailyBudget, secondsToKstMidnight());
        if (!b.ok) throw new ManseError("BUDGET_EXCEEDED", 503, "오늘은 계산할 수 있는 양을 모두 썼어요. 내일 다시 시도해 주세요.");
        reserved = true;
        // 초당 호출 수 (HRUM 콘솔 제한과 같게) — 차 있으면 1.1초 한 번 기다림
        for (let i = 0; i < 2; i++) {
          const s = await store.take(`${NS}:sec:${Math.floor(Date.now() / 1000)}`, cfg.upstreamPerSecond, 3);
          if (s.ok) return;
          if (i === 0) await sleep(1100);
        }
        throw new ManseError("RATE_LIMITED", 503, "요청이 많아 잠시 뒤 다시 시도해 주세요.");
      } catch (e) {
        await release(false);
        if (e instanceof StoreError) throw new ManseError("LIMIT_STORE_UNAVAILABLE", 503, "지금은 계산할 수 없어요. 잠시 뒤 다시 시도해 주세요.");
        throw e;
      }
    },
    async after(billed) {
      await release(billed);
    },
    state: () => ({ reserved, flying }),
  };
}

/** 1 공통 앞단 (출처 · 형식 · 크기 · 설정) */
function frontGate(req: Request, env: Env): { res: Response } | { cfg: Hrum } {
  if (!sameOrigin(req)) return { res: fail(403, "FORBIDDEN_ORIGIN", "허용되지 않은 요청이에요.") };
  if (!(req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) return { res: fail(415, "UNSUPPORTED_MEDIA_TYPE", "요청 형식이 올바르지 않아요.") };
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY) return { res: fail(413, "PAYLOAD_TOO_LARGE", "요청이 너무 커요.") };
  const cfg = readManseConfig(env);
  if (cfg.provider !== "hrum") return { res: fail(503, "NOT_CONFIGURED", "실제 만세력 계산이 아직 연결되지 않았어요.") };
  return { cfg };
}

/** 하루 예산 현황 (운영자 확인용) */
async function budgetOf(store: LimitStore, cfg: Hrum) {
  const key = `${NS}:budget:${kstDay()}`;
  return { used: await store.peek(key), limit: cfg.dailyBudget, publicLimit: cfg.dailyBudget - cfg.operatorReserve, operatorReserve: cfg.operatorReserve, day: kstDay(), ttlSec: await store.ttl(key) };
}

/** 공유 저장소 명령 전체를 실제 저장소에서 확인 (시험 키만 씀, 실제 예산 · 사용자 키는 읽기만) */
async function probeStore(store: LimitStore, cfg: Hrum) {
  const t0 = Date.now();
  const k = `${NS}:probe:${t0.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const takes = [await store.take(k, 2, 60), await store.take(k, 2, 60), await store.take(k, 2, 60)].map((x) => x.ok);
  await store.give(k);
  const afterGive = await store.peek(k);
  const ttl = await store.ttl(k);
  const lk = `${k}:lock`;
  const a = await store.lock(lk, 5000), b = await store.lock(lk, 5000);
  await store.unlock(lk, "someone-else");
  const stillLocked = (await store.lock(lk, 5000)) === null;
  await store.unlock(lk, a ?? "");
  const c = await store.lock(lk, 5000);
  await store.unlock(lk, c ?? "");
  const budget = await budgetOf(store, cfg);
  const checks = {
    countAndLimit: takes[0] === true && takes[1] === true && takes[2] === false, // 증가 · 한도 넘으면 거절 (Lua 스크립트)
    refund: afterGive === 1, // 되돌리기
    expiry: ttl > 0 && ttl <= 60, // 만료 설정 (자정에 예산이 사라짐)
    lockOnce: !!a && b === null, // 동시 1건
    lockOwnerOnly: stillLocked, // 남의 잠금은 못 풂
    unlock: !!c, // 내 잠금은 풂
    budgetExpiry: budget.used === 0 || (budget.ttlSec > 0 && budget.ttlSec <= 86_460), // 오늘 예산 키가 있으면 만료가 걸려 있음
  };
  return { latencyMs: Date.now() - t0, checks, allOk: Object.values(checks).every(Boolean), budget };
}

export async function handleManseStatus(env: Env = process.env, req?: Request, fetchImpl?: typeof fetch) {
  const cfg = readManseConfig(env);
  if (cfg.provider !== "hrum") return json(200, { provider: "none", configured: false, missing: cfg.missing, screen: "sample" });
  const probe = req ? new URL(req.url).searchParams.get("probe") : null;

  if (probe && req) {
    if (!isOperator(req, cfg)) return fail(403, "CHECK_TOKEN_REQUIRED", "확인용 요청만 받아요.");
    // ?probe=store — 공유 저장소 실제 점검 (HRUM 호출 없음)
    if (probe === "store") {
      const store = getLimitStore(env, fetchImpl);
      try {
        const r = await probeStore(store, cfg);
        return json(200, { store: store.kind, shared: store.kind === "upstash", writeRead: r.checks.countAndLimit && r.checks.refund, ...r, botCheck: cfg.turnstile ? "turnstile" : "off", publicBlockers: cfg.publicBlockers });
      } catch (e) {
        logCode(e);
        return json(503, { store: store.kind, shared: false, writeRead: false, allOk: false, error: { code: "LIMIT_STORE_UNAVAILABLE" } });
      }
    }
    // ?probe=ticket — 공개 전에도 리허설용 서명 쿠키 발급 + 봇 확인 사이트 키(공개값)
    if (probe === "ticket") {
      if (!cfg.signingSecret) return fail(503, "SIGNING_SECRET_MISSING", "MANSE_SIGNING_SECRET 이 없어요.");
      return json(200, { ticketIssued: true, ttlSec: 1800, turnstileSiteKey: cfg.turnstile?.siteKey ?? null }, { "Set-Cookie": ticketCookie(issueTicket(cfg.signingSecret, ipHash(clientIp(req), cfg.signingSecret))) });
    }
    return fail(400, "UNKNOWN_PROBE", "알 수 없는 점검이에요.");
  }

  // 무엇이 빠졌는지 이름만 알려 주고 값(키 · 토큰 · 비밀값)은 내보내지 않음
  const body = {
    provider: "hrum",
    configured: true,
    endpointHost: new URL(cfg.endpoint).host,
    mappingVerified: cfg.mappingVerified,
    publicEnabled: cfg.publicEnabled,
    publicBlockers: cfg.publicBlockers,
    protection: { sharedStore: cfg.store, signedTicket: !!cfg.signingSecret, botCheck: cfg.turnstile ? "turnstile" : "off" },
    checkTokenRequired: !cfg.publicEnabled,
    // 사용자 화면이 실제 계산을 쓰는 건 'live' 일 때뿐
    screen: cfg.publicEnabled ? "live" : "sample",
    // 사이트 키는 공개값 (브라우저 위젯용). 비밀 키는 내보내지 않음
    ...(cfg.publicEnabled && cfg.turnstile ? { turnstileSiteKey: cfg.turnstile.siteKey } : {}),
  };
  // 공개 모드일 때만 화면용 서명 쿠키 발급
  const headers: Record<string, string> = {};
  if (cfg.publicEnabled && cfg.signingSecret && req) headers["Set-Cookie"] = ticketCookie(issueTicket(cfg.signingSecret, ipHash(clientIp(req), cfg.signingSecret)));
  return json(200, body, headers);
}

export async function handleMansePost(req: Request, env: Env = process.env, fetchImpl?: typeof fetch, opts: Opts = {}) {
  if (new URL(req.url).searchParams.get("rehearsal") === "1") return handleRehearsal(req, env, opts);
  const front = frontGate(req, env);
  if ("res" in front) return front.res;
  const { cfg } = front;

  const ip = clientIp(req);
  const who = ipHash(ip, cfg.signingSecret);
  const viaToken = isOperator(req, cfg);
  if (!viaToken) {
    if (!cfg.mappingVerified) return fail(403, "CHECK_TOKEN_REQUIRED", "검증 기간에는 확인용 요청만 받아요.");
    if (!cfg.publicEnabled) return fail(403, "PUBLIC_DISABLED", "실제 계산은 아직 공개되지 않았어요.");
    const g = screenGate(req, cfg, who);
    if (g) return g;
  }

  const store = getLimitStore(env, opts.storeFetch);
  if (!viaToken && store.kind !== "upstash") return storeDown(); // 공개 요청은 공유 저장소 없이는 받지 않음

  const input = await readInput(req);
  if ("res" in input) return input.res;
  if (!viaToken) {
    const bot = await botGate(req, cfg, ip, opts);
    if (bot.res) return bot.res;
  }

  const ipg = await ipGate(store, cfg, who, !viaToken);
  if ("res" in ipg) return ipg.res;

  const hooks = upstreamGuard(store, cfg, !viaToken);
  try {
    const r = await calculateManse(input.v, cfg, fetchImpl, hooks);
    return json(200, r);
  } catch (e) {
    if (e instanceof ManseError) {
      if (e.code !== "NOT_CONFIGURED") console.warn(`[manse] ${e.code}`); // 코드만 기록 (입력 · 키 없음)
      return fail(e.httpStatus, e.code, e.message, e.upstream ? { upstreamStatus: e.upstream.status, upstreamCode: e.upstream.code } : {});
    }
    console.warn("[manse] UNKNOWN");
    return fail(500, "INTERNAL", "계산 중 문제가 생겼어요.");
  } finally {
    try {
      await store.unlock(ipg.busyKey, ipg.owner);
    } catch {
      /* 15초 뒤 자동 해제 */
    }
  }
}

/**
 * 공개 경로 리허설 — 확인 토큰 필요, HRUM 을 부르지 않음 (과금 없음)
 * 공개 요청과 같은 함수(screenGate · readInput · botGate · ipGate · upstreamGuard)를 실제 저장소 · 실제 Turnstile 로 돌리고
 * HRUM 직전에서 멈춘 뒤 예산을 되돌림. 실패한 단계에서 멈추는 것도 실제 요청과 같음
 * 검증 전 · 공개 전 상태에서도 동작 (공개 조건 플래그만 건너뜀)
 */
async function handleRehearsal(req: Request, env: Env, opts: Opts) {
  const front = frontGate(req, env);
  if ("res" in front) return front.res;
  const { cfg } = front;
  if (!isOperator(req, cfg)) return fail(403, "CHECK_TOKEN_REQUIRED", "확인용 요청만 받아요.");

  const ip = clientIp(req);
  const who = ipHash(ip, cfg.signingSecret);
  const steps: { id: string; ok: boolean; detail?: unknown }[] = [];
  const done = (stoppedAt: string | null) => json(200, { rehearsal: true, hrumCalled: false, stoppedAt, allOk: stoppedAt === null, steps, flags: { mappingVerified: cfg.mappingVerified, publicEnabled: cfg.publicEnabled, publicBlockers: cfg.publicBlockers } });
  const codeOf = async (r: Response) => ((await r.clone().json()) as { error?: { code?: string; reason?: string } }).error;

  const g = screenGate(req, cfg, who);
  steps.push({ id: "screen", ok: !g, detail: g ? await codeOf(g) : "Origin · Sec-Fetch-Site · 서명 쿠키 통과" });
  if (g) return done("screen");

  const store = getLimitStore(env, opts.storeFetch);
  steps.push({ id: "sharedStore", ok: store.kind === "upstash", detail: store.kind });
  if (store.kind !== "upstash") return done("sharedStore");

  const input = await readInput(req);
  steps.push({ id: "input", ok: !("res" in input), detail: "res" in input ? await codeOf(input.res) : "입력 검증 통과" });
  if ("res" in input) return done("input");

  const bot = await botGate(req, cfg, ip, opts);
  steps.push({ id: "botCheck", ok: !bot.res, detail: bot.check ?? "꺼져 있음 (TURNSTILE 키 없음)" });
  if (bot.res) return done("botCheck");

  const ipg = await ipGate(store, cfg, who, true, "rh:");
  steps.push({ id: "ipLimits", ok: !("res" in ipg), detail: "res" in ipg ? await codeOf(ipg.res) : "IP당 분당 · 하루 · 동시 1건 잠금 통과 (리허설 전용 키)" });
  if ("res" in ipg) return done("ipLimits");

  try {
    const before = await store.peek(`${NS}:budget:${kstDay()}`);
    const guard = upstreamGuard(store, cfg, true);
    let err: string | null = null;
    try {
      await guard.before();
    } catch (e) {
      err = e instanceof ManseError ? e.code : "UNKNOWN";
    }
    const during = await store.peek(`${NS}:budget:${kstDay()}`);
    const reserved = guard.state().reserved;
    await guard.after(false); // HRUM 을 부르지 않았으니 과금 없음 → 예산 되돌림
    const after = await store.peek(`${NS}:budget:${kstDay()}`);
    const ok = !err && reserved && during === before + 1 && after === before;
    steps.push({ id: "budget", ok, detail: { error: err, before, reservedTo: during, refundedTo: after, publicLimit: cfg.dailyBudget - cfg.operatorReserve, ttlSec: await store.ttl(`${NS}:budget:${kstDay()}`) } });
    if (!ok) return done("budget");
    return done(null);
  } catch (e) {
    logCode(e);
    steps.push({ id: "budget", ok: false, detail: "LIMIT_STORE_UNAVAILABLE" });
    return done("budget");
  } finally {
    try {
      await store.unlock(ipg.busyKey, ipg.owner);
    } catch {
      /* 15초 뒤 자동 해제 */
    }
  }
}
