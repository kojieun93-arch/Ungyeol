import type { ReportInsight } from "@/features/report/types";

const ADVISOR = "/images/ungyeol-advisor.webp";

/** 운결의 한마디 — 확정된 상담자 프로필(작게) + 말풍선 */
export function AdvisorNote({ lines }: { lines: string[] }) {
  if (!lines.length) return null;
  return (
    <div className="reveal flex gap-2.5" role="note" aria-label="운결의 한마디">
      {/* eslint-disable-next-line @next/next/no-img-element -- 확정된 상담자 프로필 (작게) */}
      <img src={ADVISOR} alt="" aria-hidden width={36} height={36} className="size-9 shrink-0 rounded-full object-cover shadow-[0_0_0_1.5px_#c9838f]" />
      <div className="min-w-0">
        <p className="mb-1 text-[12px] font-semibold text-[#6e2a40]">운결의 한마디</p>
        <div className="space-y-1.5">
          {lines.map((l) => (
            <p key={l} className="w-fit max-w-full rounded-[1.1em] rounded-tl-[0.35em] bg-white px-3.5 py-2 text-[15px] leading-[1.55] shadow-[0_0_0_1px_#e6cdbd] [word-break:keep-all]">
              {l}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

/** 챕터 끝 정리 — 운결의 한마디 · 작은 실천 · 나에게 묻는 질문 */
export function ReportInsightCard({ insight }: { insight: ReportInsight }) {
  return (
    <>
      <AdvisorNote lines={insight.advisor} />
      {(insight.practice || insight.questions.length > 0) && (
        <div className="reveal rounded-xl bg-[#f3e2d8]/70 px-4 py-3.5">
          {insight.practice && (
            <>
              <p className="text-[12.5px] font-semibold text-[#6e2a40]">작은 실천</p>
              <p className="mt-1 text-[15.5px] leading-[1.65] [word-break:keep-all]">{insight.practice}</p>
            </>
          )}
          {insight.questions.length > 0 && (
            <>
              <p className={`text-[12.5px] font-semibold text-[#6e2a40] ${insight.practice ? "mt-3" : ""}`}>나에게 묻는 질문</p>
              <ul className="mt-1 space-y-1 text-[15.5px] leading-[1.65] [word-break:keep-all]">
                {insight.questions.map((q) => (
                  <li key={q}>· {q}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </>
  );
}
