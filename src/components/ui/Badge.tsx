import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "champagne" | "lavender" | "sample";

const tones: Record<Tone, string> = {
  neutral: "border-white/[0.1] text-fg-muted",
  champagne: "border-champagne-300/30 text-champagne-200 bg-champagne-300/[0.06]",
  lavender: "border-lavender-300/30 text-lavender-200 bg-lavender-300/[0.06]",
  // 샘플 데이터 표시는 눈에 잘 띄되 차분하게
  sample: "border-champagne-300/40 text-champagne-200 bg-plum-900/70",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-[0.6875rem] font-medium tracking-[0.02em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** 샘플임을 명확히 알리는 배지 */
export function SampleBadge({ className }: { className?: string }) {
  return (
    <Badge tone="sample" className={className}>
      <span aria-hidden className="size-1 rounded-full bg-champagne-300" />
      샘플
    </Badge>
  );
}
