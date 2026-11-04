# 운결 확장 로드맵 — PHASE 1 ~ 6

대화형 상담 + 종합 운세 홈 + 개인 맞춤 심층 리포트.
각 단계는 이전 단계가 정상 작동하는지 확인한 뒤 시작합니다.

## 바꾸지 않는 것

공식 로고 · 확정된 여성 상담자 캐릭터 · 인트로 이미지 · 벚꽃·창호 채팅 배경 · 글꼴과 버건디·크림 색 · 말풍선 디자인과 애니메이션 · 기존 상담 상태 관리(`features/chat/reducer.ts`)와 검증(`features/chat/validation.ts`).

## 현재 구조 (PHASE 1 기준)

```
src/
  app/
    page.tsx                 /            인트로 (메인 버튼 → /chat, 보조 링크 → /home)
    home/page.tsx            /home        운세 홈                     ← PHASE 1
    fortune/[id]/page.tsx    /fortune/:id 운세 카테고리 (9개 정적 생성) ← PHASE 1
    chat/page.tsx            /chat        운결 상담 (결과 카드 6종 · 전체 화면 · 공유)
    result, report, explore  샘플 결과 · 리포트 미리보기 · 둘러보기
  components/
    home/       HomeScreen · FortuneDetail · FortuneArt · emblems · parts   ← PHASE 1
    chat/       ChatRoom · ChatMessage · ChatComposer · forms/ · cards/
    reading/    결과 카드 6종 · ReadingViewer · ShareSheet
  content/
    fortunes.ts          카테고리 데이터 · 입력 항목 · 무료/심층 구성 · PRODUCT_OFFERS(가격 null)  ← PHASE 1
    report-chapters.ts   종합 리포트 12챕터 명세                                              ← PHASE 1 (명세)
  features/
    chat/   대본(script) · 상태 머신(reducer) · 순서(timing) · 검증 · 이어보기(memory)
    saju/   types · provider(Mock) · reading(카드 데이터) · personality · mbti · topics
    share/  cardImage (html-to-image)
  types/
    domain.ts   UserProfile · BirthInformation · ConsultationSession · FortuneReport · ReportChapter · PurchaseStatus …  ← PHASE 1 (명세)
```

## PHASE 1 — 운세 홈과 카테고리 (구현 완료)

- `/home`: 공식 로고 · 상담자 인사(원형 프로필 + 크림 말풍선) · 대표 카드(사주 × MBTI 통합 분석) · 운세 8종 2열 카드 · 진행 순서 · 샘플·정보 처리 안내
- 카드마다 제목 · 한 줄 소개 · 그림 · 시작하기. 그림은 채팅 배경 원본을 잘라 둔 4조각(`public/images/home/`) + 금빛 문양(SVG). 새로 생성한 이미지 없음
- `/fortune/[id]`: 소개 · 이런 이야기를 나눠요 · 무료 요약 / 심층 리포트(준비 중 · 가격 미정 · 판매 안 함) · 준비할 정보 · 주제별 추가 질문 예시 · 진행 순서 · 다른 운세 · 고정된 ‘운결과 상담 시작’
- 상담 시작은 `/chat?topic=<id>` 로 이동 → PHASE 2 에서 주제별 상담으로 연결

## PHASE 2 — 주제별 맞춤 상담 (구현 완료)

- 홈 → `/chat?topic=<id>` (주제 id 만, 개인정보 없음). 알 수 없는 값은 종합운, 값이 없으면 인트로 기본 상담(기존 흐름 그대로)
- 대화: 주제별 첫 인사 → 지금의 고민 → 고민에 따라 갈라지는 후속 질문 → 반응 한마디 → 기본 정보 · MBTI → 상대방 정보(재회 · 궁합, 선택) → 확인 · 수정 → 결과 준비 → 샘플 카드 6종 + 주제 풀이
  - 내용: `features/chat/topicFlows.ts` (9개 주제), 노드: `features/chat/script.ts` (`greet` · `detail` · `bridge` · `extra` · `partnerDate` · `partnerMbti` · `editPick` · `switchTopic`)
- 상태: `ChatState.consult` (주제 · 고민 답 · 고치는 중 · 전환 대기), `resultEpoch` (결과 세대)
  - `@info`: 아직 받지 않은 정보만 묻는 경로 → 주제를 바꾸거나 일부만 고칠 때 같은 정보를 다시 묻지 않음
  - `auto`: 반응 대사 뒤에만 다음 단계로 이어짐. 질문 뒤에는 답할 때까지 멈춤
  - 결과에 쓰인 정보를 고치면 `resultEpoch + 1` → 이전 카드는 ‘정보를 고치기 전의 결과’로 흐리게, 전체 화면은 새 결과만
  - 다른 주제로 돌아오면 확인 질문 → ‘바꿀게요’(정보 재사용) / ‘지금 상담 이어서’(원래 질문으로)
- 진행 표시: 헤더 아래 `ConsultProgress` (고민 나누기 · 기본 정보 · 추가 정보 · 확인 · 결과)

남은 것: 상대방 정보로 두 사람을 실제 비교하는 풀이(만세력 연동 필요) · 주제별 심층 리포트(PHASE 4~5)

## PHASE 3 — 결과 카드 6종 · 상세 보기 (구현 완료)

- 데이터: `features/saju/types.ts` 의 `ConsultationProfile` · `ResultPayload { resultStatus: demo | calculated | unavailable, demo, manseResult, fiveElements, sajuPersonality, sajuMBTIReference, selfReportedMBTI, comparison, integratedInsight }`
  - 변환: `features/chat/consultation.ts` (채팅 상태 → ConsultationProfile → ResultPayload)
  - 고정 데모 사주: `DEMO_PROFILE` (provider.ts). Mock 제공자에서는 resultStatus 가 항상 `demo` — `calculated` 는 실제 계산 연결 뒤에만
  - 사주 기반 참고 MBTI: `SajuMBTIReference` 로 분리, `ruleStatus: "draft"` → 화면에 ‘운결 자체 분류 · 규칙 확정 전 시안’과 분류 근거 표시
  - 직접 고른 MBTI 와 데모 사주가 함께 쓰이면 ‘혼합된 데모 결과’ 안내 (`mixesUserMbti`)
- 카드: 사주 원국(기둥별 뜻 행) · 오행(그래프 · 계산 기준 · 강약 · 오행별 전통적 의미) · 타고난 나(참고 MBTI 근거) · 지금의 나(선호 성향 4글자 · 강점 · 주의할 점 · 미상) · 두 개의 나(같은/다른 유형 · 질문) · 종합(키워드 · 요약 · 강점 · 자기탐색 · 운세 8개)
- 채팅: 확인 → 안내 → 사주 원국 → 오행 안내 → 오행 → 타고난 나 → 지금의 나 → 두 개의 나 → 종합 → 운세 8개 선택(지금 상담 주제가 맨 앞, 상담 주제는 유지)
- 전체 화면: 이전·다음 · 닫기 · Esc(포커스 위치와 무관) · 브라우저 뒤로가기 · 포커스 가두기·복귀 · 끝 카드에서 포커스 유지 · 배경 inert + 문서 스크롤 잠금

## PHASE 4 — 종합 리포트 12챕터

명세: `src/content/report-chapters.ts` · 타입: `ReportChapter`, `FortuneReport`

- 라우트 `/report/[fortune]` (종합 = `integrated`)
- 화면 구성
  - 상단 고정: 읽기 진행률 막대(스크롤 비율, `aria-valuenow`) · 목차 버튼
  - 목차 시트: 12챕터, 잠김 표시(무료/심층), 지금 읽는 챕터 강조
  - 챕터: 번호 · 제목 · 핵심 요약 · 상세 해석 · 근거(사주 데이터) · 표/시각 카드 · 주의할 점 · 생각해볼 질문 · 다음 챕터
  - 심층 챕터는 요약까지만 보이고 “준비 중” (테스트 결제 UI는 PHASE 5)
- 시각 카드: `ChapterVisual` 의 kind 별 컴포넌트 (`manse-table`·`element-radar`·`type-compare` 는 카드 6종 재사용)
- 데이터가 없는 챕터는 꾸며 내지 않음: 대운·세운(10장)과 월별(11장)은 HRUM 연동 전까지 `coming-soon`
- 긴 리포트의 스크롤: 챕터를 `content-visibility: auto` 로, 이미지 없음, 고정 요소 최소화
- 채팅 복귀: 리포트로 갈 때 `ConsultationSession.resume.lastMessageId` 저장 → 돌아오면 그 메시지로 스크롤 (memory.ts 확장)
- 컴포넌트: `report/ReadingProgress` · `report/ChapterToc` · `report/Chapter` · `report/ChapterNav` · `report/visuals/*`

## PHASE 5 — 운세별 전용 리포트

| 리포트 | 무료 요약 | 심층(준비 중) | 필요한 데이터 |
|---|---|---|---|
| 연애 | 관계 기질 한 장 | 감정 표현 · 시기별 해석 | 원국 · MBTI |
| 재회 | 관계 패턴 질문 | 이별 시점 전후 흐름 · 상대 비교 | 원국 · 상대 정보 · 이별 시기(선택 답변) |
| 궁합 | 두 사람의 오행 나란히 | 사주 · MBTI 비교 | 두 사람의 원국 · MBTI |
| 재물 | 돈 습관 체크 | 재성 중심 전통 해석 · 소비 성향 | 원국 |
| 직업 | 일의 방식 | 적성 · 업무 스타일 · 전환 탐색 | 원국 · MBTI |
| 인간관계 | 관계 거리 | 대인 성향 · 갈등 패턴 | 원국 · MBTI |
| 신년운세 | 한 해 키워드 | 연간 요약 · 월별 흐름 | 원국 · 2027년 간지(HRUM) |

- 같은 `FortuneReport` 구조, 챕터 수만 다름 (3~6챕터)
- 가격: `PRODUCT_OFFERS` (지금 모두 `priceKRW: null`, `status: "draft"`). 운영자가 값을 넣기 전까지 화면은 “가격 미정”
- 결제: **테스트 UI만** — `PurchaseStatus.test-checkout` 화면에 “테스트 화면이에요. 실제 결제와 열람 권한은 없어요.” 고정 문구. 결제 수단 입력 필드 없음. `owned` 상태로 바꾸는 코드는 만들지 않음
- 후기 · 정확도 · 사용자 수 같은 수치는 만들지 않음

## PHASE 6 — 전체 모바일 점검과 HRUM 준비

- 375 · 390 · 430px(+320px) 전 화면, 키보드 · safe-area · 모션 줄이기 · 스크린리더 이름
- 실제 iPhone Safari: 키보드, 공유 시트의 ‘이미지 저장’, history 뒤로가기와 전체 화면 닫기
- HRUM
  1. 실제 응답 샘플을 받아 `HrumRawResponse` → `ManseResult` 변환 작성 (필드 추정 금지)
  2. 서버 전용 Route Handler + `HRUM_API_KEY` (클라이언트 번들 · 저장소에 키 없음)
  3. `HrumManseProvider` → `manseProvider` 교체 → `isSample: false` 로 ‘샘플’ 표시 자동 해제
  4. 대운 · 세운 · 2027년 월 간지를 받을 수 있는지 확인 후 10 · 11장 `coming-soon` 해제
- 저장 정책: HRUM · 유료 연동 전에 출생 정보 저장 여부 · 기간 · 삭제 방법을 정하고 동의 화면 추가 (지금은 저장하지 않음)
- `npm run typecheck` · `npm run build` — 실행 가능한 환경에서 실제 결과만 보고
