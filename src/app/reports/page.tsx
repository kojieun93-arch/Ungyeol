import type { Metadata, Viewport } from "next";
import { ProductCatalog } from "@/components/report/product/ProductCatalog";

export const metadata: Metadata = { title: "주제별 리포트 — 운결", description: "사주 × MBTI 주제별 리포트 7종 (판매 전 테스트 · 샘플)" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#2e1c24" };

export default function ReportsPage() {
  return <ProductCatalog />;
}
