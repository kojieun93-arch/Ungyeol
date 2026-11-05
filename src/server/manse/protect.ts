import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/* ──────────────────────────────────────────────────────────
   공개 요청 보호 (서버 전용)
   - 클라이언트 IP: Vercel 이 덮어쓰는 x-vercel-forwarded-for → x-real-ip → x-forwarded-for 첫 값
     저장소 키에는 비밀값을 섞은 해시만 씀 (원래 IP 를 남기지 않음)
   - 서명 쿠키(ticket): GET /api/manse 가 공개 모드일 때만 발급
     값 = 만료시각.IP해시.HMAC-SHA256(MANSE_SIGNING_SECRET)  · HttpOnly · Secure · SameSite=Strict · Path=/api/manse · 30분
     POST 는 이 쿠키가 있고, 서명 · 만료 · IP 가 맞아야 계산 → 화면을 거치지 않은 직접 호출 · 다른 사이트의 위조 요청을 막음
   - 봇 확인(선택): Cloudflare Turnstile 토큰을 서버에서 siteverify 로 확인 (실패 · 오류면 거절)
   ────────────────────────────────────────────────────────── */

export const TICKET_COOKIE = "ungyeol_mt";
export const TICKET_TTL_SEC = 30 * 60;

export function clientIp(req: Request) {
  const h = req.headers;
  return (h.get("x-vercel-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0] ?? "unknown").trim() || "unknown";
}
export function ipHash(ip: string, salt: string | null) {
  return createHash("sha256").update(`${salt ?? "ungyeol"}:${ip}`).digest("hex").slice(0, 20);
}

const sign = (secret: string, payload: string) => createHmac("sha256", secret).update(payload).digest("base64url");

export function issueTicket(secret: string, iph: string, now = Date.now()) {
  const exp = Math.floor(now / 1000) + TICKET_TTL_SEC;
  const payload = `${exp}.${iph}`;
  return `${payload}.${sign(secret, payload)}`;
}
export function ticketCookie(value: string) {
  return `${TICKET_COOKIE}=${value}; Path=/api/manse; Max-Age=${TICKET_TTL_SEC}; HttpOnly; Secure; SameSite=Strict`;
}

export type TicketCheck = "ok" | "missing" | "invalid" | "expired" | "ip-changed";
export function checkTicket(req: Request, secret: string, iph: string, now = Date.now()): TicketCheck {
  const raw = (req.headers.get("cookie") ?? "").split(/;\s*/).find((c) => c.startsWith(`${TICKET_COOKIE}=`))?.slice(TICKET_COOKIE.length + 1);
  if (!raw) return "missing";
  const parts = raw.split(".");
  if (parts.length !== 3) return "invalid";
  const [exp, h, sig] = parts;
  const want = Buffer.from(sign(secret, `${exp}.${h}`));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return "invalid";
  if (!/^\d+$/.test(exp) || Number(exp) * 1000 < now) return "expired";
  if (h !== iph) return "ip-changed";
  return "ok";
}

export type BotCheck = {
  ok: boolean;
  /** NO_TOKEN · NETWORK · REJECTED · HOSTNAME_MISMATCH · ACTION_MISMATCH */
  reason: string | null;
  /** Cloudflare 가 돌려준 오류 코드 (예: invalid-input-response, timeout-or-duplicate) — 운영 확인용 */
  errorCodes: string[];
  hostnameOk: boolean | null;
  actionOk: boolean | null;
};

/**
 * Turnstile 확인 — 아래를 모두 만족해야 ok (네트워크 오류 · 시간 초과면 거절, fail-closed)
 *  success === true · action === "manse"(화면에서 지정) · hostname === 이 요청의 호스트(다른 사이트에서 받은 토큰 재사용 차단)
 */
export async function verifyTurnstile(token: string | null, secretKey: string, ip: string, expectedHost: string | null, fetchImpl: typeof fetch = fetch, timeoutMs = 3000): Promise<BotCheck> {
  const no = (reason: string, extra: Partial<BotCheck> = {}): BotCheck => ({ ok: false, reason, errorCodes: [], hostnameOk: null, actionOk: null, ...extra });
  if (!token || token.length > 2048) return no("NO_TOKEN");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const body = new URLSearchParams({ secret: secretKey, response: token });
    if (ip !== "unknown") body.set("remoteip", ip);
    const res = await fetchImpl("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body, signal: ctrl.signal, cache: "no-store" });
    const j = (await res.json().catch(() => null)) as { success?: unknown; action?: unknown; hostname?: unknown; "error-codes"?: unknown } | null;
    if (!res.ok || !j) return no("NETWORK");
    const errorCodes = Array.isArray(j["error-codes"]) ? (j["error-codes"] as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 5) : [];
    if (j.success !== true) return no("REJECTED", { errorCodes });
    const want = expectedHost ? expectedHost.split(":")[0].toLowerCase() : null;
    const hostnameOk = !want || (typeof j.hostname === "string" && j.hostname.toLowerCase() === want);
    const actionOk = j.action === "manse";
    if (!hostnameOk) return no("HOSTNAME_MISMATCH", { errorCodes, hostnameOk, actionOk });
    if (!actionOk) return no("ACTION_MISMATCH", { errorCodes, hostnameOk, actionOk });
    return { ok: true, reason: null, errorCodes, hostnameOk, actionOk };
  } catch {
    return no("NETWORK");
  } finally {
    clearTimeout(timer);
  }
}

/** 이 요청의 호스트 (Vercel 은 x-forwarded-host 를 채움) */
export const requestHost = (req: Request) => req.headers.get("x-forwarded-host") ?? req.headers.get("host");
