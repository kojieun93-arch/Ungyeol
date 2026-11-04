import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { ElementBalance, MbtiAxes } from "@/components/result/Composition";
import { DestinyMap } from "@/components/result/DestinyMap";
import { MeetingPoint } from "@/components/result/MeetingPoint";
import { ReportTeaser } from "@/components/result/ReportTeaser";
import { ResultCover } from "@/components/result/ResultCover";
import { SampleNotice } from "@/components/result/SampleNotice";
import { TwoSelves } from "@/components/result/TwoSelves";
import { Button, SampleBadge, Section } from "@/components/ui";
import { SAMPLE_RESULT } from "@/content/sample-result";

export const metadata: Metadata = {
  title: "샘플 결과 — 운결",
};

export default function ResultPage() {
  const r = SAMPLE_RESULT; // 실제 결과가 연결되면 이 자리에 사용자 데이터

  return (
    <AppShell>
      <TopBar title="나의 결" right={r.isSample ? <SampleBadge /> : null} />

      <main className="pb-14">
        <ResultCover name={r.displayName} isSample={r.isSample} />
        {r.isSample && <SampleNotice />}

        <Section chapter="Chapter 01" title="타고난 나와 지금의 나" description="사주의 일간과 MBTI, 두 개의 거울에 비친 모습입니다.">
          <TwoSelves innate={r.innate} present={r.present} />
        </Section>

        <Section chapter="Chapter 02" title="결을 이루는 재료" className="pt-2">
          <div className="space-y-10">
            <ElementBalance elements={r.elements} />
            <div className="hairline" />
            <MbtiAxes axes={r.mbtiAxes} />
          </div>
        </Section>

        <Section chapter="Chapter 03" title="두 결이 만나는 자리" className="pt-2">
          <MeetingPoint meeting={r.meeting} />
        </Section>

        <Section
          id="map"
          chapter="Chapter 04"
          title="운명 지도"
          description="다섯 갈래의 길에서 지금의 당신에게 닿는 이야기."
          className="scroll-mt-14 pt-2"
        >
          <DestinyMap chapters={r.chapters} />
        </Section>

        <ReportTeaser />

        <div className="mt-10 px-6 text-center">
          <p className="type-small text-fg-subtle">
            운결의 해석은 자기 이해를 돕기 위한 참고 자료이며,
            <br />
            미래의 특정 사건을 예측하거나 보장하지 않습니다.
          </p>
          <Button href="/scan" variant="secondary" className="mt-6">
            내 정보로 다시 보기
          </Button>
        </div>
      </main>
    </AppShell>
  );
}
