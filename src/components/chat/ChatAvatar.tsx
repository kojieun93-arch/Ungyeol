"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { SPEC, u } from "./spec";

/**
 * 운결 상담자 프로필 — design/source/02-character.png 에서 얼굴 영역을 잘라낸 원형 이미지.
 * 크롭 위치는 디자인 원본(03-chat.png)의 프로필과 템플릿 매칭으로 맞춤 (중심 493,361 / 반지름 268).
 */
export const ADVISOR_IMAGE = "/images/ungyeol-advisor.webp";
export const ADVISOR_NAME = "운결";

/** 아바타가 여러 개여도 없는 파일을 반복 요청하지 않도록 상태 공유 */
let knownStatus: "ok" | "missing" | null = null;
let warned = false;

export function ChatAvatar({ className }: { className?: string }) {
  const [status, setStatusState] = useState<"loading" | "ok" | "missing">(knownStatus ?? "loading");
  const setStatus = (s: "ok" | "missing") => {
    knownStatus = s;
    setStatusState(s);
  };
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete) setStatus(img.naturalWidth > 0 ? "ok" : "missing");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status === "missing" && !warned && process.env.NODE_ENV !== "production") {
      warned = true;
      console.info(`[운결] 상담자 프로필 이미지가 없습니다. public${ADVISOR_IMAGE} 를 확인해주세요.`);
    }
  }, [status]);

  const d = u(SPEC.avatar.d);
  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-chat-raise", className)}
      style={{ width: d, height: d, boxShadow: `0 0 0 ${u(SPEC.avatar.ring)} #c9838f` }}
    >
      {status !== "ok" && (
        <span aria-hidden className="font-serif font-semibold text-chat-muted" style={{ fontSize: u(36) }}>
          운
        </span>
      )}
      {status !== "missing" && (
        // eslint-disable-next-line @next/next/no-img-element -- 정적 소형 이미지 1개, 크기 고정
        <img
          ref={imgRef}
          src={ADVISOR_IMAGE}
          alt={`${ADVISOR_NAME} 상담자 프로필`}
          width={240}
          height={240}
          decoding="async"
          onLoad={() => setStatus("ok")}
          onError={() => setStatus("missing")}
          className={cn("absolute inset-0 size-full object-cover", status === "ok" ? "opacity-100" : "opacity-0")}
        />
      )}
    </span>
  );
}
