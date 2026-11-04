import type { ElementCount, MbtiAxis } from "@/types/result";

/** 오행 분포 — 다섯 기둥 */
export function ElementBalance({ elements }: { elements: ElementCount[] }) {
  const max = Math.max(...elements.map((e) => e.count), 1);
  const total = elements.reduce((s, e) => s + e.count, 0);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="type-heading text-fg">오행의 균형</p>
        <p className="text-[0.6875rem] text-fg-subtle">여덟 글자 중 · 샘플</p>
      </div>
      <div className="mt-5 grid grid-cols-5 gap-3" role="list">
        {elements.map((e) => (
          <div key={e.key} role="listitem" aria-label={`${e.label} ${e.count}개`} className="flex flex-col items-center">
            <div className="relative flex h-24 w-full items-end justify-center">
              <span className="absolute inset-x-[30%] bottom-0 top-0 rounded-full bg-white/[0.04]" />
              <span
                className="relative w-[40%] rounded-full bg-champagne-300"
                style={{ height: `${(e.count / max) * 100}%` }}
              />
            </div>
            <span className="mt-2.5 font-serif text-[1.125rem] text-champagne-200">{e.hanja}</span>
            <span className="text-[0.6875rem] text-fg-subtle">
              {e.label} {e.count}
            </span>
          </div>
        ))}
      </div>
      <p className="type-small mt-4 text-fg-subtle">
        총 {total}글자 중 목(木)이 가장 많아, 성장과 확장의 기운이 중심에 있는 구성으로 읽힙니다.
      </p>
    </div>
  );
}

/** MBTI 네 축 — 한쪽으로 얼마나 기울었는지 */
export function MbtiAxes({ axes }: { axes: MbtiAxis[] }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="type-heading text-fg">성향의 지형</p>
        <p className="text-[0.6875rem] text-fg-subtle">자기 응답 기준 · 샘플</p>
      </div>
      <ul className="mt-5 space-y-4">
        {axes.map((a) => {
          const leanRight = a.value >= 50;
          return (
            <li key={a.left + a.right}>
              <div className="flex justify-between text-[0.75rem]">
                <span className={leanRight ? "text-fg-subtle" : "text-lavender-200"}>
                  {a.left} · {a.leftLabel}
                </span>
                <span className={leanRight ? "text-lavender-200" : "text-fg-subtle"}>
                  {a.rightLabel} · {a.right}
                </span>
              </div>
              <div className="relative mt-2 h-px bg-white/[0.12]">
                <span className="absolute left-1/2 top-1/2 h-2 w-px -translate-y-1/2 bg-white/20" />
                <span
                  className="absolute top-1/2 h-px bg-lavender-300/70"
                  style={leanRight ? { left: "50%", width: `${a.value - 50}%` } : { right: "50%", width: `${50 - a.value}%` }}
                />
                <span
                  className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lavender-300"
                  style={{ left: `${a.value}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
