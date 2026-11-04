"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ReportHero, ReportPreview, ReportTerms, Sheet, useReveal } from "@/components/report/common";
import { PRODUCTS } from "@/content/products";
import { buildProductSample, productHref } from "@/features/products/build";
import { CATEGORY_LABEL, type ProductId } from "@/features/products/types";

/* ──────────────────────────────────────────────────────────
   상품 소개 — /reports/[productId]
   표지 · 시작하기 · 받는 정보(쓰임 · 저장 여부) · 공개 목차 · 미리 읽기 · 알 수 없는 것 · 가격/환불(미정)
   ────────────────────────────────────────────────────────── */

export function ProductIntro({ productId }: { productId: ProductId }) {
  const P = PRODUCTS[productId];
  const sample = useMemo(() => buildProductSample(productId), [productId]);
  useReveal(productId);
  const free = P.previewAvailability.freeChapters;
  const preview = P.sampleSections.map((ss) => {
    const ch = sample.chapters.find((c) => c.id === ss.chapterId)!;
    return { chapterId: ch.id, chapterTitle: ch.title, sections: ch.sections.filter((s) => ss.sectionIds.includes(s.id)) };
  });

  return (
    <div className="relative min-h-dvh bg-[#2e1c24] text-white" style={{ fontFamily: "var(--font-sans)" }} data-intro={productId}>
      <div className="sticky top-0 z-30 bg-[#2e1c24]/94 backdrop-blur-[6px]" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="mx-auto grid h-14 max-w-[480px] grid-cols-[44px_1fr_44px] items-center gap-2 px-2">
          <Link href="/reports" aria-label="주제별 리포트 목록으로" className="grid size-11 place-items-center rounded-full text-white">
            <svg viewBox="0 0 15 29" fill="none" aria-hidden className="h-[18px] w-[10px]">
              <path d="M13 2 2.5 14.5 13 27" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <p className="truncate text-center font-serif text-[15px] font-semibold">{P.title}</p>
          <span />
        </div>
      </div>

      <main className="mx-auto max-w-[480px] px-4 pb-[calc(env(safe-area-inset-bottom)+64px)]">
        <ReportHero
          subtitle={`주제별 리포트 · ${CATEGORY_LABEL[P.category]}`}
          title={P.title}
          badges={[
            { text: `${P.chapters.length}개 챕터`, strong: true },
            { text: `공개 샘플 ${free.join(" · ")}` },
            { text: P.previewAvailability.written === "complete" ? "샘플 본문 완성" : "구조 공개 · 본문 준비 중" },
            { text: "가격 미정 · 결제 준비 중" },
          ]}
          note={P.summary}
        />

        <div className="mt-6 flex flex-col gap-2">
          <Link href={productHref(productId, "sample")} className="flex min-h-12 items-center justify-center rounded-full bg-[#f6e7dc] text-[15px] font-semibold text-[#3a1f2e]">
            샘플 리포트 읽기
          </Link>
          <Link href={`/chat?topic=${productId}`} className="flex min-h-12 items-center justify-center rounded-full bg-chat-chip text-[15px] text-white shadow-[inset_0_0_0_1px_var(--color-chat-chip-stroke)]">
            운결과 상담하고 내 리포트 받기
          </Link>
          <Link href={productHref(productId, "my")} className="flex min-h-11 items-center justify-center text-[14px] text-chat-muted underline decoration-chat-muted/50 underline-offset-4">
            이미 상담했다면 · 내 상담으로 보기
          </Link>
        </div>

        <section aria-labelledby="inputs-title" className="reveal mt-10">
          <Sheet className="px-4 pt-7 pb-5">
            <h2 id="inputs-title" className="text-center font-serif text-[18px] font-semibold text-[#4a1a2c]">
              상담에서 받는 정보
            </h2>
            <dl className="mt-3 space-y-2 text-[14.5px] leading-[1.55] [word-break:keep-all]">
              {[...P.requiredInputs.map((x) => ({ ...x, req: true })), ...P.optionalInputs.map((x) => ({ ...x, req: false }))].map((x) => (
                <div key={x.key} className="border-b border-[#e6cdbd]/70 pb-2 last:border-b-0">
                  <dt className="flex items-center gap-1.5 font-semibold text-[#4a1a2c]">
                    {x.label}
                    <span className={`rounded-full px-1.5 text-[11px] font-medium ${x.req ? "bg-[#974d5e] text-white" : "bg-[#efe3d0] text-[#6b4f2a]"}`}>{x.req ? "필요" : "선택"}</span>
                  </dt>
                  <dd className="text-[13.5px] text-[#6b5459]">{x.use}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 rounded-xl bg-[#f3e2d8]/70 px-3.5 py-3 text-[13.5px] leading-[1.6] [word-break:keep-all]">
              입력하신 정보는 서버로 보내거나 기기에 저장하지 않아요. 이 탭의 메모리에만 있고, 새로고침하거나 ‘처음부터 다시’를 누르면 지워져요.
              {P.optionalInputs.some((x) => x.key === "partnerBirth") && " 상대방 정보는 꼭 필요한 항목만 묻고, 모르면 건너뛸 수 있어요."}
            </p>
          </Sheet>
        </section>

        <nav aria-label={`${P.title} 목차`} className="reveal mt-10">
          <Sheet className="px-4 pt-7 pb-4">
            <h2 className="text-center font-serif text-[18px] font-semibold text-[#4a1a2c]">목차</h2>
            <ol className="mt-3 divide-y divide-[#e6cdbd]">
              {P.chapters.map((c) => (
                <li key={c.id}>
                  <Link href={productHref(productId, "sample", c.id)} className="flex min-h-12 items-center gap-3 py-2 text-[#3a2229]">
                    <span className="w-7 shrink-0 font-serif text-[14px] text-[#9a7647] tabular-nums">{c.id}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15.5px] [word-break:keep-all]">{c.title}</span>
                      <span className="block text-[12.5px] leading-[1.45] text-[#7b6266] [word-break:keep-all]">{c.question}</span>
                    </span>
                    <span className="shrink-0 text-[11.5px] text-[#7b6266]">{free.includes(c.id) ? "공개" : c.status === "planned" ? "준비 중" : "프리미엄"}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </Sheet>
        </nav>

        <div className="mt-10">
          <ReportPreview items={preview} readHref={(id) => productHref(productId, "sample", id)} />
        </div>

        <aside aria-label="이 리포트의 한계" className="reveal mt-8 rounded-2xl px-4 py-4 text-[14px] leading-[1.65] text-chat-muted shadow-[inset_0_0_0_1px_rgb(232_201_172/0.35)] [word-break:keep-all]">
          <p className="font-semibold text-[#e8c9ac]">미리 알려드려요</p>
          <ul className="mt-1.5 space-y-1">
            {P.safety.map((t) => (
              <li key={t}>· {t}</li>
            ))}
          </ul>
          <p className="mt-2">이 리포트가 알 수 없는 것 · {P.limits.join(" · ")}</p>
        </aside>

        <div className="mt-8">
          <ReportTerms
            id="intro-terms"
            title="가격 · 제공 내용 · 환불"
            rows={[
              ["가격", P.price.note],
              ["제공 내용", `${P.chapters.length}개 챕터 · 공개 샘플 ${free.join(" · ")}`],
              ["결제", "연결되지 않았어요 · 지금은 구매할 수 없어요"],
              ["상태", "판매 전 테스트 상태 (실제 구매 상태 아님)"],
              ["환불 · 이용 조건", "판매를 시작하기 전에 확정해 이곳에 안내할 예정이에요"],
            ]}
          />
        </div>
      </main>
    </div>
  );
}
