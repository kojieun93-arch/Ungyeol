import type { Report } from "./types";

/* ──────────────────────────────────────────────────────────
   리포트 내보내기 — 추후 확장 자리
   지금은 결과 카드 한 장씩 이미지로 저장(features/share/cardImage.ts)만 동작
   전체 리포트 PDF 는 아직 구현하지 않음 → 화면에는 '준비 중'으로만 표시
   구현할 때: 서버에서 공유용(개인정보 제외) 리포트를 렌더링해 PDF 로 만드는 방식 권장
   ────────────────────────────────────────────────────────── */

export interface ReportExporter {
  readonly format: "pdf";
  readonly available: boolean;
  export(report: Report): Promise<Blob>;
}

export const pdfExporter: ReportExporter = {
  format: "pdf",
  available: false,
  async export() {
    throw new Error("PDF 내보내기는 아직 준비 중이에요.");
  },
};
