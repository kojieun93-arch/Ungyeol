import { Button, Card, CardBody, CardEyebrow, CardTitle, Ornament } from "@/components/ui";
import { AppShell } from "./AppShell";
import { TopBar } from "./TopBar";

/** 아직 구현되지 않은 단계용 화면. 기능이 있는 것처럼 보이지 않도록 '준비 중'을 분명히 표기 */
export function ComingSoon({
  chapter,
  title,
  body,
  secondaryHref = "/result",
  secondaryLabel = "샘플 결과 둘러보기",
}: {
  chapter: string;
  title: string;
  body: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <AppShell>
      <TopBar title={title} />
      <main className="flex flex-1 animate-rise items-center px-6 pb-10">
        <Card variant="veil" padding="lg" className="w-full text-center">
          <CardEyebrow>{chapter}</CardEyebrow>
          <CardTitle className="type-title">{title}</CardTitle>
          <Ornament className="my-5" />
          <CardBody className="type-body">{body}</CardBody>
          <p className="type-small mt-3 text-fg-subtle">이 단계는 아직 준비 중입니다.</p>
          <div className="mt-7 flex flex-col gap-2">
            <Button href={secondaryHref} fullWidth>
              {secondaryLabel}
            </Button>
            <Button href="/" variant="secondary" fullWidth>
              처음으로
            </Button>
          </div>
        </Card>
      </main>
    </AppShell>
  );
}
