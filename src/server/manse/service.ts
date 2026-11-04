import { createHash } from "node:crypto";
import { readManseConfig, type ManseConfig } from "./config";
import { fetchHrumManse, ManseError, type HrumCalculation } from "./hrum";
import { boundaryWarnings, type BoundaryWarning, type ManseRequest } from "./input";

/* ──────────────────────────────────────────────────────────
   만세력 계산 서비스 (서버 전용)
   응답을 네 부분으로 분리
     calculation  : 제공자가 계산한 값 (원국 · 십신 · 오행 개수 …)
     warnings     : provider(제공자 경고 코드) · ungyeol(운결이 미리 아는 주의점)
     verification : mappingVerified(실제 호출 · 기준 만세력 대조 완료 여부) · checks(자체 일관성 점검)
     status       : calculated(검증 완료) · unverified(값은 있지만 검증 전 → 화면에 쓰지 않음)
   같은 입력은 10분 메모리 캐시 (호출당 과금). 키는 입력의 SHA-256
   ────────────────────────────────────────────────────────── */

export type ManseServiceResult = {
  status: "calculated" | "unverified";
  source: "hrum";
  calculation: HrumCalculation;
  warnings: { provider: string[]; ungyeol: BoundaryWarning[] };
  verification: { mappingVerified: boolean; checks: HrumCalculation["checks"] };
};

const cache = new Map<string, { at: number; calc: HrumCalculation }>();
const TTL = 10 * 60_000;
const keyOf = (v: ManseRequest) => createHash("sha256").update(JSON.stringify([v.calendar, v.leap, v.birth, v.time, v.gender, v.timezone])).digest("hex");

export async function calculateManse(v: ManseRequest, cfg: ManseConfig = readManseConfig(), fetchImpl?: typeof fetch): Promise<ManseServiceResult> {
  if (cfg.provider !== "hrum") throw new ManseError("NOT_CONFIGURED", 503, "실제 만세력 계산이 아직 연결되지 않았어요.");
  const k = keyOf(v);
  const hit = cache.get(k);
  let calc: HrumCalculation;
  if (hit && Date.now() - hit.at < TTL) calc = hit.calc;
  else {
    calc = await fetchHrumManse(v, cfg, fetchImpl);
    cache.set(k, { at: Date.now(), calc });
    if (cache.size > 500) cache.delete(cache.keys().next().value as string);
  }
  // 자체 점검이 어긋나면 검증 완료 설정이어도 calculated 로 내보내지 않음
  const consistent = calc.checks.hangulMatches && calc.checks.ohaengBalanceMatches !== false;
  return {
    status: cfg.mappingVerified && consistent ? "calculated" : "unverified",
    source: "hrum",
    calculation: calc,
    warnings: { provider: calc.providerWarnings, ungyeol: boundaryWarnings(v) },
    verification: { mappingVerified: cfg.mappingVerified, checks: calc.checks },
  };
}

export function clearManseCache() {
  cache.clear();
}
