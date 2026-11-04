import { createHash } from "node:crypto";
import type { ManseResult } from "@/features/saju/types";
import { readManseConfig, type ManseConfig } from "./config";
import { fetchHrumManse, ManseError } from "./hrum";
import { boundaryWarnings, type BoundaryWarning, type ManseRequest } from "./input";

/* ──────────────────────────────────────────────────────────
   만세력 계산 서비스 (서버 전용)
   - 같은 입력은 10분간 메모리 캐시 (HRUM 은 요청마다 과금 — 같은 결과를 다시 사지 않기 위해)
     캐시 키는 입력의 SHA-256 해시. 원문 생년월일은 키로 남기지 않음
   - status
       calculated : 실제 계산 + 매핑 확인 완료(HRUM_MAPPING_VERIFIED=true) → 화면에 '계산 결과'로 쓸 수 있음
       unverified : 실제 계산은 받았지만 매핑을 공식 문서로 확인하기 전 → 화면에는 계속 샘플
   ────────────────────────────────────────────────────────── */

export type ManseServiceResult = {
  status: "calculated" | "unverified";
  source: "hrum";
  manse: ManseResult;
  warnings: BoundaryWarning[];
};

const cache = new Map<string, { at: number; manse: ManseResult }>();
const TTL = 10 * 60_000;

const keyOf = (v: ManseRequest) => createHash("sha256").update(JSON.stringify([v.calendar, v.leap, v.birth, v.time, v.gender, v.timezone])).digest("hex");

export async function calculateManse(v: ManseRequest, cfg: ManseConfig = readManseConfig(), fetchImpl?: typeof fetch): Promise<ManseServiceResult> {
  if (cfg.provider !== "hrum") throw new ManseError("NOT_CONFIGURED", 503, "실제 만세력 계산이 아직 연결되지 않았어요.");
  const k = keyOf(v);
  const hit = cache.get(k);
  let manse: ManseResult;
  if (hit && Date.now() - hit.at < TTL) manse = hit.manse;
  else {
    manse = await fetchHrumManse(v, cfg, fetchImpl);
    cache.set(k, { at: Date.now(), manse });
    if (cache.size > 500) cache.delete(cache.keys().next().value as string);
  }
  return { status: cfg.mappingVerified ? "calculated" : "unverified", source: "hrum", manse, warnings: boundaryWarnings(v) };
}

export function clearManseCache() {
  cache.clear();
}
