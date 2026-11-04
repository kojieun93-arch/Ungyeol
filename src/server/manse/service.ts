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

/** 크레딧 사용 추정 — 실제 차감액은 HRUM 콘솔(사용량 · 결제)에서 확인 */
export type ManseBilling = {
  /** 이번 요청에서 HRUM 을 실제로 불렀는지 (false = 운결 서버 캐시) */
  upstreamCalled: boolean;
  /** HRUM 이 멱등 재응답이라고 알려 왔는지 (null = 헤더 없음) */
  replayed: boolean | null;
  /** 공식 요금(성공 1건 ₩50) 기준 추정액 */
  estimatedChargeKRW: 0 | 50;
  basis: string;
};

export type ManseServiceResult = {
  status: "calculated" | "unverified";
  source: "hrum";
  calculation: HrumCalculation;
  billing: ManseBilling;
  warnings: { provider: string[]; ungyeol: BoundaryWarning[] };
  verification: {
    mappingVerified: boolean;
    checks: HrumCalculation["checks"] & {
      /** 화면의 계산 기준 문구와 같은지: 진태양시 보정 없음 · 음력 입력이면 음력 변환 정보 있음 */
      basisMatches: boolean;
    };
    /** calculated 가 아닌 이유 (운영 확인용 코드, 개인정보 없음) */
    reasons: string[];
  };
};

/**
 * HRUM 을 실제로 부르기 직전 · 직후 (handler 가 공유 예산 · 초당 제한 · 동시 호출 수를 여기서 관리)
 * before 가 throw 하면 HRUM 을 부르지 않음. after(billed) 는 성공 · 실패 모두 한 번 불림
 * billed: 성공(200)이고 멱등 재응답이 아님 (공식 문서: 4xx · 5xx 는 과금 없음). 시간 초과는 과금됐을 수 있어 billed 로 봄
 */
export type UpstreamHooks = { before: () => Promise<void>; after: (billed: boolean) => Promise<void> };

const cache = new Map<string, { at: number; calc: HrumCalculation }>();
/** 같은 입력이 동시에 여러 번 와도 HRUM 은 한 번만 (진행 중인 호출 공유) */
const pending = new Map<string, Promise<{ calc: HrumCalculation; replayed: boolean | null }>>();
const TTL = 10 * 60_000;
const keyOf = (v: ManseRequest) => createHash("sha256").update(JSON.stringify([v.calendar, v.leap, v.birth, v.time, v.gender, v.timezone])).digest("hex");

export async function calculateManse(v: ManseRequest, cfg: ManseConfig = readManseConfig(), fetchImpl?: typeof fetch, hooks?: UpstreamHooks): Promise<ManseServiceResult> {
  if (cfg.provider !== "hrum") throw new ManseError("NOT_CONFIGURED", 503, "실제 만세력 계산이 아직 연결되지 않았어요.");
  const k = keyOf(v);
  const hit = cache.get(k);
  let calc: HrumCalculation;
  let billing: ManseBilling = { upstreamCalled: false, replayed: null, estimatedChargeKRW: 0, basis: "운결 서버 캐시 (HRUM 호출 없음)" };
  if (hit && Date.now() - hit.at < TTL) calc = hit.calc;
  else if (pending.has(k)) {
    calc = (await pending.get(k)!).calc;
    billing = { upstreamCalled: false, replayed: null, estimatedChargeKRW: 0, basis: "같은 입력의 진행 중인 계산을 함께 씀 (HRUM 호출 없음)" };
  } else {
    const hrumCfg = cfg;
    const job = (async () => {
      await hooks?.before();
      let billed = false;
      try {
        const { meta, ...fresh } = await fetchHrumManse(v, hrumCfg, fetchImpl);
        billed = meta.replayed !== true;
        return { calc: fresh as HrumCalculation, replayed: meta.replayed };
      } catch (e) {
        billed = e instanceof ManseError && e.code === "TIMEOUT"; // 시간 초과는 HRUM 쪽에서 성공했을 수 있음 → 환불하지 않음
        throw e;
      } finally {
        await hooks?.after(billed);
      }
    })();
    pending.set(k, job);
    let out: { calc: HrumCalculation; replayed: boolean | null };
    try {
      out = await job;
    } finally {
      pending.delete(k);
    }
    calc = out.calc;
    billing = out.replayed
      ? { upstreamCalled: true, replayed: true, estimatedChargeKRW: 0, basis: "HRUM 멱등 재응답 (재과금 없음)" }
      : { upstreamCalled: true, replayed: out.replayed, estimatedChargeKRW: 50, basis: "공식 요금 성공 1건 ₩50 (추정)" };
    cache.set(k, { at: Date.now(), calc });
    if (cache.size > 500) cache.delete(cache.keys().next().value as string);
  }
  // 자체 점검이 하나라도 어긋나거나 필드가 빠지면 검증 완료 설정이어도 calculated 로 내보내지 않음
  const basisMatches = !calc.trueSolarTimeApplied && (v.calendar !== "lunar" || calc.lunarConverted);
  const c = calc.checks;
  const reasons = [
    !cfg.mappingVerified && "MAPPING_NOT_VERIFIED",
    !c.hangulMatches && "HANGUL_MISMATCH",
    c.ohaengBalanceMatches !== true && "OHAENG_MISMATCH_OR_MISSING",
    c.stemSipsinMatches !== true && "STEM_SIPSIN_MISMATCH_OR_MISSING",
    !c.sipsinNamesKnown && "SIPSIN_NAME_UNKNOWN",
    !c.requiredPresent && "FIELD_MISSING",
    !basisMatches && "BASIS_MISMATCH",
  ].filter((x): x is string => !!x);
  return {
    status: reasons.length === 0 ? "calculated" : "unverified",
    source: "hrum",
    calculation: calc,
    billing,
    warnings: { provider: calc.providerWarnings, ungyeol: boundaryWarnings(v) },
    verification: { mappingVerified: cfg.mappingVerified, checks: { ...calc.checks, basisMatches }, reasons },
  };
}

export function clearManseCache() {
  cache.clear();
  pending.clear();
}
