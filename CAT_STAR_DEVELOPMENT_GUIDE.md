# 고양이의 별 — AI 개발 가이드 v1.0

> **문서 목적**  
> 이 문서는 Codex, Claude Code 등 AI 코딩 도구가 「고양이의 별」 MVP를 구현할 때 따라야 할 제품·디자인·인터랙션·기술 기준을 정의한다.  
> 본 문서와 함께 **별도 전달되는 기준 일러스트(Style Anchor)** 를 반드시 함께 참고한다.

---

# 1. 프로젝트 개요

## 1.1 서비스명

**고양이의 별**

## 1.2 한 줄 정의

> 사랑했던 고양이가 머무는 밤하늘을 만들고, 함께했던 기억을 별과 별자리로 남기는 디지털 추모 공간.

## 1.3 핵심 세계관

- **한 아이에게 하나의 밤하늘**
- 고양이 한 마리마다 하나의 고유한 밤하늘이 존재한다.
- 가장 중요한 중심별은 **고양이 자체**를 상징한다.
- 함께했던 사진과 기억은 **기억별**이 된다.
- 기억별이 모여 **별자리**를 이룬다.
- 이 서비스는 기록을 정리하는 앱이 아니라, **고양이가 머무는 새로운 세계를 만들어주는 서비스**다.

## 1.4 핵심 감정

사용자가 느껴야 하는 감정은 다음과 같다.

- “우리 아이가 아직 이곳에 있는 것 같다.”
- “기억이 사라진 것이 아니라 다른 모습으로 계속 빛나고 있다.”
- “슬프지만 차갑지 않고, 보고 싶지만 따뜻하다.”

다음 감정은 피한다.

- 장례식
- 추모관
- 납골당
- 죽음 중심의 무거운 분위기
- 지나치게 어두운 우주
- 공포스럽거나 외로운 분위기

---

# 2. Style Anchor — 최우선 시각 기준

본 개발 문서와 함께 별도로 전달되는 **기준 일러스트 이미지**를  
「고양이의 별」의 **Master Visual / Style Anchor**로 사용한다.

이 이미지는 단순한 참고 이미지가 아니다.

아래 요소를 결정하는 **최우선 기준**이다.

- 색감
- 화면 구성
- 고양이 위치와 실루엣
- 밤하늘의 공간감
- 빛 표현
- 별의 분위기
- 여백
- 화면의 감정선

## 2.1 절대 원칙

개발 시 다음 원칙을 반드시 지킨다.

1. 기준 일러스트를 일반적인 웹 UI 스타일로 재해석하지 않는다.
2. 기준 이미지를 단순히 배경 이미지 한 장으로 고정해서 끝내지 않는다.
3. 동일한 감성을 유지하면서 **인터랙티브 레이어 구조**로 재구성한다.
4. UI는 일러스트 위에 얹히는 보조 요소여야 한다.
5. 카드, 패널, 네비게이션이 장면보다 먼저 보여서는 안 된다.
6. 일반적인 SaaS Dashboard처럼 만들지 않는다.
7. 천문 관측 앱, 별자리 지도, 데이터 시각화 서비스처럼 만들지 않는다.
8. 새로운 스타일을 임의로 추가하지 않는다.

## 2.2 디자인 우선순위

시각적 우선순위는 아래와 같다.

1. 고양이와 밤하늘의 감정
2. 기억별
3. 별의 배치와 밀도
4. 빛과 공기감
5. 별자리 관계
6. 텍스트
7. UI 컨트롤

---

# 3. 시각 디자인 원칙

## 3.1 전체 분위기

키워드:

- pastel midnight
- dreamy
- warm
- quiet
- soft
- painterly
- cozy
- gentle longing
- minimal
- cinematic still frame

사용자가 앱 화면을 보는 것이 아니라  
**한 장의 애니메이션 장면 안에 들어온 것 같은 느낌**을 목표로 한다.

## 3.2 색감

기준 방향:

- muted purple
- soft blue
- lavender
- peach glow
- warm moonlight white
- deep but soft navy

피해야 할 색감:

- 네온 블루
- 강한 보라색
- 검정색 우주 배경
- 강한 금색
- 누런 아이보리
- RGB 느낌의 디지털 그라데이션
- SF/사이버펑크 스타일

## 3.3 질감

- 선명한 벡터 그래픽보다 부드러운 painterly 질감
- glow는 작고 부드럽게
- 경계는 약간 흐릿하게
- 대기와 안개가 존재하는 듯한 공간감
- 전체적으로 과도한 contrast 금지

---

# 4. 화면 레이어 구조

메인 화면은 하나의 배경 이미지가 아니라 다음 레이어로 구현한다.

```text
Layer 1 — Background
Layer 2 — World / Cat
Layer 3 — Memory Star System
Layer 4 — UI Overlay
```

## 4.1 Background Layer

포함 요소:

- 파스텔 미드나잇 하늘
- muted purple / blue gradient
- horizon 부근 peach glow
- soft mist
- subtle stardust
- 매우 약한 빛 번짐

Background는 사용자의 조작에 직접 반응하지 않아도 된다.

다만 zoom/pan 시 약간의 parallax를 줄 수 있다.

## 4.2 World / Cat Layer

포함 요소:

- 고양이 뒷모습
- 중심별
- 주변 장식성 빛
- 작은 천체 또는 빛 구슬

고양이는 단순 아이콘이 아니라  
**이 세계 안에 실제로 머무는 존재**처럼 보여야 한다.

## 4.3 Memory Star Layer

포함 요소:

- 기억별
- 별자리 연결선
- hover state
- selected state
- 별의 배치
- pan / zoom 대응

이 레이어가 서비스의 핵심 인터랙션 레이어다.

## 4.4 UI Overlay Layer

포함 요소:

- 서비스명 / 로고
- 최소 메뉴
- 기억별 추가 CTA
- 기억 상세 UI
- 설정 또는 뒤로가기

UI는 필요할 때만 등장하고  
기본 상태에서는 최대한 보이지 않거나 존재감이 약해야 한다.

---

# 5. 메인 화면 요구사항

## 5.1 기본 구성

Desktop 기준:

- 화면 전체를 차지하는 full-screen sky
- 하단 중앙 또는 중앙 하단에 고양이 뒷모습
- 고양이 위 또는 가까운 위치에 중심별
- 중심별 주변으로 기억별이 자연스럽게 군집
- 좌측 상단: `고양이의 별`
- 우측 상단: 최소 메뉴
- 우측 하단 또는 하단: `기억별 만들기`

## 5.2 고양이

고양이는 사용자에게 등을 보이고 밤하늘을 바라본다.

권장:

- 하단 중앙
- 화면을 너무 많이 차지하지 않음
- 실루엣 형태
- 얼굴 디테일 최소화
- 귀, 등, 꼬리가 자연스럽게 읽히는 정도

### 움직임

기본 상태:

- 아주 미세한 breathing
- 꼬리의 느린 움직임
- 귀의 작은 움직임

특정 조건:

- 사용자가 다른 별 군집을 탐색할 때 몇 걸음 이동
- 특정 기억별을 선택하면 고개를 살짝 올림
- 화면 이동이 큰 경우 천천히 새로운 위치로 이동 가능

금지:

- 달리기
- 점프
- 게임 캐릭터 같은 이동
- 반복적이고 눈에 띄는 idle animation
- 사용자 입력에 즉시 1:1로 반응하는 기계적 움직임

---

# 6. 기억별 시스템

## 6.1 기본 정의

- **중심별**: 고양이 자체
- **기억별**: 하나의 기억 단위
- **별자리**: 관련 기억별의 관계
- **빛나는 기억**: 사용자가 특별히 표시한 기억

## 6.2 기억별 UI

기억별은 모두 동일한 원형 dot으로 만들지 않는다.

사용 가능한 표현:

- 작은 star
- soft orb
- light droplet
- 4-point star
- 6-point soft star
- subtle sparkle

권장 분포:

- 기본 광점: 약 50%
- 형태가 있는 별: 약 30%
- 부드러운 빛 구슬: 약 20%

## 6.3 별 크기

크기는 너무 크게 차이나지 않는다.

예:

```text
Normal: 6~9px visual core
Important: 9~12px
Favorite: 10~14px + subtle glow
Center Star: 18~28px
```

실제 클릭 영역은 시각 크기보다 크게 만든다.

예:

```text
visual: 8px
hit area: 32~44px
```

---

# 7. 별 배치 규칙

별을 화면에 균등하게 랜덤 배치하지 않는다.

사용자가 봤을 때 자연스러운 기억의 군집처럼 보여야 한다.

권장 밀도:

```text
중심 영역: 약 60%
중간 영역: 약 30%
외곽 영역: 약 10%
```

## 7.1 배치 원칙

- 중심별 주변은 조금 더 촘촘하게
- 별끼리 지나치게 멀어지지 않게
- 화면 전체를 다 채우지 않음
- 충분한 negative space 유지
- 완벽한 원형 / 격자 배치 금지
- 데이터 그래프처럼 보이는 배치 금지

## 7.2 구현

초기 MVP에서는 deterministic seeded random을 사용할 수 있다.

예:

```text
pet_id + memory_star_id
```

를 seed로 사용하여  
재접속해도 별의 위치가 바뀌지 않게 한다.

---

# 8. 별자리 연결선

연결선은 **보조 요소**다.

별보다 먼저 보여서는 안 된다.

## 8.1 기본 상태

권장 opacity:

```text
0.06 ~ 0.12
```

권장 stroke:

```text
0.5px ~ 1px
```

## 8.2 선택 상태

사용자가 별을 선택했을 때  
관련 연결선만 조금 강조한다.

권장 opacity:

```text
0.20 ~ 0.35
```

## 8.3 금지

- 모든 별을 연결하는 network graph
- 굵은 선
- 강한 흰색 선
- 직선 위주의 rigid graph
- 기술적 데이터 시각화 느낌

가능하다면 약간의 curve를 사용한다.

---

# 9. 인터랙션

## 9.1 Desktop

### Hover

별에 마우스를 올렸을 때:

- size 1.05~1.15
- glow slightly increase
- 관련 별을 아주 약하게 highlight
- tooltip은 기본적으로 사용하지 않는다.

### Click

별 클릭:

- selected star 강조
- 관련 별 약간 강조
- 다른 별은 아주 약하게 dim
- 상세 UI 등장

### Pan

- drag로 밤하늘 이동
- 너무 빠르게 움직이지 않게
- inertial movement는 약하게

### Zoom

- mouse wheel
- trackpad pinch
- zoom 범위는 제한

예:

```text
0.8x ~ 2.0x
```

---

# 10. 모바일 인터랙션

## 10.1 기본

- tap: 별 선택
- drag: pan
- pinch: zoom
- bottom sheet: 기억 상세

## 10.2 모바일 시각 원칙

Desktop 화면을 단순 축소하지 않는다.

유지해야 할 것:

- 고양이
- 중심별
- 메인 기억별
- 핵심 색감
- 여백

필요하면 모바일에서는:

- 별 밀도를 조금 높임
- 외곽 별 일부 숨김
- 고양이 크기 약간 조정
- 배경 crop 별도 처리

---

# 11. 기억별 상세 UI

기억별 상세 UI는 화면을 지배해서는 안 된다.

## 11.1 Desktop

권장:

- right floating panel
- small glass / translucent panel
- 또는 narrow drawer

내용:

- 대표 사진
- 날짜
- 짧은 이름
- 선택적 글
- 미디어 수

## 11.2 Mobile

- bottom sheet
- 기본 높이 30~40%
- 사용자가 위로 끌면 확장 가능

## 11.3 정보 우선순위

1. 사진
2. 날짜
3. 짧은 기억 이름
4. 선택적 설명

텍스트가 없어도 정상적인 기억별이어야 한다.

---

# 12. 기억별 만들기

## 12.1 필수 입력

- 사진
- 날짜

## 12.2 선택 입력

- 짧은 이름
- 설명
- favorite 여부

기억을 남기는 데 긴 글쓰기를 요구하지 않는다.

---

# 13. 사진 대량 업로드 — 핵심 MVP 기능

많은 사용자는 고양이가 떠난 후  
기존 사진을 한꺼번에 업로드할 수 있다.

따라서 batch upload는 보조 기능이 아니라 **P0 핵심 기능**이다.

## 13.1 처리 흐름

```text
사진 선택
→ metadata 읽기
→ 날짜 기준 그룹화
→ 기억 단위 생성
→ MemoryStar 생성
→ 별 위치 자동 생성
→ 밤하늘 완성
```

## 13.2 그룹화 규칙

MVP에서는 AI를 사용하지 않는다.

우선 기준:

1. EXIF captured_at
2. 파일 metadata
3. 사용자가 지정한 날짜

기본적으로:

```text
같은 날짜의 사진 = 하나의 기억 그룹
```

단, 하루에 사진이 지나치게 많다면  
시간 간격을 기준으로 추가 분리할 수 있다.

예:

```text
4시간 이상 gap → 새 memory group
```

## 13.3 AI 사용

MVP에서는 사용하지 않는다.

향후 AI 기능:

- 고양이 사진 자동 탐지
- 유사 사진 그룹화
- burst 정리
- 대표 사진 추천
- 짧은 제목 추천

AI가 감정의 중요도를 결정하지 않는다.

---

# 14. 밤하늘 생성 Hero Experience

밤하늘 생성은 단순한 progress screen이 아니다.

이 서비스의 **First Wow Moment**다.

## 14.1 연출 흐름

```text
사진 업로드
↓
작은 빛들이 나타남
↓
빛들이 날짜별로 모임
↓
기억별이 생성됨
↓
별들이 밤하늘에 자리잡음
↓
고양이의 중심별 등장
↓
완성된 밤하늘 공개
```

## 14.2 카피 예시

- 함께했던 시간을 찾고 있어요.
- 기억들이 하나씩 빛이 되고 있어요.
- 루루의 밤하늘을 만들고 있어요.
- 42개의 기억별을 찾았어요.
- 루루가 새로운 밤하늘에 도착했어요.
- 함께한 기억은 이곳에서 계속 빛납니다.

진행률 숫자를 과도하게 보여주지 않는다.

---

# 15. 반응형 기준

## Desktop

권장 기준:

```text
1440 × 900
```

지원:

```text
1280px 이상
```

특징:

- 넓은 밤하늘
- 기억 상세는 우측 패널
- 별 간 거리 여유

## Tablet

- 메인 구조 유지
- 상세 패널 폭 축소

## Mobile

권장 기준:

```text
390 × 844
```

특징:

- bottom sheet
- 고양이 중심 화면
- 중요한 기억별 위주
- 한 손 조작 고려

---

# 16. 기본 UI

메인 화면에는 다음 정도만 기본 노출한다.

## Desktop

좌상단:

```text
고양이의 별
```

우상단:

```text
Menu
```

우하단 또는 하단:

```text
기억별 만들기
```

필요 시:

```text
내 밤하늘
사진 추가
설정
공유
```

초기에는 많은 메뉴를 노출하지 않는다.

---

# 17. 데이터 모델

## 17.1 Pet

```ts
Pet {
  id
  user_id
  name
  profile_image_url
  birthday?
  star_birth_date
  status // with_me | in_the_sky
  created_at
}
```

`star_birth_date`는 사용자가 고양이를 처음 만난 날을 의미한다.

## 17.2 MemoryStar

```ts
MemoryStar {
  id
  pet_id
  memory_date
  short_name?
  description?
  favorite
  importance?
  star_type
  x
  y
  size
  brightness
  created_at
}
```

## 17.3 Media

```ts
Media {
  id
  memory_star_id
  type // image | video
  url
  captured_at?
  sort_order
}
```

## 17.4 SkyTheme

```ts
SkyTheme {
  id
  pet_id
  theme
  sky_tone
  stardust_level
  glow_style
  created_at
}
```

---

# 18. 추천 기술 스택

MVP 권장:

```text
Next.js
React
TypeScript
Tailwind CSS
Supabase
Supabase Auth
Supabase PostgreSQL
Supabase Storage
```

## 18.1 별 렌더링

초기:

```text
SVG + DOM
```

을 우선한다.

이유:

- 구현 단순
- click / hover 쉬움
- 반응형 대응 쉬움
- 디버깅 쉬움

초기부터 Three.js/WebGL을 사용할 필요는 없다.

별이 수백 개 이상이 되고 성능 문제가 발생하면  
Canvas/WebGL을 검토한다.

---

# 19. 애니메이션 기준

애니메이션은 모두 느리고 절제되어야 한다.

권장 easing:

```css
cubic-bezier(0.22, 1, 0.36, 1)
```

권장 duration:

```text
hover: 200~350ms
panel: 350~500ms
star transition: 500~900ms
cat movement: 1000~3000ms
```

금지:

- bounce
- elastic
- fast scale
- flashy transitions
- confetti
- game-like effects

---

# 20. 접근성

감성 디자인을 유지하되 기본 접근성을 보장한다.

- interactive star는 keyboard focus 가능
- hit area 최소 44px 권장
- 이미지 alt text
- reduced-motion 지원
- 텍스트 contrast 확보
- 모바일 safe-area 고려

`prefers-reduced-motion` 사용 시:

- 고양이 움직임 최소화
- 별 pulse 중단
- 긴 transition 축소

---

# 21. 성능

메인 경험이 이미지와 애니메이션 중심이므로 성능을 중요하게 다룬다.

## 원칙

- 이미지 WebP/AVIF 우선
- 필요한 해상도만 로드
- lazy loading
- blur asset 과도한 중첩 금지
- DOM star가 많아지면 virtualization 또는 Canvas 검토
- Core Web Vitals 고려

Style Anchor 이미지를 그대로 큰 PNG로 계속 사용하는 방식은 피한다.

가능한 경우:

```text
background
cat
foreground glow
decorative particles
```

등을 분리된 최적화 asset으로 사용한다.

---

# 22. 컴포넌트 구조 예시

```text
app/
  sky/
    page.tsx

components/
  sky/
    SkyScene.tsx
    SkyBackground.tsx
    CatSilhouette.tsx
    MainStar.tsx
    MemoryStar.tsx
    MemoryStarField.tsx
    ConstellationLines.tsx
    SkyControls.tsx

  memory/
    MemoryDetailPanel.tsx
    MemoryBottomSheet.tsx
    MemoryCreateForm.tsx

  upload/
    BatchUpload.tsx
    SkyCreationSequence.tsx

lib/
  star-layout.ts
  memory-grouping.ts
  animation.ts

types/
  pet.ts
  memory.ts
```

이는 예시이며 필요에 따라 변경 가능하다.

---

# 23. 개발 우선순위

전체 기능을 한 번에 구현하지 않는다.

---

## Sprint 1 — Visual Prototype

### 목표

> 기준 일러스트의 감성을 실제 코드에서 재현할 수 있는지 확인한다.

구현:

- full-screen sky
- background
- 고양이 뒷모습
- 중심별 1개
- mock 기억별 20개
- 별 군집 배치
- 별 형태 variation
- subtle glow
- 매우 희미한 연결선
- hover
- click
- 기본 responsive

데이터베이스 연결 금지.

Mock data만 사용한다.

### Sprint 1 성공 조건

기능보다 다음 질문에 `Yes`가 나와야 한다.

> “별도 전달한 기준 일러스트와 같은 세계에 있는 화면처럼 느껴지는가?”

No라면 다음 Sprint로 넘어가지 않는다.

---

## Sprint 2 — Sky Interaction

구현:

- pan
- zoom
- selected state
- constellation highlight
- desktop detail panel
- mobile bottom sheet
- 고양이 미세 animation

---

## Sprint 3 — Data / Memory

구현:

- Supabase
- Pet
- MemoryStar
- Media
- 기억별 CRUD
- 사진 storage

---

## Sprint 4 — Batch Import

구현:

- multi-photo upload
- metadata parsing
- date grouping
- memory group generation
- automatic star creation

---

## Sprint 5 — Hero Creation Experience

구현:

- 업로드 완료
- light → star transition
- star placement animation
- final sky reveal
- responsive polish

---

# 24. AI 개발 도구 작업 원칙

Codex / Claude Code 등 AI 개발 도구는 아래 원칙을 따른다.

## 24.1 작업 단위

한 번에 전체 서비스를 만들지 않는다.

반드시:

```text
구현
→ 화면 확인
→ 수정
→ 다음 단계
```

순서로 진행한다.

## 24.2 UI 임의 추가 금지

AI가 “더 완성된 서비스처럼 보이게 하기 위해” 다음 요소를 임의로 추가하지 않는다.

- sidebar
- dashboard
- statistics
- cards
- onboarding widgets
- bottom navigation
- search bar
- floating widgets
- notification center

필요하면 명시적으로 요청할 때만 추가한다.

## 24.3 디자인 판단

디자인에 대한 선택이 필요한 경우:

1. Style Anchor를 우선한다.
2. 감성 유지 여부를 우선한다.
3. 기능적 편의는 그 다음이다.

---

# 25. 절대 하지 말 것

아래 결과가 나오면 실패로 간주한다.

## Visual

- 검정 우주 배경
- 천문 앱
- 별자리 관측 지도
- network graph
- SaaS dashboard
- 게임 HUD
- 카드 중심 레이아웃
- 강한 neon glow
- 과도한 glassmorphism
- sci-fi interface
- 고양이 캐릭터화
- 귀여운 스티커 UI
- 과도한 일러스트 장식

## UX

- 사용자가 별보다 UI를 먼저 보게 하는 구조
- 장문의 입력을 강요
- 게임 미션
- 레벨
- 포인트
- 성취 배지
- streak
- 과도한 notification

---

# 26. MVP에서 하지 않을 것

초기 버전에서 제외:

- AI 감정 분석
- AI가 중요한 기억 판단
- 자동 추모 문구 생성
- 가족 공동 편집
- 복잡한 소셜 기능
- 공개 커뮤니티
- 결제
- 아이템 상점
- 게임 시스템
- 3D world
- 자유 이동 캐릭터
- 복잡한 WebGL scene

---

# 27. 핵심 카피

브랜드 톤 참고용이다.

> 한 아이에게 하나의 밤하늘.

> 함께했던 기억은 별이 되고, 그 별들은 하나의 별자리가 됩니다.

> 떠난 뒤에도, 그 아이의 밤하늘은 계속 빛납니다.

> 함께한 기억으로, 그 아이가 머무는 밤하늘을 만듭니다.

> 기록하지 못했던 시간도, 사진 속에 남아 있다면 다시 별이 될 수 있습니다.

> 별은 사라지지 않습니다. 조금 멀리 있을 뿐이에요.

---

# 28. 개발 시작 요청

AI 코딩 도구에 처음 전달할 때는 아래와 같이 요청한다.

```text
이 저장소에 「고양이의 별」 MVP를 구현한다.

먼저 함께 전달한 CAT_STAR_DEVELOPMENT_GUIDE.md 전체를 읽고,
별도로 전달한 Style Anchor 일러스트를 확인해라.

가장 중요한 목표는 기능 구현이 아니라
Style Anchor의 색감, 공간감, 고양이 뒷모습, 빛, 여백과 감정을
실제 인터랙티브 웹 화면에서 최대한 유지하는 것이다.

전체 서비스를 한 번에 구현하지 마라.

먼저 문서의 Sprint 1 — Visual Prototype만 구현한다.

Sprint 1에서는 데이터베이스, 로그인, 업로드 등의 기능은 구현하지 않는다.

Mock memory stars 20개를 사용하여 다음만 구현한다.

- full-screen sky
- pastel midnight atmosphere
- cat silhouette from behind
- main star
- clustered memory stars
- subtle star variation
- extremely faint constellation lines
- hover / click states
- responsive base

구현 전에 프로젝트 구조와 구현 계획을 간단히 제안하고,
Style Anchor를 어떤 레이어로 분리해서 구현할지 설명해라.

일반적인 SaaS UI나 astronomy app 스타일로 재해석하지 마라.
임의로 카드, dashboard, sidebar 등을 추가하지 마라.

Sprint 1이 완료되면 다음 단계로 넘어가지 말고,
현재 구현 결과와 수정 가능한 디자인 변수들을 정리해서 보고해라.
```

---

# 29. Sprint 1 완료 후 확인 체크리스트

개발 결과를 아래 순서로 검토한다.

### 분위기

- [ ] 기준 일러스트와 같은 세계처럼 느껴지는가?
- [ ] 따뜻하고 조용한가?
- [ ] 너무 어둡지 않은가?
- [ ] 게임처럼 보이지 않는가?
- [ ] 천문 앱처럼 보이지 않는가?

### 고양이

- [ ] 고양이 뒷모습이 자연스러운가?
- [ ] 화면의 감정 중심 역할을 하는가?
- [ ] 너무 캐릭터화되지 않았는가?

### 별

- [ ] 기억별이 단순 데이터 node처럼 보이지 않는가?
- [ ] 별 간격이 지나치게 넓지 않은가?
- [ ] 별이 적당히 군집되어 있는가?
- [ ] 별 형태가 자연스럽게 다양하게 보이는가?

### 연결선

- [ ] 거의 보이지 않을 정도로 약한가?
- [ ] network graph처럼 보이지 않는가?

### UI

- [ ] UI보다 세계가 먼저 보이는가?
- [ ] 불필요한 카드가 없는가?
- [ ] 텍스트와 버튼이 충분히 절제되어 있는가?

### 인터랙션

- [ ] hover가 과하지 않은가?
- [ ] click state가 감성을 해치지 않는가?
- [ ] 모바일에서도 고양이와 중심별이 유지되는가?

---

# 30. 최종 원칙

이 프로젝트에서 가장 중요한 질문은

> “기능이 잘 보이는가?”

가 아니다.

항상 먼저 확인할 질문은

> **“이 화면이 사랑했던 고양이가 머무는 밤하늘처럼 느껴지는가?”**

이다.

기능 구현 때문에 이 감정이 깨진다면  
기능을 줄이거나 표현 방식을 다시 설계한다.

**Illustration is the world.  
Constellation is the interface.  
Memory is the content.**
