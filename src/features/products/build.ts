import { PRODUCTS } from "@/content/products";
import { REUNION_LABELS } from "@/content/products/reunion";
import { buildOtherChapters } from "./others";
import { buildReunionChapters, reunionFreeSummary } from "./reunion";
import { sampleSource, type ProductSource } from "./source";
import type { ProductBasis, ProductId, ProductReport } from "./types";

/* ──────────────────────────────────────────────────────────
   상품 리포트 조립 — 상품 정의(content) + 재료(source) → ProductReport
   basis(화면에 보이는 상담 요약)에는 이름 · 생년월일 · 상대 생년월일 · 이별 날짜를 넣지 않음
   ────────────────────────────────────────────────────────── */

function basisOf(id: ProductId, s: ProductSource): ProductBasis {
  const p = s.partner;
  const rows: ProductBasis = [
    { label: "MBTI", value: s.mbti ?? "모름" },
    { label: "출생 시간", value: s.timeUnknown ? "모름" : "있음" },
  ];
  if (id === "reunion" || id === "compat")
    rows.push({ label: "상대 정보", value: !p ? "없음" : [p.birth ? "생년월일 받음" : null, p.mbti ? `MBTI ${p.mbti}` : null].filter(Boolean).join(" · ") || "없음" });
  if (id === "reunion") {
    const r = s.reunion;
    rows.push({ label: "이별 시기", value: r?.breakup && r.breakup !== "private" ? "입력됨" : r?.breakup === "private" ? "말하지 않음" : "미확정" });
    rows.push({ label: "연락", value: r?.contact ? REUNION_LABELS.contact[r.contact] : "미확정" });
  }
  return rows;
}

export function buildProductReport(id: ProductId, s: ProductSource, src: ProductReport["source"] = null): ProductReport {
  const product = PRODUCTS[id];
  const chapters = id === "reunion" ? buildReunionChapters(s) : buildOtherChapters(id, s);
  return { product, reportId: s.reportId, payload: s.payload, basis: basisOf(id, s), chapters, source: src };
}

export function buildProductSample(id: ProductId): ProductReport {
  return buildProductReport(id, sampleSource(id));
}

/** 채팅의 무료 요약 카드 줄 */
export function productFreeSummary(id: ProductId, s: ProductSource): string[] {
  if (id === "reunion") return reunionFreeSummary(s);
  const r = buildProductReport(id, s);
  const free = r.chapters.find((c) => c.status === "written");
  return free ? [free.summary, `공개 샘플 · ${free.id} ${free.title}`] : [PRODUCTS[id].summary];
}

export { productHref } from "./routes";
