import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "text";
type Size = "md" | "lg";

type BaseProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
  children: ReactNode;
};

type LinkButtonProps = BaseProps & { href: string } & Omit<
    ComponentPropsWithoutRef<typeof Link>,
    "href" | "className" | "children"
  >;
type NativeButtonProps = BaseProps & { href?: undefined } & Omit<
    ComponentPropsWithoutRef<"button">,
    "className" | "children"
  >;

export type ButtonProps = LinkButtonProps | NativeButtonProps;

const base =
  "group relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap " +
  "transition-[scale,background-color,border-color,color,box-shadow,opacity] duration-500 ease-(--ease-out-expo) " +
  "active:scale-[0.985] active:duration-150 " +
  "disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const sizes: Record<Size, string> = {
  md: "h-11 rounded-full px-5 text-[0.875rem] font-medium tracking-[-0.01em]",
  lg: "h-[3.25rem] rounded-full px-6 text-[0.9375rem] font-semibold tracking-[-0.015em]",
};

const variants: Record<Variant, string> = {
  // 채팅 포인트와 같은 샴페인 베이지 단색
  primary:
    "bg-gyeol text-plum-950 hover:bg-champagne-200",
  // 얇은 실선 + 투명
  secondary:
    "border border-white/[0.12] text-fg/90 " +
    "hover:border-champagne-300/40 hover:bg-white/[0.03] hover:text-fg active:bg-white/[0.05]",
  // 밑줄 텍스트 링크
  text:
    "px-1 py-1.5 text-fg-muted underline decoration-white/20 underline-offset-[6px] " +
    "hover:text-fg hover:decoration-champagne-300/60",
};

function Inner({ leading, trailing, children }: Pick<BaseProps, "leading" | "trailing" | "children">) {
  return (
    <>
      {leading && <span className="shrink-0">{leading}</span>}
      <span>{children}</span>
      {trailing && (
        <span className="shrink-0 transition-transform duration-500 ease-(--ease-out-expo) group-hover:translate-x-0.5">
          {trailing}
        </span>
      )}
    </>
  );
}

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", fullWidth, leading, trailing, className, children, ...rest } = props;
  const classes = cn(
    base,
    variant === "text" ? "text-[0.8125rem]" : sizes[size],
    variants[variant],
    fullWidth && "w-full",
    className,
  );
  const inner = (
    <Inner leading={leading} trailing={trailing}>
      {children}
    </Inner>
  );

  if ("href" in rest && rest.href !== undefined) {
    const { href, ...linkRest } = rest as Omit<LinkButtonProps, keyof BaseProps>;
    return (
      <Link href={href} className={classes} {...linkRest}>
        {inner}
      </Link>
    );
  }

  const buttonRest = rest as Omit<NativeButtonProps, keyof BaseProps>;
  return (
    <button type="button" className={classes} {...buttonRest}>
      {inner}
    </button>
  );
}

/** 공통 화살표 아이콘 */
export function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={cn("size-4", className)} aria-hidden>
      <path d="M4 10h11m0 0-4.5-4.5M15 10l-4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
