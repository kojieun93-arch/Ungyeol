"use client";

import { useEffect, useRef, useState } from "react";
import { downloadImage, fileName, renderCardImage, shareImage, shareSupport, type ShareSupport } from "@/features/share/cardImage";
import { isDemo, type ReadingResult } from "@/features/saju/types";
import { CARD_COMPONENT, READING_META, type ReadingKind } from "./cards";

/* ──────────────────────────────────────────────────────────
   공유 · 저장 미리보기 시트
   1) 열리면 공유용 카드(이름·생년월일·시간·성별 없음)를 이미지로 만들고 미리 보여줌
   2) 무엇이 들어가고 무엇이 빠지는지 목록으로 확인
   3) 사용자가 확인한 뒤에만 공유 / 저장
   이미지를 미리 만들어 두는 이유: Safari 는 버튼을 누른 '그 순간'에만 공유 시트를 허용하므로,
   누른 뒤에 이미지를 만들기 시작하면 공유가 막힐 수 있음
   ────────────────────────────────────────────────────────── */

const INCLUDED: Record<ReadingKind, string> = {
  manse: "일간과 한 줄 기질 풀이",
  elements: "오행 비율 그래프, 가장 강한 기운과 적은 기운",
  innate: "기본 기질 · 강점 · 보완점, 사주 기반 참고 MBTI",
  current: "직접 고른 MBTI 유형과 성향 요약",
  compare: "참고 MBTI와 직접 고른 MBTI, 닮은 점 · 다른 점",
  insight: "핵심 키워드 세 가지와 종합 요약",
};

type Status = { kind: "idle" } | { kind: "done"; text: string } | { kind: "error"; text: string };

export function ShareSheet({ kind, r, intent, onClose }: { kind: ReadingKind; r: ReadingResult; intent: "save" | "share"; onClose: () => void }) {
  const captureRef = useRef<HTMLDivElement>(null);
  const firstBtn = useRef<HTMLButtonElement>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [support, setSupport] = useState<ShareSupport>({ files: false, isIOS: false });
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [busy, setBusy] = useState(false);
  const title = READING_META[kind].title;
  const name = fileName(title);
  const Card = CARD_COMPONENT[kind];

  // 1) 이미지 만들기
  useEffect(() => {
    let alive = true;
    let made: string | null = null;
    setBlob(null);
    setUrl(null);
    setRenderError(null);
    const node = captureRef.current;
    if (!node) return;
    renderCardImage(node)
      .then((b) => {
        if (!alive) return;
        made = URL.createObjectURL(b);
        setBlob(b);
        setUrl(made);
        setSupport(shareSupport(new File([b], name, { type: "image/png" })));
      })
      .catch(() => alive && setRenderError("이미지를 만들지 못했어요. 잠시 후 다시 시도해 주세요."));
    return () => {
      alive = false;
      if (made) URL.revokeObjectURL(made);
    };
  }, [kind, attempt, name]);

  useEffect(() => {
    firstBtn.current?.focus({ preventScroll: true });
  }, []);

  const doSave = () => {
    if (!blob) return;
    try {
      downloadImage(blob, name);
      setStatus({
        kind: "done",
        text: support.isIOS
          ? "이미지 파일을 내려받았어요. iPhone에서는 ‘파일’ 앱의 다운로드 폴더에 저장돼요."
          : "이미지 파일을 내려받았어요. 다운로드 폴더를 확인해 주세요.",
      });
    } catch {
      setStatus({ kind: "error", text: "이미지를 저장하지 못했어요. 다시 시도해 주세요." });
    }
  };

  const doShare = async () => {
    if (!blob) return;
    setBusy(true);
    try {
      const out = await shareImage(new File([blob], name, { type: "image/png" }), `운결 · ${title}`);
      if (out === "shared") setStatus({ kind: "done", text: "공유를 마쳤어요." });
      else setStatus({ kind: "idle" });
    } catch {
      setStatus({ kind: "error", text: "공유하지 못했어요. 대신 이미지 파일로 저장할 수 있어요." });
    } finally {
      setBusy(false);
    }
  };

  const primaryIsShare = intent === "share" && support.files;
  const ready = !!blob && !renderError;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="share-sheet-title">
      <button type="button" aria-label="미리보기 닫기" tabIndex={-1} onClick={onClose} className="absolute inset-0 animate-scrim-in bg-black/55" />

      <div
        className="relative flex max-h-[92dvh] w-full max-w-[480px] animate-sheet-in flex-col rounded-t-[1.6rem] bg-[#fbf2e8] text-[#3a2229] shadow-[0_-10px_40px_rgb(0_0_0/0.35)]"
        style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 id="share-sheet-title" className="font-serif text-[1.08rem] font-semibold text-[#4a1a2c]">
            {intent === "share" ? "공유 미리보기" : "이미지 저장 미리보기"}
          </h2>
          <button
            ref={firstBtn}
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="grid size-11 place-items-center rounded-full text-[#6e2a40] focus-visible:outline-2 focus-visible:outline-[#6e2a40]"
          >
            <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden>
              <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          <div className="grid min-h-[200px] place-items-center rounded-2xl bg-[#2c1720] p-3">
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element -- 방금 만든 이미지(blob URL)
              <img src={url} alt={`${title} 공유 이미지 미리보기`} className="max-h-[44dvh] w-auto rounded-xl" />
            ) : renderError ? (
              <div role="alert" className="flex flex-col items-center gap-3 p-4 text-center text-[0.9rem] text-[#f8e6e2]">
                {renderError}
                <button type="button" onClick={() => setAttempt((n) => n + 1)} className="min-h-11 rounded-full bg-[#974d5e] px-5 text-white">
                  다시 만들기
                </button>
              </div>
            ) : (
              <p role="status" className="flex items-center gap-2 text-[0.9rem] text-[#f8e6e2]">
                <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                이미지를 만드는 중이에요…
              </p>
            )}
          </div>

          <div className="mt-4 text-[0.88rem] leading-[1.6]">
            <p className="font-semibold text-[#6e2a40]">이미지에 들어가는 것</p>
            <ul className="mt-1 list-disc pl-5">
              <li>카드 제목 ‘{title}’과 운결 로고</li>
              <li>{INCLUDED[kind]}</li>
              {isDemo(r) && <li>‘샘플 결과’ 표시</li>}
            </ul>
            <p className="mt-3 font-semibold text-[#6e2a40]">넣지 않는 것</p>
            <p className="mt-1">
              이름, 생년월일, 태어난 시간, 성별{kind === "manse" ? ", 만세력 여덟 글자(생년월일을 짐작할 수 있어 제외)" : ""}
            </p>
          </div>

          {intent === "share" && ready && !support.files && (
            <p role="note" className="mt-3 rounded-xl bg-[#974d5e]/10 px-3 py-2.5 text-[0.85rem] leading-[1.55] text-[#6e2a40]">
              이 브라우저는 이미지 공유를 지원하지 않아요. 대신 이미지 파일로 저장한 뒤 직접 보내 주세요.
            </p>
          )}
          {intent === "save" && ready && support.isIOS && support.files && (
            <p role="note" className="mt-3 rounded-xl bg-[#974d5e]/10 px-3 py-2.5 text-[0.85rem] leading-[1.55] text-[#6e2a40]">
              사진 앱에 바로 저장하려면 ‘공유 시트 열기’ → ‘이미지 저장’을 눌러 주세요. ‘이미지 저장’ 버튼은 파일 앱에 저장해요.
            </p>
          )}

          <p role={status.kind === "error" ? "alert" : "status"} aria-live="polite" className={status.kind === "idle" ? "sr-only" : status.kind === "error" ? "mt-3 text-[0.88rem] font-medium text-[#a1283f]" : "mt-3 text-[0.88rem] font-medium text-[#3f6b4a]"}>
            {status.kind === "idle" ? "" : status.text}
          </p>
        </div>

        <div className="flex gap-2 px-5 pt-3">
          {primaryIsShare ? (
            <>
              <button type="button" onClick={doSave} disabled={!ready} className="min-h-12 flex-1 rounded-full text-[0.95rem] font-medium text-[#6e2a40] shadow-[inset_0_0_0_1.5px_#c9a27a] disabled:opacity-40">
                이미지 저장
              </button>
              <button type="button" onClick={doShare} disabled={!ready || busy} className="min-h-12 flex-[1.4] rounded-full bg-[#974d5e] text-[0.95rem] font-semibold text-white shadow-[inset_0_0_0_1.5px_#c96f81] disabled:opacity-40">
                공유하기
              </button>
            </>
          ) : (
            <>
              {intent === "save" && support.isIOS && support.files && (
                <button type="button" onClick={doShare} disabled={!ready || busy} className="min-h-12 flex-1 rounded-full text-[0.95rem] font-medium text-[#6e2a40] shadow-[inset_0_0_0_1.5px_#c9a27a] disabled:opacity-40">
                  공유 시트 열기
                </button>
              )}
              <button type="button" onClick={doSave} disabled={!ready} className="min-h-12 flex-[1.4] rounded-full bg-[#974d5e] text-[0.95rem] font-semibold text-white shadow-[inset_0_0_0_1.5px_#c96f81] disabled:opacity-40">
                {intent === "share" ? "이미지 파일로 저장" : "이미지 저장"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 공유용 카드 — 화면 밖에 그려 두고 이미지로만 사용 (개인정보 없음) */}
      <div aria-hidden className="pointer-events-none fixed top-0 left-[-10000px]" style={{ width: 360 }}>
        <div ref={captureRef} style={{ width: 360, padding: 12, background: "#2c1720" }}>
          <Card r={r} mode="share" />
          <p className="text-center font-serif" style={{ marginTop: 10, fontSize: 11, lineHeight: 1.5, color: "#e8c9ac", letterSpacing: "0.04em" }}>
            운결 · 사주 × MBTI 운명 상담
            {isDemo(r) && <span style={{ display: "block", color: "#cbb3ad" }}>샘플 결과 · 실제 사주 계산 결과가 아닙니다</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
