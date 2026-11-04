import { timingSafeEqual } from "node:crypto";
import { readManseConfig, type ManseConfig } from "./config";
import { ManseError } from "./hrum";
import { validateManseRequest } from "./input";
import { checkTicket, clientIp, ipHash, issueTicket, ticketCookie, verifyTurnstile } from "./protect";
import { calculateManse, type UpstreamHooks } from "./service";
import { getLimitStore, kstDay, secondsToKstMidnight, StoreError, type LimitStore } from "./store";

/* ──────────────────────────────────────────────────────────
   /api/manse 처리 (Route Handler 가 이 함수만 부름 — 테스트에서도 그대로 사용)

   POST 순서 (앞 단계에서 걸리면 HRUM 을 부르지 않음)
     1 같은 출처 · Content-Type: application/json (단순 폼 위조 차단) · 크기 제한
     2 요청 구분: 확인 토큰(운영자) / 공개
       공개 = 검증 완료 + MANSE_PUBLIC_ENABLED + 공유 저장소 + 서명 비밀값 일 때만,
              Origin 필수 · Sec-Fetch-Site same-origin · 서명 쿠키(화면에서 받은 것, IP 일치)
     3 사용량(공유 저장소, 인스턴스 전체): IP당 분당 · IP당 하루(공개)
     4 입력 검증 → 봇 확인(Turnstile, 설정 시) → IP당 동시 1건 잠금
     5 HRUM 직전: 동시 호출 수 · 하루 전체 예산(공개는 운영자 몫을 뺀 만큼) · 초당 호출 수
       HRUM 직후: 과금되지 않은 호출(4xx · 5xx · 멱등 재응답)은 예산 환불
     저장소에 닿지 못하면 거절 (fail-closed)
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
    return new URL(origin).host === (req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
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

type Hrum = Extract<ManseConfig, { provider: "hrum" }>;

/** 하루 예산 현황 (운영자 확인용) */
async function budgetOf(store: LimitStore, cfg: Hrum) {
  return { used: await store.peek(`${NS}:budget:${kstDay()}`), limit: cfg.dailyBudget, publicLimit: cfg.dailyBudget - cfg.operatorReserve, operatorReserve: cfg.operatorReserve, day: kstDay() };
}

export async function handleManseStatus(env: Record<string, string | undefined> = process.env, req?: Request, fetchImpl?: typeof fetch) {
  const cfg = readManseConfig(env);
  if (cfg.provider !== "hrum") return json(200, { provider: "none", configured: false, missing: cfg.missing, screen: "sample" });

  // 운영자 확인: ?probe=store + 확인 토큰 → 공유 저장소에 실제로 쓰고 읽어 봄 (HRUM 호출 없음)
  if (req && new URL(req.url).searchParams.get("probe") === "store") {
    if (!cfg.checkToken || !tokenOk(req.headers.get("x-manse-check-token"), cfg.checkToken)) return fail(403, "CHECK_TOKEN_REQUIRED", "확인용 요청만 받아요.");
    const store = getLimitStore(env, fetchImpl);
    const t0 = Date.now();
    try {
      const a = await store.take(`${NS}:probe:${kstDay()}`, 1000, secondsToKstMidnight());
      const back = await store.peek(`${NS}:probe:${kstDay()}`);
      return json(200, { store: store.kind, shared: store.kind === "upstash", writeRead: a.ok && back >= a.count, latencyMs: Date.now() - t0, budget: await budgetOf(store, cfg), botCheck: cfg.turnstile ? "turnstile" : "off", publicBlockers: cfg.publicBlockers });
    } catch (e) {
      console.warn(`[manse] ${e instanceof StoreError ? e.message : "STORE_ERROR"}`);
      return json(503, { store: store.kind, shared: false, writeRead: false, error: { code: "LIMIT_STORE_UNAVAILABLE" } });
    }
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

export async function handleMansePost(req: Request, env: Record<string, string | undefined> = process.env, fetchImpl?: typeof fetch, opts: { turnstileFetch?: typeof fetch; storeFetch?: typeof fetch } = {}) {
  if (!sameOrigin(req)) return fail(403, "FORBIDDEN_ORIGIN", "허용되지 않은 요청이에요.");
  if (!(req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) return fail(415, "UNSUPPORTED_MEDIA_TYPE", "요청 형식이 올바르지 않아요.");
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_BODY) return fail(413, "PAYLOAD_TOO_LARGE", "요청이 너무 커요.");

  const cfg = readManseConfig(env);
  if (cfg.provider !== "hrum") return fail(503, "NOT_CONFIGURED", "실제 만세력 계산이 아직 연결되지 않았어요.");

  const ip = clientIp(req);
  const who = ipHash(ip, cfg.signingSecret);
  const viaToken = !!cfg.checkToken && tokenOk(req.headers.get("x-manse-check-token"), cfg.checkToken);
  if (!viaToken) {
    if (!cfg.mappingVerified) return fail(403, "CHECK_TOKEN_REQUIRED", "검증 기간에는 확인용 요청만 받아요.");
    if (!cfg.publicEnabled) return fail(403, "PUBLIC_DISABLED", "실제 계산은 아직 공개되지 않았어요.");
    // 공개 요청은 같은 사이트의 브라우저에서 온 것만 (Origin 필수, Sec-Fetch-Site 가 있으면 same-origin)
    const sfs = req.headers.get("sec-fetch-site");
    if (!req.headers.get("origin") || (sfs && sfs !== "same-origin")) return fail(403, "FORBIDDEN_ORIGIN", "허용되지 않은 요청이에요.");
    const tk = checkTicket(req, cfg.signingSecret!, who);
    if (tk !== "ok") return fail(403, "TICKET_REQUIRED", "화면을 새로 열어 다시 시도해 주세요.", { reason: tk });
  }

  const store = getLimitStore(env, opts.storeFetch);
  if (!viaToken && store.kind !== "upstash") return storeDown(); // 공개 요청은 공유 저장소 없이는 받지 않음

  // 3. IP당 사용량 (공유 저장소)
  try {
    const perMinute = viaToken ? cfg.rateLimitPerMinute : Math.min(cfg.rateLimitPerMinute, 3);
    const m = await store.take(`${NS}:ipm:${who}:${Math.floor(Date.now() / 60_000)}`, perMinute, 70);
    if (!m.ok) return fail(429, "RATE_LIMITED", "잠시 뒤 다시 시도해 주세요.", {}, { "Retry-After": String(m.retryAfterSec) });
    if (!viaToken) {
      const d = await store.take(`${NS}:ipd:${who}:${kstDay()}`, cfg.ipDailyLimit, secondsToKstMidnight());
      if (!d.ok) return fail(429, "DAILY_LIMIT", "오늘 계산 횟수를 모두 썼어요. 내일 다시 시도해 주세요.", {}, { "Retry-After": String(d.retryAfterSec) });
    }
  } catch (e) {
    console.warn(`[manse] ${e instanceof StoreError ? e.message : "STORE_ERROR"}`);
    return storeDown();
  }

  // 4. 입력
  let raw: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY) return fail(413, "PAYLOAD_TOO_LARGE", "요청이 너무 커요.");
    raw = JSON.parse(text);
  } catch {
    return fail(400, "INVALID_JSON", "요청 형식이 올바르지 않아요.");
  }
  const v = validateManseRequest(raw);
  if (!v.ok) return fail(v.errors.some((e) => e.code === "LEAP_UNKNOWN") ? 422 : 400, "INVALID_INPUT", "입력 정보를 확인해 주세요.", { fields: v.errors });

  if (!viaToken && cfg.turnstile) {
    const ok = await verifyTurnstile(req.headers.get("x-turnstile-token"), cfg.turnstile.secretKey, ip, opts.turnstileFetch);
    if (!ok) return fail(403, "BOT_CHECK_FAILED", "확인이 필요해요. 화면을 새로 열어 다시 시도해 주세요.");
  }

  // IP당 동시 1건
  const busyKey = `${NS}:busy:${who}`;
  try {
    if (!(await store.lock(busyKey, 15_000))) return fail(429, "CONCURRENT", "이전 계산이 끝난 뒤 다시 시도해 주세요.", {}, { "Retry-After": "2" });
  } catch {
    return storeDown();
  }

  // 5. HRUM 직전 · 직후
  const day = kstDay();
  const budgetKey = `${NS}:budget:${day}`, flightKey = `${NS}:inflight`;
  let reserved = false, flying = false;
  const hooks: UpstreamHooks = {
    async before() {
      try {
        const f = await store.take(flightKey, cfg.maxConcurrent, 30);
        if (!f.ok) throw new ManseError("RATE_LIMITED", 503, "요청이 많아 잠시 뒤 다시 시도해 주세요.");
        flying = true;
        // 하루 전체 예산 (토큰 요청은 전체 한도까지, 공개는 운영자 몫을 뺀 만큼 — 같은 키를 씀)
        const limit = viaToken ? cfg.dailyBudget : cfg.dailyBudget - cfg.operatorReserve;
        const b = await store.take(budgetKey, limit, secondsToKstMidnight());
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
  };
  async function release(billed: boolean) {
    try {
      if (reserved && !billed) await store.give(budgetKey);
      if (flying) await store.give(flightKey);
    } catch {
      /* 만료(TTL)로 정리됨 */
    }
    reserved = flying = false;
  }

  try {
    const r = await calculateManse(v.value, cfg, fetchImpl, hooks);
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
      await store.unlock(busyKey);
    } catch {
      /* 15초 뒤 자동 해제 */
    }
  }
}
