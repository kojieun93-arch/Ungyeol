/* ──────────────────────────────────────────────────────────
   만세력 서버 설정 — 환경 변수 (서버에서만 읽음)
   NEXT_PUBLIC_ 이 붙은 이름은 쓰지 않음 → 브라우저 번들에 들어가지 않음
   값이 하나라도 없으면 HRUM 을 부르지 않고 'not-configured' (화면은 샘플 그대로)
   ────────────────────────────────────────────────────────── */

export type ManseConfig =
  | { provider: "none"; missing: string[] }
  | {
      provider: "hrum";
      baseUrl: string;
      apiKey: string;
      timeoutMs: number;
      /** 응답 → 화면 데이터 매핑을 공식 문서로 확인했는지 (확인 전에는 화면에 '계산 완료'로 쓰지 않음) */
      mappingVerified: boolean;
      rateLimitPerMinute: number;
      userAgent: string;
    };

const num = (v: string | undefined, d: number, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : d;
};

export function readManseConfig(env: Record<string, string | undefined> = process.env): ManseConfig {
  if (env.MANSE_PROVIDER !== "hrum") return { provider: "none", missing: ["MANSE_PROVIDER=hrum"] };
  const missing = ["HRUM_API_BASE_URL", "HRUM_API_KEY"].filter((k) => !env[k]?.trim());
  const base = env.HRUM_API_BASE_URL?.trim() ?? "";
  if (base && !/^https:\/\/[^\s/]+/.test(base)) missing.push("HRUM_API_BASE_URL(https)");
  if (missing.length) return { provider: "none", missing };
  return {
    provider: "hrum",
    baseUrl: base.replace(/\/+$/, ""),
    apiKey: env.HRUM_API_KEY!.trim(),
    timeoutMs: num(env.HRUM_TIMEOUT_MS, 8000, 1000, 20000),
    mappingVerified: env.HRUM_MAPPING_VERIFIED === "true",
    rateLimitPerMinute: num(env.MANSE_RATE_LIMIT_PER_MINUTE, 10, 1, 120),
    userAgent: "ungyeol/0.1",
  };
}
