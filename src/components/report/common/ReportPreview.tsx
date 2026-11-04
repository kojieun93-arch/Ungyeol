import Link from "next/link";
import type { ReportSection as Sec } from "@/features/report/types";
import { ReportSection } from "./ReportSection";
import { Sheet } from "./Sheet";

/** 상품 소개 화면의 미리보기 — 공개 샘플 챕터의 일부 섹션 (샘플 표시) */
export function ReportPreview({ items, readHref }: { items: { chapterId: string; chapterTitle: string; sections: Sec[] }[]; readHref: (chapterId: string) => string }) {
  return (
    <section aria-labelledby="preview-title" className="reveal">
      <Sheet className="px-4 pt-7 pb-5">
        <h2 id="preview-title" className="text-center font-serif text-[18px] font-semibold text-[#4a1a2c]">
          미리 읽기
        </h2>
        <p className="mt-1 text-center text-[12.5px] text-[#7b6266]">공개 샘플 리포트의 일부 · 샘플 사주와 예시 상황 기준</p>
        <div className="mt-5 space-y-7">
          {items.map((it) => (
            <div key={it.chapterId} className="space-y-4">
              <p className="text-center font-serif text-[14px] tracking-[0.08em] text-[#9a7647]">
                CHAPTER {it.chapterId} · {it.chapterTitle}
              </p>
              {it.sections.map((s) => (
                <ReportSection key={s.id} s={{ ...s, id: `pv-${it.chapterId}-${s.id}` }} />
              ))}
              <Link href={readHref(it.chapterId)} className="flex min-h-11 items-center justify-center rounded-full text-[14px] font-medium text-[#6e2a40] shadow-[inset_0_0_0_1.5px_#c9a27a]">
                이 챕터 이어 읽기
              </Link>
            </div>
          ))}
        </div>
      </Sheet>
    </section>
  );
}
