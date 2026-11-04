import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionProps = Omit<ComponentPropsWithoutRef<"section">, "title"> & {
  /** 'Chapter 01' 처럼 짧은 챕터 표기 */
  chapter?: string;
  title?: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  action?: ReactNode;
};

/** 에디토리얼 섹션: 이탤릭 챕터 라벨 · 명조 제목 · 고딕 설명 */
export function Section({
  chapter,
  title,
  description,
  align = "left",
  action,
  className,
  children,
  ...rest
}: SectionProps) {
  const centered = align === "center";
  const hasHeader = chapter || title || description || action;

  return (
    <section className={cn("px-6 py-10", className)} {...rest}>
      {hasHeader && (
        <header className={cn("mb-6", centered ? "text-center" : "flex items-end justify-between gap-4")}>
          <div>
            {chapter && (
              <p className={cn("type-italic flex items-center gap-3 text-champagne-300/90", centered && "justify-center")}>
                <span>{chapter}</span>
                <span aria-hidden className="h-px w-8 bg-champagne-300/30" />
              </p>
            )}
            {title && <h2 className="type-title mt-3 text-fg">{title}</h2>}
            {description && <p className="type-small mt-2 text-fg-muted">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
