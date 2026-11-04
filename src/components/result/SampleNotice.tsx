/** 샘플 데이터임을 분명히 알리는 안내 */
export function SampleNotice() {
  return (
    <div role="note" className="mx-6 flex gap-3 rounded-2xl border border-champagne-300/20 bg-champagne-300/[0.05] px-4 py-3.5">
      <svg viewBox="0 0 20 20" fill="none" className="mt-0.5 size-4 shrink-0 text-champagne-300" aria-hidden>
        <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.2" />
        <path d="M10 9v4.5M10 6.5v.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <p className="type-small text-fg-muted">
        이 화면은 <strong className="font-semibold text-champagne-200">샘플 결과</strong>입니다. 실제 생년월일로
        계산한 내용이 아니며, 결과 화면이 어떻게 구성되는지 보여주기 위한 예시입니다.
      </p>
    </div>
  );
}
