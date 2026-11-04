import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { ProductReader } from "@/components/report/product/ProductReader";
import { PRODUCTS } from "@/content/products";
import { PRODUCT_IDS, isProductId } from "@/features/products/types";
import { isReportId } from "@/features/report/types";

type Params = { params: Promise<{ productId: string; reportId: string; chapterId: string }> };

/** 7개 상품 × 샘플 · 내 리포트 × 각 상품의 챕터 */
export function generateStaticParams() {
  return PRODUCT_IDS.flatMap((productId) =>
    ["sample", "my"].flatMap((reportId) => PRODUCTS[productId].chapters.map((c) => ({ productId, reportId, chapterId: c.id }))),
  );
}
export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { productId, chapterId } = await params;
  if (!isProductId(productId)) return {};
  const c = PRODUCTS[productId].chapters.find((x) => x.id === chapterId);
  return c ? { title: `${chapterId} ${c.title} · ${PRODUCTS[productId].title} — 운결` } : {};
}
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#2e1c24" };

export default async function ProductChapterPage({ params }: Params) {
  const { productId, reportId, chapterId } = await params;
  if (!isProductId(productId) || !isReportId(reportId) || !PRODUCTS[productId].chapters.some((c) => c.id === chapterId)) notFound();
  return <ProductReader productId={productId} reportId={reportId} chapterId={chapterId} />;
}
