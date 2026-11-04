import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { ReportCover } from "@/components/report/ReportCover";
import Link from "next/link";
import { Badge, Button, Ornament, Section } from "@/components/ui";
import { CHAPTER_META } from "@/content/report/chapters";
import { REPORT_STATUS } from "@/content/report-outline";
import { SAMPLE_RESULT } from "@/content/sample-result";

export const metadata: Metadata = {
  title: "종합 리포트 — 운결",
};

export default function ReportPreviewPage() {
  return (
    <AppShell>
      <TopBar backHref="/home" title="종합 리포트" right={<Badge>샘플</Badge>} />

      <main className="pb-14">
        {/* ── 표지 ── */}
        <header className="px-6 pt-6 pb-4 text-center">
          <ReportCover name={SAMPLE_RESULT.displayName} className="animate-rise" />
          <p className="type-italic mt-10 animate-rise text-champagne-300/90" style={{ animationDelay: "200ms" }}>
            A Book of Two Grains
          </p>
          <h1 className="type-title mt-2 animate-rise" style={{ animationDelay: "300ms" }}>
            열두 장으로 읽는
            <br />
            두 가지 결
          </h1>
          <p className="type-small mx-auto mt-3 max-w-[19rem] animate-rise text-fg-muted" style={{ animationDelay: "400ms" }}>
            채팅에서 받은 결과 카드 6종을 원국 해설부터 2027년 월별 흐름까지 12챕터로 펼친 리포트예요. 지금은 데모 사주로 만든 샘플이고, 계산이 필요한 부분은 ‘미연결’로 비워 두었어요.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button href="/report/sample" fullWidth>
              샘플 리포트 열기
            </Button>
            <Button href="/report/my" variant="secondary" fullWidth>
              내 상담 결과로 보기
            </Button>
            <Button href="/reports" variant="secondary" fullWidth>
              주제별 리포트 7종 보기
            </Button>
          </div>
        </header>

        {/* ── 목차 (전체 공개) ── */}
        <Section chapter="Contents" title="목차" description="공개 샘플 챕터는 누구나 읽을 수 있고, 나머지는 담기는 내용까지 볼 수 있어요.">
          <ol className="border-t border-line">
            {CHAPTER_META.map((c) => (
              <li key={c.id} className="border-b border-line">
                <Link href={`/report/sample/chapter/${c.id}`} className="flex min-h-12 items-baseline gap-3 py-3.5">
                  <span className="type-italic w-7 shrink-0 text-[0.875rem] text-champagne-300/80 tabular-nums">{c.id}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-serif text-[1rem] tracking-[-0.02em] text-fg">
                      {c.title}
                      {c.access === "free" && <span className="rounded-full border border-champagne-300/30 px-1.5 py-px text-[0.625rem] text-champagne-200">공개 샘플</span>}
                    </span>
                    <span className="mt-0.5 block text-[0.8125rem] text-fg-subtle">{c.question}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </Section>

        {/* ── 상태 안내: 판매하지 않음 ── */}
        <section className="mx-6 rounded-[1.5rem] border border-line px-6 py-7 text-center">
          <Ornament />
          <p className="type-subtitle mt-5 text-fg">프리미엄 리포트는 아직 판매하지 않아요</p>
          <p className="type-small mt-2 text-fg-muted">{REPORT_STATUS.note} 결제가 연결되지 않았고, 환불 · 이용 조건은 판매 전에 확정해 안내할 예정이에요.</p>
          <div className="mt-6 flex flex-col gap-2">
            <Button href="/chat" fullWidth>
              운결과 상담하기
            </Button>
            <Button href="/" variant="secondary" fullWidth>
              처음으로
            </Button>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
