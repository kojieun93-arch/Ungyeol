import { createHash } from "node:crypto";
import { BRANCHES, ELEMENTS, ELEMENT_ORDER, STEMS } from "@/features/saju/elements";
import { countElements } from "@/features/saju/provider";
import type { ElementKey, ManseResult, Pillar, PillarKey } from "@/features/saju/types";
import type { ManseConfig } from "./config";
import type { ManseRequest } from "./input";

/* ──────────────────────────────────────────────────────────
   HRUM(흐름) 만세력 어댑터 — 서버 전용
   근거: 공식 문서 https://hrum.ai/docs.html (만세력 API) · https://hrum.ai/getting-started.html (2026-11-05 확인)

   요청 (보내는 것)
     year · month · day · hour(0–23, 모르면 생략) · minute(0–59) · timezone("Asia/Seoul") · gender(male|female)
     음력이면 calendar:"lunar" · isLeapMonth
   보내지 않는 것 (운결 정책)
     name(개인정보 최소화) · birthLatitude/Longitude · country(진태양시 보정 안 함 — 표준시 기준)
     zaSiRule(공식 기본값 traditional: 23시 이후 다음 날 일주) · birthTimePrecision · astrology · glossary · lang(기본 ko)

   응답에서 쓰는 것 (공식 문서의 필드만)
     data.wonkuk.{year,month,day,hour|null}: stem · branch(한글) · stemHanja · branchHanja · ohaeng(목화토금수) · stemSipsin · branchSipsin
     data.ohaengBalance {목,화,토,금,수} · data.birthHour.known · data.trueSolarTime · data.lunarInput(있는지만) · data.warnings
   대운 · 세운 · 용신 · 격국 등은 아직 화면에 쓰지 않아 변환하지 않음 (리포트는 '미연결' 유지)
   ────────────────────────────────────────────────────────── */

export type ManseErrorCode =
  | "NOT_CONFIGURED"
  | "INVALID_INPUT"
  | "INVALID_LUNAR_DATE"
  | "AUTH"
  | "BLOCKED"
  | "INSUFFICIENT_BALANCE"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "UPSTREAM"
  | "UNEXPECTED_RESPONSE";

export class ManseError extends Error {
  constructor(
    readonly code: ManseErrorCode,
    readonly httpStatus: number,
    message: string,
    readonly upstream: { status: number; code: string | null } | null = null,
  ) {
    super(message);
  }
}

/** 공식 응답에서 읽은 값 — 운결이 계산하지 않은, 제공자가 준 그대로의 값 */
export type HrumPillarExtra = { key: PillarKey; stemHangul: string; branchHangul: string; ohaeng: string | null; stemSipsin: string | null; branchSipsin: string | null };
export type HrumCalculation = {
  manse: ManseResult;
  /** 기둥별 십신 · 오행(제공자 문자열 그대로. 일간 자리 표기는 문서에 없어 해석하지 않음) */
  pillars: HrumPillarExtra[];
  ohaengBalance: Record<ElementKey, number> | null;
  birthHourKnown: boolean;
  trueSolarTimeApplied: boolean;
  lunarConverted: boolean;
  /** 제공자 경고 코드 (예: UNKNOWN_TIMEZONE) */
  providerWarnings: string[];
  /** 운결 쪽 자체 점검 (계산값을 바꾸지 않음) */
  checks: { ohaengBalanceMatches: boolean | null; hangulMatches: boolean };
};

export function buildHrumBody(v: ManseRequest): Record<string, unknown> {
  const body: Record<string, unknown> = { year: v.birth.y, month: v.birth.m, day: v.birth.d, timezone: v.timezone, gender: v.gender };
  if (v.time) {
    body.hour = v.time.h;
    body.minute = v.time.m;
  }
  if (v.calendar === "lunar") {
    body.calendar = "lunar";
    body.isLeapMonth = v.leap === true;
  }
  return body;
}

const PILLAR_ORDER: { key: PillarKey; label: string }[] = [
  { key: "hour", label: "시주" },
  { key: "day", label: "일주" },
  { key: "month", label: "월주" },
  { key: "year", label: "년주" },
];

/** 공식 ohaengBalance 의 키(한글) → 운결 오행 키 */
const OHAENG_KEY: Record<string, ElementKey> = { 목: "wood", 화: "fire", 토: "earth", 금: "metal", 수: "water" };

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

export function parseHrumResponse(json: unknown, timeSent: boolean): HrumCalculation {
  const bad = (why: string) => new ManseError("UNEXPECTED_RESPONSE", 502, `계산 결과 형식을 확인할 수 없어요 (${why}).`);
  if (!json || typeof json !== "object") throw bad("본문");
  const j = json as { success?: unknown; data?: Record<string, unknown> };
  const data = j.data;
  const wonkuk = data?.wonkuk as Record<string, unknown> | undefined;
  if (j.success !== true || !data || !wonkuk || typeof wonkuk !== "object") throw bad("success · data.wonkuk");

  // 출생시간 미상: 공식 문서 — hour 생략 시 wonkuk.hour = null, birthHour.known 으로 판별 (excludedFields 는 쓰지 않음)
  const birthHour = data.birthHour as { known?: unknown } | undefined;
  const birthHourKnown = timeSent ? true : birthHour?.known === false ? false : (() => { throw bad("시각 미상인데 birthHour.known 이 false 가 아님"); })();

  let hangulMatches = true;
  const extras: HrumPillarExtra[] = [];
  const pillars: Pillar[] = PILLAR_ORDER.map(({ key, label }) => {
    const p = wonkuk[key] as Record<string, unknown> | null | undefined;
    if (key === "hour" && !birthHourKnown) {
      if (p !== null && p !== undefined) throw bad("시각 미상인데 시주가 있음");
      return { key, label, stem: null, branch: null };
    }
    if (!p || typeof p !== "object") throw bad(`${key} 기둥 없음`);
    const stem = typeof p.stemHanja === "string" ? STEMS[p.stemHanja] : undefined;
    const branch = typeof p.branchHanja === "string" ? BRANCHES[p.branchHanja] : undefined;
    if (!stem || !branch) throw bad(`${key} 천간 · 지지 한자`);
    const sh = str(p.stem), bh = str(p.branch);
    if ((sh && sh !== stem.hangul) || (bh && bh !== branch.hangul)) hangulMatches = false;
    extras.push({ key, stemHangul: sh ?? stem.hangul, branchHangul: bh ?? branch.hangul, ohaeng: str(p.ohaeng), stemSipsin: str(p.stemSipsin), branchSipsin: str(p.branchSipsin) });
    return { key, label, stem, branch };
  });
  if (!hangulMatches) throw bad("한글 · 한자 천간지지가 서로 맞지 않음");

  const manse: ManseResult = { isSample: false, source: "hrum", pillars, dayMaster: pillars[1].stem!, hourKnown: birthHourKnown, elements: countElements(pillars) };

  // 오행 개수: 공식 ohaengBalance 를 그대로 보관하고, 운결이 글자로 센 값과 같은지 점검만
  let ohaengBalance: Record<ElementKey, number> | null = null;
  const ob = data.ohaengBalance as Record<string, unknown> | undefined;
  if (ob && typeof ob === "object") {
    const out = {} as Record<ElementKey, number>;
    let ok = true;
    for (const [k, el] of Object.entries(OHAENG_KEY)) {
      const n = ob[k];
      if (typeof n !== "number" || !Number.isFinite(n) || n < 0) ok = false;
      else out[el] = n;
    }
    ohaengBalance = ok ? out : null;
  }
  const ohaengBalanceMatches = ohaengBalance ? ELEMENT_ORDER.every((k) => manse.elements.counts.find((c) => c.key === k)!.count === ohaengBalance![k]) : null;

  const warnings = Array.isArray(data.warnings) ? (data.warnings as unknown[]).map((w) => str((w as { code?: unknown })?.code)).filter((x): x is string => !!x) : [];

  return {
    manse,
    pillars: extras,
    ohaengBalance,
    birthHourKnown,
    trueSolarTimeApplied: data.trueSolarTime !== null && data.trueSolarTime !== undefined,
    lunarConverted: data.lunarInput !== null && data.lunarInput !== undefined,
    providerWarnings: warnings,
    checks: { ohaengBalanceMatches, hangulMatches },
  };
}

/** 공식 오류 → 운결 오류. 메시지에 키 · 입력값을 넣지 않음 */
export function mapHrumError(status: number, body: unknown): ManseError {
  const code = str((body as { code?: unknown } | null)?.code);
  const up = { status, code };
  if (code === "INVALID_LUNAR_DATE") return new ManseError("INVALID_LUNAR_DATE", 400, "없는 음력 날짜이거나, 그해에 없는 윤달이에요.", up);
  if (status === 400) return new ManseError("INVALID_INPUT", 400, "입력한 정보로 계산할 수 없어요.", up);
  if (status === 401) return new ManseError("AUTH", 503, "계산 서비스 설정을 확인하고 있어요.", up); // 키 없음 · 잘못됨
  if (status === 402) return new ManseError("INSUFFICIENT_BALANCE", 503, "지금은 계산할 수 없어요. 잠시 뒤 다시 시도해 주세요.", up); // 만세력은 code 없이 402
  if (status === 403) return new ManseError("BLOCKED", 503, "계산 서비스 연결을 확인하고 있어요.", up); // 보안 규칙(User-Agent 등)
  if (status === 429) return new ManseError("RATE_LIMITED", 503, "요청이 많아 잠시 뒤 다시 시도해 주세요.", up);
  return new ManseError("UPSTREAM", 503, "계산 서비스가 잠시 응답하지 않아요. 잠시 뒤 다시 시도해 주세요.", up);
}

const RETRYABLE = new Set([500, 502, 503, 504]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * 호출 — 타임아웃 · 일시 오류(5xx)만 1번 재시도(1초 뒤). 429 · 4xx 는 재시도하지 않음 (요금 · 한도 보호)
 * 공식 문서: 실패(4xx · 5xx) 응답은 과금되지 않음
 * X-Idempotency-Key: 공식 문서의 멱등성 절(같은 키 · 같은 본문은 24시간 안 재과금 없음). 만세력 적용 여부는 실제 호출로 확인 필요
 */
export async function fetchHrumManse(v: ManseRequest, cfg: Extract<ManseConfig, { provider: "hrum" }>, fetchImpl: typeof fetch = fetch, retryDelayMs = 1000): Promise<HrumCalculation> {
  const body = JSON.stringify(buildHrumBody(v));
  const idem = createHash("sha256").update(body).digest("hex").slice(0, 64);
  for (let attempt = 0; ; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs);
    let res: Response;
    try {
      res = await fetchImpl(cfg.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "X-Partner-Api-Key": cfg.apiKey, "User-Agent": cfg.userAgent, "X-Idempotency-Key": idem },
        body,
        signal: ctrl.signal,
        cache: "no-store",
      });
    } catch (e) {
      clearTimeout(timer);
      if ((e as Error)?.name === "AbortError") throw new ManseError("TIMEOUT", 504, "계산 서비스 응답이 늦어요. 잠시 뒤 다시 시도해 주세요.");
      throw new ManseError("UPSTREAM", 503, "계산 서비스에 연결하지 못했어요.");
    }
    clearTimeout(timer);
    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      json = null; // 403 보안 규칙 차단은 HTML 본문
    }
    if (res.ok) return parseHrumResponse(json, v.time !== null);
    if (attempt === 0 && RETRYABLE.has(res.status)) {
      await sleep(retryDelayMs);
      continue;
    }
    throw mapHrumError(res.status, json);
  }
}

/** 오행 이름 (화면 표시용) */
export const ohaengLabel = (k: ElementKey) => ELEMENTS[k].hangul;
