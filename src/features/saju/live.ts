import { useEffect, useSyncExternalStore } from "react";
import type { Profile } from "@/features/chat/types";
import { BRANCHES, STEMS } from "./elements";
import { countElements } from "./provider";
import type { LiveExtras, ManseResult, Pillar, PillarKey } from "./types";

/* ──────────────────────────────────────────────────────────
   실제 만세력 결과 — 브라우저 쪽 저장소 (메모리 전용, 이 탭에서만)

   흐름: GET /api/manse 의 screen 이 "live" 일 때만 POST /api/manse 로 계산을 요청
         (live = 서버에서 HRUM_MAPPING_VERIFIED=true 그리고 MANSE_PUBLIC_ENABLED=true)
   - 서버 응답 status 가 "calculated" 일 때만 실제 결과로 씀. unverified · 오류 · 입력 미상이면 샘플 + 이유
   - 브라우저는 키 · 확인 토큰을 모름 (서버 환경 변수에만)
   - 같은 입력은 한 번만 요청 (진행 중인 요청도 공유)
   - 생년월일 등은 저장하지 않음 (새로고침하면 사라짐)
   ────────────────────────────────────────────────────────── */

export type LiveMode = "unknown" | "sample" | "live";
export type LiveEntry =
  | { phase: "loading" }
  | { phase: "calculated"; manse: ManseResult; extras: LiveExtras }
  | { phase: "fallback"; reason: string };

let mode: LiveMode = "unknown";
let modeReq: Promise<void> | null = null;
const entries = new Map<string, LiveEntry>();
const listeners = new Set<() => void>();
let version = 0;
const emit = () => {
  version++;
  listeners.forEach((l) => l());
};

const keyOf = (p: Profile) => JSON.stringify([p.calendar ?? null, p.calendar === "lunar" ? (p.leap ?? null) : null, p.birth ?? null, p.time ?? null, p.gender ?? null]);

export function getLiveMode(): LiveMode {
  return mode;
}
/** 채팅 문구용 — 실제 계산을 쓸 수 있는 상태가 아니면 샘플 문구 */
export function isSampleMode(): boolean {
  return mode !== "live";
}

export function ensureLiveMode(fetchImpl: typeof fetch = fetch): Promise<void> {
  if (mode !== "unknown") return Promise.resolve();
  if (!modeReq)
    modeReq = fetchImpl("/api/manse", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        mode = j && j.screen === "live" ? "live" : "sample";
      })
      .catch(() => {
        mode = "sample";
      })
      .finally(emit);
  return modeReq;
}

const BASIS = ["HRUM 만세력 API로 입력하신 생년월일을 계산했어요 (대한민국 표준시 기준, 진태양시 보정 없음).", "23시 이후 출생은 전통 자시 규칙(다음 날 일주)으로 계산해요.", "십신 · 오행은 HRUM 값, 일간 기질 해석은 운결의 일간 10종 해설표 기준이에요."];

const REASON: Record<string, string> = {
  LEAP_UNKNOWN: "음력 윤달 여부를 몰라 실제 계산을 하지 않았어요.",
  INVALID_LUNAR_DATE: "없는 음력 날짜(또는 윤달)라 계산하지 못했어요.",
  INVALID_INPUT: "입력하신 정보로 계산하지 못했어요.",
  RATE_LIMITED: "요청이 많아 지금은 계산하지 못했어요.",
  DAILY_LIMIT: "오늘 계산 횟수를 모두 써서 계산하지 못했어요.",
};

/** 서버 응답 → ManseResult (운결 천간 · 지지 표로 다시 만듦 — 응답 모양을 그대로 믿지 않음) */
export function toLiveEntry(j: unknown): LiveEntry {
  const r = j as { status?: string; calculation?: { manse?: { pillars?: { key: PillarKey; stem: { hanja: string } | null; branch: { hanja: string } | null }[]; hourKnown?: boolean }; pillars?: LiveExtras["tenGods"][number] & { stemSipsin?: string | null; branchSipsin?: string | null }[] }; warnings?: { provider?: string[]; ungyeol?: { message: string }[] }; error?: { code?: string } };
  if (r?.status !== "calculated") return { phase: "fallback", reason: REASON[r?.error?.code ?? ""] ?? (r?.status === "unverified" ? "실제 계산이 아직 검증되지 않아 샘플로 보여드려요." : "실제 계산을 하지 못해 샘플로 보여드려요.") };
  const order: { key: PillarKey; label: string }[] = [
    { key: "hour", label: "시주" },
    { key: "day", label: "일주" },
    { key: "month", label: "월주" },
    { key: "year", label: "년주" },
  ];
  const src = r.calculation?.manse?.pillars ?? [];
  const hourKnown = r.calculation?.manse?.hourKnown !== false;
  const pillars: Pillar[] = [];
  for (const { key, label } of order) {
    const p = src.find((x) => x.key === key);
    if (key === "hour" && !hourKnown) {
      pillars.push({ key, label, stem: null, branch: null });
      continue;
    }
    const stem = p?.stem ? STEMS[p.stem.hanja] : undefined;
    const branch = p?.branch ? BRANCHES[p.branch.hanja] : undefined;
    if (!stem || !branch) return { phase: "fallback", reason: "계산 결과 형식을 확인하지 못해 샘플로 보여드려요." };
    pillars.push({ key, label, stem, branch });
  }
  const manse: ManseResult = { isSample: false, source: "hrum", pillars, dayMaster: pillars[1].stem!, hourKnown, elements: countElements(pillars) };
  const raw = (r.calculation?.pillars ?? []) as { key: PillarKey; stemSipsin?: string | null; branchSipsin?: string | null; ohaeng?: string | null }[];
  const tenGods = order.map(({ key }) => {
    const x = raw.find((y) => y.key === key);
    return { key, stem: key === "day" ? null : (x?.stemSipsin ?? null), branch: x?.branchSipsin ?? null, ohaeng: x?.ohaeng ?? null };
  });
  const warnings = [...(r.warnings?.ungyeol ?? []).map((w) => w.message)];
  return { phase: "calculated", manse, extras: { source: "hrum", tenGods, basis: BASIS, warnings } };
}

export async function requestLive(p: Profile, fetchImpl: typeof fetch = fetch): Promise<void> {
  if (mode !== "live") return;
  const k = keyOf(p);
  if (entries.has(k)) return;
  if (!p.birth || !p.gender || !p.calendar) {
    entries.set(k, { phase: "fallback", reason: "생년월일 · 성별 정보가 없어 실제 계산을 하지 않았어요." });
    return emit();
  }
  if (p.calendar === "lunar" && (p.leap === null || p.leap === undefined)) {
    entries.set(k, { phase: "fallback", reason: REASON.LEAP_UNKNOWN });
    return emit();
  }
  entries.set(k, { phase: "loading" });
  emit();
  let entry: LiveEntry;
  try {
    const res = await fetchImpl("/api/manse", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calendar: p.calendar, leap: p.calendar === "lunar" ? p.leap : null, birth: p.birth, time: p.time ?? null, gender: p.gender }),
    });
    entry = toLiveEntry(await res.json().catch(() => null));
  } catch {
    entry = { phase: "fallback", reason: "계산 서버에 연결하지 못해 샘플로 보여드려요." };
  }
  entries.set(k, entry);
  emit();
}

/** 지금 저장된 결과 (실제 계산이 끝난 것만 calculated) */
export function getLiveEntry(p: Profile | null | undefined): LiveEntry | null {
  if (!p || mode !== "live") return null;
  return entries.get(keyOf(p)) ?? null;
}

export function useLive(p: Profile | null): { mode: LiveMode; entry: LiveEntry | null } {
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => version,
    () => 0,
  );
  useEffect(() => {
    void ensureLiveMode().then(() => p && requestLive(p));
  }, [p]);
  return { mode, entry: getLiveEntry(p) };
}

/** 테스트용 */
export function __resetLive(m: LiveMode = "unknown") {
  mode = m;
  modeReq = null;
  entries.clear();
  emit();
}
