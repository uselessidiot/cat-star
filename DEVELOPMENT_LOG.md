# Cat Star Development Log

## 2026-09-12

### Product Direction

- MVP focus changed from batch photo import to a slower single-memory ritual.
- One creation flow should produce one memory star.
- Batch upload, date grouping, and automatic bulk organization are postponed until after the emotional MVP is solid.

### Completed

- Synced GitHub with commit `93dcf16 Refine mock memory star field`.
- Reworked memory creation to accept one photo and create one star.
- Removed unused bulk upload state, grouping styles, and mock bulk creation button.
- Added chronological created-star placement so each new memory settles deeper into the sky.
- Added a short creation ritual after submit: the form softens while memory gathers into starlight.
- Slowed the final cat-story text so it rises more gently.
- Warmed the end-of-journey sky earlier, before the final messages appear.
- Tuned center-star labels to read as emotional memory context rather than dashboard stats.
- Softened album copy so `/memories` feels like revisiting stars, not managing records.
- Updated `CAT_STAR_DEVELOPMENT_GUIDE.md` to reflect the single-memory MVP direction.
- Added a local development test button that seeds 10 one-photo memory stars, replacing only prior test seed data so the single-photo flow can be reviewed quickly.
- Enlarged and reorganized the center-star detail/edit panels so the profile fields and memory stats read more calmly.
- Added a first-visit opening story that leads into the night-sky experience, while deep links to a specific memory skip the opening.
- Replaced the center-star panel's album shortcut with a small star-touch interaction and tightened the stat text alignment.
- Simplified the memory album for the one-photo MVP: album detail and edit flows now treat each memory as one photo, one note, one star.
- Added local controls to replay the opening story and clear only the 10-photo test seed memories.

### Verification

- `pnpm run build` passed after reinstalling dependencies.
- `node node_modules\typescript\bin\tsc --noEmit` passed.
- `git diff --check` passed after cleanup.

### Current Local Preview

- Dev server: `http://localhost:3000/`
- Album route: `http://localhost:3000/memories`

### Next Candidates

- Review the final-story transition visually and adjust warmth, text pacing, or copy.
- Add a more graceful empty state for the album when only mock memories exist.
- Decide whether album edit mode should keep multi-photo controls or match the one-photo MVP.
- Use the 10-photo local test seed to review density, star spacing, and album readability after many one-by-one additions.
- Review whether the opening replay and local test controls should stay visible, move into a quieter menu, or remain development-only.
- Prepare a commit and push once the current visual pass is approved.

## 2026-09-13

### Completed

- Moved the primary home actions into a single responsive top-right header group: opening story, memory-star creation, and memory album.
- Kept local-only test controls separate from the user-facing header actions so the first screen stays focused.
- Reworked the opening into a three-step first-user story that explains the emotional premise, the one-photo one-star ritual, and the first memory-star action.
- Added a separate returning-user opening story so replaying the intro feels like revisiting the sky rather than onboarding again.
- Added a quiet first-memory invitation on the sky when there are no personal memories yet, while excluding local test seed memories from that first-user state.
- Added first-memory creation copy across the creator form, photo preview state, creation ritual, and completion notice so the first star feels like a distinct moment.
- Reworked the memory album to judge empty and first-memory states from personal memories only, separate local test seeds from the real album, and give the first saved memory a quieter “first star” presentation.

### Verification

- `node node_modules\typescript\bin\tsc --noEmit` passed.
- `pnpm run build` passed.
- `git diff --check` passed.

## 2026-09-13 - 중심별 월드 화면 전환

- 중심별을 열었을 때 기존 카드형 정보창 대신 별빛 하늘 전체 화면으로 전환되도록 구조를 정리했다.
- 배경에 반복 별가루, 강조 별, 새벽빛 그라데이션, 낮은 행성 곡선, 고양이 실루엣을 배치해 사용자가 제안한 오프닝 이미지 같은 분위기를 살렸다.
- 정보 텍스트와 액션은 왼쪽 아래 반투명 패널에 유지해 `고양이별 수정`, `첫 기억 만나기`, `별빛 쓰다듬기` 흐름을 계속 사용할 수 있게 했다.
- 배경 장면 레이어와 조작 UI 레이어가 겹치지 않도록 중심별 화면의 JSX 구조를 직접 자식 레이어 방식으로 단순화했다.

## 2026-09-13 - 첫 방문 이미지 오프닝 애니메이션

- 첨부된 4장의 오프닝 일러스트를 `public/assets/opening/`에 추가하고, `CatStarOpening` 독립 컴포넌트에서 설정 배열로 이미지 경로, 문구, 장면 설명을 관리하도록 구성했다.
- 첫 방문에서는 `cat-star-opening-seen-v1` 저장값을 기준으로 약 8초짜리 전체 화면 오프닝을 자동 재생하고, `?opening=1` 또는 상단 `처음 이야기` 버튼으로 언제든 다시 볼 수 있게 연결했다.
- 장면별 카메라 확대, 좌우 이동, 별빛 호흡, 별가루, 순차 별 점등 느낌을 CSS 애니메이션으로 구현하고, 마지막 장면은 어두운 밤하늘을 유지한 채 메인 화면으로 페이드아웃되게 했다.
- 오프닝 중에는 body 스크롤을 잠그고, 완료/건너뛰기 후 컴포넌트를 제거하며 스크롤을 복원한다.
- 모바일 폭에서는 이미지를 `contain`으로 전환하고 장면별 `object-position`과 안전영역 여백을 따로 적용해 고양이와 중심 별이 잘리지 않도록 했다.
- `prefers-reduced-motion: reduce`에서는 카메라 이동, 패럴랙스, 입자 움직임을 제거하고 페이드 중심으로 동작하게 했다.
- 데스크톱 오프닝, 클릭 진행, 건너뛰기, 자동 종료 후 메인 복귀를 로컬 브라우저에서 확인했다. 모바일 캡처는 브라우저 보안 정책상 iframe 미리보기가 차단되어 CSS 반응형 규칙 기준으로 확인했다.

## 2026-09-13 - 중심별 월드 거리감 보정

- 메인 별자리 화면에 임시로 적용됐던 별 이동/거리감 실험 CSS를 제거하고, 중심별을 클릭했을 때의 월드 화면만 다시 조정했다.
- 중심별 월드에서 루루 실루엣을 더 작고 낮게 배치해 화면이 너무 가까워 보이지 않도록 했고, 걷는 스프라이트 애니메이션은 유지했다.
- 우측 상단의 루루 중심별을 따뜻한 광원과 얇은 궤도 링으로 다시 강조했다.
- 별자리 레이어는 천천히 떠가고, 십자 별은 천천히 회전하도록 해 루루가 걸어가는 흐름에 맞춘 잔잔한 움직임을 더했다.
- `prefers-reduced-motion` 환경에서는 중심별 월드의 추가 움직임도 멈추도록 처리했다.
- 로컬 데스크톱 화면에서 중심별 열기/닫기와 메인 화면 복귀를 확인했다.

### Verification

- `node node_modules\typescript\bin\tsc --noEmit` passed.
- `pnpm run build` passed.
- `git diff --check` passed.

## 2026-09-13 - 메인 별 표면과 메뉴 위치 정리

- 메인 별자리 화면에 루루가 서 있는 듯한 낮은 별 표면 레이어를 추가했다. 중심별 상세 월드와 구분되도록 큰 행성 연출이 아니라 얇은 곡선, 림라이트, 희미한 표면 별가루만 사용했다.
- 상단 브랜드와 주요 메뉴의 여백을 다시 잡고, 데스크톱에서는 우측 상단 버튼 그룹으로 유지했다.
- 모바일 폭에서는 상단 메뉴가 한 줄 스크롤 그룹으로 정리되도록 반응형 규칙을 보강했다.
- 하단 스크롤 안내와 화살표가 루루 몸통을 덮지 않도록 더 낮고 옅게 조정했다.
- 로컬 데스크톱 화면에서 메인 별 표면, 상단 메뉴, 개발용 테스트 버튼 위치를 확인했다.

### Verification

- `node node_modules\typescript\bin\tsc --noEmit` passed.
- `pnpm run build` passed.
- `git diff --check` passed.

## 2026-09-14 - 중심별 상세 배경 이미지 교체

- 사용자가 지정한 두 번째 일러스트를 `public/assets/center-world/lulu-center-world.png`로 추가했다.
- 중심별을 열었을 때 보이는 월드 화면은 CSS로 만든 별, 행성, 고양이 레이어를 숨기고 해당 이미지를 실제 배경으로 사용하도록 정리했다.
- 배경 이미지는 데스크톱에서 중심별 광원과 앉아 있는 고양이가 함께 보이도록 중앙 기준 `cover`로 배치했다.
- 기존 중심별 정보 카드와 `고양이별 수정`, `첫 기억 만나기`, `별빛 쓰다듬기` 액션은 이미지 위에 유지했다.
- 로컬 브라우저에서 중심별 상세를 열어 이미지 배경이 적용된 것을 확인했다.

### Verification

- `node node_modules\typescript\bin\tsc --noEmit` passed.
- `pnpm run build` passed.
- `git diff --check` passed.

## 2026-09-14 - 메인 하늘 일러스트 배경 전환

- 메인 별자리 화면도 중심별 상세와 같은 결의 일러스트 배경을 사용하도록 `public/assets/center-world/lulu-main-sky.png`를 추가했다.
- 기존 CSS 별가루, 구름/안개, 중심별 광원, 고양이 실루엣, 별 표면 레이어를 숨겨 손으로 임시 합성한 듯한 느낌을 제거했다.
- 일러스트 안의 우측 상단 중심별 위에 투명한 클릭 영역을 배치해 중심별 상세 진입 기능은 유지했다.
- 메인 일러스트에 이미 하단 문구가 포함되어 있어 기존 좌하단 문구는 숨겨 중복을 없앴다.
- 기억별 버튼은 기능상 유지하되 배경 일러스트와 충돌하지 않도록 더 은은하게 보이게 조정했다.
- 로컬 브라우저에서 메인 일러스트 배경과 중심별 상세 진입을 확인했다.

### Verification

- `node node_modules\typescript\bin\tsc --noEmit` passed.
- `pnpm run build` passed.
- `git diff --check` passed.

## 2026-09-14 - 메인 걷는 루루 복원

- 메인 일러스트 배경 전환 과정에서 숨겨졌던 기존 걷는 루루 스프라이트 레이어를 복원했다.
- 메인 화면에서는 `cat-walk-sprite-v2.png`를 항상 사용해 `walk-frames`와 `walk-bob` 애니메이션이 계속 적용되도록 했다.
- 일러스트 배경 안의 앉은 고양이는 배경 크롭을 조정해 화면 아래로 빠지게 하고, 실제로 보이는 루루는 걷는 스프라이트 한 마리만 남겼다.
- 로컬 브라우저에서 메인 화면을 확인했고, `.cat-art`의 계산된 애니메이션 값이 `walk-frames, walk-bob`으로 적용된 것을 확인했다.

### Verification

- `node node_modules\typescript\bin\tsc --noEmit` passed.
- `pnpm run build` passed.
- `git diff --check` passed.

## 2026-09-14 - 메인 배경 고양이 제거와 걷는 루루 분리

- 메인 일러스트 배경에서 앉은 고양이만 제거한 새 배경 `public/assets/center-world/lulu-main-sky-no-cat.png`를 생성해 적용했다.
- 별 표면, 풀 언덕, 하늘, 중심별 광원, 하단 문구는 유지하고 배경 안의 고양이만 제거했다.
- 화면에 보이는 고양이는 기존 걷는 스프라이트 `cat-walk-sprite-v2.png`만 사용하도록 분리했다.
- 로컬 브라우저에서 배경 고양이 제거 상태와 `.cat-art`의 `walk-frames, walk-bob` 애니메이션 적용을 확인했다.

### Verification

- `node node_modules\typescript\bin\tsc --noEmit` passed.
- `pnpm run build` passed.
- `git diff --check` passed.

## 2026-09-14 - 메인 문구 크기와 걷는 루루 위치 보정

- 메인 배경에서 큰 내장 문구를 제거한 새 배경 `public/assets/center-world/lulu-main-sky-clean.png`를 적용했다.
- 왼쪽 문구는 CSS 오버레이로 다시 표시해 작고 은은하게 조정했다.
- 걷는 루루 스프라이트를 조금 위로 올려 하단 네비게이션 안내와 겹치지 않게 했다.
- 별 표면과 언덕은 배경 이미지에 그대로 유지하고, 화면에 보이는 고양이는 기존 걷는 스프라이트만 남겼다.
- 로컬 브라우저에서 문구 크기, 고양이 위치, `walk-frames, walk-bob` 애니메이션 적용을 확인했다.

### Verification

- `node node_modules\typescript\bin\tsc --noEmit` passed.
- `pnpm run build` passed.
- `git diff --check` passed.

## 2026-09-14 - 스크롤 기반 걷기 상태 복원

- 메인 화면의 루루 스프라이트가 항상 걷지 않도록 되돌리고, 기본 상태에서는 정지 이미지가 보이게 했다.
- 사용자가 스크롤하거나 스와이프해 별자리 사이를 이동할 때만 `cat-wrap walking` 상태에서 `walk-frames, walk-bob` 애니메이션이 켜지도록 복원했다.
- 로컬 브라우저에서 기본 상태의 애니메이션이 `none`, 스크롤 중 애니메이션이 `walk-frames, walk-bob`으로 전환되는 것을 확인했다.

### Verification

- `node node_modules\typescript\bin\tsc --noEmit` passed.
- `pnpm run build` passed.
- `git diff --check` passed.

## 2026-09-14 - 걷기 종료 착지 전환과 고양이 톤 보정

- 스크롤 또는 스와이프 이동이 끝난 뒤 루루가 갑자기 멈추지 않도록 `catSettling` 상태를 추가했다.
- 걷는 스프라이트가 바로 사라지는 대신 정지 이미지와 천천히 크로스페이드되고, 짧은 착지 애니메이션을 거쳐 자연스럽게 앉도록 조정했다.
- 고양이 주변의 흰 테두리처럼 보이던 효과를 줄이기 위해 스프라이트와 정지 이미지의 밝기, 채도, 그림자를 낮췄다.
- 고양이가 다니는 별 표면의 발밑 광량과 그림자를 줄여 배경 일러스트와 더 차분하게 섞이도록 했다.
- 로컬 브라우저에서 이동 중 `cat-wrap walking`, 착지 중 `cat-wrap settling`, 종료 후 기본 상태로 이어지는 전환을 확인했다.

### Verification

- `node node_modules\typescript\bin\tsc --noEmit` passed.
- `pnpm run build` passed.
- `git diff --check` passed.

## 2026-09-14 - 오후/저녁 밤하늘 톤 분리

- 메인 하늘에 `sky-afternoon`, `sky-evening`, `sky-night` 시간대 상태를 추가했다.
- 이동 진행도에 따라 `--dusk-progress`를 계산해 오후 배경이 저녁과 밤으로 천천히 어두워지도록 구성했다.
- 배경 일러스트 위에 밤 레이어와 하단 노을 억제 레이어를 추가해 과한 수평선 광량을 낮췄다.
- 별 사이를 깊게 걸어갈수록 별가루, 별자리 선, 기억별의 존재감이 더 살아나도록 조정했다.
- 고양이와 안내 문구도 어두워진 배경에 맞춰 밝기와 그림자를 다시 맞췄다.
- 로컬 브라우저에서 기본 오후 톤과 여러 번 이동한 뒤의 저녁/밤 톤을 확인했다.

### Verification

- `node node_modules\typescript\bin\tsc --noEmit` passed.
- `pnpm run build` passed.
- `git diff --check` passed.

## 2026-09-14 - 6시 기준 낮/밤 하늘과 앉는 루루 보정

- 메인 하늘의 밝기 기준을 스크롤 진행도가 아니라 브라우저 현재 시각으로 변경했다.
- 오전 6시부터 오후 6시 전까지는 `sky-afternoon`, 오후 6시부터 다음 오전 6시 전까지는 `sky-night`가 적용되도록 했다.
- 개발 확인용으로 `?sky-time=afternoon`, `?sky-time=evening`, `?sky-time=night` 강제 모드를 추가했다.
- 루루의 정지 컷을 `cat-back-v2.png`로 바꾸고, 걷기 종료 후 더 낮고 작게 내려앉는 전환을 추가했다.
- 로컬 브라우저에서 night/afternoon 강제 모드와 걷기 종료 후 앉은 상태를 확인했다.

### Verification

- `node node_modules\typescript\bin\tsc --noEmit` passed.
- `pnpm run build` passed.
- `git diff --check` passed.

## 2026-09-14 - 걷기 종료 타이밍 재조정

- 스크롤이 멈추자마자 바로 앉는 방식은 끊겨 보여서, 짧은 마지막 발걸음 후 앉는 방식으로 되돌렸다.
- 기본 걷기 유지 시간을 약 0.56초로 줄이고, 터치 이동은 약 0.5초로 줄여 이전보다 빠르게 반응하도록 했다.
- 앉는 전환은 0.78초의 부드러운 착지 애니메이션으로 정리했다.
- 앉을 때 `scale(.9)`로 작아지던 보정을 제거해 걷는 고양이와 앉은 고양이가 같은 체감 크기로 이어지게 했다.
- 이전 실험용 즉시 앉기 CSS와 중복 종료 애니메이션을 제거하고 최종 종료 애니메이션 하나만 남겼다.

### Verification

- `node node_modules\typescript\bin\tsc --noEmit` passed.
- `pnpm run build` passed.
- `git diff --check` passed.

## 2026-09-14 - 기억별 일러스트 모양 1차 적용

- 밤하늘의 기억별이 단순 원형/이모티콘처럼 보이지 않도록 CSS 기반 일러스트 별 레이어를 추가했다.
- 기존 `dot`, `four`, `six`, `orb`, `comet`, `flower`, `crystal` 형태를 유지하되 각각 발자국, 별빛, 실뭉치, 부드러운 달빛, 꼬리별, 생선/간식, 크리스털 느낌으로 보이게 조정했다.
- 생성되는 별과 테스트 별도 같은 `.star-core` 구조를 사용하므로 새 모양이 자동 적용된다.
- PNG 이미지를 여러 장 늘리지 않고 CSS/SVG 질감으로 구현해 작은 크기와 모바일 확대/축소에서 흐려지지 않게 했다.
- 로컬 미리보기에서 별 모양이 이모티콘이 아니라 배경에 섞이는 작은 일러스트 형태로 렌더링되는 것을 확인했다.

### Verification

- `node node_modules\typescript\bin\tsc --noEmit` passed.
- `pnpm run build` passed.
- `git diff --check` passed.

## 2026-09-14 - 기억별 3D 구체화와 드래그 확장감

- 고양이 물건 실루엣처럼 보이던 기억별 모양을 제거하고, 작은 3D 빛 구체 스타일로 통일했다.
- 활동별 shape는 데이터 구조로 유지하되, 화면에서는 색조와 크기 차이 중심으로 표현해 이모티콘/아이콘 느낌을 줄였다.
- 마우스나 터치로 밤하늘을 옆/위아래로 당길 때 `dragPull` 값을 계산해 별자리 공간이 아주 살짝 확장되도록 했다.
- 드래그 강도에 따라 별자리 레이어, 기억별, 원근 먼지, 별자리 선이 미세하게 커지고 선명해져 공간을 잡아당기는 느낌을 준다.
- `prefers-reduced-motion`에서는 드래그 확장 transform을 제거해 움직임 부담을 줄였다.

### Verification

- `node node_modules\typescript\bin\tsc --noEmit` passed.
- `pnpm run build` passed.
- `git diff --check` passed.
- `http://localhost:3000/?center-image-check=2` returned 200.

## 2026-09-14 - 기억별 상태별 컬러 체계 적용

- 기억별 색상을 무지개식 활동 분류가 아니라 상태 중심으로 정리했다.
- 비어 있는 별은 희미한 아이보리, 사진이 담긴 별은 따뜻한 크림/복숭아 계열, 새로 생성된 별은 살구빛, 특별한 별은 골드빛으로 보이게 했다.
- 활동별 `tone-*` 값은 유지하되 전체 색을 갈라놓지 않고 구체 내부에 약한 틴트로만 섞이게 했다.
- 선택한 별은 중심부가 흰빛에 가까워지고 외곽이 따뜻하게 빛나도록 조정했다.
- 3D 구체 스타일의 광원, 내부 그림자, 외곽 글로우가 상태별 색을 따라가도록 CSS 변수를 정리했다.

### Verification

- `node node_modules\typescript\bin\tsc --noEmit` passed.
- `pnpm run build` passed.
- `git diff --check` passed.
- `http://localhost:3000/?center-image-check=2` returned 200.

## 2026-09-14 - 생성 기억별 시간 기반 배치 알고리즘

- 새 기억별 배치를 고정 좌표 배열에서 시간 기반 배치 규칙으로 바꿨다.
- 생성된 기억별은 날짜가 최신일수록 가까운 깊이와 중앙에 가까운 위치에 놓이고, 오래된 기억일수록 더 먼 깊이와 좌우/상하 가장자리 쪽에 놓인다.
- 기존 저장된 생성 별도 화면에 불러올 때 새 규칙으로 재배치해, 테스트 별 10개처럼 여러 별이 있을 때 중앙에 몰려 보이는 현상을 줄였다.
- 먼 별은 화면 가장자리나 살짝 바깥 좌표까지 허용해 밤하늘이 넓게 이어지는 느낌을 만들었다.
- 별에 가까워지는 스크롤 구간에서는 투영 위치를 약하게 중앙으로 끌어와, 가장자리의 먼 별도 걸어가며 시야 중심으로 다가오는 느낌을 추가했다.
- 테스트 별 생성과 테스트 별 삭제 흐름도 새 배치 규칙을 사용하도록 맞췄다.

### Verification

- `node node_modules\typescript\bin\tsc --noEmit` passed.
- `pnpm run build` passed.
- `git diff --check` passed.
- `http://localhost:3000/?center-image-check=2` returned 200.

## 2026-09-14 - 지나간 기억별 크기와 사라짐 보정

- 스크롤로 별에 가까워졌을 때 기억별이 행성처럼 과하게 커지고 지나간 뒤에도 남아 보이던 문제를 수정했다.
- 투영 계산에서 위치 확대와 실제 별 크기 확대를 분리하고, 기억별의 최대 시각 크기를 낮췄다.
- 별이 시야를 지나가면 더 빠르게 opacity가 0이 되도록 fade 구간을 좁혔다.
- `data-distance='passed'` 상태의 별은 glow와 core까지 투명하게 처리해 스크롤로 들어간 별이 확실히 사라지게 했다.
- 가까운 생성 별도 최대 크기를 제한해 큰 행성처럼 보이지 않게 했다.

### Verification

- `node node_modules\typescript\bin\tsc --noEmit` passed.
- `pnpm run build` passed.
- `git diff --check` passed.
- `http://localhost:3000/?center-image-check=2` returned 200.

## 2026-09-14 - 기억별 테두리 소프트 halo 실험

- 기억별 주변의 또렷한 원형 테두리가 UI 링처럼 보여서, 기존 코드는 남겨둔 채 하단 오버라이드 블록으로만 부드럽게 실험했다.
- `.proximity-ring`의 border를 제거하고, 흐린 radial/conic gradient와 mask로 안개 같은 halo가 보이도록 했다.
- 가까운 별, hover/focus/selected 상태에서는 halo가 조금 더 보이지만 선명한 원으로 보이지 않게 opacity와 blur를 낮췄다.
- 원복이 필요하면 `Soft halo experiment` CSS 블록만 제거하면 기존 테두리 스타일로 돌아갈 수 있다.

### Verification

- `node node_modules\typescript\bin\tsc --noEmit` passed.
- `pnpm run build` passed.
- `git diff --check` passed.
- `http://localhost:3000/?center-image-check=2` returned 200.

## 2026-09-14 - 지나간 기억별 잔광 보정

- 직전 보정에서 별이 너무 빨리 사라지는 느낌이 있어 fade 구간을 조금 넓혔다.
- 지나간 별은 완전히 즉시 사라지지 않고, 아주 작은 흐린 잔광으로 잠깐 남도록 했다.
- 큰 구체나 원형 테두리가 남지 않도록 passed 상태의 core 최대 크기와 halo opacity는 계속 제한했다.

### Verification

- `node node_modules\typescript\bin\tsc --noEmit` passed.
- `pnpm run build` passed.
- `git diff --check` passed.
- `http://localhost:3000/?center-image-check=2` returned 200.
