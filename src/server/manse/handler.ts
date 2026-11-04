import { createHash, timingSafeEqual } from "node:crypto";
import { readManseConfig } from "./config";
import { ManseError } from "./hrum";
import { validateManseRequest } from "./input";
import { takeToken } from "./rateLimit";
import { calculateManse } from "./service";

/* ──────────────────────────────────────────────────────────
   /api/manse 처리 (Route Handler 가 이 함수만 부름 — 테스트에서도 그대로 사용)
   순서: 같은 출처 확인 → 크기 제한 → 요청 구분(확인 토큰 / 공개) → 사용량 제한 → JSON → 입력 검증 → 계산
   공개 요청은 HRUM_MAPPING_VERIFIED=true 그리고 MANSE_PUBLIC_ENABLED=true 일 때만,
   같은 사이트 브라우저(Origin 필수) · IP당 분당 3회 · IP당 하루 MANSE_IP_DAILY_LIMIT · 인스턴스 하루 MANSE_DAILY_BUDGET
   응답 · 로그에 API 키 · 생년월일을 넣지 않음. 응답은 캐시 금지(no-store)
   ────────────────────────────────────────────────────────── */

const MAX_BODY = 2048;

const json = (status: number, body: unknown, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra } });

function clientKey(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

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

export async function handleManseStatus(env: Record<string, string | undefined> = process.env) {
  const cfg = readManseConfig(env);
  // 무엇이 빠졌는지만 알려 주고 값(키 · 토큰)은 절대 내보내지 않음
  return json(
    200,
    cfg.provider === "hrum"
      ? {
          provider: "hrum",
          configured: true,
          endpointHost: new URL(cfg.endpoint).host,
          mappingVerified: cfg.mappingVerified,
          publicEnabled: cfg.publicEnabled,
          checkTokenRequired: !cfg.publicEnabled,
          // 사용자 화면이 실제 계산을 쓰는 건 'live' 일 때뿐 (검증 완료 + 공개 허용)
          screen: cfg.publicEnabled ? "live" : "sample",
        }
      : { provider: "none", configured: false, missing: cfg.missing, screen: "sample" },
  );
}

export async function handleMansePost(req: Request, env: Record<string, string | undefined> = process.env, fetchImpl?: typeof fetch) {
  if (!sameOrigin(req)) return fail(403, "FORBIDDEN_ORIGIN", "허용되지 않은 요청이에요.");
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_BODY) return fail(413, "PAYLOAD_TOO_LARGE", "요청이 너무 커요.");

  const cfg = readManseConfig(env);
  const who = clientKey(req);
  // 확인 토큰 요청(운영자 검증) · 공개 요청(사용자 화면) 구분
  const viaToken = cfg.provider === "hrum" && !!cfg.checkToken && tokenOk(req.headers.get("x-manse-check-token"), cfg.checkToken);
  if (cfg.provider === "hrum" && !viaToken) {
    if (!cfg.mappingVerified) return fail(403, "CHECK_TOKEN_REQUIRED", "검증 기간에는 확인용 요청만 받아요.");
    if (!cfg.publicEnabled) return fail(403, "PUBLIC_DISABLED", "실제 계산은 아직 공개되지 않았어요.");
    // 공개 요청은 같은 사이트의 브라우저에서 온 것만 (Origin 필수, Sec-Fetch-Site 가 있으면 same-origin)
    const sfs = req.headers.get("sec-fetch-site");
    if (!req.headers.get("origin") || (sfs && sfs !== "same-origin")) return fail(403, "FORBIDDEN_ORIGIN", "허용되지 않은 요청이에요.");
  }
  const perMinute = cfg.provider === "hrum" ? (viaToken ? cfg.rateLimitPerMinute : Math.min(cfg.rateLimitPerMinute, 3)) : 10;
  const t = takeToken(who, perMinute);
  if (!t.ok) return fail(429, "RATE_LIMITED", "잠시 뒤 다시 시도해 주세요.", {}, { "Retry-After": String(t.retryAfterSec) });
  if (cfg.provider === "hrum" && !viaToken) {
    // 공개 요청: IP당 하루 · 인스턴스 전체 하루 상한 (인스턴스 메모리 기준 — 최종 상한은 HRUM 콘솔의 요청 제한)
    const d = takeToken(`${who}:day`, cfg.ipDailyLimit, Date.now(), 86_400_000);
    if (!d.ok) return fail(429, "DAILY_LIMIT", "오늘 계산 횟수를 모두 썼어요. 내일 다시 시도해 주세요.", {}, { "Retry-After": String(d.retryAfterSec) });
    const g = takeToken("global:day", cfg.dailyBudget, Date.now(), 86_400_000);
    if (!g.ok) return fail(503, "BUDGET_EXCEEDED", "지금은 계산할 수 없어요. 잠시 뒤 다시 시도해 주세요.");
  }

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

  try {
    const r = await calculateManse(v.value, cfg, fetchImpl);
    return json(200, r);
  } catch (e) {
    if (e instanceof ManseError) {
      if (e.code !== "NOT_CONFIGURED") console.warn(`[manse] ${e.code}`); // 코드만 기록 (입력 · 키 없음)
      // 제공자 상태 코드는 운영 확인용으로만 (키 · 입력값 없음)
      return fail(e.httpStatus, e.code, e.message, e.upstream ? { upstreamStatus: e.upstream.status, upstreamCode: e.upstream.code } : {});
    }
    console.warn("[manse] UNKNOWN");
    return fail(500, "INTERNAL", "계산 중 문제가 생겼어요.");
  }
}
