/* ──────────────────────────────────────────────────────────
   사용량 제한 — 1분 고정 창, 키(IP 해시)별
   서버리스는 인스턴스마다 메모리가 따로라 '인스턴스당' 제한이에요.
   여러 인스턴스 전체를 묶으려면 공유 저장소(예: Redis/KV)가 필요 → 다음 단계
   ────────────────────────────────────────────────────────── */

const buckets = new Map<string, { start: number; count: number }>();

export function takeToken(key: string, limit: number, now = Date.now(), windowMs = 60_000): { ok: boolean; retryAfterSec: number } {
  const b = buckets.get(key);
  if (!b || now - b.start >= windowMs) {
    buckets.set(key, { start: now, count: 1 });
    if (buckets.size > 5000) for (const [k, v] of buckets) if (now - v.start >= windowMs) buckets.delete(k);
    return { ok: true, retryAfterSec: 0 };
  }
  if (b.count >= limit) return { ok: false, retryAfterSec: Math.ceil((b.start + windowMs - now) / 1000) };
  b.count++;
  return { ok: true, retryAfterSec: 0 };
}

export function resetRateLimit() {
  buckets.clear();
}
