# 이미지 에셋

모든 이미지는 `design/source/` 의 디자인 원본 3장에서 만들었습니다. 다시 그리거나 새로 생성하지 않았습니다.

| 파일 | 원본 | 처리 |
|---|---|---|
| `ungyeol-logo.webp` (900w), `ungyeol-logo-sm.webp` (520w) | `01-logo.png` | 로고 영역(x430–1640, y20–668)만 자르고 바탕을 투명 처리. 글자·달·인장·부제·구름 장식은 원본 픽셀 그대로. 양옆 벚꽃은 로고가 아니므로 제외 |
| `ungyeol-character.webp` (1086×1448) | `02-character.png` | 원본 그대로, 형식만 WebP |
| `ungyeol-advisor.webp` (240×240) | `02-character.png` | 얼굴 영역 정사각 크롭(중심 493,361 · 반지름 268). `03-chat.png` 의 프로필과 템플릿 매칭으로 위치를 맞춤 |
| `chat/chat-bg-top.webp`, `chat/chat-bg-bottom.webp`, `chat/chat-bg-mid.webp` | `03-chat.png` | 말풍선·로고·버튼·입력창을 지운 배경(`design/source/03-chat-background-ui-removed.png`)을 위(0–1100)·아래(960–1649) 두 조각과 사이 민무늬 띠로 나눔. 화면이 원본보다 길어도 그림을 늘리지 않음 |

## 교체 방법

- 로고: 바탕이 투명한 PNG/WebP 원본을 받으면 `ungyeol-logo*.webp` 만 바꾸면 됩니다. 비율이 달라지면 `src/content/brand.ts` 의 `LOGO_RATIO` 와 `src/components/chat/spec.ts` 의 `logo` 위치를 조정합니다.
- 캐릭터: 같은 파일명으로 교체. 프로필 크롭은 `ungyeol-advisor.webp` (정사각, 얼굴 중앙).
- 채팅 배경: UI가 없는 원본 배경을 받으면 `chat-bg-*.webp` 를 다시 만듭니다.

이미지가 없거나 로드에 실패하면 플레이스홀더가 나오고, 개발 모드에서 경로를 안내합니다.

## reading/ — 결과 카드 장식

| 파일 | 출처 · 처리 |
|---|---|
| `reading/sakura-corner.webp` | `design/source/03-chat-background-ui-removed.png` 왼쪽 위 벚꽃 가지(x0–262, y0–92)만 잘라 어두운 바탕을 투명 처리. 카드 헤더 양쪽 위(오른쪽은 좌우 반전)에 사용 |
| `reading/sakura-sprig-light.webp` | 같은 가지를 크림 바탕용으로 가장자리 어두운 기운만 분홍 쪽으로 보정하고 좌우 반전. 크림 카드 오른쪽 위에 사용 |

새로 그리거나 생성한 이미지는 없습니다. 카드의 글·표·그래프·아이콘·구름 무늬는 모두 HTML/SVG 입니다.

## home/ — 운세 카드 그림

| 파일 | 출처 (design/source/03-chat-background-ui-removed.png 영역) |
|---|---|
| `home/art-sakura.webp` | 왼쪽 벚꽃 가지 x0–330, y700–1020 |
| `home/art-lantern.webp` | 왼쪽 아래 등불 x0–330, y960–1290 |
| `home/art-window.webp` | 오른쪽 창호 빛 x640–954, y170–760 |
| `home/art-petals.webp` | 창호 앞 꽃잎 x560–954, y240–560 |

원본을 잘라 형식만 WebP 로 바꿨고 색·내용은 손대지 않았습니다. 카드마다 조각·위치·좌우 반전을 달리하고 금빛 문양(SVG, `components/home/emblems.tsx`)을 얹습니다. 실제 카테고리 일러스트가 생기면 이 파일만 같은 이름으로 바꾸면 됩니다.
