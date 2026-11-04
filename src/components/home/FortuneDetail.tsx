import Link from "next/link";
import { FORTUNES, FORTUNE_IDS, INPUT_LABEL, offerFor, type FortuneCategory } from "@/content/fortunes";
import { FortuneArt } from "./FortuneArt";
import { ChatShortcut, HomeBar, SectionHead, StepFlow, Tag } from "./parts";

/* ──────────────────────────────────────────────────────────
   운세 카테고리 페이지 (/fortune/[id])
   소개 → 살펴보는 것 → 무료 요약 / 심층 리포트(준비 중 · 가격 미정) → 준비할 정보 → 진행 순서 → 상담 시작
   ────────────────────────────────────────────────────────── */

function Diamond() {
  return <span aria-hidden className="mt-[0.55em] size-[6px] shrink-0 rotate-45 bg-[#d3ab7c]" />;
}

function priceLabel(f: FortuneCategory) {
  const o = offerFor(f.id);
  if (!o || o.priceKRW === null) return "가격 미정";
  return `${o.priceKRW.toLocaleString("ko-KR")}원`;
}

export function FortuneDetail({ f }: { f: FortuneCategory }) {
  const offer = offerFor(f.id);
  const others = FORTUNE_IDS.filter((id) => id !== f.id).map((id) => FORTUNES[id]);
  const follow = f.followUps[0];

  return (
    <div className="relative min-h-dvh bg-[#2e1c24] text-white" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="relative mx-auto w-full max-w-[480px]">
        <HomeBar backHref="/home" backLabel="운세 홈으로" title={f.title} right={<ChatShortcut />} />

        <main className="px-4 pb-[calc(env(safe-area-inset-bottom)+136px)]">
          {/* 소개 */}
          <section className="pt-4" aria-labelledby="fortune-title">
            <FortuneArt f={f} className="aspect-[16/10] rounded-[1.5rem] shadow-[0_0_0_1px_rgb(232_201_172/0.3)]" emblemClass="w-[62%]" />
            <div className="mt-5 flex items-center gap-2">
              <Tag>샘플 미리보기</Tag>
              <Tag tone="line">무료 요약 제공</Tag>
            </div>
            <h2 id="fortune-title" className="mt-3 font-serif text-[1.6rem] leading-[1.3] font-semibold tracking-[-0.03em] [word-break:keep-all]">
              {f.title}
            </h2>
            <p className="mt-2 text-[15px] leading-[1.65] text-chat-muted [word-break:keep-all]">{f.intro}</p>
          </section>

          {/* 살펴보는 것 */}
          <section className="mt-8" aria-labelledby="explores-title">
            <SectionHead id="explores-title" title="이런 이야기를 나눠요" />
            <ul className="flex flex-col gap-2.5">
              {f.explores.map((e) => (
                <li key={e} className="flex gap-2.5 text-[15px] leading-[1.55] [word-break:keep-all]">
                  <Diamond />
                  {e}
                </li>
              ))}
            </ul>
          </section>

          {/* 무료 · 심층 */}
          <section className="mt-9" aria-labelledby="tiers-title">
            <SectionHead id="tiers-title" title="무료 요약과 심층 리포트" desc="무료 요약은 상담 안에서 바로 볼 수 있어요. 심층 리포트는 준비 중이라 지금은 판매하지 않아요." />
            <div className="flex flex-col gap-3">
              <div className="rounded-[1.25rem] bg-[#fbf2e8] px-4 py-4 text-[#3a2229] shadow-[0_0_0_1.5px_#d3ab7c]">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-serif text-[1.05rem] font-semibold text-[#4a1a2c]">무료 요약</h3>
                  <span className="rounded-full bg-[#4a1a2c] px-2.5 py-1 text-[11px] font-semibold text-white">무료</span>
                </div>
                <ul className="mt-2.5 flex flex-col gap-1.5 text-[14px] leading-[1.55]">
                  {f.free.map((t) => (
                    <li key={t} className="flex gap-2 [word-break:keep-all]">
                      <span aria-hidden className="text-[#974d5e]">✓</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[1.25rem] bg-white/[0.04] px-4 py-4 shadow-[0_0_0_1px_rgb(232_201_172/0.35)]">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-serif text-[1.05rem] font-semibold text-white">{offer?.title ?? "심층 리포트"}</h3>
                  <Tag tone="line">준비 중</Tag>
                </div>
                <ul className="mt-2.5 flex flex-col gap-1.5 text-[14px] leading-[1.55] text-chat-muted">
                  {f.premium.map((t) => (
                    <li key={t} className="flex gap-2 [word-break:keep-all]">
                      <Diamond />
                      {t}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-[13px] text-chat-muted">
                  <span>{priceLabel(f)}</span>
                  <span>아직 판매하지 않아요</span>
                </p>
              </div>
            </div>
          </section>

          {/* 준비할 정보 */}
          <section className="mt-9" aria-labelledby="inputs-title">
            <SectionHead id="inputs-title" title="상담 전에 준비할 정보" desc="운결이 대화 중에 하나씩 물어봐요. 같은 대화 안에서는 다시 묻지 않아요." />
            <ol className="flex flex-col overflow-hidden rounded-[1.25rem] shadow-[0_0_0_1px_rgb(232_201_172/0.22)]">
              {f.inputs.map((k, i) => (
                <li key={k} className="flex items-center gap-3 border-b border-white/[0.07] bg-white/[0.03] px-4 py-3 last:border-b-0">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-chat-chip text-[12px] font-semibold text-white shadow-[inset_0_0_0_1px_var(--color-chat-chip-stroke)] tabular-nums">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-[14.5px] leading-[1.45] [word-break:keep-all]">{INPUT_LABEL[k].label}</span>
                  {INPUT_LABEL[k].note && <span className="shrink-0 text-right text-[12px] leading-[1.35] text-chat-muted/85">{INPUT_LABEL[k].note}</span>}
                </li>
              ))}
            </ol>
            {follow && (
              <div className="mt-3 rounded-[1.25rem] bg-white/[0.03] px-4 py-3.5 shadow-[0_0_0_1px_rgb(232_201_172/0.22)]">
                <p className="text-[12px] text-[#e8c9ac]">이 주제에서 더 묻는 질문 (예시)</p>
                <p className="mt-1 font-serif text-[15px] font-semibold [word-break:keep-all]">{follow.question}</p>
                <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="선택지 예시">
                  {follow.options.map((o) => (
                    <li key={o} className="rounded-full bg-chat-chip px-3 py-1.5 text-[12.5px] shadow-[inset_0_0_0_1px_var(--color-chat-chip-stroke)]">
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* 진행 순서 */}
          <section className="mt-9" aria-labelledby="flow-title">
            <SectionHead id="flow-title" title="이렇게 진행돼요" />
            <StepFlow />
          </section>

          {/* 다른 운세 */}
          <section className="mt-10" aria-labelledby="others-title">
            <SectionHead id="others-title" title="다른 운세도 둘러보세요" />
            <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
              {others.map((o) => (
                <li key={o.id} className="w-[8.5rem] shrink-0 snap-start">
                  <Link href={`/fortune/${o.id}`} className="block overflow-hidden rounded-2xl bg-[#3a2430] shadow-[0_0_0_1px_rgb(232_201_172/0.22)] focus-visible:outline-2 focus-visible:outline-chat-accent">
                    <FortuneArt f={o} className="aspect-[4/3]" />
                    <span className="flex min-h-11 items-center px-3 py-2 font-serif text-[13.5px] leading-snug font-semibold [word-break:keep-all]">{o.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </main>

        {/* 아래 고정: 상담 시작 */}
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] bg-[linear-gradient(180deg,transparent,#2e1c24_30%)] px-4 pt-6" style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}>
          <Link
            href={`/chat?topic=${f.id}`}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full border border-[#e9c6b8] bg-[#f6e7dc] text-[16px] font-semibold text-[#3a1f2e] active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f6e7dc]"
          >
            운결과 상담 시작
            <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden>
              <path d="m7.5 4.5 5.5 5.5-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <p className="mt-2 text-center text-[11.5px] leading-[1.45] text-chat-muted/80 [word-break:keep-all]">
            고른 주제에 맞춰 운결이 첫 인사와 질문을 건네요. 주소에는 주제만 담기고 개인정보는 담기지 않아요.
          </p>
        </div>
      </div>
    </div>
  );
}
