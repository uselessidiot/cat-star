import { starDepths } from '@/lib/memory-stars';

// Mirrors SkyScene.tsx's private depthFor()/createdStarPlace() math so freshly
// created stars land in a sensible spot immediately after creation. On the
// next full reload SkyScene recomputes added-star positions itself from the
// full list (layoutCreatedStars), so this only needs to be "good enough" for
// the one frame between creation and the next page load — it does not need
// to stay byte-identical with SkyScene.tsx forever.

const RECENT_CREATED_PLACES: Array<[number, number]> = [
  [52, 42], [43, 48], [61, 49], [36, 39], [69, 39], [49, 58],
];

export function legacyStarDepth(legacySlotId: number) {
  const band = starDepths[legacySlotId] ?? 'far';
  const base = band === 'near' ? 0.54 : band === 'mid' ? 1.12 : 1.78;
  return base + ((legacySlotId * 17) % 11) / 36;
}

export type AddedStarPlacement = { x: number; y: number; depth: number; size: number };

export function placeAddedStar(input: { id: number; rankFromNewest: number; total: number }): AddedStarPlacement {
  const { id, rankFromNewest, total } = input;
  if (rankFromNewest < RECENT_CREATED_PLACES.length) {
    const [x, y] = RECENT_CREATED_PLACES[rankFromNewest];
    return { x, y, depth: 0.98 + rankFromNewest * 0.09, size: Math.max(7, 10 - (rankFromNewest % 3)) };
  }

  const progress = total <= 1 ? 0 : rankFromNewest / Math.max(1, total - 1);
  const theta = ((rankFromNewest * 137.508 + (id % 9) * 13 - 94) * Math.PI) / 180;
  const radiusX = 22 + Math.pow(progress, 0.68) * 54;
  const radiusY = 13 + Math.pow(progress, 0.72) * 34;
  const edgeDrift = Math.min(1, Math.max(0, (rankFromNewest - 8) / 18));
  const x = 50 + Math.cos(theta) * radiusX * (1 + edgeDrift * 0.18);
  const y = 43 + Math.sin(theta) * radiusY + progress * 13;

  return {
    x: Math.max(-12, Math.min(112, x)),
    y: Math.max(14, Math.min(84, y)),
    depth: Math.min(2.24, 1.38 + Math.pow(progress, 0.74) * 0.76 + rankFromNewest * 0.025),
    size: 6 + ((id + rankFromNewest) % 4),
  };
}
