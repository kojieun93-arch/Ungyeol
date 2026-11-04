import { ART_SRC, type FortuneCategory } from "@/content/fortunes";
import { cn } from "@/lib/cn";
import { EmblemMark } from "./emblems";

/**
 * 카드 그림 — 채팅 배경 원본 조각(벚꽃 · 창호 빛 · 등불 · 꽃잎) + 금빛 문양
 * 카드마다 조각 · 위치 · 좌우 반전을 달리해 같은 브랜드 그림 안에서 구분
 */
export function FortuneArt({ f, className, emblemClass }: { f: FortuneCategory; className?: string; emblemClass?: string }) {
  return (
    <div className={cn("relative isolate overflow-hidden bg-[#3a2229]", className)} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element -- 원본 배경 조각 (정적 파일) */}
      <img
        src={ART_SRC[f.art.src]}
        alt=""
        loading="lazy"
        decoding="async"
        className={cn("absolute inset-0 size-full object-cover", f.art.flip && "-scale-x-100")}
        style={{ objectPosition: f.art.position ?? "50% 50%" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(70%_70%_at_50%_55%,rgb(46_28_36/0.15),rgb(46_28_36/0.65))]" />
      <div className="absolute inset-0 grid place-items-center">
        <span className="grid place-items-center rounded-full bg-[#2e1c24]/55 shadow-[0_0_0_1px_rgb(232_201_172/0.45),0_0_24px_rgb(0_0_0/0.35)] backdrop-blur-[1px]" style={{ width: "42%", aspectRatio: "1" }}>
          <EmblemMark name={f.emblem} className={cn("w-[70%]", emblemClass)} />
        </span>
      </div>
    </div>
  );
}
