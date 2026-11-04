import { toBlob } from "html-to-image";

/* ──────────────────────────────────────────────────────────
   결과 카드 → PNG 이미지 · 공유 · 저장
   - 이미지: html-to-image 로 '공유용 카드' DOM 을 그대로 그림 (카드 디자인 = 공유 이미지)
   - 공유: Web Share API 의 파일 공유(navigator.canShare({ files })) 가 될 때만
   - 저장: <a download> 로 PNG 파일 내려받기
   iOS Safari 참고
   - 파일 공유는 iOS 15 이상에서 지원, 공유 시트의 ‘이미지 저장’으로 사진 앱에 저장 가능
   - <a download> 는 사진 앱이 아니라 ‘파일’ 앱(다운로드)으로 저장됨
   - Safari 는 SVG foreignObject 안의 이미지를 첫 렌더에서 빠뜨리는 경우가 있어 한 번 미리 그린 뒤 다시 그림
   ────────────────────────────────────────────────────────── */

export type ShareSupport = {
  /** 파일까지 공유할 수 있는지 (navigator.canShare 로 확인) */
  files: boolean;
  isIOS: boolean;
};

export function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isSafari() {
  if (typeof navigator === "undefined") return false;
  return /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
}

export function shareSupport(file: File | null): ShareSupport {
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  let files = false;
  try {
    files = !!(file && nav?.share && nav.canShare && nav.canShare({ files: [file] }));
  } catch {
    files = false;
  }
  return { files, isIOS: isIOS() };
}

async function waitForAssets(node: HTMLElement) {
  const imgs = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    imgs.map((img) =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          }),
    ),
  );
  if (typeof document !== "undefined" && document.fonts?.ready) await document.fonts.ready;
}

/** 공유용 카드 DOM → PNG. 폭 360px × pixelRatio 3 = 1080px */
export async function renderCardImage(node: HTMLElement, { pixelRatio = 3 }: { pixelRatio?: number } = {}): Promise<Blob> {
  await waitForAssets(node);
  const opts = { pixelRatio, cacheBust: false, backgroundColor: "#2c1720" };
  if (isSafari()) {
    // Safari: 첫 렌더에서 이미지·글꼴이 빠지는 문제를 피하려고 한 번 미리 그림
    await toBlob(node, opts).catch(() => null);
  }
  const blob = await toBlob(node, opts);
  if (!blob || blob.size < 1000) throw new Error("이미지를 만들지 못했어요.");
  return blob;
}

/**
 * 저장 파일 이름 — 영문 · 숫자만 (한글 파일 이름은 일부 브라우저에서 'download' 로 바뀌거나 깨짐)
 * 예: ungyeol-manse.png
 */
export function fileName(slug: string) {
  return `ungyeol-${slug.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "card"}.png`;
}

export type ShareOutcome = "shared" | "cancelled";

/** 네이티브 공유. 사용자가 공유 시트를 닫으면 cancelled (오류 아님) */
export async function shareImage(file: File, title: string): Promise<ShareOutcome> {
  try {
    // 일부 iOS 버전에서 text 를 함께 넣으면 파일이 빠지는 경우가 있어 파일 + 제목만
    await navigator.share({ files: [file], title });
    return "shared";
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
    throw e;
  }
}

/** PNG 파일 내려받기 */
export function downloadImage(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // 브라우저가 다운로드를 시작할 시간을 둔 뒤 정리
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
