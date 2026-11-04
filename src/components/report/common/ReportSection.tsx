import type { DataSlot, ReportSection as Sec } from "@/features/report/types";

/* 챕터 본문 한 덩어리 — 제목(버건디 · 금빛 마름모) · 16px 본문 · 목록 · 접는 '더 알아보기' */
export function ReportSection({ s }: { s: Sec }) {
  return (
    <section className="reveal" aria-labelledby={`sec-${s.id}`}>
      <h3 id={`sec-${s.id}`} className="flex items-center gap-2 font-serif text-[17px] font-semibold text-[#4a1a2c]">
        <span aria-hidden className="size-[7px] rotate-45 bg-[#b88a57]" />
        {s.title}
      </h3>
      <div className="mt-2 space-y-2.5 text-[16px] leading-[1.75] [word-break:keep-all]">
        {s.body.map((b) => (
          <p key={b}>{b}</p>
        ))}
        {s.list && (
          <ul className="space-y-1.5">
            {s.list.map((t) => (
              <li key={t} className="flex gap-2">
                <span aria-hidden className="mt-[0.72em] size-1.5 shrink-0 rounded-full bg-[#974d5e]" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        )}
        {s.more && (
          <details className="report-more group rounded-xl bg-white/55 shadow-[0_0_0_1px_#e6cdbd]">
            <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 px-3.5 text-[14px] font-medium text-[#6e2a40]">
              더 알아보기
              <svg viewBox="0 0 20 20" className="size-4 transition-transform group-open:rotate-180" fill="none" aria-hidden>
                <path d="m5 8 5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <div className="space-y-2 px-3.5 pb-3.5 text-[15px] leading-[1.7]">
              {s.more.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </div>
          </details>
        )}
      </div>
    </section>
  );
}

/** 데이터 상태 — 샘플 · 미연결 · 정보 필요(미확정) */
export function SlotBadge({ slot }: { slot: DataSlot }) {
  const tone = slot.status === "demo" ? "bg-[#974d5e]/10 text-[#6e2a40] shadow-[inset_0_0_0_1px_rgb(151_77_94/0.3)]" : "bg-[#efe3d0] text-[#6b4f2a] shadow-[inset_0_0_0_1px_rgb(155_118_71/0.4)]";
  return (
    <div role="note" className={`reveal rounded-xl px-3.5 py-3 text-[13.5px] leading-[1.6] [word-break:keep-all] ${tone}`} data-slot={slot.status}>
      <p className="flex items-center gap-1.5 font-semibold">
        <span aria-hidden className={`size-2 rounded-full ${slot.status === "demo" ? "bg-[#974d5e]" : "bg-[#9a7647]"}`} />
        {slot.status === "demo" ? "샘플" : slot.status === "unconnected" ? "미연결" : "정보 필요"} · {slot.label}
      </p>
      {slot.detail && <p className="mt-1">{slot.detail}</p>}
      {slot.needs && slot.needs.length > 0 && <p className="mt-1 text-[13px] opacity-85">필요한 것 · {slot.needs.join(" · ")}</p>}
    </div>
  );
}
