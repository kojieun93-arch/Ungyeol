import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { ProductIntro } from "@/components/report/product/ProductIntro";
import { PRODUCTS } from "@/content/products";
import { PRODUCT_IDS, isProductId } from "@/features/products/types";

type Params = { params: Promise<{ productId: string }> };

export function generateStaticParams() {
  return PRODUCT_IDS.map((productId) => ({ productId }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { productId } = await params;
  return isProductId(productId) ? { title: `${PRODUCTS[productId].title} — 운결`, description: PRODUCTS[productId].summary } : {};
}
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#2e1c24" };

export default async function ProductPage({ params }: Params) {
  const { productId } = await params;
  if (!isProductId(productId)) notFound();
  return <ProductIntro productId={productId} />;
}
