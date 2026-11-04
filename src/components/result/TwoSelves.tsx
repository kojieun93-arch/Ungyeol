import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { SelfPortrait } from "@/types/result";

function Portrait({ p, tone }: { p: SelfPortrait; tone: "champagne" | "lavender" }) {
  const accent = tone === "champagne" ? "text-champagne-300" : "text-lavender-300";
  const chip =
    tone === "champagne"
      ? "border-champagne-300/25 text-champagne-200"
      : "border-lavender-300/25 text-lavender-200";

  return (
    <Card variant={tone} padding="lg">
      <div className="flex items-baseline justify-between gap-3">
        <p className={cn("type-italic", accent)}>{p.label}</p>
        <p className="text-[0.6875rem] text-fg-subtle">{p.source}</p>
      </div>
      <p className={cn("mt-3 font-serif text-[1.875rem] leading-none font-medium tracking-[-0.02em]", tone === "champagne" ? "text-champagne" : "text-lavender")}>
        {p.name}
      </p>
      <p className="mt-3 font-serif text-[0.9375rem] leading-[1.6] text-fg/90">“{p.image}”</p>
      <ul className="mt-4 flex flex-wrap gap-1.5">
        {p.keywords.map((k) => (
          <li key={k} className={cn("rounded-full border px-2.5 py-1 text-[0.75rem]", chip)}>
            {k}
          </li>
        ))}
      </ul>
      <p className="type-small mt-4 text-fg-muted">{p.summary}</p>
    </Card>
  );
}

/** 타고난 나 × 지금의 나 — 두 장의 카드를 가는 선으로 잇는다 */
export function TwoSelves({ innate, present }: { innate: SelfPortrait; present: SelfPortrait }) {
  return (
    <div className="relative">
      <Portrait p={innate} tone="champagne" />
      <div aria-hidden className="relative flex h-14 items-center justify-center">
        <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-line-strong" />
        <span className="relative grid size-8 place-items-center rounded-full border border-white/10 bg-plum-900 font-serif text-[0.8125rem] text-fg-muted">
          ×
        </span>
      </div>
      <Portrait p={present} tone="lavender" />
    </div>
  );
}
