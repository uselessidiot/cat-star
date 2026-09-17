# Cat's Orbit Sprite Prompts

이 문서는 GPT Image로 고양이 움직임 스프라이트를 만들 때 바로 붙여 넣기 위한 프롬프트 모음입니다. 전체 방향은 `CAT_STAR_IMAGE_ANIMATION_GUIDE.md`의 컨셉을 따릅니다.

## 공통 스타일

모든 스프라이트 요청에 아래 조건을 유지합니다.

```text
Style:
Soft painterly digital illustration, dreamy but clean web animation asset, tender and nostalgic mood, quiet violet twilight atmosphere, warm peach-gold rim light, subtle fur softness, no hard outlines, no cartoon exaggeration.

Character:
A small black cat viewed mostly from behind or three-quarter back view. Keep the same body shape, head size, ear shape, tail length, silhouette, and scale across all frames. The cat should feel like a beloved pet quietly moving through a memory night sky.

Sprite sheet requirements:
- Transparent background.
- Horizontal sprite sheet.
- Equal frame size.
- No text, no labels, no UI, no background scenery.
- Do not draw grid lines.
- Keep the cat aligned to the same ground baseline in every frame.
- Leave consistent padding around each frame.
- The silhouette must remain readable at small web size.
- Soft warm peach-gold rim light from above/front.
```

## 1. Idle Look-Up

기본 대기 + 별을 올려다보는 루프입니다. 첫 적용 우선순위가 가장 높습니다.

```text
Create a clean horizontal sprite sheet for a black cat character seen mostly from behind, matching a quiet emotional memory website called "Cat's Orbit".

Style:
Soft painterly digital illustration, dreamy but clean web animation asset, tender and nostalgic mood, quiet violet twilight atmosphere, warm peach-gold rim light, subtle fur softness, no hard outlines, no cartoon exaggeration.

Character:
A small black cat viewed from behind or three-quarter back view. The cat should feel like it is quietly watching warm memory stars. Keep the same body shape, head size, ear shape, tail length, silhouette, and scale across all frames.

Sprite sheet requirements:
- Transparent background.
- Horizontal sprite sheet.
- 6 frames total.
- Equal frame size.
- No text, no labels, no UI, no background scenery.
- Do not draw grid lines.
- Keep the cat aligned to the same ground baseline in every frame.
- Leave consistent padding around each frame.
- The silhouette must remain readable at small web size.
- Soft warm peach-gold rim light from above/front.

Animation:
Idle + emotional look-up loop. The motion should be subtle and poetic, not comedic.

Frame 1:
Cat sitting still, facing away, tail resting softly on the ground.

Frame 2:
Subtle breathing motion, shoulders slightly lifted, tail tip gently raised.

Frame 3:
Ears tilt forward as if noticing a memory star.

Frame 4:
Head slowly lifts upward, looking toward a warm star above.

Frame 5:
Tail curls slightly closer to the body, posture becomes softer and more attentive.

Frame 6:
Cat returns toward the original sitting pose, calm and quiet, ready to loop smoothly.

Visual constraints:
The cat should not jump, run, smile, speak, or face the viewer fully. Keep it realistic enough to feel like a beloved pet, but simplified enough for a web animation sprite.

Output:
One PNG sprite sheet, transparent background, 6 horizontal frames, high resolution.
```

## 2. Slow Walk

별 사이를 이동할 때 쓰는 기본 걷기 루프입니다.

```text
Create a clean horizontal sprite sheet for a black cat walking slowly from behind, matching a quiet emotional memory website called "Cat's Orbit".

Style:
Soft painterly digital illustration, dreamy web animation asset, black cat silhouette with subtle fur softness, warm peach-gold rim light, calm violet-night mood. No hard outlines, no cartoon exaggeration.

Character:
A small black cat viewed from behind or three-quarter back view. Keep the same body shape, head size, ear shape, tail length, silhouette, and scale across all frames.

Sprite sheet requirements:
- Transparent background.
- Horizontal sprite sheet.
- 8 frames total.
- Equal frame size.
- No text, labels, UI, shadows, or background scenery.
- Do not draw grid lines.
- Keep the cat aligned to the same ground baseline in every frame.
- Keep consistent body size and proportions across frames.
- Leave padding around each frame.
- Readable as a small web character.

Animation:
Slow gentle walking loop, back view / three-quarter back view. The cat takes calm, quiet steps forward. The shoulders, hips, paws, and tail move subtly. The tail sways gently, never high or playful. The head stays mostly forward, occasionally dipping slightly as if walking through grass under a night sky.

Mood:
Tender, nostalgic, quiet, magical. The movement should feel like the cat is guiding the viewer between memory stars.

Output:
One PNG sprite sheet, transparent background, 8 horizontal frames, high resolution.
```

## 3. Sit Settle

별 앞에 도착했을 때 걷다가 앉는 전환입니다.

```text
Create a clean horizontal sprite sheet for a black cat slowly settling into a sitting pose, viewed from behind or three-quarter back view, matching a quiet emotional memory website called "Cat's Orbit".

Style:
Soft painterly digital illustration, dreamy but clean web animation asset, quiet violet twilight mood, warm peach-gold rim light, subtle fur softness, no hard outlines, no cartoon exaggeration.

Sprite sheet requirements:
- Transparent background.
- Horizontal sprite sheet.
- 6 frames total.
- Equal frame size.
- No text, no labels, no UI, no background scenery.
- Do not draw grid lines.
- Keep the ground baseline consistent.
- Leave consistent padding around each frame.

Animation:
The cat finishes a slow walk and gently sits down in front of a memory star.

Frame 1:
Cat standing still after walking, facing away.

Frame 2:
Head and shoulders lower slightly, back legs begin to fold.

Frame 3:
Body lowers closer to the ground, tail starts to curve.

Frame 4:
Cat settles into a seated posture, ears softly forward.

Frame 5:
Tail wraps or rests beside the body.

Frame 6:
Calm seated pose, looking slightly upward, ready to hold on the final frame.

Mood:
Quiet arrival, emotional pause, gentle attention.

Output:
One PNG sprite sheet, transparent background, 6 horizontal frames, high resolution.
```

## 4. Star Birth Look

새 기억별이 생성될 때 쓰는 반응입니다.

```text
Create a clean horizontal sprite sheet for a black cat reacting softly to a newly born memory star above, viewed mostly from behind, matching a quiet emotional memory website called "Cat's Orbit".

Style:
Soft painterly digital illustration, dreamy web animation asset, tender nostalgic mood, violet twilight atmosphere, warm peach-gold rim light, subtle fur softness, no hard outlines, no cartoon exaggeration.

Sprite sheet requirements:
- Transparent background.
- Horizontal sprite sheet.
- 6 frames total.
- Equal frame size.
- No text, no labels, no UI, no background scenery.
- Do not draw grid lines.
- Keep the cat aligned to the same ground baseline in every frame.
- Leave consistent padding around each frame.

Animation:
The cat notices a warm star appearing above and quietly looks up. Add a slightly stronger warm rim light on the cat's ears and back in the middle frames, as if the new star is glowing.

Frame 1:
Cat sitting or standing calmly, facing away.

Frame 2:
Ears lift and tilt forward.

Frame 3:
Head rises toward the star.

Frame 4:
Warm rim light becomes slightly brighter around ears, shoulders, and tail.

Frame 5:
Cat holds the upward gaze, posture soft and still.

Frame 6:
Light softens while the cat remains calm, ready to transition back to idle.

Mood:
Small wonder, warmth, memory becoming visible.

Output:
One PNG sprite sheet, transparent background, 6 horizontal frames, high resolution.
```

## 5. Gentle Turn Back

밤 끝 이야기나 특별한 구간에서 아주 살짝 뒤돌아보는 감정 동작입니다.

```text
Create a clean horizontal sprite sheet for a black cat gently turning its head back, viewed mostly from behind, matching a quiet emotional memory website called "Cat's Orbit".

Style:
Soft painterly digital illustration, dreamy but clean web animation asset, tender nostalgic mood, violet night sky feeling, warm peach-gold rim light, subtle fur softness, no hard outlines, no cartoon exaggeration.

Sprite sheet requirements:
- Transparent background.
- Horizontal sprite sheet.
- 6 frames total.
- Equal frame size.
- No text, no labels, no UI, no background scenery.
- Do not draw grid lines.
- Keep the cat aligned to the same ground baseline in every frame.
- Leave consistent padding around each frame.

Animation:
The cat is sitting or standing still, then gently turns its head and upper body slightly as if looking back toward the viewer. It should not fully face the viewer. The feeling should be quiet and emotional, like a brief acknowledgement.

Frame 1:
Cat facing away, calm.

Frame 2:
One ear shifts backward.

Frame 3:
Head begins to turn slightly over the shoulder.

Frame 4:
Three-quarter back view, head turned just enough to suggest it noticed the viewer.

Frame 5:
Cat holds the soft backward glance.

Frame 6:
Cat begins returning toward the original forward-facing pose.

Mood:
Tender, restrained, bittersweet, not dramatic.

Output:
One PNG sprite sheet, transparent background, 6 horizontal frames, high resolution.
```

## 6. Center Star Touch

중심별을 누르거나 쓰다듬을 때 쓰는 반응입니다.

```text
Create a clean horizontal sprite sheet for a black cat receiving warm starlight, viewed from behind or three-quarter back view, matching a quiet emotional memory website called "Cat's Orbit".

Style:
Soft painterly digital illustration, dreamy web animation asset, gentle violet twilight mood, warm peach-gold rim light, subtle fur softness, no hard outlines, no cartoon exaggeration.

Sprite sheet requirements:
- Transparent background.
- Horizontal sprite sheet.
- 5 frames total.
- Equal frame size.
- No text, no labels, no UI, no background scenery.
- Do not draw grid lines.
- Keep the cat aligned to the same ground baseline in every frame.
- Leave consistent padding around each frame.

Animation:
The cat quietly reacts to a warm central star being touched. The motion is small: ears soften, head tilts, body relaxes, tail curls gently.

Frame 1:
Cat sitting still, facing away.

Frame 2:
Warm rim light appears a little stronger along the ears and back.

Frame 3:
Cat tilts its head slightly, relaxed and attentive.

Frame 4:
Tail curls softly closer to the body.

Frame 5:
Cat returns to a calm seated pose with a faint warm edge light.

Mood:
Comforted, remembered, quietly loved.

Output:
One PNG sprite sheet, transparent background, 5 horizontal frames, high resolution.
```

## Negative Prompt

필요하면 아래 문장을 함께 넣습니다.

```text
Avoid: full background, scenery, grass, UI elements, text, labels, grid lines, frame numbers, white boxes, harsh black outlines, cartoon mascot style, exaggerated facial expression, front-facing cat, smiling cat, running jump pose, distorted anatomy, inconsistent cat size, inconsistent baseline, cropped ears, cropped tail, strong shadow blob, realistic photo style.
```

## 추천 제작 순서

1. `Idle Look-Up`: 화면 기본 생동감.
2. `Slow Walk`: 별 사이 이동.
3. `Sit Settle`: 별 선택 후 멈춤.
4. `Star Birth Look`: 새 기억 생성.
5. `Gentle Turn Back`: 밤 끝 이야기.
6. `Center Star Touch`: 중심별 상호작용.

