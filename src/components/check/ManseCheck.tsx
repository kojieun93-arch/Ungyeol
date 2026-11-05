"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "@/components/reading/Frame";
import { Sheet } from "@/components/report/common";
import { getBotToken } from "@/features/saju/live";
import CHECK from "@/content/manse-check-cases.json";

/* ──────────────────────────────────────────────────────────
   HRUM 실제 계산 검증 화면 — /check/manse (운영자용, 링크 없음 · 검색 제외)
   - 확인 토큰은 이 화면의 메모리에만 (저장 · 주소 · 결과 요약에 넣지 않음). 새로고침하면 지워짐
   - 1단계: 1건만 계산 → 형식 · 네 기둥 · 오행 · 십신 · 오류 검사
   - 2단계: 1단계가 성공하고 기준과 모두 맞을 때만 나머지 3건 (한 번씩만, 오류가 나면 멈춤)
   - 호출 수 · HRUM 실제 호출 수 · 추정 크레딧 표시. 실제 차감은 HRUM 콘솔에서 확인
   - 이 화면은 사용자 화면(샘플)을 바꾸지 않음
   ────────────────────────────────────────────────────────── */

type Case = { id: string; name: string; body: { calendar: string; leap: boolean | null; birth: { y: number; m: number; d: number }; time: { h: number; m: number } | null; gender: string }; expect?: Record<string, string | null>; expectError?: string; topic?: string; basis?: string };
type PillarKey = "year" | "month" | "day" | "hour";
const KEYS: PillarKey[] = ["year", "month", "day", "hour"];
const LABEL: Record<PillarKey, string> = { year: "년주", month: "월주", day: "일주", hour: "시주" };
const STOP = new Set(["INSUFFICIENT_BALANCE", "AUTH", "BLOCKED", "CHECK_TOKEN_REQUIRED", "RATE_LIMITED", "NOT_CONFIGURED", "FORBIDDEN_ORIGIN"]);

type Api = {
  status?: string;
  calculation?: {
    manse?: { pillars?: { key: string; stem: { hanja: string } | null; branch: { hanja: string } | null }[] };
    pillars?: { key: string; stemSipsin: string | null; branchSipsin: string | null; ohaeng: string | null }[];
    ohaengBalance?: Record<string, number> | null;
    birthHourKnown?: boolean;
    lunarConverted?: boolean;
    trueSolarTimeApplied?: boolean;
    missing?: string[];
  };
  billing?: { upstreamCalled: boolean; replayed: boolean | null; estimatedChargeKRW: number; basis: string };
  warnings?: { provider: string[]; ungyeol: { code: string }[] };
  verification?: { mappingVerified: boolean; checks: { ohaengBalanceMatches: boolean | null; hangulMatches: boolean; stemSipsinMatches?: boolean | null; sipsinNamesKnown?: boolean; requiredPresent?: boolean; basisMatches?: boolean }; reasons?: string[] };
  error?: { code: string; message: string; upstreamStatus?: number; upstreamCode?: string | null };
};

type Result = {
  id: string;
  http: number;
  ok: boolean;
  formatOk: boolean;
  pillars: Record<PillarKey, string | null>;
  match: Record<PillarKey, boolean>;
  allMatch: boolean;
  extraOk: boolean;
  data: Api | null;
  note: string[];
};

function analyze(c: Case, http: number, data: Api | null): Result {
  const note: string[] = [];
  // 오류가 기대되는 사례 (예: 없는 윤달 → INVALID_LUNAR_DATE, 과금 없음)
  if (c.expectError) {
    const got = data?.error?.code ?? null;
    const pass = got === c.expectError;
    if (!pass) note.push(`기대한 오류 ${c.expectError} 와 다름 (받은 값 ${got ?? `HTTP ${http}`})`);
    const none = { year: null, month: null, day: null, hour: null } as Record<PillarKey, string | null>;
    return { id: c.id, http, ok: pass, formatOk: false, pillars: none, match: { year: pass, month: pass, day: pass, hour: pass }, allMatch: pass, extraOk: pass, data, note };
  }
  const list = data?.calculation?.manse?.pillars ?? [];
  const pillars = Object.fromEntries(KEYS.map((k) => {
    const p = list.find((x) => x.key === k);
    return [k, p && p.stem && p.branch ? p.stem.hanja + p.branch.hanja : null];
  })) as Record<PillarKey, string | null>;
  const formatOk = http === 200 && (data?.status === "unverified" || data?.status === "calculated") && list.length === 4 && !!data?.verification && !!data?.billing;
  if (http === 200 && !formatOk) note.push("응답 형식이 예상과 달라요");
  const exp = (c.expect ?? {}) as Record<PillarKey, string | null>;
  const match = Object.fromEntries(KEYS.map((k) => [k, pillars[k] === exp[k]])) as Record<PillarKey, boolean>;
  const allMatch = formatOk && KEYS.every((k) => match[k]);
  // 사례별 추가 점검: 시각 모름 → birthHourKnown false · 음력 → lunarConverted true · 오행 개수 일치 · 한글/한자 일치
  const calc = data?.calculation;
  const checks = data?.verification?.checks;
  let extraOk = formatOk && checks?.hangulMatches === true && checks?.ohaengBalanceMatches !== false && checks?.stemSipsinMatches !== false && checks?.sipsinNamesKnown !== false && checks?.requiredPresent !== false;
  if (formatOk && checks?.stemSipsinMatches === false) note.push("천간 십신이 표준 규칙(음양 · 생극)과 달라요");
  if (formatOk && checks?.sipsinNamesKnown === false) note.push("십신 이름이 공식 10종 밖이에요");
  if (formatOk && c.body.time === null && calc?.birthHourKnown !== false) (extraOk = false), note.push("시각 모름인데 birthHour.known 이 false 가 아니에요");
  if (formatOk && c.body.calendar === "lunar" && calc?.lunarConverted !== true) (extraOk = false), note.push("음력인데 lunarInput 이 없어요");
  if (formatOk && checks?.ohaengBalanceMatches === null) note.push("ohaengBalance 가 응답에 없어요");
  if (formatOk && calc?.trueSolarTimeApplied) note.push("진태양시 보정이 적용됐어요 (기준값은 보정 없음)");
  if (formatOk && Array.isArray(calc?.missing) && calc.missing.length) (extraOk = false), note.push(`응답에 없는 필드: ${calc.missing.join(", ")}`);
  return { id: c.id, http, ok: http === 200, formatOk, pillars, match, allMatch, extraOk, data, note };
}

type RehearsalRun = { http: number; allOk?: boolean; stoppedAt?: string | null; hrumCalled?: boolean; steps?: { id: string; ok: boolean; detail?: unknown }[]; error?: { code: string } };
type Rehearsal = { ticket: { http: number; issued: boolean; siteKey: boolean; error: string | null } | null; widget: { token: boolean; error: string | null } | null; normal: RehearsalRun | null; noBot: RehearsalRun | null; noCookie: RehearsalRun | null };
const STEP_LABEL: Record<string, string> = { screen: "화면 요청 확인 (Origin · 서명 쿠키)", sharedStore: "공유 저장소", input: "입력 검증", botCheck: "봇 확인 (Turnstile 서버 검증)", ipLimits: "IP 한도 · 동시 1건", budget: "하루 예산 예약 → 환불" };
const detailText = (d: unknown) => (d === undefined ? "" : typeof d === "string" ? d : JSON.stringify(d));

const cases = CHECK.cases as Case[];
const extra = CHECK.extra as Case[];

export function ManseCheck() {
  const [token, setToken] = useState("");
  const [server, setServer] = useState<Record<string, unknown> | null>(null);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [busy, setBusy] = useState(false);
  const [stopped, setStopped] = useState<string | null>(null);
  const [counts, setCounts] = useState({ sent: 0, upstream: 0, krw: 0 });
  const [copied, setCopied] = useState<string | null>(null);
  const [probe, setProbe] = useState<Record<string, unknown> | null>(null);
  const [rehearsal, setRehearsal] = useState<Rehearsal | null>(null);

  // 공개 경로 리허설 — 실제 Turnstile · 서명 쿠키 · 공유 저장소로 공개 요청 단계를 돌리고 HRUM 직전에서 멈춤 (과금 없음)
  const runRehearsal = async () => {
    if (busy) return;
    setBusy(true);
    const tk = token.trim();
    const out: Rehearsal = { ticket: null, widget: null, normal: null, noBot: null, noCookie: null };
    try {
      const t = await fetch("/api/manse?probe=ticket", { cache: "no-store", credentials: "same-origin", headers: { "X-Manse-Check-Token": tk } });
      const tj = (await t.json().catch(() => ({}))) as { ticketIssued?: boolean; turnstileSiteKey?: string | null; error?: { code: string } };
      out.ticket = { http: t.status, issued: tj.ticketIssued === true, siteKey: !!tj.turnstileSiteKey, error: tj.error?.code ?? null };
      const post = async (botToken: string | null, credentials: RequestCredentials) => {
        const h: Record<string, string> = { "Content-Type": "application/json", "X-Manse-Check-Token": tk };
        if (botToken) h["X-Turnstile-Token"] = botToken;
        const r = await fetch("/api/manse?rehearsal=1", { method: "POST", cache: "no-store", credentials, headers: h, body: JSON.stringify(cases[0].body) });
        return { http: r.status, ...((await r.json().catch(() => ({}))) as Record<string, unknown>) } as RehearsalRun;
      };
      if (tj.turnstileSiteKey) {
        const w = await getBotToken(tj.turnstileSiteKey);
        out.widget = { token: !!w.token, error: w.error };
        out.normal = await post(w.token, "same-origin");
        out.noBot = await post(null, "same-origin");
      } else out.normal = await post(null, "same-origin");
      out.noCookie = await post(null, "omit");
    } catch {
      /* 화면에 비어 있는 칸으로 보임 */
    }
    setRehearsal(out);
    setBusy(false);
  };

  // 공유 저장소 확인 — HRUM 을 부르지 않음 (과금 없음)
  const runProbe = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/manse?probe=store", { cache: "no-store", headers: { "X-Manse-Check-Token": token.trim() } });
      setProbe({ http: r.status, ...((await r.json().catch(() => ({}))) as Record<string, unknown>) });
    } catch {
      setProbe({ http: 0 });
    }
    setBusy(false);
  };

  useEffect(() => {
    fetch("/api/manse", { cache: "no-store" })
      .then((r) => r.json())
      .then(setServer)
      .catch(() => setServer({ error: "상태를 읽지 못했어요" }));
  }, []);

  const run = async (c: Case) => {
    setCounts((n) => ({ ...n, sent: n.sent + 1 }));
    let http = 0;
    let data: Api | null = null;
    try {
      const r = await fetch("/api/manse", { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json", "X-Manse-Check-Token": token.trim() }, body: JSON.stringify(c.body) });
      http = r.status;
      data = await r.json().catch(() => null);
    } catch {
      http = 0;
    }
    const res = analyze(c, http, data);
    if (data?.billing) setCounts((n) => ({ ...n, upstream: n.upstream + (data!.billing!.upstreamCalled ? 1 : 0), krw: n.krw + (data!.billing!.estimatedChargeKRW || 0) }));
    setResults((m) => ({ ...m, [c.id]: res }));
    return res;
  };

  const runFirst = async () => {
    if (busy || results.c1) return;
    setBusy(true);
    const r = await run(cases[0]);
    if (!r.ok && r.data?.error && STOP.has(r.data.error.code)) setStopped(r.data.error.code);
    setBusy(false);
  };

  const runRest = async () => {
    if (busy || !gate) return;
    setBusy(true);
    for (const c of cases.slice(1)) {
      if (results[c.id]) continue;
      const r = await run(c);
      if (!r.ok && r.data?.error && STOP.has(r.data.error.code)) {
        setStopped(r.data.error.code);
        break;
      }
    }
    setBusy(false);
  };

  const first = results.c1;
  const gate = !!first && first.allMatch && first.extraOk && !stopped;
  const done = cases.filter((c) => results[c.id]).length;
  // 3단계(운영 전 추가 사례): 기본 4건이 모두 맞은 뒤에만, 사례마다 따로 한 번씩
  const gate3 = cases.every((c) => results[c.id]?.allMatch && results[c.id]?.extraOk) && !stopped;
  const runOne = async (c: Case) => {
    if (busy || results[c.id] || !gate3) return;
    setBusy(true);
    const r = await run(c);
    if (!r.ok && !c.expectError && r.data?.error && STOP.has(r.data.error.code)) setStopped(r.data.error.code);
    setBusy(false);
  };

  // 결과 요약 — 토큰 · 키 없음 (가상의 시험 생년월일과 계산값만)
  const summary = JSON.stringify(
    {
      at: new Date().toISOString().slice(0, 16),
      host: typeof window !== "undefined" ? window.location.host : "",
      server: server ? { configured: server.configured, mappingVerified: server.mappingVerified, screen: server.screen, protection: server.protection, publicBlockers: server.publicBlockers } : null,
      rehearsal: rehearsal ? { ticket: rehearsal.ticket, widget: rehearsal.widget, normal: rehearsal.normal && { allOk: rehearsal.normal.allOk, stoppedAt: rehearsal.normal.stoppedAt, steps: rehearsal.normal.steps }, noBot: rehearsal.noBot && { stoppedAt: rehearsal.noBot.stoppedAt }, noCookie: rehearsal.noCookie && { stoppedAt: rehearsal.noCookie.stoppedAt } } : null,
      store: probe ? { http: probe.http, shared: probe.shared, allOk: probe.allOk, checks: probe.checks, budget: probe.budget, botCheck: probe.botCheck } : null,
      counts,
      stopped,
      results: [...cases, ...extra].filter((c) => results[c.id]).map((c) => {
        const r = results[c.id];
        return {
          id: c.id,
          http: r.http,
          status: r.data?.status ?? null,
          pillars: r.pillars,
          expect: c.expect ?? null,
          expectError: c.expectError ?? null,
          match: r.allMatch,
          extraOk: r.extraOk,
          sipsin: r.data?.calculation?.pillars?.map((p) => `${p.key}:${p.stemSipsin ?? "-"}/${p.branchSipsin ?? "-"}/${p.ohaeng ?? "-"}`) ?? null,
          ohaengBalance: r.data?.calculation?.ohaengBalance ?? null,
          checks: r.data?.verification?.checks ?? null,
          reasons: r.data?.verification?.reasons ?? null,
          missing: r.data?.calculation?.missing ?? null,
          flags: r.data?.calculation ? { birthHourKnown: r.data.calculation.birthHourKnown, lunarConverted: r.data.calculation.lunarConverted, trueSolarTimeApplied: r.data.calculation.trueSolarTimeApplied } : null,
          warnings: r.data?.warnings ?? null,
          billing: r.data?.billing ?? null,
          error: r.data?.error ?? null,
          note: r.note,
        };
      }),
    },
    null,
    1,
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied("결과를 복사했어요. 운결 작업 대화에 붙여넣어 주세요.");
    } catch {
      setCopied("복사하지 못했어요. 아래 칸을 길게 눌러 ‘전체 선택 → 복사’ 해 주세요.");
    }
  };

  return (
    <div className="min-h-dvh bg-[#2e1c24] px-4 pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(env(safe-area-inset-bottom)+48px)] text-white" style={{ fontFamily: "var(--font-sans)" }} data-check="manse">
      <div className="mx-auto max-w-[480px]">
        <div className="flex justify-center">
          <LogoMark width="8rem" />
        </div>
        <h1 className="mt-3 text-center font-serif text-[1.45rem] font-semibold">만세력 실제 계산 검증</h1>
        <p className="mt-2 text-center text-[14px] leading-[1.6] text-chat-muted [word-break:keep-all]">
          운영자 확인용 화면이에요. 사용자 화면은 계속 샘플 사주로 보여요. 이 화면의 계산은 HRUM 크레딧을 써요 (성공 1건 ₩50). 저장소 확인은 크레딧을 쓰지 않아요.
        </p>

        <Sheet className="mt-6 px-4 pt-7 pb-5">
          <h2 className="font-serif text-[17px] font-semibold text-[#4a1a2c]">서버 상태</h2>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[14.5px]" data-server>
            {server ? (
              ["configured", "endpointHost", "mappingVerified", "checkTokenRequired", "screen", "protection", "publicBlockers"].map((k) => (
                <div key={k} className="contents">
                  <dt className="text-[#7b6266]">{k}</dt>
                  <dd className="font-medium break-all">{typeof server[k] === "object" && server[k] !== null ? (Array.isArray(server[k]) ? (server[k] as string[]).join(", ") || "없음" : Object.entries(server[k] as Record<string, unknown>).map(([a, b]) => `${a}: ${b}`).join(" · ")) : String(server[k] ?? (server.error ? "—" : "없음"))}</dd>
                </div>
              ))
            ) : (
              <dd>읽는 중…</dd>
            )}
          </dl>

          <label htmlFor="check-token" className="mt-5 block text-[15px] font-semibold text-[#4a1a2c]">
            확인 토큰 (MANSE_CHECK_TOKEN)
          </label>
          <input
            id="check-token"
            type="password"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Vercel 에 넣은 값을 붙여넣기"
            className="mt-1.5 h-12 w-full rounded-xl bg-white px-3 text-[16px] text-[#3a2229] shadow-[inset_0_0_0_1px_#e6cdbd] outline-none focus:shadow-[inset_0_0_0_2px_#974d5e]"
          />
          <p className="mt-1.5 text-[13px] leading-[1.55] text-[#7b6266] [word-break:keep-all]">
            토큰은 이 화면에만 잠시 있어요 (저장하지 않음). 화면을 캡처해 공유하지 말고, 끝나면 ‘토큰 지우기’를 눌러 주세요.
          </p>
          <button type="button" onClick={() => setToken("")} className="mt-1 min-h-11 text-[14px] text-[#6e2a40] underline decoration-[#c9a27a] underline-offset-4">
            토큰 지우기
          </button>
        </Sheet>

        <Sheet className="mt-8 px-4 pt-7 pb-5">
          <h2 className="font-serif text-[17px] font-semibold text-[#4a1a2c]">공유 사용량 저장소 확인</h2>
          <p className="mt-1 text-[14px] leading-[1.55] text-[#6b5459] [word-break:keep-all]">
            서버 인스턴스 전체가 같은 하루 예산을 보는지 확인해요. HRUM 은 부르지 않아요 (과금 없음). 공개 전에 shared 가 true 여야 해요.
          </p>
          <button type="button" onClick={runProbe} disabled={busy || token.trim().length < 24 || !server?.configured} className="mt-3 min-h-12 w-full rounded-full text-[15px] font-medium text-[#6e2a40] shadow-[inset_0_0_0_1.5px_#c9a27a] disabled:opacity-40" data-probe>
            저장소 확인하기
          </button>
          {probe && (
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[14.5px]" data-probe-result>
              {[
                ["shared", String(probe.shared ?? false)],
                ["store", String(probe.store ?? "—")],
                ["명령 점검", probe.checks ? `${probe.allOk ? "모두 통과" : "실패 있음"} · ${Object.entries(probe.checks as Record<string, boolean>).map(([a, b]) => `${({ countAndLimit: "증가·한도", refund: "환불", expiry: "만료", lockOnce: "동시 잠금", lockOwnerOnly: "남의 잠금 보호", unlock: "잠금 해제", budgetExpiry: "예산 키 만료" } as Record<string, string>)[a] ?? a} ${b ? "✓" : "✗"}`).join(" · ")}` : String(probe.writeRead ?? false)],
                ["응답 시간", probe.latencyMs !== undefined ? `${probe.latencyMs}ms` : "—"],
                ["오늘 HRUM 호출", probe.budget ? `${(probe.budget as any).used} / ${(probe.budget as any).limit} (공개 ${(probe.budget as any).publicLimit}, 운영자 몫 ${(probe.budget as any).operatorReserve}${(probe.budget as any).ttlSec > 0 ? `, ${Math.round((probe.budget as any).ttlSec / 3600)}시간 뒤 초기화` : ""})` : "—"],
                ["봇 확인", String(probe.botCheck ?? "—")],
                ["공개 전 남은 설정", Array.isArray(probe.publicBlockers) ? (probe.publicBlockers as string[]).join(", ") || "없음" : "—"],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-[#7b6266]">{k}</dt>
                  <dd className="font-medium break-all">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </Sheet>

        <Sheet className="mt-8 px-4 pt-7 pb-5">
          <h2 className="font-serif text-[17px] font-semibold text-[#4a1a2c]">공개 경로 리허설</h2>
          <p className="mt-1 text-[14px] leading-[1.55] text-[#6b5459] [word-break:keep-all]">
            사용자 화면이 실제로 보낼 요청을 그대로 흉내 내요. Turnstile 브라우저 인증 → 서버 검증 → 서명 쿠키 → 공유 저장소 한도 → 하루 예산 예약까지 진행하고, HRUM 을 부르기 직전에 멈춰 예산을 되돌려요 (과금 없음). 토큰 없이 · 쿠키 없이 보낸 요청이 거절되는지도 같이 봐요.
          </p>
          <button type="button" onClick={runRehearsal} disabled={busy || token.trim().length < 24 || !server?.configured} className="mt-3 min-h-12 w-full rounded-full text-[15px] font-medium text-[#6e2a40] shadow-[inset_0_0_0_1.5px_#c9a27a] disabled:opacity-40" data-rehearsal>
            {busy && !rehearsal ? "확인 중…" : "리허설 실행 (HRUM 호출 없음)"}
          </button>
          {rehearsal && (
            <div className="mt-3 space-y-3 text-[14px]" data-rehearsal-result>
              <p className="[word-break:keep-all]">
                서명 쿠키 발급: <b>{rehearsal.ticket?.issued ? "됨" : `안 됨 (${rehearsal.ticket?.error ?? rehearsal.ticket?.http ?? "—"})`}</b>
                {" · "}봇 확인 위젯: <b>{rehearsal.widget ? (rehearsal.widget.token ? "토큰 받음" : `실패 (${rehearsal.widget.error})`) : rehearsal.ticket?.siteKey === false ? "꺼져 있음" : "—"}</b>
              </p>
              {([
                ["normal", "① 정상 요청 — 모두 통과해야 정상", rehearsal.normal, (r: RehearsalRun) => r.allOk === true],
                ["noBot", "② Turnstile 토큰 없이 — 봇 확인에서 거절돼야 정상", rehearsal.noBot, (r: RehearsalRun) => r.stoppedAt === "botCheck"],
                ["noCookie", "③ 서명 쿠키 없이 — 화면 요청 확인에서 거절돼야 정상", rehearsal.noCookie, (r: RehearsalRun) => r.stoppedAt === "screen"],
              ] as const).map(([id, title, r, pass]) =>
                r ? (
                  <div key={id} className="rounded-xl bg-white/60 px-3.5 py-3 shadow-[0_0_0_1px_#e6cdbd]" data-run={id}>
                    <p className="font-semibold text-[#3a2229] [word-break:keep-all]">
                      {pass(r) ? "✅" : "❌"} {title}
                    </p>
                    <p className="mt-0.5 text-[13px] text-[#7b6266]">HTTP {r.http} · HRUM 호출 {r.hrumCalled === false ? "없음" : "?"}{r.error ? ` · ${r.error.code}` : ""}</p>
                    <ul className="mt-1.5 space-y-1">
                      {(r.steps ?? []).map((st) => (
                        <li key={st.id} className="text-[13px] leading-[1.5] break-all">
                          {st.ok ? "✓" : "✗"} {STEP_LABEL[st.id] ?? st.id} <span className="text-[#7b6266]">{detailText(st.detail)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null,
              )}
            </div>
          )}
        </Sheet>

        <Sheet className="mt-8 px-4 pt-7 pb-5">
          <h2 className="font-serif text-[17px] font-semibold text-[#4a1a2c]">1단계 · 1건 시험 계산</h2>
          <p className="mt-1 text-[14px] text-[#6b5459]">{cases[0].name}</p>
          <button
            type="button"
            onClick={runFirst}
            disabled={busy || !!results.c1 || token.trim().length < 24 || !server?.configured}
            className="mt-3 min-h-12 w-full rounded-full bg-[#4a1a2c] text-[15px] font-medium text-[#fff4e8] shadow-[0_0_0_1px_#d3ab7c] disabled:opacity-40"
          >
            {results.c1 ? "1건 계산 완료" : busy ? "계산 중…" : "1건만 계산하기"}
          </button>
          {token.trim().length > 0 && token.trim().length < 24 && <p className="mt-1.5 text-[13px] text-[#8a3b2e]">토큰은 24자 이상이에요.</p>}
          {first && <CaseView c={cases[0]} r={first} />}
        </Sheet>

        <Sheet className="mt-8 px-4 pt-7 pb-5">
          <h2 className="font-serif text-[17px] font-semibold text-[#4a1a2c]">2단계 · 나머지 3건</h2>
          <p className="mt-1 text-[14px] leading-[1.55] text-[#6b5459] [word-break:keep-all]">
            {gate ? "1단계가 기준과 모두 맞았어요. 나머지 3건을 한 번씩만 계산해요." : stopped ? `오류(${stopped})로 멈췄어요. 결과를 공유해 주세요.` : first ? "1단계 결과가 기준과 다르거나 확인할 점이 있어 잠겨 있어요. 결과를 먼저 공유해 주세요." : "1단계가 성공하면 열려요."}
          </p>
          <button type="button" onClick={runRest} disabled={!gate || busy || done === cases.length} className="mt-3 min-h-12 w-full rounded-full bg-[#4a1a2c] text-[15px] font-medium text-[#fff4e8] shadow-[0_0_0_1px_#d3ab7c] disabled:opacity-40">
            {done === cases.length ? "4건 모두 완료" : busy && gate ? "계산 중…" : "나머지 3건 계산하기"}
          </button>
          {cases.slice(1).map((c) => (results[c.id] ? <CaseView key={c.id} c={c} r={results[c.id]} /> : null))}
        </Sheet>

        <Sheet className="mt-8 px-4 pt-7 pb-5">
          <h2 className="font-serif text-[17px] font-semibold text-[#4a1a2c]">호출 · 크레딧</h2>
          <dl className="mt-2 space-y-1 text-[15px]" data-counts>
            <div className="flex justify-between"><dt>보낸 요청</dt><dd className="font-semibold tabular-nums">{counts.sent}건</dd></div>
            <div className="flex justify-between"><dt>HRUM 실제 호출</dt><dd className="font-semibold tabular-nums">{counts.upstream}건</dd></div>
            <div className="flex justify-between"><dt>추정 사용 크레딧</dt><dd className="font-semibold tabular-nums">₩{counts.krw}</dd></div>
          </dl>
          <p className="mt-2 text-[13px] leading-[1.55] text-[#7b6266] [word-break:keep-all]">공식 요금(성공 1건 ₩50) 기준 추정이에요. 실패 응답은 과금되지 않아요. 실제 차감액은 HRUM 콘솔의 사용량 화면에서 확인해 주세요.</p>
        </Sheet>

        <Sheet className="mt-8 px-4 pt-7 pb-5">
          <h2 className="font-serif text-[17px] font-semibold text-[#4a1a2c]">3단계 · 운영 전 추가 사례</h2>
          <p className="mt-1 text-[14px] leading-[1.55] text-[#6b5459] [word-break:keep-all]">
            {gate3 ? "절기 경계 · 자시 · 윤달 · 서머타임을 하나씩 확인해요. 사례마다 한 번만 계산해요 (오류 사례는 과금 없음)." : "1 · 2단계 4건이 모두 기준과 맞으면 열려요."}
          </p>
          <ul className="mt-3 space-y-3">
            {extra.map((c) => (
              <li key={c.id} className="rounded-xl bg-white/60 px-3.5 py-3 shadow-[0_0_0_1px_#e6cdbd]">
                <p className="text-[13px] font-semibold text-[#9a7647]">{c.topic}</p>
                <p className="text-[14.5px] text-[#3a2229] [word-break:keep-all]">{c.name}</p>
                <p className="mt-0.5 text-[13px] leading-[1.5] text-[#7b6266] [word-break:keep-all]">기준 근거 · {c.basis}</p>
                <button type="button" onClick={() => runOne(c)} disabled={!gate3 || busy || !!results[c.id]} className="mt-2 min-h-11 w-full rounded-full text-[14px] font-medium text-[#6e2a40] shadow-[inset_0_0_0_1.5px_#c9a27a] disabled:opacity-40" data-extra={c.id}>
                  {results[c.id] ? "계산 완료" : c.expectError ? "오류 응답 확인 (과금 없음)" : "이 사례 계산 (₩50)"}
                </button>
                {results[c.id] && <CaseView c={c} r={results[c.id]} />}
              </li>
            ))}
          </ul>
        </Sheet>

        {done > 0 && (
          <Sheet className="mt-8 px-4 pt-7 pb-5">
            <h2 className="font-serif text-[17px] font-semibold text-[#4a1a2c]">결과 공유</h2>
            <p className="mt-1 text-[13.5px] leading-[1.55] text-[#6b5459] [word-break:keep-all]">토큰과 키는 들어 있지 않아요. 가상의 시험 생년월일과 계산값만 있어요.</p>
            <button type="button" onClick={copy} className="mt-3 min-h-12 w-full rounded-full bg-[#4a1a2c] text-[15px] font-medium text-[#fff4e8] shadow-[0_0_0_1px_#d3ab7c]">
              결과 복사
            </button>
            {copied && <p role="status" className="mt-2 text-center text-[13.5px] text-[#6e2a40]">{copied}</p>}
            <textarea readOnly value={summary} aria-label="결과 요약" className="mt-3 h-48 w-full rounded-xl bg-white p-3 font-mono text-[12px] leading-[1.45] text-[#3a2229] shadow-[inset_0_0_0_1px_#e6cdbd]" data-summary />
          </Sheet>
        )}
      </div>
    </div>
  );
}

function CaseView({ c, r }: { c: Case; r: Result }) {
  const exp = (c.expect ?? {}) as Record<PillarKey, string | null>;
  const d = r.data;
  if (c.expectError)
    return (
      <div className="mt-3 rounded-xl bg-white/70 px-3.5 py-3 text-[14.5px] shadow-[0_0_0_1px_#e6cdbd]" data-case={c.id} data-result={r.allMatch ? "pass" : "check"}>
        <p className="font-semibold text-[#4a1a2c]">{r.allMatch ? "✓ 기대한 오류" : "△ 확인 필요"} · HTTP {r.http} · {d?.error?.code ?? "-"}</p>
        {r.note.map((n) => (
          <p key={n} className="mt-1 text-[13px] text-[#8a3b2e]">· {n}</p>
        ))}
      </div>
    );
  return (
    <div className="mt-4 rounded-xl bg-white/70 px-3.5 py-3 text-[14.5px] shadow-[0_0_0_1px_#e6cdbd]" data-case={c.id} data-result={r.allMatch && r.extraOk ? "pass" : r.ok ? "check" : "error"}>
      <p className="font-semibold text-[#4a1a2c]">
        {r.allMatch && r.extraOk ? "✓ 기준과 일치" : r.ok ? "△ 확인 필요" : "✗ 오류"} · HTTP {r.http || "연결 실패"} · {d?.status ?? "-"}
      </p>
      {r.ok && r.formatOk && (
        <table className="mt-2 w-full table-fixed border-collapse text-[14px]">
          <thead>
            <tr className="text-left text-[12.5px] text-[#7b6266]">
              <th className="w-[22%] py-1">기둥</th>
              <th>HRUM</th>
              <th>기준</th>
              <th className="w-[12%] text-center">일치</th>
            </tr>
          </thead>
          <tbody>
            {KEYS.map((k) => (
              <tr key={k} className="border-t border-[#e6cdbd]/70">
                <td className="py-1.5 font-semibold text-[#6e2a40]">{LABEL[k]}</td>
                <td className="font-serif">{r.pillars[k] ?? "없음"}</td>
                <td className="font-serif">{exp[k] ?? "없음"}</td>
                <td className="text-center font-semibold">{r.match[k] ? "○" : "×"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {d?.calculation?.pillars && (
        <p className="mt-2 text-[13px] leading-[1.55] break-all">
          십신 · 오행: {d.calculation.pillars.map((p) => `${LABEL[p.key as PillarKey] ?? p.key} ${p.stemSipsin ?? "-"}/${p.branchSipsin ?? "-"} (${p.ohaeng ?? "-"})`).join(" · ")}
        </p>
      )}
      {d?.calculation?.ohaengBalance && (
        <p className="mt-1 text-[13px]">
          오행 개수: {Object.entries(d.calculation.ohaengBalance).map(([k, v]) => `${k} ${v}`).join(" · ")} · 운결 계산과 {d.verification?.checks.ohaengBalanceMatches ? "일치" : "다름"}
        </p>
      )}
      {d?.verification && (
        <p className="mt-1 text-[13px]">
          천간 십신 표준 규칙과 {d.verification.checks.stemSipsinMatches === null || d.verification.checks.stemSipsinMatches === undefined ? "비교 값 없음" : d.verification.checks.stemSipsinMatches ? "일치" : "다름"} · 십신 이름 {d.verification.checks.sipsinNamesKnown === false ? "공식 10종 밖 있음" : "공식 10종"}
        </p>
      )}
      {d?.warnings && (d.warnings.provider.length > 0 || d.warnings.ungyeol.length > 0) && <p className="mt-1 text-[13px]">경고: {[...d.warnings.provider, ...d.warnings.ungyeol.map((w) => w.code)].join(", ")}</p>}
      {d?.billing && <p className="mt-1 text-[13px] text-[#7b6266]">크레딧: {d.billing.basis}</p>}
      {d?.error && (
        <p className="mt-1 text-[13.5px] text-[#8a3b2e]">
          오류 {d.error.code}
          {d.error.upstreamStatus ? ` (HRUM ${d.error.upstreamStatus}${d.error.upstreamCode ? ` ${d.error.upstreamCode}` : ""})` : ""} · {d.error.message}
        </p>
      )}
      {r.note.map((n) => (
        <p key={n} className="mt-1 text-[13px] text-[#8a3b2e]">· {n}</p>
      ))}
    </div>
  );
}
