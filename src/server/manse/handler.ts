import { createHash } from "node:crypto";
import { readManseConfig } from "./config";
import { ManseError } from "./hrum";
import { validateManseRequest } from "./input";
import { takeToken } from "./rateLimit";
import { calculateManse } from "./service";

/* ──────────────────────────────────────────────────────────
   /api/manse 처리 (Route Handler 가 이 함수만 부름 — 테스트에서도 그대로 사용)
   순서: 같은 출처 확인 → 크기 제한 → 사용량 제한 → JSON → 입력 검증 → 계산
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

export async function handleManseStatus(env: Record<string, string | undefined> = process.env) {
  const cfg = readManseConfig(env);
  // 무엇이 빠졌는지만 알려 주고 값은 절대 내보내지 않음
  return json(200, cfg.provider === "hrum" ? { provider: "hrum", configured: true, mappingVerified: cfg.mappingVerified } : { provider: "none", configured: false, missing: cfg.missing });
}

export async function handleMansePost(req: Request, env: Record<string, string | undefined> = process.env, fetchImpl?: typeof fetch) {
  if (!sameOrigin(req)) return json(403, { status: "error", code: "FORBIDDEN_ORIGIN", message: "허용되지 않은 요청이에요." });
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_BODY) return json(413, { status: "error", code: "PAYLOAD_TOO_LARGE", message: "요청이 너무 커요." });

  const cfg = readManseConfig(env);
  const limit = cfg.provider === "hrum" ? cfg.rateLimitPerMinute : 10;
  const t = takeToken(clientKey(req), limit);
  if (!t.ok) return json(429, { status: "error", code: "RATE_LIMITED", message: "잠시 뒤 다시 시도해 주세요." }, { "Retry-After": String(t.retryAfterSec) });

  let raw: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY) return json(413, { status: "error", code: "PAYLOAD_TOO_LARGE", message: "요청이 너무 커요." });
    raw = JSON.parse(text);
  } catch {
    return json(400, { status: "error", code: "INVALID_JSON", message: "요청 형식이 올바르지 않아요." });
  }

  const v = validateManseRequest(raw);
  if (!v.ok) return json(v.errors.some((e) => e.code === "LEAP_UNKNOWN") ? 422 : 400, { status: "error", code: "INVALID_INPUT", errors: v.errors });

  try {
    const r = await calculateManse(v.value, cfg, fetchImpl);
    return json(200, r);
  } catch (e) {
    if (e instanceof ManseError) {
      if (e.code !== "NOT_CONFIGURED") console.warn(`[manse] ${e.code}`); // 코드만 기록 (입력 · 키 없음)
      return json(e.httpStatus, { status: e.code === "NOT_CONFIGURED" ? "not-configured" : "error", code: e.code, message: e.message });
    }
    console.warn("[manse] UNKNOWN");
    return json(500, { status: "error", code: "INTERNAL", message: "계산 중 문제가 생겼어요." });
  }
}
