# Cat Star Image & Animation Design Guide

이 문서는 GPT Image 또는 다른 이미지 생성 도구로 `고양이의 별`에 들어갈 별, 고양이, 배경, 애니메이션 프레임을 만들 때 기준으로 삼는 디자인 가이드다. 목표는 새 에셋이 기존 사이트의 밤하늘과 자연스럽게 섞이도록 컨셉, 색감, 질감, 움직임의 언어를 일관되게 유지하는 것이다.

## Core Concept

`고양이의 별`은 떠난 고양이를 멀리 보내는 이야기가 아니라, 기억이 밤하늘의 작은 별로 남아 다시 만날 수 있는 공간이다. 화면의 감정은 슬픔을 크게 드러내기보다 조용한 그리움, 따뜻한 재회, 천천히 가까워지는 기억에 가깝다.

핵심 이미지는 세 가지다.

- 중앙 위쪽의 큰 별: 고양이의 중심별, 모든 기억이 돌아오는 자리
- 별빛 들판에 앉은 검은 고양이: 사용자를 등지고 별을 바라보는 동행자
- 주변의 기억별: 사진과 날짜, 활동의 기억이 작게 반짝이는 조각들

에셋은 “우주”, “게임”, “판타지”보다 “개인적인 추모 공간”, “조용한 그림책”, “부드러운 밤 산책”에 가까워야 한다.

## Visual Thesis

부드러운 노을빛이 남아 있는 보랏빛 밤하늘, 낮은 별빛 들판, 뒤돌아 앉은 작은 검은 고양이. 모든 것은 또렷하게 설명하기보다 은은하게 떠오른다.

좋은 방향:

- 부드러운 디지털 페인팅
- 수채화처럼 번지는 하늘
- 필름 그레인처럼 아주 약한 입자감
- 가장자리가 살짝 흐려진 빛
- 따뜻한 크림색 별빛
- 고양이는 실루엣 중심이되, 귀와 등, 꼬리 라인은 알아볼 수 있게

피해야 할 방향:

- 강한 네온, SF 우주선, 은하 폭발
- 과장된 캐릭터 표정
- 만화적인 검은 외곽선
- 지나치게 귀여운 스티커 스타일
- 공포스럽거나 차갑고 죽음이 직접 드러나는 분위기
- 화면 안에 문구, 로고, UI 버튼, 글자 포함

## Color Palette

기존 사이트의 색감은 낮은 채도의 보라, 푸른 밤, 복숭아빛 지평선, 크림색 별빛으로 이루어진다.

Primary sky:

- Deep twilight blue: `#293962`
- Soft blue violet: `#4b5788`
- Muted periwinkle: `#69709b`
- Lavender haze: `#817eac`
- Dusty mauve: `#b6a0c1`

Horizon and warmth:

- Peach dusk: `#e9b6b3`
- Warm horizon glow: `#ffccaa`
- Soft apricot: `#ffc083`
- Pale rose: `#efa9bb`

Star light:

- Cream star: `#fff3c1`
- Warm white: `#fff9e9`
- Gold memory: `#ffe0a0`
- Blue memory: `#cbdcff`
- Lavender memory: `#d9c7f2`

Black cat:

- Base silhouette: near-black with blue-purple undertone, not pure `#000`
- Highlight: dim violet rim light along ear, shoulder, back, tail
- Shadow: soft, transparent, feathered into the grass surface

Use warm light against cool shadow. The image should never become a one-color purple wash; keep peach and cream light visible.

## Lighting

The main light source is the central star above the cat. It should feel warm, soft, and circular, like a small moon made of memory.

Lighting rules:

- The star casts a faint amber glow downward.
- The cat receives only a subtle rim light, mainly on ears, head, shoulders, and tail curve.
- The grass surface catches tiny warm specks, as if dew or memory dust is reflecting the star.
- Shadows are soft and blurred, never hard-edged.
- Glow should bloom outward in translucent layers, not in sharp rings.

## Main Sky Background

The home background should support responsive cropping. Important visual anchors:

- Main star near the upper center
- Open sky around the star
- The cat below the star on the same vertical axis
- A visible grassy/starry surface near the bottom
- Enough empty sky for memory stars and UI overlays

For new background generations:

- Create at wide landscape ratio first, ideally `16:9` or wider.
- Keep the grass surface visible in the lower 12-20% of the frame.
- Put the main star around 15-20% from the top.
- Put the cat sitting on the surface around 76-84% from the top.
- Leave horizontal breathing room; do not crowd the cat with large objects.
- Do not bake in UI text, buttons, labels, or title.

Recommended GPT Image prompt:

```text
Soft painterly digital illustration for a memorial web app called "Cat Star". A small black cat seen from behind sits calmly on a glowing grassy hill, looking up at one warm cream-colored memory star in the upper center of a blue violet twilight sky. The horizon has muted peach and rose dusk light, tiny distant stars, faint comet-like specks, gentle atmospheric grain, soft bloom, quiet emotional mood, no text, no UI, no logo, no hard outlines, no cartoon expression. Wide responsive composition with empty sky for interface overlays, grass visible at the bottom, cat aligned under the star.
```

Negative prompt:

```text
No text, no buttons, no logo, no watermark, no realistic photo, no horror, no angel wings, no halo on the cat, no spaceship, no bright neon, no busy galaxy, no sharp comic outline, no front-facing cat, no oversized eyes.
```

## Cat Asset Direction

The cat is Lulu-like: a small black cat viewed from behind, quiet and attentive. The viewer should feel that the cat is present, not posing.

Shape language:

- Upright seated body
- Small triangular ears
- Rounded shoulders
- Curved tail resting near the ground
- Slight asymmetry so it feels alive
- Back-facing or three-quarter back-facing pose

Rendering:

- Mostly silhouette
- Very soft fur edge, no detailed fur clumps
- Low contrast facial detail or none
- Subtle purple-blue rim light
- Transparent PNG/WebP preferred for overlay sprites

The cat must visually touch the surface. Leave minimal transparent padding below the paws/tail in generated assets, or document the exact padding so CSS can compensate.

### Cat Idle Prompts

```text
Transparent-background sprite of a small black cat seen from behind, sitting quietly with a curved tail resting on the ground. Soft painterly digital style, subtle violet-blue rim light on ears and back, gentle warm glow from above, no face visible, no text, no shadow baked into the image, centered in frame, minimal transparent padding.
```

### Cat Walking Prompts

Generate as a sprite sheet with 4 frames in one horizontal row.

```text
Transparent-background horizontal sprite sheet, 4 animation frames of a small black cat seen from behind walking slowly forward. Soft painterly silhouette, subtle violet-blue rim light, tail gently sways, body bob is minimal, calm memorial mood, no text, no ground, no shadow baked in, consistent size and registration across frames.
```

Frame notes:

- Frame 1: neutral step, tail low
- Frame 2: body rises slightly, front shoulder shift
- Frame 3: opposite step, tail curves a little more
- Frame 4: returns close to neutral

Movement should be slow and meditative, not playful or energetic.

## Star Asset Direction

Stars are memories, not generic decoration. They should feel like tiny held moments.

Shared traits:

- Small luminous cores
- Feathered glow
- Slightly irregular shapes
- Warm center, cool outer haze
- Low opacity when distant
- More glow than physical body

Memory star categories already used by the app:

- `낮잠`: orb, cream
- `창가 구경`: four-point star, blue
- `놀이`: six-point star, peach
- `산책·외출`: comet, lavender
- `식사·간식`: flower-like star, gold
- `함께한 일상`: dot, white
- `특별한 날`: crystal, rose

Do not make every star equally bright. A good sky has depth: many faint lights, a few near memories, and one central star.

### Main Star Prompt

```text
Warm cream-colored memory star, soft circular glow, painterly digital style, layered amber bloom, tiny four-point glint in the center, gentle transparent outer haze, quiet emotional tone, no text, isolated on transparent background.
```

### Memory Star Sprite Prompt

```text
Small memory star icon set on transparent background, soft painterly glow, warm cream centers with subtle blue, peach, lavender, gold, white, and rose variations. Include dot, four-point, six-point, orb, comet, flower-like, and crystal-like star shapes. Delicate, low-contrast, no hard outlines, no UI labels, no text.
```

## Animation Language

All movement should feel like breathing, drifting, or remembering. Avoid fast loops and obvious mechanical motion.

Good motion:

- Very slow glow pulse
- Tiny twinkle with uneven timing
- Cat body bob only while walking
- Tail sways gently
- Star glow expands and fades when a memory is born
- Dust motes drift upward or sideways
- Background parallax is subtle

Avoid:

- Bouncy cartoon easing
- Fast sparkle bursts
- Confetti
- Fireworks
- Screen-shake
- Strong zooms
- Repetitive synchronized twinkling

Timing suggestions:

- Main star breathing: 6-8 seconds per loop
- Memory star twinkle: 5-9 seconds with varied delays
- New memory birth glow: 2-3 seconds
- Cat walk cycle: 1.6-2.2 seconds
- Cat settle into idle: 0.7-1.0 seconds

Easing should feel soft: cubic-bezier close to `.22, 1, .36, 1`.

## Image Generation Specs

Use these specs unless a specific feature needs a different format.

Background:

- Format: PNG or high-quality WebP
- Suggested size: `2400x1350`, `2560x1440`, or wider if making a hero sky
- No text or UI
- Must include extra sky margin for responsive cropping
- Surface should be visible enough for the cat to sit on

Cat overlay:

- Format: transparent PNG/WebP
- Idle: single frame
- Walking: horizontal sprite sheet, 4 equal-width frames
- Keep consistent registration across frames
- Minimal padding below feet/tail

Stars:

- Format: transparent PNG/WebP if generated as raster assets
- Keep glow visible on dark blue and mauve backgrounds
- Make the core small; do not make planet-like spheres

## Composition Rules

The default home composition:

- Star and cat share a vertical axis.
- The cat sits below the star, visually grounded on the hill.
- The first memory prompt floats between the star and cat, never touching the cat.
- On mobile, surrounding star labels should be hidden or extremely reduced.
- On ultra-wide screens, the background should crop so the grassy surface rises into view.

When making alternate images, test mentally in three crops:

- Mobile portrait: `350x670`
- Desktop: `1440x900`
- Ultra-wide: `2549x1275`

If the cat floats, the background failed. If the labels or cards crowd the cat, the composition failed. If the star no longer feels like the cat's destination, the emotional axis failed.

## Prompt Template

Use this template for future GPT Image requests.

```text
Create [asset type] for "고양이의 별", a quiet Korean memorial web app about a beloved black cat whose memories become stars.

Mood: gentle grief, warm remembrance, calm reunion, slow night walk.
Style: soft painterly digital illustration, subtle grain, low contrast, feathered glow, no hard cartoon outlines.
Palette: deep twilight blue, muted violet, dusty mauve, peach horizon, warm cream star light.
Subject: [specific subject or animation frame].
Composition: [where the cat/star/surface should sit], with enough empty sky for UI overlays.
Lighting: warm central memory-star glow, soft violet-blue shadows, subtle rim light.
Output: [transparent PNG / wide background / sprite sheet], no text, no UI, no logo, no watermark.
Avoid: neon sci-fi, busy galaxy, horror, angel wings, front-facing mascot expression, sharp outlines, stickers.
```

## Asset Checklist

Before adding a generated image to the site, check:

- Does it match the current twilight blue, violet, peach, and cream palette?
- Does it keep the same quiet emotional tone?
- Is there no baked-in text or UI?
- Does the cat touch the ground or surface?
- Does it still work when cropped on mobile and ultra-wide screens?
- Are transparent edges clean?
- Are animation frames aligned and similar in size?
- Is the glow soft enough to sit behind existing UI?

## Current Site References

Useful existing assets:

- `public/assets/center-world/lulu-main-sky-clean-no-hero.png`
- `public/assets/center-world/lulu-center-world.png`
- `public/assets/cat-back-v2.png`
- `public/assets/cat-walk-sprite-v2.png`

Useful code references:

- `lib/memory-stars.ts`: memory star shape and tone categories
- `app/globals.css`: current palette, responsive sky composition, star/cat motion
- `components/sky/SkyScene.tsx`: scene structure and interaction behavior

