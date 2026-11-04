import { ChapterHead } from "./ReportChapter";
import { Sheet } from "./Sheet";

/* ──────────────────────────────────────────────────────────
   열람 제한 — 잠긴 챕터 · 준비 중 챕터 · 프리미엄 안내
   실제 결제 없음: 구매 버튼은 항상 비활성. '데모 전체 보기'는 화면 확인용 (결제 아님)
   ────────────────────────────────────────────────────────── */

type GateChapter = { id: string; title: string; question: string; access: "free" | "premium"; includes: string[] };

export function ReportAccessGate({ c, state, onDemo }: { c: GateChapter; state: "locked" | "planned"; onDemo?: (() => void) | null }) {
  const planned = state === "planned";
  return (
    <Sheet className="px-4 pt-8 pb-6">
      <ChapterHead c={c} locked={!planned} />
      <div className="reveal mt-5 rounded-xl bg-white/60 px-4 py-3.5 shadow-[0_0_0_1px_#e6cdbd]" data-gate={state}>
        <p className="text-[12.5px] font-semibold text-[#6e2a40]">이 챕터에 담기는 내용</p>
        <ul className="mt-1.5 space-y-1 text-[15px] leading-[1.6]">
          {c.includes.map((t) => (
            <li key={t} className="flex gap-2">
              <span aria-hidden className="mt-[0.65em] size-1.5 shrink-0 rotate-45 bg-[#b88a57]" />
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t border-[#e6cdbd] pt-2.5 text-[13px] leading-[1.55] text-[#7b6266] [word-break:keep-all]">
          {planned
            ? "본문 준비 중 · 지금은 챕터 구조(제목 · 핵심 질문 · 담기는 내용)만 공개해요."
            : "지금 읽을 수 있는 범위 · 챕터 제목 · 핵심 질문 · 담기는 내용. 본문은 프리미엄 리포트에 들어가요."}
        </p>
      </div>
      {!planned && (
        <div className="reveal mt-4 flex flex-col gap-2">
          <button type="button" disabled aria-disabled="true" className="min-h-12 rounded-full bg-[#4a1a2c]/40 text-[15px] font-medium text-white/85">
            프리미엄 리포트 · 결제 준비 중
          </button>
          {onDemo && (
            <button type="button" onClick={onDemo} className="min-h-11 rounded-full text-[13.5px] text-[#6e2a40] underline decoration-[#c9a27a] underline-offset-4">
              데모로 전체 챕터 미리 보기 (결제 아님)
            </button>
          )}
        </div>
      )}
    </Sheet>
  );
}

/** 가격 · 제공 내용 · 환불 · 상태 — 가격은 미정, 결제 미연결, 테스트 상태 */
export function ReportTerms({
  title = "프리미엄 리포트 안내",
  rows,
  demo,
  id = "terms-title",
}: {
  title?: string;
  rows: [string, string][];
  /** 데모 전체 보기 켜기 · 끄기 (없으면 버튼 없음) */
  demo?: { on: boolean; toggle: (on: boolean) => void } | null;
  id?: string;
}) {
  return (
    <section aria-labelledby={id} className="reveal">
      <Sheet className="px-4 pt-7 pb-5">
        <h2 id={id} className="text-center font-serif text-[18px] font-semibold text-[#4a1a2c]">
          {title}
        </h2>
        <dl className="mt-3 space-y-2 text-[14.5px] leading-[1.6] [word-break:keep-all]">
          {rows.map(([k, v]) => (
            <div key={k} className="flex gap-3 border-b border-[#e6cdbd]/70 pb-2 last:border-b-0">
              <dt className="w-[6.5em] shrink-0 font-semibold text-[#6e2a40]">{k}</dt>
              <dd className="min-w-0">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex flex-col gap-2">
          <button type="button" disabled aria-disabled="true" className="min-h-12 rounded-full bg-[#4a1a2c]/40 text-[15px] font-medium text-white/85">
            구매하기 · 결제 준비 중
          </button>
          <button type="button" disabled aria-disabled="true" className="min-h-11 rounded-full text-[14px] text-[#7b6266] shadow-[inset_0_0_0_1px_#e6cdbd]">
            전체 리포트 PDF 저장 · 준비 중
          </button>
          {demo && (
            <button type="button" onClick={() => demo.toggle(!demo.on)} className="min-h-11 text-[13.5px] text-[#6e2a40] underline decoration-[#c9a27a] underline-offset-4">
              {demo.on ? "데모 체험 끄기 (공개 챕터만 보기)" : "데모로 전체 챕터 미리 보기 (결제 아님)"}
            </button>
          )}
        </div>
        {demo && <p className="mt-2 text-center text-[12px] leading-[1.5] text-[#7b6266] [word-break:keep-all]">데모 체험은 화면 확인용이에요. 구매나 유료 권한이 아니며 새로고침하면 꺼져요.</p>}
      </Sheet>
    </section>
  );
}
