import { BRANCHES, STEMS } from "@/features/saju/elements";
import { countElements } from "@/features/saju/provider";
import type { ManseResult, Pillar, PillarKey } from "@/features/saju/types";
import type { ManseConfig } from "./config";
import type { ManseRequest } from "./input";

/* ──────────────────────────────────────────────────────────
   HRUM(흐름) 만세력 어댑터 — 서버 전용
   ⚠ 검증 상태: 공식 API 문서(hrum.ai/docs.html)를 아직 직접 확인하지 못함
     아래 요청 · 응답 형식은 HRUM 운영사(플로트)가 공개한 예제 저장소에서 확인한 부분만 사용
       - github.com/float1122/hrum-manseryeok-example · github.com/float1122/hrum-saju-api-examples
       - POST {base}/manseryeok, 헤더 X-Partner-Api-Key, 본문 year · month · day · hour · minute · timezone · gender · calendar · isLeapMonth
       - 응답 { success, data: { wonkuk: { year · month · day · hour(시간 미상이면 null): { stemHanja, branchHanja, … } } } }
     주소(base URL)는 코드에 넣지 않고 HRUM_API_BASE_URL 로만 받음
   예제에 없는 필드(좌표 · 자시 규칙 · 언어 등)는 보내지 않고, 응답의 다른 필드는 쓰지 않음
   응답이 예상과 다르면 추측해서 채우지 않고 UNEXPECTED_RESPONSE 로 실패
   ────────────────────────────────────────────────────────── */

export type ManseErrorCode = "NOT_CONFIGURED" | "INVALID_INPUT" | "INVALID_LUNAR_DATE" | "AUTH" | "QUOTA" | "RATE_LIMITED" | "TIMEOUT" | "UPSTREAM" | "UNEXPECTED_RESPONSE";

export class ManseError extends Error {
  constructor(
    readonly code: ManseErrorCode,
    readonly httpStatus: number,
    message: string,
  ) {
    super(message);
  }
}

/** 요청 본문 — 예제에서 확인한 필드만 */
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

/** 응답 → ManseResult. 한자 천간 · 지지만 사용하고 오행은 운결 표(elements.ts)로 붙임 */
export function parseHrumResponse(json: unknown, timeKnown: boolean): ManseResult {
  const bad = (why: string) => new ManseError("UNEXPECTED_RESPONSE", 502, `계산 결과 형식을 확인할 수 없어요 (${why}).`);
  if (!json || typeof json !== "object") throw bad("본문");
  const j = json as { success?: unknown; data?: { wonkuk?: Record<string, unknown> } };
  if (j.success !== true || !j.data?.wonkuk) throw bad("success · data.wonkuk");
  const w = j.data.wonkuk;
  const pillars: Pillar[] = PILLAR_ORDER.map(({ key, label }) => {
    const p = w[key] as { stemHanja?: unknown; branchHanja?: unknown } | null | undefined;
    if (key === "hour" && (p === null || p === undefined)) {
      if (timeKnown) throw bad("시각을 보냈는데 시주가 없음");
      return { key, label, stem: null, branch: null };
    }
    if (key === "hour" && !timeKnown) throw bad("시각 미상인데 시주가 있음");
    const stem = typeof p?.stemHanja === "string" ? STEMS[p.stemHanja] : undefined;
    const branch = typeof p?.branchHanja === "string" ? BRANCHES[p.branchHanja] : undefined;
    if (!stem || !branch) throw bad(`${key} 천간 · 지지`);
    return { key, label, stem, branch };
  });
  const day = pillars.find((p) => p.key === "day")!;
  return { isSample: false, source: "hrum", pillars, dayMaster: day.stem!, hourKnown: timeKnown, elements: countElements(pillars) };
}

/** HTTP 상태 · 오류 코드 → 운결 오류 (메시지에 키 · 입력값을 넣지 않음) */
export function mapHrumError(status: number, body: unknown): ManseError {
  const code = (body as { code?: unknown } | null)?.code;
  if (code === "INVALID_LUNAR_DATE") return new ManseError("INVALID_LUNAR_DATE", 400, "없는 음력 날짜(또는 윤달)예요.");
  if (code === "INSUFFICIENT_BALANCE") return new ManseError("QUOTA", 503, "지금은 계산할 수 없어요. 잠시 뒤 다시 시도해 주세요.");
  if (code === "RATE_LIMIT_EXCEEDED" || status === 429) return new ManseError("RATE_LIMITED", 503, "요청이 많아 잠시 뒤 다시 시도해 주세요.");
  if (status === 401 || status === 403) return new ManseError("AUTH", 503, "계산 서비스 설정을 확인하고 있어요.");
  if (status === 400) return new ManseError("INVALID_INPUT", 400, "입력한 정보로 계산할 수 없어요.");
  return new ManseError("UPSTREAM", 503, "계산 서비스가 응답하지 않아요. 잠시 뒤 다시 시도해 주세요.");
}

export async function fetchHrumManse(v: ManseRequest, cfg: Extract<ManseConfig, { provider: "hrum" }>, fetchImpl: typeof fetch = fetch): Promise<ManseResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs);
  let res: Response;
  try {
    res = await fetchImpl(`${cfg.baseUrl}/manseryeok`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", "X-Partner-Api-Key": cfg.apiKey, "User-Agent": cfg.userAgent },
      body: JSON.stringify(buildHrumBody(v)),
      signal: ctrl.signal,
      cache: "no-store",
    });
  } catch (e) {
    if ((e as Error)?.name === "AbortError") throw new ManseError("TIMEOUT", 504, "계산 서비스 응답이 늦어요. 잠시 뒤 다시 시도해 주세요.");
    throw new ManseError("UPSTREAM", 503, "계산 서비스에 연결하지 못했어요.");
  } finally {
    clearTimeout(timer);
  }
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  if (!res.ok) throw mapHrumError(res.status, json);
  return parseHrumResponse(json, v.time !== null);
}
