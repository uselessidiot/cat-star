'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import Image from 'next/image';

export const CAT_STAR_OPENING_SEEN = 'cat-star-opening-seen-v1';

const OPENING_SCENE_MS = 1800;
const OPENING_TOTAL_MS = 8000;

const openingScenes = [
  {
    id: 'call',
    image: '/assets/opening/opening-01-call.png',
    text: <>함께한 기억은,<br />조금 멀리서도 계속 빛나요.</>,
    label: '별을 바라보는 고양이',
  },
  {
    id: 'step',
    image: '/assets/opening/opening-02-step.png',
    text: <>기억을 따라<br />한 걸음씩 걸어가면</>,
    label: '고양이가 별을 향해 첫걸음을 시작하는 장면',
  },
  {
    id: 'walk',
    image: '/assets/opening/opening-03-walk.png',
    text: <>잊고 있던 순간들이<br />하나씩 다시 빛나고</>,
    label: '기억별 사이를 걷는 장면',
  },
  {
    id: 'arrival',
    image: '/assets/opening/opening-04-arrival-night.png',
    text: <>다시,<br />너의 별을 만나요.</>,
    label: '어두운 밤하늘에서 가장 빛나는 별과 만나는 마지막 장면',
  },
] as const;

type CatStarOpeningProps = {
  open: boolean;
  onComplete: () => void;
};

export function CatStarOpening({ open, onComplete }: CatStarOpeningProps) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set());
  const [exiting, setExiting] = useState(false);
  const startedAt = useRef(0);
  const sceneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completed = useRef(false);
  const activeScene = openingScenes[sceneIndex];
  const reducedMotion = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  useEffect(() => {
    if (!open) return;
    setSceneIndex(0);
    setPreviousIndex(null);
    completed.current = false;
    setExiting(false);
    startedAt.current = Date.now();
    openingScenes.slice(1).forEach((scene, index) => {
      const preload = new window.Image();
      preload.onload = () => setLoaded((current) => new Set(current).add(index + 1));
      preload.src = scene.image;
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (sceneTimer.current) clearTimeout(sceneTimer.current);
    if (finishTimer.current) clearTimeout(finishTimer.current);

    finishTimer.current = setTimeout(() => finish(), OPENING_TOTAL_MS);
    sceneTimer.current = setTimeout(() => goNext(), reducedMotion ? OPENING_SCENE_MS + 250 : OPENING_SCENE_MS);

    return () => {
      if (sceneTimer.current) clearTimeout(sceneTimer.current);
      if (finishTimer.current) clearTimeout(finishTimer.current);
    };
  }, [open, sceneIndex, loaded, reducedMotion]);

  function markLoaded(index: number) {
    setLoaded((current) => new Set(current).add(index));
  }

  function finish() {
    if (completed.current) return;
    completed.current = true;
    setExiting(true);
    window.setTimeout(onComplete, 700);
  }

  function goNext() {
    if (!open || completed.current) return;
    if (sceneIndex >= openingScenes.length - 1) {
      finish();
      return;
    }

    const nextIndex = sceneIndex + 1;
    if (!loaded.has(nextIndex)) {
      sceneTimer.current = setTimeout(() => goNext(), 180);
      return;
    }

    setPreviousIndex(sceneIndex);
    setSceneIndex(nextIndex);
    window.setTimeout(() => setPreviousIndex((current) => current === sceneIndex ? null : current), 780);
  }

  function handleBackdropClick(event: MouseEvent<HTMLElement>) {
    if (event.target !== event.currentTarget) return;
    goNext();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') finish();
    if (event.key === 'ArrowRight' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      goNext();
    }
  }

  if (!open) return null;

  return <section className={`cat-opening${exiting ? ' exiting' : ''}`} role="dialog" aria-modal="true" aria-label="고양이의 별 첫 방문 오프닝" onClick={handleBackdropClick} onKeyDown={handleKeyDown} tabIndex={-1}>
    <div className="cat-opening-stage" aria-live="polite">
      {openingScenes.map((scene, index) => {
        const status = index === sceneIndex ? 'active' : index === previousIndex ? 'previous' : '';
        return <figure key={scene.id} className={`cat-opening-scene scene-${scene.id} ${status}`} aria-hidden={index !== sceneIndex}>
          <Image src={scene.image} alt={scene.label} fill sizes="100vw" priority={index === 0} loading={index === 0 ? 'eager' : 'eager'} onLoad={() => markLoaded(index)} unoptimized />
        </figure>;
      })}
      <div className={`cat-opening-particles scene-${activeScene.id}`} aria-hidden="true"><i /><i /><i /></div>
      <div className={`cat-opening-glow scene-${activeScene.id}`} aria-hidden="true" />
      <div className="cat-opening-copy" aria-label={`오프닝 문구 ${sceneIndex + 1} / ${openingScenes.length}`}>
        <p key={activeScene.id}>{activeScene.text}</p>
      </div>
      <button className="cat-opening-skip" type="button" onClick={finish}>건너뛰기</button>
      <div className="cat-opening-dots" aria-label={`현재 장면 ${sceneIndex + 1} / ${openingScenes.length}`}>
        {openingScenes.map((scene, index) => <i key={scene.id} className={index === sceneIndex ? 'active' : ''} />)}
      </div>
      {sceneIndex === openingScenes.length - 1 && <button className="cat-opening-start" type="button" onClick={finish}>나의 밤하늘 시작하기 <span>✦</span></button>}
    </div>
  </section>;
}
