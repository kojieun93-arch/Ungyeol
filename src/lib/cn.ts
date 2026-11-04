/** 조건부 className 결합 (의존성 없는 경량 버전) */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
