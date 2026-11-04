import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

type CardVariant = "veil" | "plain" | "outline" | "paper" | "champagne" | "lavender";

const variants: Record<CardVariant, string> = {
  veil: "veil",
  plain: "bg-plum-850/80 border border-line",
  outline: "border border-line",
  paper: "paper",
  // '타고난 나' — 샴페인 베이지
  champagne: "border border-champagne-300/25 bg-champagne-300/[0.07]",
  // '지금의 나' — 분홍 버건디
  lavender: "border border-lavender-400/35 bg-lavender-400/[0.10]",
};

const paddings = { none: "", sm: "p-4", md: "p-5", lg: "p-6" };

type CardProps = ComponentPropsWithoutRef<"div"> & {
  variant?: CardVariant;
  padding?: keyof typeof paddings;
  interactive?: boolean;
};

export function Card({ variant = "veil", padding = "md", interactive, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.5rem]",
        variants[variant],
        paddings[padding],
        interactive &&
          "cursor-pointer transition-[translate,scale,border-color,background-color] duration-500 ease-(--ease-out-expo) hover:-translate-y-0.5 active:scale-[0.99]",
        className,
      )}
      {...rest}
    />
  );
}

export function CardEyebrow({ className, ...rest }: ComponentPropsWithoutRef<"p">) {
  return <p className={cn("type-italic text-fg-subtle", className)} {...rest} />;
}

export function CardTitle({ className, ...rest }: ComponentPropsWithoutRef<"h3">) {
  return <h3 className={cn("type-subtitle mt-1.5 text-fg", className)} {...rest} />;
}

export function CardBody({ className, ...rest }: ComponentPropsWithoutRef<"p">) {
  return <p className={cn("type-small mt-2 text-fg-muted", className)} {...rest} />;
}
