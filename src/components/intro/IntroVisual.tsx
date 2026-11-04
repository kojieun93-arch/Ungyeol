"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";

/** 공식 상담 캐릭터 — design/source/02-character.png 원본 그대로 (1086×1448, 다시 그리지 않음) */
export const CHARACTER_IMAGE = "/images/ungyeol-character.webp";

/**
 * 캐릭터 영역
 * - 비율 유지(object-cover), 얼굴이 오른쪽 59% 지점에 있어 object-position 을 그에 맞춤
 * - 위·아래 가장자리만 mask 로 바탕색에 녹임 (색을 덧칠하지 않음 → 원본 명도·대비 유지)
 * - 상자 크기를 부모가 고정 → 이미지 로딩 전후 레이아웃 이동 없음
 */
export function IntroVisual({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);
  const mask = "linear-gradient(180deg, transparent 0%, #000 16%, #000 72%, transparent 100%)";

  return (
    <div className={cn("pointer-events-none absolute inset-x-0 overflow-hidden", className)}>
      {failed ? (
        <div className="grid size-full place-items-center">
          {process.env.NODE_ENV !== "production" && (
            <p className="mx-8 rounded-xl border border-intro-cream/20 px-4 py-3 text-center text-[0.75rem] leading-relaxed text-intro-muted">
              캐릭터 이미지가 없습니다
              <br />
              <code className="text-intro-cream">public{CHARACTER_IMAGE}</code>
            </p>
          )}
        </div>
      ) : (
        <div className="absolute inset-0" style={{ maskImage: mask, WebkitMaskImage: mask }}>
          <Image
            src={CHARACTER_IMAGE}
            alt="운결 상담자 — 자주색 한복에 벚꽃 장신구를 한, 긴 검은 머리의 여성이 턱을 괴고 미소 짓는 모습"
            fill
            priority
            sizes="(max-width: 480px) 100vw, 480px"
            onError={() => setFailed(true)}
            className="animate-intro-image object-cover object-[60%_0%]"
          />
        </div>
      )}
    </div>
  );
}
