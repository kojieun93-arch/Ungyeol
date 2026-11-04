# 운결 UNGYEOL — 프리미엄 운명 아틀리에

사주 × MBTI 개인 리포트 모바일 웹앱 · Next.js App Router · TypeScript · Tailwind CSS v4

> 내 안의 두 가지 결이 만나는 순간

## 실행

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck    # 타입 검사
npm run build        # 프로덕션 빌드
```

### 모바일에서 미리보기

1. **휴대폰 실기기 (같은 Wi‑Fi)**
   - `npm run dev:mobile` 실행 (외부 기기 접속 허용)
   - PC의 내부 IP 확인: macOS `ipconfig getifaddr en0`, Windows `ipconfig`
   - 휴대폰 브라우저에서 `http://<PC IP>:3000` 접속
   - 접속이 안 되면 PC 방화벽에서 3000 포트를 허용하세요
2. **PC 브라우저 기기 모드**: Chrome 개발자 도구 → 기기 툴바(⌘⇧M / Ctrl+Shift+M) → 390 × 844 (iPhone 14 계열)
3. **iPhone SE 같은 작은 화면 확인**: 기기 모드에서 375 × 553 (주소창이 보이는 SE의 실제 가시 영역)

## 라우트

| 경로 | 화면 | 상태 |
|---|---|---|
| `/` | **인트로** — 운결 상담자 일러스트 + 메인 카피 → `/chat`, 보조 링크 → `/home` | 구현 |
| `/home` | **운세 홈** — 대표(사주 × MBTI 통합 분석) + 운세 8종 카드 | 구현 (PHASE 1) |
| `/fortune/[id]` | 운세 카테고리 — 소개 · 무료/심층(준비 중) · 준비할 정보 → 상담 시작 | 구현 (PHASE 1) |
| `/chat` | **운결 채팅 상담** (메신저형) — `?topic=<id>` 로 주제별 상담, 없으면 기본 상담 | 구현 |
| `/result` | 결과 — 타고난 나 × 지금의 나, 운명 지도 | 구현 (**샘플 데이터**) |
| `/report` | 종합 리포트 소개 · 12챕터 목차 | 구현 (판매 없음) |
| `/report/sample`, `/report/my` | 12챕터 종합 리포트 (공개 01 · 04, 데모 체험) | 구현 (PHASE 4, **데모 사주**) |
| `/report/[id]/chapter/[nn]` | 챕터 위치로 바로 | 구현 |
| `/reports` | 주제별 리포트 7종 목록 | 구현 (PHASE 5, 판매 없음) |
| `/reports/[productId]` | 상품 소개 · 받는 정보 · 목차 · 미리 읽기 · 가격/환불(미정) | 구현 |
| `/reports/[productId]/[sample\|my]` (`/chapter/[nn]`) | 주제별 리포트 읽기 — 재회운 10챕터 완성, 나머지 6개는 구조 + 샘플 1챕터 | 구현 (**데모 사주**) |
| `/explore` | 먼저 둘러보기 | 구현 |
| `/scan`, `/mbti` | 준비 중 안내 (입력은 채팅 홈에서 진행) | 유지 |

확장 계획과 단계별 명세: [`docs/ROADMAP.md`](docs/ROADMAP.md)

## 채팅 홈 구조

```
src/features/chat/          # UI와 분리된 대화 로직
├─ types.ts                 # 메시지·프로필·대본 타입
├─ script.ts                # ★ 대본(상태 머신). 문구·순서 수정은 여기만
├─ reducer.ts               # 순수 상태 전이 (typing → deliver → prompt → answer)
├─ timing.ts                # 메시지 리듬 (400ms → 입력 중 700ms → 이후 500~900ms 간격)
├─ hooks.ts                 # 시퀀서 · 자동 스크롤 · 키보드(visualViewport) · reduced motion
├─ validation.ts            # 생년월일·시간·이름 검증
└─ format.ts                # 시간·생년월일 표기
src/components/chat/
├─ ChatRoom.tsx             # 조립: 헤더 / 대화 목록(role=log) / 하단 답변 영역
├─ ChatHeader.tsx, HeaderMenu.tsx
├─ ChatMessage.tsx          # 말풍선 + 묶음(첫 줄 프로필·이름, 마지막 줄 시간)
├─ ChatAvatar.tsx           # 원형 프로필 (이미지 없으면 '운' 플레이스홀더)
├─ TypingIndicator.tsx      # 점 세 개
├─ ChoiceButtons.tsx        # 선택형 답변
├─ ChatComposer.tsx         # 하단 정보 칩(⊞·생년월일·태어난 시간·성별·MBTI) + 입력창(+ · input · 보내기)
├─ spec.ts                  # 원본 실측 치수
├─ forms/                   # BirthDateForm · BirthTimeForm · MbtiForm (실제 input/select/radio)
└─ cards/                   # SummaryCard(입력 확인) · SampleResultCard(샘플 분석)
```

### 메시지 등장 원리

- 아직 나오지 않은 메시지는 `queue`에만 있고 **DOM에 렌더링되지 않습니다.**
- 시퀀서는 queue 맨 앞 하나만 보고 타이머를 1개만 둡니다. 언마운트·상태 변경 시 cleanup에서 정리됩니다.
- reducer는 모든 진행 액션을 메시지 id로 확인하고, 맞지 않으면 무시합니다. 그래서 React StrictMode의 이중 effect나 늦게 도착한 타이머가 있어도 중복·순서 꼬임이 없습니다.
- 사용자 응답이 필요한 단계에서는 자동 진행을 멈춥니다(`prompt`). 응답은 한 번만 받습니다(연타 무시).
- 맨 아래를 보고 있을 때만 자동 스크롤합니다. 위로 올려 읽는 중에는 `새 메시지 N개` 버튼만 나타납니다.
- `prefers-reduced-motion`이면 순서는 같고 리듬은 절반, 이동·반복 애니메이션은 꺼집니다.

### 재진입 정책 (`src/features/chat/memory.ts`)

| 상황 | 대화 |
|---|---|
| 앱 안에서 다른 화면(인트로·결과 등)에 다녀옴 | **이어서** — 이미 본 메시지는 애니메이션 없이, 진행 중이던 메시지는 이어서 등장. 경계에 '이전 대화에 이어서' 표시 |
| 새로고침 · 탭 닫기 | **처음부터** |
| 마지막 활동 후 30분 | **처음부터** |
| `⋯ → 처음부터 다시` | **즉시 삭제 후 처음부터** |

대화는 JS 모듈 메모리에만 있습니다. 서버 렌더링 중에는 읽거나 쓰지 않습니다.

### 개인정보

대화 중 입력한 정보는 컴포넌트 메모리에만 있습니다. 서버 전송·localStorage 저장이 없습니다. 새로고침하거나 `⋯ → 처음부터 다시`를 누르면 지워지며, 이 내용은 대화와 메뉴에서 안내합니다.

### 샘플 결과

실제 만세력 계산은 아직 없습니다. 운결이 이를 대화에서 직접 밝히고, 입력과 무관한 **샘플 사주**로 만든 결과 카드를 보여줍니다. 모든 카드 헤더에 `운결 샘플 결과`, 알약에 `샘플 결과 · 샘플 분석`, 아래에 안내문이 붙습니다.

### 결과 카드 6종 (`src/components/reading/`)

대화에서 순서대로 도착: 사주 원국 → 오행 분석 → 타고난 나 → 지금의 나 → 두 개의 나 → 종합 인사이트

| 파일 | 역할 |
|---|---|
| `Frame.tsx` | 공통 틀 (딥 플럼 헤더 · 공식 로고 윗부분 · 크림 카드 · 금빛 이중 테두리 · 매듭 · 구름 · 벚꽃). 길이는 모두 em → `chat`/`full`/`share` 세 크기 |
| `cards.tsx` | 카드 6종. `ReadingResult` 만 받아 그림 (표·그래프·문구 모두 HTML/SVG) |
| `details.tsx` | 전체 화면의 상세 해석 |
| `ChatReadingCard.tsx` | 채팅 안 요약 카드 + 확대 버튼 |
| `ReadingViewer.tsx` · `useReadingViewer.ts` | 전체 화면 (이전·다음, Esc·닫기·브라우저 뒤로가기, 포커스 가두기·복귀, 뒤 채팅 inert) |
| `ShareSheet.tsx` + `features/share/cardImage.ts` | 공유·저장 미리보기 → html-to-image 로 1080px PNG → Web Share(파일) 또는 내려받기 |

데이터: `features/saju/reading.ts` 의 `buildReading(ManseResult, mbti)` 가 `FiveElementDistribution · SajuPersonality · SelfReportedMBTI · SajuMBTIComparison · IntegratedInsight` 를 만듭니다. 일간 10개 해석은 `personality.ts`, MBTI 16유형은 `mbti.ts`.

공유 이미지에는 카드 제목·요약·로고·샘플 표시만 들어가고, 이름·생년월일·태어난 시간·성별·만세력 여덟 글자는 넣지 않습니다. 공유 전 미리보기에서 포함·제외 항목을 보여줍니다.

### HRUM 만세력 연동 (남은 작업)

1. 서버 전용 Route Handler(예: `app/api/manse/route.ts`)에서 `process.env.HRUM_API_KEY` 로 HRUM 호출 — 키는 클라이언트 번들·저장소에 넣지 않음 (`.env*` 는 .gitignore)
2. HRUM 응답 → `ManseResult` 변환 (`STEMS`/`BRANCHES` 표 사용), `isSample: false, source: "hrum"`
3. `HrumManseProvider` 가 그 Route Handler 를 부르도록 구현하고 `provider.ts` 의 `manseProvider` 교체
4. `ChatReadingCard.readingForProfile` 을 비동기 결과(로딩·오류 상태 포함)로 교체 → 카드·공유 이미지의 '샘플' 표시는 `isSample` 로 자동 전환
5. 대운 방향(성별) · 음력/윤달 변환 결과 검증

### 디자인 원본과 이미지

- 원본 3장: `design/source/01-logo.png` · `02-character.png` · `03-chat.png` (배포되지 않음)
- 로고·캐릭터·채팅 배경은 원본에서 잘라 쓰고, 문구·말풍선·버튼·입력창은 HTML/CSS로 구현
- 처리 내역과 교체 방법: `public/images/README.md`

### 모바일 사용성 기준

- 본문 14~15px (`READ.body = clamp(14px, 3.85vw, 15px)`), 글꼴·굵기 470 유지. 여백·모서리·꼬리는 원본 비율을 em 으로 유지
- 입력창 글자 16px (iOS 자동 확대 방지). `maximumScale` 같은 확대 제한 없음
- 하단 칩·⊞·+·보내기, 헤더 ‹·⋯ 의 실제 버튼 요소는 모두 44×44px 이상 (보이는 모양은 원본 크기)
- 정보 칩 줄은 좁은 화면에서 가로 스크롤, 지금 묻는 항목 칩은 자동으로 보이게 이동
- 키보드: visualViewport 높이·위치를 따라 채팅 화면을 맞춤, 열려 있으면 하단 safe-area 여백 축소, 채팅 중 문서 스크롤 잠금

### 채팅 화면 치수

`src/components/chat/spec.ts` 에 원본(954×1649) 실측값이 원본 픽셀 단위로 정리되어 있습니다.
`--u = 화면 폭 / 954` 로 변환하므로 375 · 390 · 430px 어디서나 원본과 같은 비율입니다.

## 디자인 원칙

- **색**: 딥 플럼(밤·바탕) / 뮤트 라벤더(안개·지금의 나) / 샴페인 골드(달빛·타고난 나) / 상아 종이(리포트 지면)
- **글**: 제목 Noto Serif KR(명조), 본문 Pretendard(고딕), 챕터 라벨 Cormorant 이탤릭
- **구성**: 긴 스토리 대신 `Chapter 00 → 04` 의 짧은 챕터. 캐릭터·말풍선·웹툰·HUD 없음
- **정직성**
  - 샘플 화면에는 상단 `샘플` 배지와 안내문을 항상 표시
  - 해석은 '경향'으로 서술하고, 특정 사건을 예측·보장하지 않음
  - 후기·평점·사용자 수 같은 사회적 증거를 만들어 넣지 않음
  - 심층 리포트는 '준비 중' 미리보기로만 노출. 가격·결제 버튼 없음
- **모션**: 진입 페이드, 달무리 호흡, 안개 흐름, 수면 반짝임, 두 결이 그려지는 선. 모두 CSS이며 `prefers-reduced-motion`에서 반복 모션 정지

## 실제 데이터 연결

`src/app/result/page.tsx` 의 `SAMPLE_RESULT` 를 `ResultData` 타입과 같은 모양의 실제 계산 결과로 바꾸고 `isSample: false` 로 두면 샘플 배지와 안내문이 사라집니다.

## 이미지 에셋 교체

`public/images/README.md` 와 `src/content/assets.ts` 참고. `src`가 비어 있으면 코드 일러스트가 그대로 쓰입니다.
