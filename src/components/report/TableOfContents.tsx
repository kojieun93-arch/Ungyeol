import type { ReportChapter } from "@/types/result";

/** 목차 — 매거진식 점선 리더 + 쪽 번호. sampleNo 에 해당하는 장은 '샘플 공개' 표시 */
export function TableOfContents({ chapters, sampleNos }: { chapters: ReportChapter[]; sampleNos: string[] }) {
  return (
    <ol className="border-t border-line">
      {chapters.map((c) => {
        const isSample = sampleNos.includes(c.no);
        return (
          <li key={c.no} className="flex items-baseline gap-3 border-b border-line py-4">
            <span className="type-italic w-[4.75rem] shrink-0 text-[0.8125rem] text-champagne-300/80">{c.no}</span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="font-serif text-[1rem] tracking-[-0.02em] text-fg">{c.title}</span>
                {isSample && (
                  <span className="rounded-full border border-champagne-300/30 px-1.5 py-px text-[0.625rem] text-champagne-200">
                    샘플 공개
                  </span>
                )}
              </span>
              <span className="mt-0.5 block text-[0.75rem] text-fg-subtle">{c.subtitle}</span>
            </span>
            <span className="font-serif text-[0.8125rem] tabular-nums text-fg-subtle">{String(c.page).padStart(2, "0")}</span>
          </li>
        );
      })}
    </ol>
  );
}
