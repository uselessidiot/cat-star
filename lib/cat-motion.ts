/* client-side motion tokens for the interactive sky */
'use client';

import type { CSSProperties } from 'react';

export type CatMoment = 'star-birth' | 'center-touch' | 'turn-back';
export type CatMotion = 'idle' | 'walk' | 'settle' | CatMoment;

export const catMotionSprites = {
  idle: {
    src: '/assets/cat-back-v2.png',
  },
  idleGesture: {
    src: '/assets/cat-idle-sprite-v1.png',
    frames: 6,
    durationMs: 1720,
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
    '--cat-idle-sprite': `url("${catMotionSprites.idleGesture.src}")`,
    '--cat-idle-sprite-duration': `${catMotionSprites.idleGesture.durationMs}ms`,
    '--cat-walk-sprite': `url("${catMotionSprites.walk.src}")`,
    '--cat-walk-duration': `${catMotionSprites.walk.durationMs}ms`,
  } as CSSProperties;
}
