/* ──────────────────────────────────────────────────────────
   공유 사용량 저장소 — 서버 인스턴스 전체가 같은 숫자를 봄 (서버 전용)

   운영: Upstash Redis REST (Vercel Marketplace 'Upstash for Redis' 연결 시 자동으로 들어가는 변수)
     UPSTASH_REDIS_REST_URL · UPSTASH_REDIS_REST_TOKEN  (또는 KV_REST_API_URL · KV_REST_API_TOKEN)
     npm 패키지 없이 fetch 로 REST 명령만 씀. 주소는 https://*.upstash.io 만 허용 (토큰이 다른 곳으로 새지 않게)
   개발 · 공개 전: 메모리 저장소 (인스턴스마다 따로 — 공개 모드에서는 쓰지 않음)

   모든 증가는 Lua 스크립트 한 번으로 원자적으로: INCR → 처음이면 만료 설정 → 한도 넘으면 되돌리고 거절
   저장소 오류 · 시간 초과는 '거절'로 처리 (fail-closed: 셀 수 없으면 HRUM 을 부르지 않음)
   키 · 토큰 · 주소 · 개인정보는 로그에 남기지 않음. IP 는 해시로만 키에 씀
   ────────────────────────────────────────────────────────── */

export type CountResult = { ok: boolean; count: number; retryAfterSec: number };

export interface LimitStore {
  readonly kind: "upstash" | "memory";
  /** 고정 창 카운터: 한도 안이면 +1 하고 ok, 넘으면 그대로 두고 거절 */
  take(key: string, limit: number, windowSec: number): Promise<CountResult>;
  /** 앞서 take 한 1을 되돌림 (과금되지 않은 호출의 예산 환불) */
  give(key: string): Promise<void>;
  /** 지금 값 (없으면 0) */
  peek(key: string): Promise<number>;
  /** 잠금: 비어 있으면 잡고 true (ttl 뒤 자동 해제) */
  lock(key: string, ttlMs: number): Promise<boolean>;
  unlock(key: string): Promise<void>;
}

export class StoreError extends Error {}

// ── 메모리 (개발 · 시험 · 공개 전 확인 토큰 요청)
export function memoryStore(now: () => number = Date.now): LimitStore {
  const m = new Map<string, { v: number; exp: number }>();
  const get = (k: string) => {
    const e = m.get(k);
    if (e && e.exp <= now()) m.delete(k);
    return m.get(k);
  };
  return {
    kind: "memory",
    async take(key, limit, windowSec) {
      const e = get(key);
      if (e && e.v >= limit) return { ok: false, count: e.v, retryAfterSec: Math.max(1, Math.ceil((e.exp - now()) / 1000)) };
      if (e) e.v++;
      else m.set(key, { v: 1, exp: now() + windowSec * 1000 });
      if (m.size > 5000) for (const k of m.keys()) get(k);
      return { ok: true, count: get(key)!.v, retryAfterSec: 0 };
    },
    async give(key) {
      const e = get(key);
      if (e && e.v > 0) e.v--;
    },
    async peek(key) {
      return get(key)?.v ?? 0;
    },
    async lock(key, ttlMs) {
      if (get(key)) return false;
      m.set(key, { v: 1, exp: now() + ttlMs });
      return true;
    },
    async unlock(key) {
      m.delete(key);
    },
  };
}

// ── Upstash Redis REST
const TAKE = "local v=redis.call('INCR',KEYS[1]) if v==1 then redis.call('EXPIRE',KEYS[1],tonumber(ARGV[2])) end if v>tonumber(ARGV[1]) then redis.call('DECR',KEYS[1]) local t=redis.call('TTL',KEYS[1]) return {0,v-1,t} end return {1,v,0}";
const GIVE = "local v=tonumber(redis.call('GET',KEYS[1]) or '0') if v>0 then redis.call('DECR',KEYS[1]) end return 1";

export function resolveUpstash(env: Record<string, string | undefined>): { url: string; token: string } | null {
  const url = (env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL ?? "").trim();
  const token = (env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN ?? "").trim();
  if (!url || !token) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || !u.hostname.endsWith(".upstash.io") || u.username || u.password || u.search || u.hash) return null;
    return { url: u.origin, token };
  } catch {
    return null;
  }
}

export function upstashStore(cfg: { url: string; token: string }, fetchImpl: typeof fetch = fetch, timeoutMs = 1500): LimitStore {
  async function cmd(args: (string | number)[]): Promise<unknown> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetchImpl(cfg.url, { method: "POST", headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" }, body: JSON.stringify(args.map(String)), cache: "no-store", signal: ctrl.signal });
      const j = (await res.json().catch(() => null)) as { result?: unknown; error?: unknown } | null;
      if (!res.ok || !j || "error" in j) throw new StoreError("STORE_ERROR");
      return j.result;
    } catch (e) {
      throw e instanceof StoreError ? e : new StoreError("STORE_UNAVAILABLE");
    } finally {
      clearTimeout(timer);
    }
  }
  return {
    kind: "upstash",
    async take(key, limit, windowSec) {
      const r = (await cmd(["EVAL", TAKE, 1, key, limit, windowSec])) as unknown;
      if (!Array.isArray(r) || r.length < 3) throw new StoreError("STORE_ERROR");
      const [ok, count, ttl] = r.map(Number);
      return { ok: ok === 1, count, retryAfterSec: ok === 1 ? 0 : Math.max(1, ttl > 0 ? ttl : windowSec) };
    },
    async give(key) {
      await cmd(["EVAL", GIVE, 1, key]);
    },
    async peek(key) {
      const r = await cmd(["GET", key]);
      return r === null || r === undefined ? 0 : Number(r) || 0;
    },
    async lock(key, ttlMs) {
      return (await cmd(["SET", key, "1", "NX", "PX", ttlMs])) === "OK";
    },
    async unlock(key) {
      await cmd(["DEL", key]);
    },
  };
}

/** 대한민국 날짜 (예산은 한국 자정에 초기화) */
export function kstDay(now = Date.now()) {
  return new Date(now + 9 * 3600_000).toISOString().slice(0, 10);
}
/** 한국 자정까지 남은 초 (+60초 여유) */
export function secondsToKstMidnight(now = Date.now()) {
  const k = now + 9 * 3600_000;
  return Math.ceil((86_400_000 - (k % 86_400_000)) / 1000) + 60;
}

let shared: { sig: string; store: LimitStore } | null = null;
let fallback = memoryStore();
/** 환경 변수로 저장소 선택 (Upstash 설정이 있으면 Upstash, 없으면 메모리) */
export function getLimitStore(env: Record<string, string | undefined>, fetchImpl?: typeof fetch): LimitStore {
  const up = resolveUpstash(env);
  if (!up) return fallback;
  if (fetchImpl) return upstashStore(up, fetchImpl);
  const sig = up.url + "|" + up.token.length;
  if (!shared || shared.sig !== sig) shared = { sig, store: upstashStore(up) };
  return shared.store;
}
/** 시험용: 메모리 저장소 비우기 */
export function __resetMemoryStore() {
  fallback = memoryStore();
}
