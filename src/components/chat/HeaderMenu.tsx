"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type React from "react";
import { cn } from "@/lib/cn";

export type MenuItem =
  | { kind: "link"; label: string; href: string }
  | { kind: "action"; label: string; onSelect: () => void; danger?: boolean }
  | { kind: "note"; text: string };

/** 헤더 메뉴 버튼 + 팝오버. Esc·바깥 터치로 닫힘, 닫히면 버튼으로 포커스 복귀 */
export function HeaderMenu({
  label,
  icon,
  items,
  align,
  placement = "below",
  buttonClassName,
  buttonStyle,
}: {
  label: string;
  icon: ReactNode;
  items: MenuItem[];
  align: "left" | "right";
  /** 하단 버튼에서 열 때는 위로 */
  placement?: "below" | "above";
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btn.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    // 첫 항목으로 포커스
    wrap.current?.querySelector<HTMLElement>("[data-menu-item]")?.focus();
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const itemCls =
    "flex min-h-12 w-full items-center px-4 text-left text-[0.9375rem] text-chat-text transition-colors duration-150 hover:bg-chat-raise focus-visible:bg-chat-raise focus-visible:outline-none";

  return (
    <div ref={wrap} className="relative">
      <button
        ref={btn}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "grid place-items-center rounded-full text-white focus-visible:outline-2 focus-visible:outline-chat-accent",
          buttonClassName ?? "size-11",
        )}
        style={buttonStyle}
      >
        {icon}
      </button>
      {open && (
        <div
          id={id}
          role="menu"
          aria-label={label}
          className={cn(
            "absolute z-40 w-60 animate-panel-in overflow-hidden rounded-2xl border border-chat-line bg-chat-surface py-1.5",
            placement === "below" ? "top-12" : "bottom-[calc(100%+8px)]",
            align === "left" ? "left-0" : "right-0",
          )}
        >
          {items.map((it, i) =>
            it.kind === "link" ? (
              <Link key={i} href={it.href} role="menuitem" data-menu-item className={itemCls} onClick={() => setOpen(false)}>
                {it.label}
              </Link>
            ) : it.kind === "action" ? (
              <button
                key={i}
                type="button"
                role="menuitem"
                data-menu-item
                className={cn(itemCls, it.danger && "text-chat-error")}
                onClick={() => {
                  setOpen(false);
                  it.onSelect();
                  btn.current?.focus();
                }}
              >
                {it.label}
              </button>
            ) : (
              <p key={i} className="mt-1 border-t border-chat-line px-4 pt-3 pb-2 text-[0.75rem] leading-[1.6] text-chat-subtle">
                {it.text}
              </p>
            ),
          )}
        </div>
      )}
    </div>
  );
}
