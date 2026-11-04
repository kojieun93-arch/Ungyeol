import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { ProductReader } from "@/components/report/product/ProductReader";
import { PRODUCTS } from "@/content/products";
import { PRODUCT_IDS, isProductId } from "@/features/products/types";
import { isReportId } from "@/features/report/types";

type Params = { params: Promise<{ productId: string; reportId: string }> };

export function generateStaticParams() {
  return PRODUCT_IDS.flatMap((productId) => ["sample", "my"].map((reportId) => ({ productId, reportId })));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { productId, reportId } = await params;
  if (!isProductId(productId)) return {};
  return { title: `${PRODUCTS[productId].title} ${reportId === "sample" ? "샘플" : ""} — 운결`.replace("  ", " ") };
}
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#2e1c24" };

export default async function ProductReportPage({ params }: Params) {
  const { productId, reportId } = await params;
  if (!isProductId(productId) || !isReportId(reportId)) notFound();
  return <ProductReader productId={productId} reportId={reportId} />;
}
