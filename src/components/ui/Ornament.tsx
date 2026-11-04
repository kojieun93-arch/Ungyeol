import { cn } from "@/lib/cn";

/** 매거진 구분 장식: ── ◦ ── */
export function Ornament({ className, tone = "dark" }: { className?: string; tone?: "dark" | "paper" }) {
  const line = tone === "paper" ? "bg-ink/20" : "bg-champagne-300/25";
  const dot = tone === "paper" ? "border-ink/40" : "border-champagne-300/60";
  return (
    <div aria-hidden className={cn("flex items-center justify-center gap-3", className)}>
      <span className={cn("h-px w-10", line)} />
      <span className={cn("size-1.5 rotate-45 border", dot)} />
      <span className={cn("h-px w-10", line)} />
    </div>
  );
}
