/* client-side motion tokens for the interactive sky */
'use client';

import type { CSSProperties } from 'react';

export type CatMoment = 'star-birth' | 'center-touch' | 'turn-back';
export type CatMotion = 'idle' | 'walk' | 'settle' | CatMoment;

export const catMotionSprites = {
  idle: {
    src: '/assets/cat-back-v2.png',
  },
  walk: {
    src: '/assets/cat-walk-sprite-v2.png',
    frames: 4,
    durationMs: 2120,
  },
} as const;

export function resolveCatMotion(walking: boolean, settling: boolean, moment: CatMoment | null): CatMotion {
  if (walking) return 'walk';
  if (settling) return 'settle';
  return moment ?? 'idle';
}

export function catMotionCssVars() {
  return {
    '--cat-idle-src': `url("${catMotionSprites.idle.src}")`,
    '--cat-walk-sprite': `url("${catMotionSprites.walk.src}")`,
    '--cat-walk-duration': `${catMotionSprites.walk.durationMs}ms`,
  } as CSSProperties;
}
