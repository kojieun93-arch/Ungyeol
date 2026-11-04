import type { ReactNode } from "react";
import { ELEMENTS, ELEMENT_ORDER, elementLabel } from "@/features/saju/elements";
import { isDemo, type ElementKey, type Glyph, type ReadingResult } from "@/features/saju/types";
import { C, InfoRow, ReadingFrame, RuledPill, TypeCapsule, type CardMode } from "./Frame";
import { Icon, type IconName } from "./icons";

/* ──────────────────────────────────────────────────────────
   결과 카드 6종 — 모두 ReadingResult 만 받아 그림
   mode: chat(채팅 안 요약) · full(전체 화면) · share(공유 이미지)
   ────────────────────────────────────────────────────────── */

export const READING_KINDS = ["manse", "elements", "innate", "current", "compare", "insight"] as const;
export type ReadingKind = (typeof READING_KINDS)[number];

export const READING_META: Record<ReadingKind, { title: string; short: string }> = {
  manse: { title: "사주 원국", short: "사주 원국" },
  elements: { title: "오행 분석", short: "오행 분석" },
  innate: { title: "타고난 나", short: "타고난 나" },
  current: { title: "지금의 나", short: "지금의 나" },
  compare: { title: "두 개의 나", short: "두 개의 나" },
  insight: { title: "종합 인사이트", short: "종합 인사이트" },
};

export type CardProps = {
  r: ReadingResult;
  mode: CardMode;
  titleId?: string;
  action?: ReactNode;
  /** 종합 인사이트의 운세 바로가기 */
  onTopic?: (id: ReadingResult["integratedInsight"]["topics"][number]["id"]) => void;
};

const sampleNote = (r: ReadingResult, text: string) => (isDemo(r) ? `※ ${text}` : undefined);

/** 데모 결과 안내 — 사주 관련 카드마다 */
const demoBasis = (r: ReadingResult) => (r.demo ? `${r.demo.label}(일간 乙木 고정 샘플) 기준이에요.` : "");

/** 직접 고른 MBTI 와 데모 사주가 함께 쓰인 카드 */
const mixedNote = (r: ReadingResult) =>
  r.mixesUserMbti ? "MBTI는 직접 고른 값 그대로, 사주 쪽은 데모 사주예요 (혼합된 데모 결과)." : "";

/** 각 기둥의 짧은 뜻 (전통적 읽기) */
const PILLAR_SHORT: Record<string, string> = { hour: "열매 · 앞날", day: "꽃 · 나", month: "줄기 · 사회", year: "뿌리 · 집안" };

/* ── ① 사주 원국 ── */

function GlyphCell({ g, dayMaster, unknown }: { g: Glyph | null; dayMaster?: boolean; unknown?: boolean }) {
  if (unknown || !g)
    return (
      <span className="block font-medium" style={{ fontSize: "max(0.82em, 10px)", color: C.soft }}>
        미확정
      </span>
    );
  return (
    <span className="relative inline-flex flex-col items-center leading-none">
      {dayMaster && (
        <span
          className="absolute rounded-[0.5em]"
          aria-hidden
          style={{ inset: "-0.32em -0.55em -0.3em", boxShadow: `0 0 0 1.5px #a8505b`, background: "rgb(242 223 224 / 0.6)" }}
        />
      )}
      <span className="relative font-serif" style={{ fontSize: "1.75em", color: "#33161f", lineHeight: 1.05 }}>
        {g.hanja}
      </span>
      <span className="relative" style={{ fontSize: "max(0.72em, 10px)", marginTop: "0.28em", color: C.soft }}>
        {g.hangul}
      </span>
    </span>
  );
}

export function ManseTable({ r }: { r: ReadingResult }) {
  const pillars = r.manseResult.pillars;
  const head = "font-serif font-medium text-[#fff4e8]";
  const cellBorder = `1px solid ${C.line}`;
  return (
    <table className="w-full border-separate border-spacing-0 overflow-hidden text-center" style={{ borderRadius: "0.85em", boxShadow: `0 0 0 1px ${C.line}`, background: "rgb(255 255 255 / 0.5)", tableLayout: "fixed" }}>
      <caption className="sr-only">사주 원국 — 시주 · 일주 · 월주 · 년주의 천간과 지지{isDemo(r) ? " (샘플)" : ""}</caption>
      <colgroup>
        <col style={{ width: "20%" }} />
        {pillars.map((p) => (
          <col key={p.key} style={{ width: "20%" }} />
        ))}
      </colgroup>
      <thead>
        <tr style={{ background: "linear-gradient(180deg, #7a3449, #5d2537)" }}>
          <th scope="col" className={head} style={{ height: "2.3em" }}>
            <span className="sr-only">구분</span>
          </th>
          {pillars.map((p) => (
            <th key={p.key} scope="col" className={head} style={{ fontSize: "1em", borderLeft: "1px solid rgb(255 255 255 / 0.15)" }}>
              {p.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {(["stem", "branch"] as const).map((row) => (
          <tr key={row}>
            <th scope="row" className="font-serif font-semibold" style={{ color: C.burgundy, background: "rgb(243 226 216 / 0.7)", borderTop: cellBorder, fontSize: "0.98em" }}>
              {row === "stem" ? "천간" : "지지"}
            </th>
            {pillars.map((p) => (
              <td key={p.key} style={{ borderTop: cellBorder, borderLeft: cellBorder, height: "3.6em" }} aria-label={p[row] ? `${p.label} ${row === "stem" ? "천간" : "지지"} ${p[row]!.hanja} ${p[row]!.hangul}${p.key === "day" && row === "stem" ? " (일간)" : ""}` : `${p.label} 미확정`}>
                <GlyphCell g={p[row]} dayMaster={p.key === "day" && row === "stem"} unknown={!p[row]} />
              </td>
            ))}
          </tr>
        ))}
        <tr>
          <th scope="row" className="font-serif font-semibold" style={{ color: C.burgundy, background: "rgb(243 226 216 / 0.7)", borderTop: cellBorder, fontSize: "0.98em", height: "2.5em" }}>
            오행
          </th>
          {pillars.map((p) => (
            <td key={p.key} style={{ borderTop: cellBorder, borderLeft: cellBorder, fontSize: "0.9em" }}>
              {p.stem && p.branch ? (
                <span className="font-semibold">
                  <span style={{ color: ELEMENTS[p.stem.element].color }}>{ELEMENTS[p.stem.element].hangul}</span>
                  <span style={{ color: C.soft }}>·</span>
                  <span style={{ color: ELEMENTS[p.branch.element].color }}>{ELEMENTS[p.branch.element].hangul}</span>
                </span>
              ) : (
                <span style={{ color: C.soft }}>–</span>
              )}
            </td>
          ))}
        </tr>
        {r.liveExtras && (
          // 실제 계산일 때만: 기둥별 십신 (천간/지지, HRUM 값) — 일간 자리는 '일간'
          <tr data-row="sipsin">
            <th scope="row" className="font-serif font-semibold" style={{ color: C.burgundy, background: "rgb(243 226 216 / 0.7)", borderTop: cellBorder, fontSize: "0.98em", height: "2.5em" }}>
              십신
            </th>
            {pillars.map((p) => {
              const tg = r.liveExtras!.tenGods.find((t) => t.key === p.key);
              return (
                <td key={p.key} style={{ borderTop: cellBorder, borderLeft: cellBorder, fontSize: "max(0.78em, 10px)", lineHeight: 1.3, color: C.ink, wordBreak: "keep-all" }}>
                  {p.stem ? (
                    <>
                      <span className="block">{p.key === "day" ? "일간" : (tg?.stem ?? "–")}</span>
                      <span className="block" style={{ color: C.soft }}>{tg?.branch ?? "–"}</span>
                    </>
                  ) : (
                    <span style={{ color: C.soft }}>–</span>
                  )}
                </td>
              );
            })}
          </tr>
        )}
        <tr>
          <th scope="row" className="font-serif font-semibold" style={{ color: C.burgundy, background: "rgb(243 226 216 / 0.7)", borderTop: cellBorder, fontSize: "0.98em", height: "2.6em" }}>
            의미
          </th>
          {pillars.map((p) => (
            <td key={p.key} style={{ borderTop: cellBorder, borderLeft: cellBorder, fontSize: "max(0.78em, 10px)", lineHeight: 1.3, color: C.ink, wordBreak: "keep-all" }}>
              {PILLAR_SHORT[p.key]}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

export function ManseCard({ r, mode, titleId, action }: CardProps) {
  const p = r.sajuPersonality;
  return (
    <ReadingFrame
      mode={mode}
      isSample={isDemo(r)}
      pill={isDemo(r) ? "샘플 결과" : "만세력"}
      title="사주 원국"
      titleId={titleId}
      action={action}
      footnote={
        isDemo(r)
          ? `※ 본 카드는 화면 구성을 보여드리기 위한 샘플 결과로, 입력하신 생년월일로 계산한 결과가 아닙니다. ${demoBasis(r)}${r.manseResult.hourKnown ? "" : " 태어난 시간을 모른다고 하셔서 시주는 미확정으로 두었어요."}`
          : `※ 실제 만세력 계산 · ${r.liveExtras?.basis[0] ?? "입력하신 생년월일로 계산한 원국이에요."} ${r.liveExtras?.basis[1] ?? ""} 십신은 HRUM 값이에요.${r.manseResult.hourKnown ? "" : " 태어난 시간을 몰라 시주는 비워 두었어요."}${r.liveExtras?.warnings.length ? ` 읽을 때 참고: ${r.liveExtras.warnings.filter((w) => !w.startsWith("출생 시각을 몰라 시주는")).join(" ")}` : ""}`
      }
    >
      {/* 공유 이미지에는 만세력 표를 넣지 않음 — 생년월일을 짐작할 수 있는 정보 */}
      {mode !== "share" && <ManseTable r={r} />}
      <RuledPill className={mode === "share" ? "" : "mt-[1.2em]"}>
        일간 · {p.title.split(" ")[0]} <span className="text-[0.85em]">{p.title.split(" ")[1]}</span>
      </RuledPill>
      <p className="mx-auto mt-[0.9em] text-center font-serif" style={{ fontSize: "1.05em", lineHeight: 1.6, color: C.title, maxWidth: "21em", wordBreak: "keep-all" }}>
        {p.summary}
      </p>
    </ReadingFrame>
  );
}

/* ── ② 오행 분석 ── */

const EL_ICON: Record<ElementKey, IconName> = { wood: "leaf", fire: "flame", earth: "mountain", metal: "gem", water: "drop" };

/** 오각형 그래프 — 목(위) · 화(오른쪽 위) · 토(오른쪽 아래) · 금(왼쪽 아래) · 수(왼쪽 위) */
export function ElementRadar({ r }: { r: ReadingResult }) {
  const ratios = r.fiveElements.ratios;
  const max = Math.max(40, ...ratios.map((x) => x.percent));
  const cx = 100;
  const cy = 98;
  const R = 62;
  const pt = (i: number, k: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return [cx + Math.cos(a) * R * k, cy + Math.sin(a) * R * k] as const;
  };
  const ring = (k: number) => ELEMENT_ORDER.map((_, i) => pt(i, k).join(",")).join(" ");
  const data = ELEMENT_ORDER.map((key, i) => pt(i, Math.max(0.04, (ratios.find((x) => x.key === key)?.percent ?? 0) / max)));
  const label = (i: number) => {
    const [x, y] = pt(i, 1.42);
    return { x, y };
  };
  return (
    <figure className="relative mx-auto" style={{ width: "100%", maxWidth: "22em" }}>
      <svg viewBox="0 0 200 200" className="block w-full" role="img" aria-label={`오행 분포 그래프: ${ELEMENT_ORDER.map((k) => `${ELEMENTS[k].hangul} ${ratios.find((x) => x.key === k)?.percent ?? 0}퍼센트`).join(", ")}`}>
        {[1, 0.66, 0.33].map((k) => (
          <polygon key={k} points={ring(k)} fill={k === 1 ? "rgb(255 255 255 / 0.55)" : "none"} stroke="#e6c4bd" strokeWidth="0.8" />
        ))}
        {ELEMENT_ORDER.map((_, i) => {
          const [x, y] = pt(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#ecd2cb" strokeWidth="0.7" />;
        })}
        <polygon points={data.map((d) => d.join(",")).join(" ")} fill="rgb(201 111 129 / 0.32)" stroke="#b4566c" strokeWidth="1.3" strokeLinejoin="round" />
        {data.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.4" fill="#b4566c" />
        ))}
      </svg>
      {ELEMENT_ORDER.map((key, i) => {
        const { x, y } = label(i);
        const pct = ratios.find((q) => q.key === key)?.percent ?? 0;
        const count = r.fiveElements.counts.find((q) => q.key === key)?.count ?? 0;
        return (
          <div
            key={key}
            aria-hidden
            className="absolute flex flex-col items-center leading-[1.15]"
            style={{ left: `${(x / 200) * 100}%`, top: `${(y / 200) * 100}%`, transform: "translate(-50%, -50%)" }}
          >
            <span className="font-serif font-semibold whitespace-nowrap" style={{ fontSize: "0.98em", color: C.title }}>
              {ELEMENTS[key].hangul}({ELEMENTS[key].hanja})
            </span>
            <span className="font-semibold tabular-nums" style={{ fontSize: "0.92em", color: C.title }}>
              {pct}%
            </span>
            <span className="flex items-center gap-[0.2em]" style={{ fontSize: "max(0.7em, 10px)", color: C.soft }}>
              <Icon name={EL_ICON[key]} style={{ width: "1.5em", height: "1.5em" }} />
              {count}글자
            </span>
          </div>
        );
      })}
    </figure>
  );
}

function StrongWeakBox({ icon, label, keys, note }: { icon: IconName; label: string; keys: ElementKey[]; note: string }) {
  return (
    <div className="flex flex-1 flex-col items-center text-center" style={{ padding: "0.8em 0.6em", borderRadius: "0.9em", background: "rgb(255 255 255 / 0.55)", boxShadow: `0 0 0 1px ${C.line}` }}>
      <span className="flex items-center gap-[0.3em] font-serif font-semibold" style={{ color: C.burgundy, fontSize: "0.95em" }}>
        <Icon name={icon} style={{ width: "1.5em", height: "1.5em" }} />
        {label}
      </span>
      <span className="mt-[0.15em] font-serif font-semibold" style={{ fontSize: keys.length > 1 ? "1.05em" : "1.3em", color: C.title, wordBreak: "keep-all" }}>
        {keys.map(elementLabel).join(" · ")}
      </span>
      <span className="mt-[0.35em]" style={{ fontSize: "max(0.82em, 10.5px)", lineHeight: 1.5, color: C.ink, wordBreak: "keep-all" }}>
        {note}
      </span>
    </div>
  );
}

export function ElementsCard({ r, mode, titleId, action }: CardProps) {
  const e = r.fiveElements;
  const strongNote = ELEMENTS[e.strongest[0]].tendency.replaceAll(" · ", ", ") + "의 기운이 두드러져요.";
  const weakNote = e.weakest.length > 1 ? "이 기운들은 상대적으로 적게 나타나요." : `${ELEMENTS[e.weakest[0]].tendency.replaceAll(" · ", ", ")}의 힘을 조금 더 채워 보세요.`;
  return (
    <ReadingFrame
      mode={mode}
      isSample={isDemo(r)}
      pill={isDemo(r) ? "샘플 분석" : "오행 분석"}
      title="오행 분석"
      titleId={titleId}
      action={action}
      footnote={
        <>
          {isDemo(r) ? `※ 샘플 데이터로 분석된 예시입니다. ${demoBasis(r)}` : `※ 실제 원국 ${r.fiveElements.basis}글자의 오행을 같은 무게로 센 개수예요.`}
          <span className="block">비율 기준 · {e.method}</span>
          {mode !== "chat" && <span className="block">{e.limits.join(" ")}</span>}
        </>
      }
    >
      <div style={{ padding: "0.6em 1.6em 0.9em" }}>
        <ElementRadar r={r} />
      </div>
      <div className="flex gap-[0.6em]">
        <StrongWeakBox icon="crown" label="가장 강한 기운" keys={e.strongest} note={strongNote} />
        <StrongWeakBox icon="sprout" label={e.weakest.length > 1 ? "상대적으로 적은 기운" : "가장 약한 기운"} keys={e.weakest} note={weakNote} />
      </div>
      {/* 오행별 전통적 의미 */}
      <ul className="mt-[0.7em] grid grid-cols-5 gap-[0.3em]" aria-label="오행별 전통적 의미">
        {ELEMENT_ORDER.map((k) => (
          <li key={k} className="flex flex-col items-center rounded-[0.7em] text-center" style={{ padding: "0.45em 0.15em", background: ELEMENTS[k].tint }}>
            <span className="font-serif font-semibold" style={{ color: ELEMENTS[k].color, fontSize: "1.05em" }}>
              {ELEMENTS[k].hanja}
            </span>
            <span style={{ fontSize: "max(0.74em, 10px)", lineHeight: 1.35, color: C.ink, wordBreak: "keep-all" }}>
              {(mode === "chat" ? ELEMENTS[k].tendency.split(" · ").slice(0, 1) : ELEMENTS[k].tendency.split(" · ")).join(" ")}
            </span>
          </li>
        ))}
      </ul>
    </ReadingFrame>
  );
}

/* ── ③ 타고난 나 ── */

export function InnateCard({ r, mode, titleId, action }: CardProps) {
  const p = r.sajuPersonality;
  const ref = r.sajuMBTIReference;
  return (
    <ReadingFrame
      mode={mode}
      isSample={isDemo(r)}
      pill={isDemo(r) ? "샘플 분석" : "사주 분석"}
      title="타고난 나"
      titleNote="(사주 분석)"
      titleId={titleId}
      action={action}
      footnote={
        <>
          {isDemo(r) ? sampleNote(r, `샘플 분석 결과입니다. ${demoBasis(r)}`) : `※ 일간(일주 천간 ${p.dayMaster.hanja}${p.dayMaster.hangul})은 실제 만세력 계산값이고, 기질 해석은 운결의 일간 10종 해설표에 따른 경향이에요.`} 참고 MBTI는 운결의 비유 분류(규칙 확정 전 시안)일 뿐, 사주로 실제 MBTI를 산출할 수는 없어요.
        </>
      }
    >
      <div className="flex flex-col gap-[0.55em]">
        <InfoRow icon={<Icon name="tree" style={{ width: "1.9em", height: "1.9em" }} />} label="기본 기질">
          {p.core}
        </InfoRow>
        <InfoRow icon={<Icon name="star" style={{ width: "1.9em", height: "1.9em" }} />} label="강점">
          {p.strengths.join(" · ")}
        </InfoRow>
        <InfoRow icon={<Icon name="sprout" style={{ width: "1.9em", height: "1.9em" }} />} label="보완점">
          {p.cautions[0]}
        </InfoRow>
      </div>
      <RuledPill className="mt-[1.2em]">사주 기반 참고 MBTI</RuledPill>
      <div className="mt-[0.8em]">
        <TypeCapsule type={ref.type} />
      </div>
      <p className="mx-auto mt-[0.5em] w-max max-w-full rounded-full text-center" style={{ padding: "0.3em 0.9em", fontSize: "max(0.78em, 10px)", color: C.burgundy, boxShadow: `inset 0 0 0 1px ${C.gold}` }}>
        운결 자체 분류{ref.ruleStatus === "draft" ? " · 규칙 확정 전 시안" : ""}
      </p>
      <p className="mx-auto mt-[0.6em] text-center font-serif" style={{ fontSize: "1em", lineHeight: 1.55, color: C.title, maxWidth: "20em", wordBreak: "keep-all" }}>
        {ref.reason}으로 비유해 볼 수 있어요.
      </p>
      <p className="mx-auto mt-[0.4em] text-center" style={{ fontSize: "max(0.8em, 10px)", lineHeight: 1.5, color: C.soft, maxWidth: "22em", wordBreak: "keep-all" }}>
        분류 근거 · {(mode === "chat" ? ref.basis.slice(0, 2) : ref.basis).join(" · ")}
      </p>
    </ReadingFrame>
  );
}

/* ── ④ 지금의 나 ── */

export function CurrentCard({ r, mode, titleId, action }: CardProps) {
  const c = r.selfReportedMBTI;
  return (
    <ReadingFrame
      mode={mode}
      isSample={isDemo(r)}
      pill={isDemo(r) ? "샘플 분석" : "MBTI"}
      title="지금의 나"
      titleNote={c.type ? "(직접 고른 MBTI)" : "(MBTI)"}
      titleId={titleId}
      action={action}
      footnote={
        c.type
          ? `※ 사용자가 직접 선택한 MBTI를 바탕으로 한 결과예요. MBTI 검사나 진단이 아니에요. ${mixedNote(r)}`
          : "※ MBTI를 고르지 않아, 네 가지 선호를 스스로 살펴보는 질문으로 대신했어요."
      }
    >
      {c.type ? (
        <>
          <TypeCapsule type={c.type} />
          {/* 유형별 선호 성향 — 글자마다 */}
          <ul className="mt-[0.8em] grid grid-cols-4 gap-[0.35em]" aria-label="선호 성향">
            {c.axes.map((a) => (
              <li key={a.axis} className="flex flex-col items-center rounded-[0.7em] text-center" style={{ padding: "0.4em 0.2em", background: "rgb(255 255 255 / 0.55)", boxShadow: `0 0 0 1px ${C.line}` }}>
                <span className="font-serif font-semibold" style={{ color: C.burgundy, fontSize: "1.1em" }}>
                  {a.letter}
                </span>
                <span style={{ fontSize: "max(0.74em, 10px)", color: C.soft }}>{a.title}</span>
              </li>
            ))}
          </ul>
          <div className="mt-[0.7em] flex flex-col gap-[0.55em]">
            <InfoRow icon={<Icon name="bulb" style={{ width: "1.9em", height: "1.9em" }} />} label="핵심 성향">
              {c.summary}
            </InfoRow>
            <InfoRow icon={<Icon name="crown" style={{ width: "1.9em", height: "1.9em" }} />} label="강점">
              {c.strengths.join(" ")}
            </InfoRow>
            <InfoRow icon={<Icon name="sprout" style={{ width: "1.9em", height: "1.9em" }} />} label="주의할 점">
              {c.growth.join(" ")}
            </InfoRow>
          </div>
        </>
      ) : (
        <>
          <TypeCapsule type="? ? ? ?" />
          <p className="mx-auto mt-[0.8em] text-center font-serif" style={{ fontSize: "1.02em", lineHeight: 1.55, color: C.title, maxWidth: "20em", wordBreak: "keep-all" }}>
            아직 MBTI를 고르지 않았어요. 아래 네 가지 중 지금의 나에게 가까운 쪽을 떠올려 보세요.
          </p>
          <ul className="mt-[0.8em] flex flex-col gap-[0.45em]">
            {[
              ["에너지", "사람 속에서 충전 (E)", "혼자서 충전 (I)"],
              ["인식", "구체적인 사실 (S)", "가능성과 의미 (N)"],
              ["판단", "논리와 원칙 (T)", "사람과 가치 (F)"],
              ["생활", "계획하고 매듭 (J)", "열어 두고 맞춤 (P)"],
            ].map(([t, a, b]) => (
              <li key={t} className="flex items-center gap-[0.5em]" style={{ padding: "0.55em 0.75em", borderRadius: "0.8em", background: "rgb(255 255 255 / 0.55)", boxShadow: `0 0 0 1px ${C.line}`, fontSize: "0.9em" }}>
                <span className="w-[3.4em] shrink-0 font-serif font-semibold" style={{ color: C.burgundy }}>
                  {t}
                </span>
                <span className="flex-1 text-center">{a}</span>
                <span aria-hidden style={{ color: C.soft }}>
                  ↔
                </span>
                <span className="flex-1 text-center">{b}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </ReadingFrame>
  );
}

/* ── ⑤ 두 개의 나 ── */

function TypeColumn({ label, type }: { label: string; type: string | null }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden" style={{ borderRadius: "0.9em", boxShadow: `0 0 0 1px ${C.gold}` }}>
      <span className="text-center font-serif leading-none font-medium whitespace-nowrap text-[#fff4e8]" style={{ padding: "0.6em 0.3em", fontSize: "0.92em", background: "linear-gradient(180deg, #7a3449, #5d2537)" }}>
        {label}
      </span>
      <span className="grid place-items-center" style={{ padding: "0.6em 0.45em", background: "linear-gradient(180deg, #8a3d54, #6a2a40)" }}>
        <span
          className="grid w-full place-items-center rounded-full font-serif font-semibold tracking-[0.04em]"
          style={{ height: "1.75em", fontSize: "1.6em", color: C.title, background: "linear-gradient(180deg, #fffaf5, #f7e6dc)", boxShadow: "inset 0 0 0 1px #e7c3bb" }}
        >
          {type ?? "?"}
        </span>
      </span>
    </div>
  );
}

function ListBlock({ icon, label, sub, items, mark = "✓" }: { icon: IconName; label: string; sub?: string; items: string[]; mark?: string }) {
  return (
    <div className="flex items-center text-left" style={{ gap: "0.7em", padding: "0.7em 0.8em", borderRadius: "0.9em", background: "rgb(255 255 255 / 0.55)", boxShadow: `0 0 0 1px ${C.line}` }}>
      <span className="flex w-[5.4em] shrink-0 items-center gap-[0.35em]">
        <Icon name={icon} style={{ width: "1.6em", height: "1.6em", flexShrink: 0 }} />
        <span className="font-serif leading-[1.2] font-semibold" style={{ color: C.burgundy, fontSize: "0.95em", wordBreak: "keep-all" }}>
          {label}
          {sub && (
            <span className="block font-medium" style={{ color: C.soft, fontSize: "max(0.72em, 9.5px)" }}>
              {sub}
            </span>
          )}
        </span>
      </span>
      <ul className="min-w-0 flex-1" style={{ fontSize: "0.88em", lineHeight: 1.5 }}>
        {items.map((t) => (
          <li key={t} className="flex gap-[0.4em]" style={{ wordBreak: "keep-all" }}>
            <span aria-hidden className="shrink-0 font-semibold" style={{ color: C.burgundy }}>
              {mark}
            </span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CompareCard({ r, mode, titleId, action }: CardProps) {
  const c = r.comparison;
  const n = mode === "full" ? 3 : 2;
  return (
    <ReadingFrame
      mode={mode}
      isSample={isDemo(r)}
      pill={isDemo(r) ? "샘플 비교 분석" : "비교 분석"}
      title="두 개의 나"
      titleId={titleId}
      action={action}
      footnote={`${isDemo(r) ? `※ 샘플 분석 결과입니다. ${mixedNote(r)} ` : "※ "}참고 MBTI는 운결 자체 비유(규칙 확정 전 시안)라, 어느 쪽이 맞고 틀린지를 가리지 않아요.`}
    >
      <p className="-mt-[0.6em] mb-[0.8em] text-center font-serif font-semibold" style={{ color: C.title, fontSize: "1.02em" }}>
        사주 기반 참고 MBTI vs {c.selected ? "직접 고른 MBTI" : "지금의 나"}
      </p>
      <div className="relative flex items-stretch gap-[1.4em]">
        <TypeColumn label="사주 기반 참고" type={c.reference} />
        <span
          className="absolute top-1/2 left-1/2 z-10 grid size-[2.2em] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full font-serif font-semibold text-[#fff4e8]"
          style={{ background: "#4a1a2c", boxShadow: `0 0 0 2px #fbf2e8, 0 0 0 3px ${C.gold}`, fontSize: "0.8em" }}
          aria-label={c.relation === "same" ? "같은 유형" : "비교"}
        >
          {c.relation === "same" ? "=" : "VS"}
        </span>
        <TypeColumn label={c.selected ? "직접 고른 MBTI" : "MBTI 미선택"} type={c.selected} />
      </div>
      <div className="mt-[0.9em] flex flex-col gap-[0.5em]">
        {c.relation === "unknown" ? (
          <ListBlock icon="chat" label="생각해볼 질문" items={c.questions.slice(0, n)} mark="·" />
        ) : (
          <>
            <ListBlock icon="rings" label="닮은 점" sub="(공통점)" items={c.common.slice(0, n)} />
            <ListBlock icon="split" label="다른 점" items={c.differences.slice(0, n)} />
            {mode === "full" && <ListBlock icon="chat" label="생각해볼 질문" items={c.questions.slice(0, 2)} mark="·" />}
          </>
        )}
        <div className="flex items-center text-left" style={{ gap: "0.7em", padding: "0.7em 0.8em", borderRadius: "0.9em", background: "rgb(255 255 255 / 0.55)", boxShadow: `0 0 0 1px ${C.line}` }}>
          <span className="flex w-[5.4em] shrink-0 items-center gap-[0.35em]">
            <Icon name="chat" style={{ width: "1.6em", height: "1.6em", flexShrink: 0 }} />
            <span className="font-serif leading-[1.2] font-semibold whitespace-nowrap" style={{ color: C.burgundy, fontSize: "0.95em" }}>
              한마디
            </span>
          </span>
          <p className="min-w-0 flex-1" style={{ fontSize: "0.88em", lineHeight: 1.55, wordBreak: "keep-all" }}>
            {c.insight}
          </p>
        </div>
      </div>
    </ReadingFrame>
  );
}

/* ── ⑥ 종합 인사이트 ── */

export function InsightCard({ r, mode, titleId, action, onTopic }: CardProps) {
  const s = r.integratedInsight;
  return (
    <ReadingFrame
      mode={mode}
      isSample={isDemo(r)}
      pill="종합 인사이트"
      title={<span style={{ fontSize: "0.78em" }}>{isDemo(r) ? "샘플 사주로 본 키워드" : "지금, 당신에게 중요한 키워드"}</span>}
      titleId={titleId}
      action={action}
      footnote={isDemo(r) ? sampleNote(r, `샘플 분석 결과입니다. ${demoBasis(r)} ${mixedNote(r)} 미래를 정해 주는 풀이가 아니에요.`) : "※ 실제 원국을 바탕으로 한 운결의 해설이에요. 대운 · 세운은 아직 연결 전이고, 미래를 정해 주는 풀이가 아니에요."}
    >
      <ul className="flex justify-center gap-[0.7em]" aria-label="핵심 키워드">
        {s.keywords.map((k) => (
          <li
            key={k.word}
            className="grid place-items-center rounded-full"
            style={{ width: "5.6em", height: "5.6em", background: "radial-gradient(circle at 50% 35%, #fffaf4, #f6e4d8)", boxShadow: `0 0 0 1px ${C.gold}, 0 0 0 0.3em #fbf2e8, 0 0 0 calc(0.3em + 1px) rgb(211 171 124 / 0.45)` }}
          >
            <span className="flex flex-col items-center">
              <Icon name={k.icon} style={{ width: "2em", height: "2em" }} />
              <span className="mt-[0.15em] font-serif font-semibold" style={{ fontSize: "1.15em", color: C.title }}>
                {k.word}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <blockquote className="mt-[1.1em] text-center font-serif" style={{ padding: "0.9em 1em", borderRadius: "0.9em", background: "rgb(255 255 255 / 0.55)", boxShadow: `0 0 0 1px ${C.line}`, color: C.title, lineHeight: 1.65, wordBreak: "keep-all" }}>
        <span aria-hidden className="block leading-none" style={{ color: C.gold, fontSize: "1.6em" }}>
          “
        </span>
        <span className="block" style={{ fontSize: "0.98em" }}>
          {s.summary}
        </span>
        {mode !== "chat" && (
          <span className="mt-[0.4em] block" style={{ fontSize: "0.95em" }}>
            {s.advice}
          </span>
        )}
        <span aria-hidden className="mt-[0.2em] block leading-none" style={{ color: C.gold, fontSize: "1.6em" }}>
          ”
        </span>
      </blockquote>
      {/* 강점 · 자기탐색 포인트 */}
      <div className="mt-[0.7em] flex flex-col gap-[0.5em]">
        <InfoRow icon={<Icon name="star" style={{ width: "1.8em", height: "1.8em" }} />} label="강점">
          {s.strength}
        </InfoRow>
        <InfoRow icon={<Icon name="chat" style={{ width: "1.8em", height: "1.8em" }} />} label="자기탐색">
          {s.explore}
        </InfoRow>
      </div>
      {mode !== "share" && onTopic && (
        <div className="mt-[0.9em]">
          <p className="text-center font-serif font-semibold" style={{ fontSize: "0.9em", color: C.burgundy }}>
            운세별 상세 분석 (샘플)
          </p>
          <div className="mt-[0.45em] flex flex-wrap justify-center gap-[0.4em]">
            {s.topics.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation();
                  onTopic(t.id);
                }}
                className="inline-flex min-h-11 items-center rounded-full font-serif font-medium text-[#fff4e8] transition-[filter] active:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6e2a40]"
                style={{ padding: "0 1.05em", fontSize: "0.92em", background: "linear-gradient(180deg, #81394f, #5a2336)", boxShadow: `0 0 0 1px ${C.gold}` }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </ReadingFrame>
  );
}

export const CARD_COMPONENT: Record<ReadingKind, (p: CardProps) => ReactNode> = {
  manse: ManseCard,
  elements: ElementsCard,
  innate: InnateCard,
  current: CurrentCard,
  compare: CompareCard,
  insight: InsightCard,
};
