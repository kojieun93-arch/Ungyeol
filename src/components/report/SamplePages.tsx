import { Ornament } from "@/components/ui";
import { cn } from "@/lib/cn";

/** 종이 지면 한 장 */
function Page({
  folio,
  running,
  children,
  className,
}: {
  folio: number;
  running: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "paper relative flex aspect-[3/4.2] w-[78vw] max-w-[300px] shrink-0 snap-center flex-col rounded-md px-6 pt-6 pb-5",
        className,
      )}
    >
      {/* 머리글 */}
      <header className="flex items-center justify-between text-[0.5625rem] tracking-[0.14em] text-ink-soft uppercase">
        <span>Ungyeol</span>
        <span className="type-italic text-[0.6875rem] tracking-normal normal-case">{running}</span>
      </header>
      <div className="mt-5 flex-1 overflow-hidden">{children}</div>
      {/* 쪽 번호 */}
      <footer className="mt-3 flex items-center justify-between text-[0.625rem] text-ink-soft">
        <span className="rounded-full border border-ink/20 px-1.5 py-px">샘플 페이지</span>
        <span className="font-serif tabular-nums">{folio}</span>
      </footer>
    </article>
  );
}

/** 샘플 페이지 — 가로로 넘겨 보는 지면. 내용은 품질 방향을 보여주기 위한 예시 */
export function SamplePages() {
  return (
    <div className="no-scrollbar -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pt-2 pb-8" tabIndex={0} aria-label="샘플 페이지, 가로로 넘겨 보기">
      {/* 1. 챕터 오프닝 */}
      <Page folio={26} running="Chapter 3">
        <div className="flex h-full flex-col">
          <p className="type-italic text-[0.8125rem] text-[#8a6d43]">Chapter 3</p>
          <h3 className="mt-2 font-serif text-[1.375rem] leading-[1.35] font-medium tracking-[-0.03em] text-ink">
            두 결이
            <br />
            만나는 자리
          </h3>
          <Ornament tone="paper" className="mt-5 justify-start [&>span:first-child]:hidden" />
          <p className="mt-5 text-[0.75rem] leading-[1.85] text-ink-soft">
            <span className="float-left mr-1.5 font-serif text-[2.25rem] leading-[0.9] text-ink">덩</span>
            굴은 벽을 밀어내지 않습니다. 벽을 따라 오르며 결국 햇빛에 닿습니다. 타고난 결이 그렇다면, 지금의 당신은 그 길을
            조용히 지도로 그려 두는 사람에 가깝습니다.
          </p>
          <p className="mt-auto border-t border-ink/15 pt-3 font-serif text-[0.875rem] leading-[1.6] text-ink">
            “충분히 머문 다음에 뻗어 나가는 것.”
          </p>
        </div>
      </Page>

      {/* 2. 해설 + 도표 */}
      <Page folio={29} running="닮은 결, 엇갈리는 결">
        <p className="text-[0.625rem] font-semibold tracking-[0.12em] text-[#8a6d43] uppercase">Reading 3-2</p>
        <h4 className="mt-1.5 font-serif text-[1rem] leading-[1.45] tracking-[-0.02em] text-ink">에너지가 향하는 방향</h4>
        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-sm border border-ink/15 py-3">
            <p className="font-serif text-[1.125rem] text-[#8a6d43]">木 ↗</p>
            <p className="mt-1 text-[0.625rem] text-ink-soft">바깥으로 뻗는 기운</p>
          </div>
          <div className="rounded-sm border border-ink/15 py-3">
            <p className="font-serif text-[1.125rem] text-[#974d5e]">I ↘</p>
            <p className="mt-1 text-[0.625rem] text-ink-soft">안으로 모으는 성향</p>
          </div>
        </div>
        <p className="mt-4 text-[0.75rem] leading-[1.85] text-ink-soft">
          두 방향은 충돌이 아니라 순서의 문제로 볼 수 있습니다. 안에서 충분히 모은 에너지가 있을 때, 바깥으로의 확장도 오래
          지속되는 경향이 있습니다.
        </p>
        <p className="mt-3 border-l-2 border-[#c9a877] pl-3 text-[0.6875rem] leading-[1.7] text-ink">
          이번 주의 질문 — 요즘 나는 ‘모으는 시기’인가요, ‘뻗는 시기’인가요?
        </p>
      </Page>

      {/* 3. 월별 흐름 */}
      <Page folio={60} running="Chapter 7">
        <p className="type-italic text-[0.8125rem] text-[#8a6d43]">2027 · 丁未</p>
        <h4 className="mt-1.5 font-serif text-[1rem] leading-[1.45] tracking-[-0.02em] text-ink">열두 달의 결 — 봄</h4>
        <ul className="mt-4 space-y-3">
          {[
            ["3월", "새로 시작한 일의 이름을 정해 보기 좋은 달"],
            ["4월", "가까운 사람에게 생각을 꺼내 보이는 연습"],
            ["5월", "정리와 휴식, 다음 계절을 위한 비움"],
          ].map(([m, t]) => (
            <li key={m} className="flex gap-3 border-b border-ink/10 pb-3">
              <span className="w-8 shrink-0 font-serif text-[0.875rem] text-ink">{m}</span>
              <span className="text-[0.6875rem] leading-[1.7] text-ink-soft">{t}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[0.625rem] leading-[1.6] text-ink-soft/80">
          월별 흐름은 전통 해석에 기반한 참고용 읽기이며, 특정 사건을 예측하지 않습니다.
        </p>
      </Page>
    </div>
  );
}
