import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Backdrop } from "./Backdrop";

/** 모바일 우선 컨테이너: 최대 440px, 데스크톱에서는 중앙 정렬 + 노치 안전영역 */
export function AppShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <>
      <Backdrop />
      <div
        className={cn(
          "relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col",
          "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
          className,
        )}
      >
        {children}
      </div>
    </>
  );
}
