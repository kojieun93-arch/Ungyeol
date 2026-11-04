import type { Metadata, Viewport } from "next";
import { ManseCheck } from "@/components/check/ManseCheck";

/** /check/manse — 운영자용 HRUM 실제 계산 검증 (링크 없음 · 검색 제외 · 계산은 확인 토큰이 있어야만) */
export const metadata: Metadata = { title: "만세력 검증 — 운결", robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#2e1c24" };

export default function ManseCheckPage() {
  return <ManseCheck />;
}
