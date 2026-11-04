# 실행 · 빌드 검증 안내

## 실제 환경에서 할 일 (인터넷이 되는 컴퓨터)

```bash
node -v              # 18.18 이상 (권장 20 · 22 LTS)
npm install          # package-lock.json 이 처음 만들어져요 → 저장소에 함께 커밋
npm run typecheck    # tsc --noEmit
npm run build        # next build — 정적 페이지 생성까지
npm run start        # http://localhost:3000
```

한 번에: `npm run verify` (typecheck → build)

- `next/font/google` 을 쓰므로 `npm run build` 중에 Google Fonts 에 접속해요. 인터넷이 막힌 CI 라면 빌드가 실패할 수 있어요.
- ESLint 는 설치되어 있지 않아요. 빌드 중 ‘ESLint must be installed’ 경고는 정상이고 빌드는 계속돼요.

## 빌드되는 라우트 (정적 생성)

| 라우트 | 개수 |
|---|---|
| `/` `/home` `/chat` `/result` `/report` `/explore` `/mbti` `/scan` `/reports` | 9 |
| `/fortune/[id]` | 9 |
| `/report/[sample\|my]` · `/chapter/[01~12]` | 2 + 24 |
| `/reports/[productId]` | 7 |
| `/reports/[productId]/[sample\|my]` · `/chapter/[nn]` | 14 + 88 |

`/chat` 은 주소의 `?topic=` `?product=&report=&chapter=` 를 읽어서 요청마다 렌더링돼요 (id 만, 개인정보 없음).

## 개발 환경(클라우드 세션)에서 한 검증 — 실제 Next 빌드 대체

패키지 저장소(registry.npmjs.org)에 접속할 수 없어 `npm install` · `next build` 를 실행하지 못했을 때 쓴 방법이에요.

1. 정적 생성 시뮬레이션: 모든 `generateStaticParams` 를 돌려 각 페이지를 React 19 `renderToString` 으로 렌더 (next/link · next/font 는 대체 모듈)
   - 157개 정적 라우트 렌더 성공, 잘못된 주소 → notFound
   - 시계를 1년 옮겨 다시 렌더해도 HTML 이 같은지 확인 (하이드레이션 불일치 방지)
2. 타입 검사: 실제 `@types/react` 대신 최소 React 타입으로 전체 `src` 검사
3. 브라우저 테스트: esbuild 로 묶은 화면을 Playwright(Chromium) 로 라우트 · 상담 · 리포트 · 3가지 화면 크기 검사

실제 `npm run typecheck` · `npm run build` 를 대신하지 않아요. 실제 환경에서 위 명령을 꼭 실행해 주세요.

## HRUM 연결 전 준비 상태

- 화면은 `ManseProvider` 인터페이스만 사용 (`src/features/saju/provider.ts`), 지금은 `MockManseProvider` (결과는 항상 `resultStatus: "demo"`)
- 키는 서버 환경 변수로만: `.env.example` 참고. `.env*` 는 gitignore (예외 `.env.example`)
- 클라이언트 코드에 `NEXT_PUBLIC_` 환경 변수 없음, API 키 · 개인정보 없음
