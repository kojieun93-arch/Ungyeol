"use client";

import Link from "next/link";
import { LogoMark } from "@/components/reading/Frame";
import { Sheet, useReveal } from "@/components/report/common";
import { PRODUCT_LIST } from "@/content/products";
import { CATEGORY_LABEL } from "@/features/products/types";

/** /reports — 7개 주제별 리포트 목록 (본문 완성 상품을 먼저) */
export function ProductCatalog() {
  useReveal("catalog");
  const list = [...PRODUCT_LIST].sort((a, b) => Number(b.previewAvailability.written === "complete") - Number(a.previewAvailability.written === "complete"));
  return (
    <div className="min-h-dvh bg-[#2e1c24] text-white" style={{ fontFamily: "var(--font-sans)" }}>
      <main className="mx-auto max-w-[480px] px-4 pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(env(safe-area-inset-bottom)+64px)]">
        <div className="flex items-center justify-between">
          <Link href="/home" aria-label="홈으로" className="grid size-11 place-items-center rounded-full text-white">
            <svg viewBox="0 0 15 29" fill="none" aria-hidden className="h-[18px] w-[10px]">
              <path d="M13 2 2.5 14.5 13 27" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <LogoMark width="7.5rem" />
          <span className="size-11" />
        </div>
        <header className="mt-6 text-center">
          <p className="font-serif text-[13px] tracking-[0.18em] text-[#e8c9ac]">사주 × MBTI</p>
          <h1 className="mt-1 font-serif text-[1.7rem] font-semibold">주제별 리포트</h1>
          <p className="mx-auto mt-2 max-w-[22rem] text-[14px] leading-[1.65] text-chat-muted [word-break:keep-all]">
            일곱 가지 주제를 같은 방식으로 깊게 풀어요. 지금은 판매 전 테스트 상태이고, 사주는 샘플로 표시돼요.
          </p>
        </header>
        <ul className="mt-8 space-y-6">
          {list.map((p) => (
            <li key={p.id} className="reveal">
              <Sheet className="px-4 pt-7 pb-4">
                <p className="text-center text-[12px] tracking-[0.08em] text-[#9a7647]">{CATEGORY_LABEL[p.category]}</p>
                <h2 className="mt-1 text-center font-serif text-[19px] font-semibold text-[#4a1a2c]">{p.title}</h2>
                <p className="mt-2 text-[14.5px] leading-[1.65] [word-break:keep-all]">{p.summary}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-[11.5px]">
                  <span className="rounded-full bg-[#974d5e] px-2 py-0.5 font-semibold text-white">{p.chapters.length}개 챕터</span>
                  <span className="rounded-full bg-[#efe3d0] px-2 py-0.5 text-[#6b4f2a]">{p.previewAvailability.written === "complete" ? "샘플 본문 완성" : "구조 · 샘플 1챕터"}</span>
                  <span className="rounded-full bg-[#efe3d0] px-2 py-0.5 text-[#6b4f2a]">가격 미정</span>
                </div>
                <Link href={`/reports/${p.id}`} className="mt-3 flex min-h-11 items-center justify-center rounded-full text-[14px] font-medium text-[#6e2a40] shadow-[inset_0_0_0_1.5px_#c9a27a]" aria-label={`${p.title} 자세히 보기`}>
                  자세히 보기
                </Link>
              </Sheet>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
