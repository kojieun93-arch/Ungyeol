import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { ReportCover } from "@/components/report/ReportCover";
import { SamplePages } from "@/components/report/SamplePages";
import { TableOfContents } from "@/components/report/TableOfContents";
import { Badge, Button, Ornament, Section } from "@/components/ui";
import { REPORT_CHAPTERS, REPORT_STATUS } from "@/content/report-outline";
import { SAMPLE_RESULT } from "@/content/sample-result";

export const metadata: Metadata = {
  title: "심층 리포트 미리보기 — 운결",
};

export default function ReportPreviewPage() {
  return (
    <AppShell>
      <TopBar backHref="/result" title="심층 리포트 미리보기" right={<Badge>준비 중</Badge>} />

      <main className="pb-14">
        {/* ── 표지 ── */}
        <header className="px-6 pt-6 pb-4 text-center">
          <ReportCover name={SAMPLE_RESULT.displayName} className="animate-rise" />
          <p className="type-italic mt-10 animate-rise text-champagne-300/90" style={{ animationDelay: "200ms" }}>
            A Book of Two Grains
          </p>
          <h1 className="type-title mt-2 animate-rise" style={{ animationDelay: "300ms" }}>
            한 사람을 위해 쓰이는
            <br />
            일흔 쪽의 이야기
          </h1>
          <p className="type-small mx-auto mt-3 max-w-[19rem] animate-rise text-fg-muted" style={{ animationDelay: "400ms" }}>
            무료 결과의 각 장을 더 깊이 펼쳐, 원국 해설과 열두 달의 흐름까지 한 권으로 엮는 리포트를 준비하고 있습니다. 아래 목차와 쪽수는 현재 구성안입니다.
          </p>
        </header>

        {/* ── 목차 ── */}
        <Section chapter="Contents" title="목차">
          <TableOfContents chapters={REPORT_CHAPTERS} sampleNos={["Chapter 3", "Chapter 7"]} />
        </Section>

        {/* ── 샘플 페이지 ── */}
        <Section chapter="Sample Pages" title="샘플 페이지" description="옆으로 넘겨 지면을 살펴보세요. 내용은 샘플 사용자 기준 예시입니다." className="pt-2">
          <SamplePages />
        </Section>

        {/* ── 상태 안내: 판매하지 않음 ── */}
        <section className="mx-6 rounded-[1.5rem] border border-line px-6 py-7 text-center">
          <Ornament />
          <p className="type-subtitle mt-5 text-fg">지금은 미리보기만 제공합니다</p>
          <p className="type-small mt-2 text-fg-muted">{REPORT_STATUS.note}</p>
          <div className="mt-6 flex flex-col gap-2">
            <Button href="/result" fullWidth>
              무료 결과로 돌아가기
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
