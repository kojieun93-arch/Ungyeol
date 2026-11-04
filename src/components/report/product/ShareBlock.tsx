"use client";

import { useState } from "react";
import { Sheet } from "@/components/report/common";
import { productHref } from "@/features/products/build";
import type { ProductId } from "@/features/products/types";
import type { ReportId } from "@/features/report/types";

/* ──────────────────────────────────────────────────────────
   공유 · 저장
   - 링크: 공개 샘플 리포트 주소만 (개인정보 · 상담 내용이 주소에 들어가지 않음)
     내 리포트는 이 탭의 메모리에만 있어 링크로 열리지 않으므로 공유하지 않음
   - 이미지: 챕터의 '결과 카드 크게 보기 · 이미지 저장' (이름 · 생년월일 없는 기본 템플릿, 샘플 표시 포함)
   - 복사 실패 시 주소를 그대로 보여 줘 직접 복사할 수 있게
   ────────────────────────────────────────────────────────── */

export function ShareBlock({ productId, reportId, title }: { productId: ProductId; reportId: ReportId; title: string }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const url = () => new URL(productHref(productId, "sample"), window.location.href).href;

  const copy = async () => {
    const u = url();
    try {
      if (!navigator.clipboard?.writeText) throw new Error("no clipboard");
      await navigator.clipboard.writeText(u);
      setMsg({ ok: true, text: "공개 샘플 리포트 주소를 복사했어요." });
    } catch {
      setMsg({ ok: false, text: `복사하지 못했어요. 아래 주소를 길게 눌러 복사해 주세요. ${u}` });
    }
  };

  return (
    <section aria-labelledby="share-title" className="reveal">
      <Sheet className="px-4 pt-7 pb-5">
        <h2 id="share-title" className="text-center font-serif text-[18px] font-semibold text-[#4a1a2c]">
          공유 · 저장
        </h2>
        <ul className="mt-3 space-y-2 text-[14.5px] leading-[1.6] [word-break:keep-all]">
          <li>· 결과 카드는 챕터 안의 ‘결과 카드 크게 보기 · 이미지 저장’에서 한 장씩 저장할 수 있어요. 이름과 생년월일은 들어가지 않고, 샘플 표시가 함께 들어가요.</li>
          <li>· {reportId === "my" ? "내 리포트는 이 기기의 이 탭에서만 열려서 링크로 공유되지 않아요. 대신 공개 샘플 리포트 주소를 공유할 수 있어요." : `‘${title}’ 공개 샘플 주소를 공유할 수 있어요. 상담 내용은 들어가지 않아요.`}</li>
        </ul>
        <button type="button" onClick={copy} className="mt-4 flex min-h-12 w-full items-center justify-center rounded-full bg-[#4a1a2c] text-[15px] font-medium text-[#fff4e8] shadow-[0_0_0_1px_#d3ab7c]">
          공개 샘플 링크 복사
        </button>
        <p role="status" aria-live="polite" className={`mt-2 min-h-[1.5em] break-all text-center text-[13px] ${msg?.ok === false ? "text-[#8a3b2e]" : "text-[#6e2a40]"}`} data-share={msg ? (msg.ok ? "ok" : "fail") : undefined}>
          {msg?.text}
        </p>
      </Sheet>
    </section>
  );
}
