/* ──────────────────────────────────────────────────────────
   만세력 서버 설정 — 환경 변수 (서버에서만 읽음, NEXT_PUBLIC_ 아님)

   공식 문서(hrum.ai/docs.html · getting-started.html) 기준
   - 기본 주소 https://api.hrum.ai, 만세력 경로 /api/v1/partners/v1/manseryeok
   - 예전 주소 api.float.do · api.inta.do 도 동작한다고 안내됨
   HRUM_API_BASE_URL 은 선택. 비우면 공식 기본 주소. 아래 어느 형태로 넣어도 같은 경로로 정리 (중복 경로 방지)
     https://api.hrum.ai
     https://api.hrum.ai/api/v1/partners/v1
     https://api.hrum.ai/api/v1/partners/v1/manseryeok
   키가 다른 곳으로 새지 않도록 허용된 호스트만 사용
   ────────────────────────────────────────────────────────── */

export const HRUM_DEFAULT_ORIGIN = "https://api.hrum.ai";
export const HRUM_MANSE_PATH = "/api/v1/partners/v1/manseryeok";
export const HRUM_ALLOWED_HOSTS = ["api.hrum.ai", "api.float.do", "api.inta.do"];

export type ManseConfig =
  | { provider: "none"; missing: string[] }
  | {
      provider: "hrum";
      endpoint: string;
      apiKey: string;
      timeoutMs: number;
      /** 응답 매핑을 실제 호출 · 기준 만세력 대조로 확인했는지. 확인 전에는 결과를 '계산 완료'로 쓰지 않음 */
      mappingVerified: boolean;
      /** 확인 전에는 이 토큰(X-Manse-Check-Token)이 있는 요청만 계산 — 공개 주소로 요금이 새지 않게 */
      checkToken: string | null;
      rateLimitPerMinute: number;
      userAgent: string;
    };

const num = (v: string | undefined, d: number, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : d;
};

/** 기본 주소 · 파트너 경로 · 전체 엔드포인트 어느 것이든 → 공식 만세력 엔드포인트. 허용 호스트가 아니면 null */
export function resolveManseEndpoint(raw: string | undefined): string | null {
  const v = (raw ?? "").trim() || HRUM_DEFAULT_ORIGIN;
  let u: URL;
  try {
    u = new URL(v);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || !HRUM_ALLOWED_HOSTS.includes(u.hostname) || u.search || u.hash || u.username || u.password) return null;
  const path = u.pathname.replace(/\/+$/, "");
  if (path === "" || path === HRUM_MANSE_PATH || path === HRUM_MANSE_PATH.replace(/\/manseryeok$/, "")) return `${u.origin}${HRUM_MANSE_PATH}`;
  return null; // 그 밖의 경로는 추측하지 않음
}

export function readManseConfig(env: Record<string, string | undefined> = process.env): ManseConfig {
  if (env.MANSE_PROVIDER !== "hrum") return { provider: "none", missing: ["MANSE_PROVIDER=hrum"] };
  const missing: string[] = [];
  if (!env.HRUM_API_KEY?.trim()) missing.push("HRUM_API_KEY");
  const endpoint = resolveManseEndpoint(env.HRUM_API_BASE_URL);
  if (!endpoint) missing.push("HRUM_API_BASE_URL(허용 주소: api.hrum.ai)");
  const mappingVerified = env.HRUM_MAPPING_VERIFIED === "true";
  const checkToken = env.MANSE_CHECK_TOKEN?.trim() || null;
  if (!mappingVerified && (!checkToken || checkToken.length < 24)) missing.push("MANSE_CHECK_TOKEN(24자 이상)");
  if (missing.length) return { provider: "none", missing };
  return {
    provider: "hrum",
    endpoint: endpoint!,
    apiKey: env.HRUM_API_KEY!.trim(),
    timeoutMs: num(env.HRUM_TIMEOUT_MS, 8000, 1000, 20000),
    mappingVerified,
    checkToken,
    rateLimitPerMinute: num(env.MANSE_RATE_LIMIT_PER_MINUTE, 10, 1, 120),
    userAgent: "ungyeol/0.2",
  };
}
