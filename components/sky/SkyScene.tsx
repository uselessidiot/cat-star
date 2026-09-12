'use client';
/* oxlint-disable next/no-html-link-for-pages */

import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type PointerEvent, type SyntheticEvent, type TouchEvent, type WheelEvent } from 'react';
import Image from 'next/image';
import { activityFor, activityStyles, activityTags, constellationPairs, memoryStars, mobileStarPositions, starDepths, type ActivityTag, type MemoryStarData } from '@/lib/memory-stars';
import { deleteStoredMemory, getStoredCatProfile, getStoredMemories, MEMORY_STORE_CHANGED, saveStoredCatProfile, saveStoredMemories, type CatProfile } from '@/lib/memory-store';

const MAX_TRAVEL = 2.18;
const END_STORY_GATE = MAX_TRAVEL - .045;
const STORY_APPROACH_START = END_STORY_GATE - .32;

function clampTravel(value: number) {
  return Math.min(MAX_TRAVEL, Math.max(0, value));
}

function easeJourney(progress: number) {
  return .5 - Math.cos(progress * Math.PI) / 2;
}

function journeyDuration(from: number, to: number) {
  const distance = Math.abs(to - from);
  return Math.round(980 + Math.min(1.9, distance) * 1420 + (distance > .9 ? 420 : 0));
}

function depthFor(id: number, customDepth?: number) {
  if (customDepth != null) return customDepth;
  const band = starDepths[id] ?? 'far';
  const base = band === 'near' ? 0.54 : band === 'mid' ? 1.12 : 1.78;
  return base + ((id * 17) % 11) / 36;
}

function project(x: number, y: number, depth: number, travel: number) {
  const distance = depth - travel;
  const scale = Math.min(6.4, Math.max(.46, .32 + 1.12 / Math.max(.18, distance + .42)));
  return {
    distance,
    scale,
    x: 50 + (x - 50) * scale,
    y: 46 + (y - 46) * scale,
    opacity: distance < -.44 ? 0 : distance < .08 ? Math.max(0, (distance + .44) / .52) : Math.min(1, .35 + scale * .38),
    selectable: distance >= .06 && distance <= .66,
  };
}

function dateFromFile(file: File) {
  const filenameDate = file.name.match(/(20\d{2})[-_.]?(0[1-9]|1[0-2])[-_.]?([0-2]\d|3[01])/);
  if (filenameDate) return `${filenameDate[1]}-${filenameDate[2]}-${filenameDate[3]}`;
  const date = new Date(file.lastModified || Date.now());
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dateInputFromDisplay(date: string) {
  const match = date.match(/(20\d{2})\D+(0?[1-9]|1[0-2])\D+([0-2]?\d|3[01])/);
  if (!match) return '';
  return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
}

function displayDate(date: string) {
  const input = date.includes('-') ? date : dateInputFromDisplay(date);
  if (!input) return '아직 준비 중';
  return input.replaceAll('-', '. ');
}

function daysBetween(from: string) {
  if (!from) return null;
  const start = new Date(`${from}T00:00:00`);
  if (Number.isNaN(start.getTime())) return null;
  return Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000) + 1);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readableMemoryNote(note: string) {
  return note.replace(`${TEST_SEED_MARKER} `, '');
}

const catStoryMessages = [
  { title: '루루의 작은 말', body: '오늘도 여기까지 와줘서 고마워.' },
  { title: '별 사이에서', body: '나는 멀리 있는 게 아니라, 네가 올 때마다 조금씩 가까워져.' },
  { title: '조용한 약속', body: '괜찮아. 천천히 걸어와도 돼. 나는 늘 이 밤에 있을게.' },
  { title: '따뜻한 기억', body: '네가 웃던 소리도, 내 이름을 부르던 목소리도 아직 반짝여.' },
  { title: '고마운 마음', body: '내 하루를 오래 기억해줘서 고마워.' },
  { title: '다시 만나는 밤', body: '보고 싶을 때마다 놀러와. 나는 별 하나를 더 밝혀둘게.' },
  { title: '작은 발자국', body: '우리가 함께 걸었던 시간은 사라지지 않고 길이 됐어.' },
  { title: '주인을 향해', body: '네 곁에 있던 모든 순간이 나에게는 따뜻한 집이었어.' },
  { title: '밤하늘 끝에서', body: '더 걸어가도 좋아. 오래된 기억들이 천천히 문을 열 거야.' },
  { title: '언제나 여기', body: '네가 나를 떠올리는 동안, 나는 계속 반짝이고 있을게.' },
  { title: '끝나지 않는 길', body: '여기가 끝처럼 보여도, 우리 기억은 조금 더 이어져.' },
  { title: '작은 골골송', body: '네 마음이 조용해질 때까지 옆에서 작게 골골거릴게.' },
  { title: '늦은 인사', body: '늦게 와도 괜찮아. 나는 기다리는 법을 잘 아니까.' },
  { title: '햇빛 조각', body: '네 손끝의 온기를 아직 기억해. 참 따뜻했어.' },
  { title: '잠든 자리', body: '내가 좋아하던 자리는 사실 네가 가까이 있던 곳이야.' },
  { title: '별 하나 더', body: '네가 기억 하나를 꺼낼 때마다 이 밤은 조금 더 환해져.' },
  { title: '보고 싶은 날', body: '많이 보고 싶은 날에는 오래 걸어도 돼. 내가 천천히 맞춰 걸을게.' },
  { title: '괜찮다는 말', body: '울어도 괜찮아. 그런 마음까지 전부 내게 닿고 있어.' },
  { title: '우리의 계절', body: '봄도 여름도 가을도 겨울도, 네 옆이라서 좋았어.' },
  { title: '돌아오는 별', body: '너는 나를 찾아오는 게 아니라, 우리가 있던 곳으로 돌아오는 거야.' },
  { title: '작은 부탁', body: '가끔은 웃으면서 와줘. 그럼 나도 더 밝게 빛날 수 있어.' },
  { title: '긴 밤의 끝', body: '밤이 길어도 무섭지 않아. 네가 나를 기억해주니까.' },
  { title: '품 안의 우주', body: '나에게 가장 넓은 우주는 네 품 안이었어.' },
  { title: '또 만나는 곳', body: '다음 별에서도, 그 다음 별에서도 나는 너를 알아볼게.' },
];

const defaultCatProfile: CatProfile = {
  name: '루루',
  guardianName: '',
  metDate: '2012-04-18',
  birthday: '',
  description: '한 장면을 담은 기억별과 달리, 이 별은 모든 기억이 돌아오는 중심이에요. 함께한 시간 전체를 조용히 품고 있어요.',
};

const createdStarPath = [
  [42, 38], [58, 35], [35, 48], [66, 47], [49, 58], [28, 40],
  [74, 56], [39, 66], [61, 64], [22, 56], [78, 34], [51, 27],
];

const TEST_SEED_MARKER = '[cat-star-test-seed]';
const OPENING_STORY_SEEN = 'cat-star-opening-story-seen';
const isLocalDevelopment = process.env.NODE_ENV !== 'production';

const testMemorySeeds: Array<{ name: string; date: string; note: string; activity: ActivityTag; palette: [string, string, string] }> = [
  { name: '테스트 01 · 창가 첫빛', date: '2020-03-01', note: '아침 창가에 오래 머문 사진 한 장을 넣었을 때의 별이에요.', activity: '창가 구경', palette: ['#756fa8', '#f3c8bb', '#fff2c9'] },
  { name: '테스트 02 · 낮잠 자리', date: '2020-03-04', note: '담요 위에서 잠든 순간이 부드러운 별로 놓이는지 보는 테스트예요.', activity: '낮잠', palette: ['#5f6f9f', '#e8b4c4', '#ffe4ae'] },
  { name: '테스트 03 · 장난감 소리', date: '2020-03-08', note: '놀이 사진이 조금 더 생기 있게 보이는지 확인해요.', activity: '놀이', palette: ['#6b5f9a', '#f1aa91', '#fff8d6'] },
  { name: '테스트 04 · 간식 기다림', date: '2020-03-11', note: '간식 앞에서 반짝이던 눈빛을 별 하나로 남겨요.', activity: '식사·간식', palette: ['#79679b', '#f4bd7d', '#fff4c7'] },
  { name: '테스트 05 · 비 오는 날', date: '2020-03-15', note: '흐린 날의 사진도 밤하늘에서 너무 어둡지 않은지 살펴봐요.', activity: '함께한 일상', palette: ['#586c99', '#b9b0d3', '#f6dbc4'] },
  { name: '테스트 06 · 병원 다녀온 날', date: '2020-03-19', note: '외출 기억이 차분한 보라빛 별로 자리 잡는지 확인해요.', activity: '산책·외출', palette: ['#625889', '#c3aad5', '#fee2bd'] },
  { name: '테스트 07 · 생일 리본', date: '2020-03-22', note: '특별한 날의 별이 다른 별 사이에서 살짝 돋보이는지 봐요.', activity: '특별한 날', palette: ['#7b5f91', '#eda5b6', '#fff1c2'] },
  { name: '테스트 08 · 소파 옆자리', date: '2020-03-26', note: '평범한 일상 사진이 작고 따뜻하게 쌓이는지 보는 테스트예요.', activity: '함께한 일상', palette: ['#676d9c', '#efb9a8', '#fff3cc'] },
  { name: '테스트 09 · 해 질 무렵', date: '2020-03-29', note: '저녁빛 사진이 복숭아색으로 너무 튀지 않게 놓이는지 확인해요.', activity: '창가 구경', palette: ['#5d6698', '#f0aa9b', '#ffdba5'] },
  { name: '테스트 10 · 손끝 온기', date: '2020-04-02', note: '열 번째 사진까지 넣었을 때 하늘이 복잡하지 않은지 보는 마지막 별이에요.', activity: '낮잠', palette: ['#706395', '#f0beb0', '#fff5cf'] },
];

function nextCreatedStarPlace(ordinal: number) {
  const [baseX, baseY] = createdStarPath[ordinal % createdStarPath.length];
  const lap = Math.floor(ordinal / createdStarPath.length);
  const drift = Math.min(5, lap * 1.4);
  const direction = ordinal % 2 === 0 ? -1 : 1;
  return {
    x: Math.max(14, Math.min(86, baseX + direction * drift)),
    y: Math.max(22, Math.min(74, baseY + Math.sin((ordinal + 1) * 1.7) * 2.8)),
    depth: Math.min(2.12, 1.38 + ordinal * .055),
    size: 7 + ordinal % 3,
  };
}

export function SkyScene() {
  const [addedStars, setAddedStars] = useState<MemoryStarData[]>([]);
  const [filledStars, setFilledStars] = useState<Record<number, MemoryStarData>>({});
  const [photoUrls, setPhotoUrls] = useState<Record<number, string[]>>({});
  const [addedNotes, setAddedNotes] = useState<Record<number, string>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailPhotoIndex, setDetailPhotoIndex] = useState(0);
  const [detailReady, setDetailReady] = useState(false);
  const [centerOpen, setCenterOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [openingStoryOpen, setOpeningStoryOpen] = useState(false);
  const [centerTouched, setCenterTouched] = useState(false);
  const [fillTargetId, setFillTargetId] = useState<number | null>(null);
  const [creatingMemory, setCreatingMemory] = useState(false);
  const [seedingTestMemories, setSeedingTestMemories] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [singlePreview, setSinglePreview] = useState<string | null>(null);
  const [bornIds, setBornIds] = useState<number[]>([]);
  const [creationNotice, setCreationNotice] = useState<{ id: number; name: string; message: string } | null>(null);
  const [draft, setDraft] = useState<{ name: string; date: string; note: string; activity: ActivityTag }>({ name: '', date: '', note: '', activity: '함께한 일상' });
  const [travel, setTravel] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [walking, setWalking] = useState(false);
  const [storyStep, setStoryStep] = useState(0);
  const [storyPulse, setStoryPulse] = useState(0);
  const [endScrolls, setEndScrolls] = useState(0);
  const [catProfile, setCatProfile] = useState<CatProfile>(defaultCatProfile);
  const [profileDraft, setProfileDraft] = useState<CatProfile>(defaultCatProfile);
  const [centerEditing, setCenterEditing] = useState(false);
  const [profilePortraitUrl, setProfilePortraitUrl] = useState<string | null>(null);
  const [profilePortraitBlob, setProfilePortraitBlob] = useState<Blob | undefined>(undefined);
  const walkingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const detailTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const travelAnimation = useRef<number | null>(null);
  const travelRef = useRef(0);
  const storyLastAt = useRef(0);
  const centerTouchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pointerDrag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const touchGesture = useRef<{ x: number; y: number; panX: number; panY: number; distance: number | null; travel: number; mode: 'pending' | 'pan' | 'travel' | 'pinch' } | null>(null);
  const detailPhotoSwipe = useRef<{ x: number; y: number } | null>(null);
  const suppressNextTap = useRef(false);
  const baseStars = memoryStars.map((star) => filledStars[star.id] ?? star);
  const allStars = [...baseStars, ...addedStars];
  const selected = allStars.find((star) => star.id === selectedId);
  const projected = allStars.map((star) => ({ star, ...project(star.x, star.y, depthFor(star.id, star.depth), travel) }));
  const selectedProjection = selected ? projected.find((item) => item.star.id === selected.id) : null;
  const detailVisible = Boolean(selected && detailReady);
  const detailOnRight = !selectedProjection || selectedProjection.x < 52;
  const catVisitShift = selectedProjection ? Math.min(9.5, Math.max(-9.5, (selectedProjection.x - 50) / 5.6)) : 0;
  const skyFollowShift = Math.min(1.25, Math.max(-1.25, catVisitShift * .13));
  const catLean = selectedProjection ? Math.min(1.15, Math.max(-1.15, (selectedProjection.x - 50) / 28)) : 0;
  const catStep = selectedProjection ? Math.min(5, Math.max(-5, (selectedProjection.x - 50) / 14)) : 0;
  const detailStyle = selectedProjection ? {
    '--detail-x': `${Math.min(82, Math.max(18, selectedProjection.x + (detailOnRight ? 8 : -8)))}%`,
    '--detail-y': `${Math.min(74, Math.max(24, selectedProjection.y + 2))}%`,
  } as CSSProperties : undefined;
  const closest = projected.filter((item) => item.selectable).sort((a, b) => a.distance - b.distance)[0];
  const atStoryEnd = travel >= END_STORY_GATE;
  const storyActive = storyPulse > 0 && atStoryEnd && !detailVisible && !centerOpen && !createOpen && !openingStoryOpen;
  const currentStory = catStoryMessages[storyStep % catStoryMessages.length];
  const endApproach = Math.min(1, Math.max(0, (travel - STORY_APPROACH_START) / (MAX_TRAVEL - STORY_APPROACH_START)));
  const journeyText = atStoryEnd ? '밤 끝에서 · 천천히 더 걸으면 작은 말이 떠올라요' : endApproach > .55 ? '말이 떠오르는 밤끝으로 가는 중' : travel < .1 ? '스크롤·스와이프로 별 사이 걷기' : closest ? `${closest.star.name} 가까이` : '더 먼 기억으로 걷는 중';
  const endWarmth = Math.min(1, endApproach * .42 + (atStoryEnd ? endScrolls / 9 * .58 : 0));
  const filledMemoryStars = allStars.filter((star) => (photoUrls[star.id]?.length ?? 0) > 0);
  const totalPhotoCount = filledMemoryStars.reduce((sum, star) => sum + (photoUrls[star.id]?.length ?? 0), 0);
  const datedMemories = filledMemoryStars.map((star) => ({ star, inputDate: dateInputFromDisplay(star.date) })).filter((item) => item.inputDate);
  const firstMemory = [...datedMemories].sort((a, b) => a.inputDate.localeCompare(b.inputDate))[0]?.star;
  const recentMemory = [...datedMemories].sort((a, b) => b.inputDate.localeCompare(a.inputDate))[0]?.star;
  const topActivity = Object.entries(filledMemoryStars.reduce<Record<string, number>>((counts, star) => {
    const activity = activityFor(star);
    counts[activity] = (counts[activity] ?? 0) + 1;
    return counts;
  }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '아직 준비 중';
  const togetherDays = daysBetween(catProfile.metDate);
  const memoryNotes = [
    '햇빛이 오래 머물던 자리에서, 우리는 아무 말 없이 같은 풍경을 바라봤어요.',
    '작고 따뜻했던 순간은 멀어져도 사라지지 않고 조용히 빛나요.',
    '평범해서 더 소중했던 하루. 네가 곁에 있다는 것만으로 충분했어요.',
    '문득 돌아보면 언제나 그 자리에 있던 온기를 기억해요.',
  ];

  useEffect(() => {
    travelRef.current = travel;
    if (travel < END_STORY_GATE && endScrolls) {
      setEndScrolls(0);
      setStoryPulse(0);
    }
  }, [travel]);

  useEffect(() => {
    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') { closeSelectedStar(); setCreateOpen(false); setCenterOpen(false); closeOpeningStory(); }
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      if (walkingTimer.current) clearTimeout(walkingTimer.current);
      if (detailTimer.current) clearTimeout(detailTimer.current);
      if (centerTouchTimer.current) clearTimeout(centerTouchTimer.current);
      if (travelAnimation.current != null) cancelAnimationFrame(travelAnimation.current);
    };
  }, []);

  useEffect(() => {
    try {
      const hasRequestedMemory = Boolean(new URLSearchParams(window.location.search).get('memory'));
      const hasSeenOpening = window.localStorage.getItem(OPENING_STORY_SEEN) === 'true';
      if (!hasRequestedMemory && !hasSeenOpening) setOpeningStoryOpen(true);
    } catch {
      setOpeningStoryOpen(true);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const urls: string[] = [];
    function loadMemoriesFromStore() {
      getStoredMemories().then((stored) => {
      if (!active) return;
      const storedBaseStars = stored.filter((memory) => memory.id <= 20);
      const storedAddedStars = stored.filter((memory) => memory.id > 20);
      setFilledStars(Object.fromEntries(storedBaseStars.map((memory) => [memory.id, memory.star])));
      setAddedStars(storedAddedStars.map((memory) => memory.star));
      setAddedNotes(Object.fromEntries(stored.map((memory) => [memory.id, readableMemoryNote(memory.note)])));
      setPhotoUrls(Object.fromEntries(stored.map((memory) => {
        const photos = memory.photos.map((photo) => { const url = URL.createObjectURL(photo); urls.push(url); return url; });
        return [memory.id, photos];
      })));
      const requestedId = Number(new URLSearchParams(window.location.search).get('memory'));
      const requested = [...memoryStars, ...stored.map((memory) => memory.star)].find((star) => star.id === requestedId);
      if (requested) focusStar(requested.id, requested.depth);
    }).catch(() => undefined);
    }
    function handleStorage(event: StorageEvent) {
      if (event.key === MEMORY_STORE_CHANGED) loadMemoriesFromStore();
    }
    loadMemoriesFromStore();
    window.addEventListener(MEMORY_STORE_CHANGED, loadMemoriesFromStore);
    window.addEventListener('storage', handleStorage);
    return () => {
      active = false;
      window.removeEventListener(MEMORY_STORE_CHANGED, loadMemoriesFromStore);
      window.removeEventListener('storage', handleStorage);
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    let active = true;
    const urls: string[] = [];
    getStoredCatProfile().then((profile) => {
      if (!active || !profile) return;
      const next = { ...defaultCatProfile, ...profile };
      setCatProfile(next);
      setProfileDraft(next);
      setProfilePortraitBlob(profile.portrait);
      if (profile.portrait) {
        const url = URL.createObjectURL(profile.portrait);
        urls.push(url);
        setProfilePortraitUrl(url);
      }
    }).catch(() => undefined);
    return () => {
      active = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function cancelTravelAnimation() {
    if (travelAnimation.current != null) {
      cancelAnimationFrame(travelAnimation.current);
      travelAnimation.current = null;
    }
  }

  function beginWalking(duration = 3000) {
    setWalking(true);
    if (walkingTimer.current) clearTimeout(walkingTimer.current);
    walkingTimer.current = setTimeout(() => setWalking(false), duration + 420);
  }

  function animateTravelTo(targetValue: number, duration: number) {
    cancelTravelAnimation();
    const from = travelRef.current;
    const target = clampTravel(targetValue);
    if (Math.abs(target - from) < .015) {
      travelRef.current = target;
      setTravel(target);
      return;
    }

    const startedAt = performance.now();
    let lastPaintAt = startedAt;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const next = from + (target - from) * easeJourney(progress);
      if (now - lastPaintAt > 30 || progress === 1) {
        travelRef.current = next;
        setTravel(next);
        lastPaintAt = now;
      }

      if (progress < 1) {
        travelAnimation.current = requestAnimationFrame(tick);
      } else {
        travelAnimation.current = null;
        travelRef.current = target;
        setTravel(target);
      }
    };

    travelAnimation.current = requestAnimationFrame(tick);
  }

  function revealDetail(delay = 880) {
    setDetailReady(false);
    if (detailTimer.current) clearTimeout(detailTimer.current);
    detailTimer.current = setTimeout(() => setDetailReady(true), delay);
  }

  function closeSelectedStar() {
    if (detailTimer.current) clearTimeout(detailTimer.current);
    setDetailReady(false);
    setSelectedId(null);
    setDetailPhotoIndex(0);
  }

  function openCenterStar() {
    closeSelectedStar();
    setCenterEditing(false);
    setOpeningStoryOpen(false);
    setCenterOpen((open) => !open);
  }

  function touchCenterStar() {
    setCenterTouched(true);
    setStoryPulse(0);
    if (centerTouchTimer.current) clearTimeout(centerTouchTimer.current);
    centerTouchTimer.current = setTimeout(() => setCenterTouched(false), 2400);
  }

  function closeOpeningStory() {
    setOpeningStoryOpen(false);
    try {
      window.localStorage.setItem(OPENING_STORY_SEEN, 'true');
    } catch {
      // Local preview storage can be unavailable in private or restricted contexts.
    }
  }

  function replayOpeningStory() {
    closeSelectedStar();
    setCenterOpen(false);
    setCreateOpen(false);
    setOpeningStoryOpen(true);
  }

  function visitStar(id: number, customDepth?: number, delay = 880) {
    const target = clampTravel(depthFor(id, customDepth) - .3);
    const distance = Math.abs(target - travelRef.current);
    const duration = journeyDuration(travelRef.current, target);
    const detailDelay = distance < .08 ? delay : Math.min(4700, Math.max(delay, duration + 180));
    setSelectedId(id);
    setDetailPhotoIndex(0);
    setCenterOpen(false);
    setPan({ x: 0, y: 0 });
    animateTravelTo(target, duration);
    beginWalking(duration);
    revealDetail(detailDelay);
  }

  function resetUploadDraft() {
    setPendingFiles([]);
    setSinglePreview(null);
  }

  function makeTestMemoryPhoto(seed: (typeof testMemorySeeds)[number], index: number) {
    const [sky, warmth, light] = seed.palette;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${sky}"/>
      <stop offset=".58" stop-color="${warmth}"/>
      <stop offset="1" stop-color="${light}"/>
    </linearGradient>
    <radialGradient id="glow" cx=".42" cy=".32" r=".72">
      <stop offset="0" stop-color="#fff8dd" stop-opacity=".86"/>
      <stop offset=".42" stop-color="#fff0d2" stop-opacity=".36"/>
      <stop offset="1" stop-color="#5b527f" stop-opacity=".1"/>
    </radialGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="9"/></filter>
  </defs>
  <rect width="720" height="720" fill="url(#sky)"/>
  <circle cx="240" cy="210" r="230" fill="url(#glow)"/>
  <ellipse cx="360" cy="530" rx="270" ry="90" fill="#4d456b" opacity=".18" filter="url(#soft)"/>
  <path d="M270 438c-28-39-22-112 27-145 23-16 32-52 63-52 30 0 40 36 64 52 49 33 55 106 27 145-31 44-150 44-181 0z" fill="#fff6e8" opacity=".76"/>
  <path d="M284 302l-44-75 91 38M436 302l44-75-91 38" fill="#fff6e8" opacity=".76"/>
  <circle cx="326" cy="366" r="9" fill="#6d5c77" opacity=".62"/>
  <circle cx="394" cy="366" r="9" fill="#6d5c77" opacity=".62"/>
  <path d="M343 406c18 14 34 14 52 0" fill="none" stroke="#6d5c77" stroke-width="8" stroke-linecap="round" opacity=".46"/>
  <text x="360" y="624" text-anchor="middle" fill="#fff8e7" font-family="Georgia, serif" font-size="28" opacity=".82">photo ${String(index + 1).padStart(2, '0')}</text>
</svg>`;
    return new Blob([svg], { type: 'image/svg+xml' });
  }

  function closeCreator(force = false) {
    if (creatingMemory && !force) return;
    setCreateOpen(false);
    setFillTargetId(null);
  }

  function openCreatorForNewStar() {
    setFillTargetId(null);
    resetUploadDraft();
    setDraft({ name: '', date: '', note: '', activity: '함께한 일상' });
    setCreateOpen(true);
  }

  function openFillMemory(star: MemoryStarData) {
    setFillTargetId(star.id);
    resetUploadDraft();
    setDraft({
      name: star.name,
      date: star.date.replaceAll('. ', '-'),
      note: '',
      activity: activityFor(star),
    });
    setCreateOpen(true);
  }

  function openCenterProfileEdit() {
    setProfileDraft(catProfile);
    setProfilePortraitBlob(catProfile.portrait);
    setCenterEditing(true);
  }

  function handleProfilePortraitSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setProfilePortraitBlob(file);
    setProfilePortraitUrl(URL.createObjectURL(file));
  }

  async function saveCatProfileDetails(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextProfile: CatProfile = {
      ...profileDraft,
      name: profileDraft.name.trim() || '이름 없는 고양이',
      guardianName: profileDraft.guardianName.trim(),
      description: profileDraft.description.trim() || '이 별은 함께한 모든 기억이 돌아오는 중심이에요.',
      portrait: profilePortraitBlob,
    };
    await saveStoredCatProfile(nextProfile);
    setCatProfile(nextProfile);
    setProfileDraft(nextProfile);
    setCenterEditing(false);
  }

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const accepted = Array.from(event.target.files ?? []).slice(0, 1);
    setPendingFiles(accepted);
    const file = accepted[0];
    setSinglePreview(file ? URL.createObjectURL(file) : null);
    if (file) setDraft((current) => ({
      ...current,
      name: current.name || file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      date: current.date || dateFromFile(file),
    }));
  }

  function focusStar(id: number, customDepth?: number) {
    visitStar(id, customDepth, 920);
  }

  function handleWheel(event: WheelEvent<HTMLElement>) {
    if (openingStoryOpen) return;
    if ((event.target as HTMLElement).closest('.memory-creator')) return;
    cancelTravelAnimation();
    const rawDelta = Math.sign(event.deltaY) * Math.min(.18, Math.abs(event.deltaY) / 560);
    const wasAtStoryEnd = travelRef.current >= END_STORY_GATE;
    setTravel((value) => {
      const nextDistance = allStars.map((star) => depthFor(star.id, star.depth) - value).filter((distance) => distance > 0).sort((a, b) => a - b)[0] ?? 1;
      const brake = rawDelta > 0 && nextDistance < .24 ? .34 + Math.max(0, nextDistance) / .24 * .66 : 1;
      const next = clampTravel(value + rawDelta * brake);
      travelRef.current = next;
      return next;
    });
    closeSelectedStar();
    if (rawDelta > .015 && wasAtStoryEnd) stirCatStory(1);
    beginWalking();
  }

  function stirCatStory(direction: -1 | 1 = 1, force = false) {
    if (travelRef.current < END_STORY_GATE && !force) return;
    const now = performance.now();
    if (!force && now - storyLastAt.current < 2100) return;
    storyLastAt.current = now;
    setStoryStep((step) => storyPulse === 0 && direction > 0 ? 0 : (step + direction + catStoryMessages.length) % catStoryMessages.length);
    setStoryPulse((pulse) => pulse + 1);
    setEndScrolls((count) => Math.min(28, count + 1));
  }

  function nudgeTravel(delta: number, walkingDuration = 1800) {
    cancelTravelAnimation();
    setTravel((value) => {
      const nextDistance = allStars.map((star) => depthFor(star.id, star.depth) - value).filter((distance) => distance > 0).sort((a, b) => a - b)[0] ?? 1;
      const brake = delta > 0 && nextDistance < .24 ? .34 + Math.max(0, nextDistance) / .24 * .66 : 1;
      const next = clampTravel(value + delta * brake);
      travelRef.current = next;
      return next;
    });
    closeSelectedStar();
    if (delta > .03 && travelRef.current >= END_STORY_GATE) stirCatStory(1);
    beginWalking(walkingDuration);
  }

  function stepJourney(direction: -1 | 1) {
    const target = clampTravel(travelRef.current + direction * .24);
    const duration = journeyDuration(travelRef.current, target);
    animateTravelTo(target, duration);
    closeSelectedStar();
    if (direction > 0 && travelRef.current >= END_STORY_GATE) stirCatStory(1, true);
    beginWalking(duration);
  }

  function shiftDetailPhoto(delta: -1 | 1, total: number) {
    setDetailPhotoIndex((index) => (index + delta + total) % total);
  }

  function isSkyTouchTarget(target: EventTarget) {
    const element = target instanceof HTMLElement ? target : null;
    if (!element) return false;
    if (element.closest('.memory-star')) return true;
    return !element.closest('.opening-story, .memory-creator, .memory-detail, .center-star-detail, .creation-notice, .journey-actions, .add-memory, .memory-library, input, textarea, select, label, a, button');
  }

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    if (!isSkyTouchTarget(event.target)) return;
    const a = event.touches[0];
    const b = event.touches[1];
    if (!a) return;
    touchGesture.current = {
      x: a.clientX,
      y: a.clientY,
      panX: pan.x,
      panY: pan.y,
      distance: b ? Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) : null,
      travel: travelRef.current,
      mode: b ? 'pinch' : 'pending',
    };
  }

  async function createStars(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creatingMemory) return;
    const file = pendingFiles[0];
    if (!file) return;
    setCreatingMemory(true);
    const source = { date: draft.date || dateFromFile(file), name: draft.name.trim() || file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '), file, preview: singlePreview, activity: draft.activity };
    if (fillTargetId) {
      const baseStar = allStars.find((star) => star.id === fillTargetId) ?? memoryStars.find((star) => star.id === fillTargetId);
      if (!baseStar) return;
      const style = activityStyles[source.activity ?? activityFor(baseStar)];
      const filledStar: MemoryStarData = {
        ...baseStar,
        name: source.name,
        date: source.date.replaceAll('-', '. '),
        shape: style.shape,
        tone: style.tone,
        activity: source.activity ?? activityFor(baseStar),
        photoCount: 1,
        created: true,
      };
      const note = draft.note.trim() || '이 순간이 조용히 별빛으로 머물러요.';
      await saveStoredMemories([{ id: filledStar.id, star: filledStar, note, photos: [source.file], createdAt: new Date().toISOString() }]);
      setFilledStars((stars) => ({ ...stars, [filledStar.id]: filledStar }));
      setPhotoUrls((current) => ({ ...current, [filledStar.id]: source.preview ? [source.preview] : [] }));
      setAddedNotes((current) => ({ ...current, [filledStar.id]: note }));
      setBornIds([filledStar.id]);
      setCreationNotice({ id: filledStar.id, name: filledStar.name, message: '기다리던 별에 기억이 스며들었어요.' });
      setTimeout(() => setBornIds([]), 2800);
      setTimeout(() => setCreationNotice(null), 6800);
      await wait(980);
      setCreatingMemory(false);
      closeCreator(true);
      setPendingFiles([]);
      setSinglePreview(null);
      setDraft({ name: '', date: '', note: '', activity: '함께한 일상' });
      focusStar(filledStar.id, filledStar.depth);
      return;
    }
    const nextId = Math.max(20, ...allStars.map((star) => star.id)) + 1;
    const ordinal = allStars.filter((star) => star.created).length;
    const place = nextCreatedStarPlace(ordinal);
    const style = activityStyles[source.activity ?? '함께한 일상'];
    const created: MemoryStarData = {
      id: nextId,
      name: source.name,
      date: source.date.replaceAll('-', '. '),
      x: place.x,
      y: place.y,
      size: place.size,
      shape: style.shape,
      tone: style.tone,
      activity: source.activity ?? undefined,
      depth: place.depth,
      photoCount: 1,
      created: true,
    };
    const note = draft.note.trim() || '이 순간이 밤하늘에 새 별로 머물러요.';
    await saveStoredMemories([{ id: created.id, star: created, note, photos: [source.file], createdAt: new Date().toISOString() }]);
    setAddedStars((stars) => [...stars, created]);
    setPhotoUrls((current) => ({ ...current, [created.id]: source.preview ? [source.preview] : [] }));
    setAddedNotes((current) => ({ ...current, [created.id]: note }));
    setBornIds([created.id]);
    setCreationNotice({ id: created.id, name: created.name, message: '작은 빛이 자리를 찾아 새 기억별이 되었어요.' });
    setTimeout(() => setBornIds([]), 2800);
    setTimeout(() => setCreationNotice(null), 6800);
    await wait(980);
    setCreatingMemory(false);
    closeCreator(true);
    setPendingFiles([]);
    setSinglePreview(null);
    setDraft({ name: '', date: '', note: '', activity: '함께한 일상' });
    focusStar(created.id, created.depth);
  }

  async function seedTenTestMemories() {
    if (seedingTestMemories) return;
    setSeedingTestMemories(true);
    try {
      const stored = await getStoredMemories();
      const testSeeds = stored.filter((memory) => memory.testSeed || memory.note.startsWith(TEST_SEED_MARKER));
      const preserved = stored.filter((memory) => !memory.testSeed && !memory.note.startsWith(TEST_SEED_MARKER));
      await Promise.all(testSeeds.map((memory) => deleteStoredMemory(memory.id)));

      const existingStars = [...memoryStars, ...preserved.map((memory) => memory.star)];
      const firstId = Math.max(20, ...existingStars.map((star) => star.id)) + 1;
      const ordinalStart = existingStars.filter((star) => star.created).length;
      const createdAt = new Date().toISOString();
      const seeded = testMemorySeeds.map((seed, index) => {
        const place = nextCreatedStarPlace(ordinalStart + index);
        const style = activityStyles[seed.activity];
        const star: MemoryStarData = {
          id: firstId + index,
          name: seed.name,
          date: seed.date.replaceAll('-', '. '),
          x: place.x,
          y: place.y,
          size: place.size,
          shape: style.shape,
          tone: style.tone,
          activity: seed.activity,
          depth: place.depth,
          photoCount: 1,
          created: true,
        };
        return { id: star.id, star, note: seed.note, photos: [makeTestMemoryPhoto(seed, index)], createdAt, testSeed: true };
      });

      await saveStoredMemories(seeded);
      setAddedStars([...preserved.filter((memory) => memory.id > 20).map((memory) => memory.star), ...seeded.map((memory) => memory.star)]);
      setFilledStars(Object.fromEntries(preserved.filter((memory) => memory.id <= 20).map((memory) => [memory.id, memory.star])));
      setAddedNotes(Object.fromEntries([...preserved, ...seeded].map((memory) => [memory.id, readableMemoryNote(memory.note)])));
      setPhotoUrls(Object.fromEntries([...preserved, ...seeded].map((memory) => [memory.id, memory.photos.map((photo) => URL.createObjectURL(photo))])));
      setBornIds(seeded.map((memory) => memory.id));
      setCreationNotice({ id: seeded[seeded.length - 1].id, name: '테스트 사진 10장', message: '사진을 하나씩 넣었을 때 생기는 별 10개를 채웠어요.' });
      setTimeout(() => setBornIds([]), 3200);
      setTimeout(() => setCreationNotice(null), 7600);
      closeSelectedStar();
      setCenterOpen(false);
      setCreateOpen(false);
      animateTravelTo(0, 920);
      beginWalking(920);
    } finally {
      setSeedingTestMemories(false);
    }
  }

  async function clearTestMemories() {
    if (seedingTestMemories) return;
    setSeedingTestMemories(true);
    try {
      const stored = await getStoredMemories();
      const testSeeds = stored.filter((memory) => memory.testSeed || memory.note.startsWith(TEST_SEED_MARKER));
      const preserved = stored.filter((memory) => !memory.testSeed && !memory.note.startsWith(TEST_SEED_MARKER));
      await Promise.all(testSeeds.map((memory) => deleteStoredMemory(memory.id)));
      setAddedStars(preserved.filter((memory) => memory.id > 20).map((memory) => memory.star));
      setFilledStars(Object.fromEntries(preserved.filter((memory) => memory.id <= 20).map((memory) => [memory.id, memory.star])));
      setAddedNotes(Object.fromEntries(preserved.map((memory) => [memory.id, readableMemoryNote(memory.note)])));
      setPhotoUrls(Object.fromEntries(preserved.map((memory) => [memory.id, memory.photos.map((photo) => URL.createObjectURL(photo))])));
      setBornIds([]);
      closeSelectedStar();
      setCenterOpen(false);
      setCreationNotice({ id: memoryStars[0].id, name: '테스트 기억을 지웠어요', message: '사진 10장 테스트로 만든 별만 밤하늘에서 비웠어요.' });
      setTimeout(() => setCreationNotice(null), 5200);
    } finally {
      setSeedingTestMemories(false);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    if ((event.target as HTMLElement).closest('button, a, input, textarea, label')) return;
    pointerDrag.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (!pointerDrag.current || event.pointerType !== 'mouse') return;
    setPan({ x: Math.max(-120, Math.min(120, pointerDrag.current.panX + event.clientX - pointerDrag.current.x)), y: Math.max(-80, Math.min(80, pointerDrag.current.panY + event.clientY - pointerDrag.current.y)) });
  }

  function handleTouchMove(event: TouchEvent<HTMLElement>) {
    const gesture = touchGesture.current;
    if (!gesture) return;
    if (event.touches.length === 2) {
      event.preventDefault();
      const a = event.touches[0]; const b = event.touches[1];
      const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      if (gesture.distance != null) {
        cancelTravelAnimation();
        const next = clampTravel(gesture.travel + (distance - gesture.distance) / 320);
        travelRef.current = next;
        setTravel(next);
      }
      suppressNextTap.current = true;
      closeSelectedStar(); beginWalking(1600); return;
    }
    const touch = event.touches[0];
    if (!touch) return;
    const dx = touch.clientX - gesture.x;
    const dy = touch.clientY - gesture.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (gesture.mode === 'pending' && Math.max(absX, absY) > 7) {
      gesture.mode = absY > absX * 1.08 ? 'travel' : 'pan';
    }
    if (gesture.mode === 'travel') {
      event.preventDefault();
      suppressNextTap.current = true;
      cancelTravelAnimation();
      const next = clampTravel(gesture.travel + (gesture.y - touch.clientY) / 390);
      travelRef.current = next;
      setTravel(next);
      closeSelectedStar();
      if (gesture.travel >= END_STORY_GATE && gesture.y - touch.clientY > 24) stirCatStory(1);
      beginWalking(1250);
      return;
    }
    if (gesture.mode === 'pan') {
      event.preventDefault();
      suppressNextTap.current = true;
      setPan({ x: Math.max(-52, Math.min(52, gesture.panX + dx * .72)), y: Math.max(-22, Math.min(22, gesture.panY + dy * .18)) });
    }
  }

  function handleTouchEnd() {
    touchGesture.current = null;
    setTimeout(() => { suppressNextTap.current = false; }, 120);
  }

  function handleDetailPhotoTouchStart(event: TouchEvent<HTMLElement>) {
    const touch = event.touches[0];
    if (!touch) return;
    detailPhotoSwipe.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleDetailPhotoTouchEnd(event: TouchEvent<HTMLElement>, total: number) {
    const start = detailPhotoSwipe.current;
    const touch = event.changedTouches[0];
    detailPhotoSwipe.current = null;
    if (!start || !touch || total < 2) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > 38 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      shiftDetailPhoto(dx < 0 ? 1 : -1, total);
    }
  }

  return (
    <main className={`sky-scene${endWarmth > .04 ? ' story-near' : ''}${atStoryEnd ? ' story-end' : ''}`} onWheel={handleWheel} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={() => { pointerDrag.current = null; }} onPointerCancel={() => { pointerDrag.current = null; }} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onTouchCancel={handleTouchEnd} style={{ '--travel': travel, '--end-warmth': endWarmth, '--pan-x':`${pan.x}px`, '--pan-y':`${pan.y}px`, '--cat-shift': `${Math.sin(travel * 3.4) * 2.35}vw`, '--cat-visit-shift': `${catVisitShift}vw`, '--sky-follow-shift': `${skyFollowShift}vw`, '--cat-lean': `${catLean}deg`, '--cat-counter-lean': `${-catLean * .6}deg`, '--cat-step-x': `${catStep}px` } as CSSProperties}>
      <div className="sky-background" aria-hidden="true"><div className="mist mist-one" /><div className="mist mist-two" /><div className="stardust" /></div>
      <header className="sky-header">
        <div className="brand" aria-label="고양이의 별"><span className="brand-star">✦</span><span>고양이의 별</span><small>CAT&apos;S ORBIT</small></div>
        <nav className="sky-actions" aria-label="주요 기억 동작">
          <button className="replay-opening" type="button" onPointerDown={(event) => event.stopPropagation()} onClick={replayOpeningStory}>처음 이야기 <span>✦</span></button>
          <button className="add-memory" type="button" onPointerDown={(event) => event.stopPropagation()} onClick={openCreatorForNewStar}><span>＋</span> 기억별 만들기</button>
          <a className="memory-library" href="/memories">다시 보는 기억</a>
        </nav>
      </header>

      <section className="star-world" aria-label="스크롤하여 기억별 사이를 걷는 루루의 밤하늘">
        <div className="sky-follow-layer">
          <div className="depth-dust depth-far" aria-hidden="true" />
          <div className="depth-dust depth-near" aria-hidden="true" />
          <svg className="constellations" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {constellationPairs.map(([a, b]) => {
              const from = projected[a - 1]; const to = projected[b - 1];
              const active = selectedId === a || selectedId === b;
              if (from.opacity < .08 || to.opacity < .08) return null;
              return <path key={`${a}-${b}`} className={active ? 'active' : ''} style={{ opacity: Math.min(from.opacity, to.opacity) }} d={`M ${from.x} ${from.y} Q ${(from.x + to.x) / 2 + 1.5} ${(from.y + to.y) / 2 - 1} ${to.x} ${to.y}`} />;
            })}
          </svg>

          <button className={`main-star${centerOpen ? ' selected' : ''}${centerTouched ? ' center-touched' : ''}`} type="button" aria-label={`${catProfile.name}의 중심별 열기`} aria-expanded={centerOpen} onClick={openCenterStar}>
            <span className="main-star-aura" aria-hidden="true" />
            <span className="main-star-ring" aria-hidden="true" />
            <span className="main-star-core" aria-hidden="true">
              <span className="main-star-glint">✦</span>
            </span>
            <span className="main-star-label">{catProfile.name}의 별</span>
          </button>
          {projected.map(({ star, x, y, scale, opacity, selectable, distance }) => {
            const hasPhoto = Boolean(photoUrls[star.id]?.[0]);
            const activity = activityFor(star);
            const visual = activityStyles[activity];
            const related = selected && selected.id !== star.id && activityFor(selected) === activity;
            const mobilePosition = mobileStarPositions[star.id] ?? [star.x, star.y];
            const mobile = project(mobilePosition[0], mobilePosition[1], depthFor(star.id), travel);
            return <button key={star.id} type="button" data-reachability={selectable ? 'selectable' : 'approach'}
              data-depth={starDepths[star.id] ?? 'far'} data-distance={distance < .03 ? 'passed' : selectable ? 'close' : 'far'} data-memory={hasPhoto ? 'filled' : 'empty'}
              className={`memory-star shape-${visual.shape} tone-${visual.tone}${star.favorite ? ' favorite' : ''}${hasPhoto ? ' filled' : ' empty'}${star.created ? ' created' : ''}${bornIds.includes(star.id) ? ' newly-born' : ''}${selectedId === star.id ? ' selected' : ''}${related ? ' tag-related' : ''}${selectedId && selectedId !== star.id && !related ? ' dimmed' : ''}`}
              style={{ left:`${x}%`, top:`${y}%`, opacity, '--depth-scale': scale, '--mobile-x':`${mobile.x}%`, '--mobile-y':`${mobile.y}%`, '--star-size':`${star.size}px`, '--twinkle-delay':`${(-((star.id * 1.37) % 8)).toFixed(2)}s`, '--twinkle-duration':`${(5.4 + (star.id % 5) * 1.1).toFixed(1)}s`, '--arrival-delay':`${120 + star.id * 42}ms` } as CSSProperties}
              aria-label={`${star.name}, ${star.date}${selectable ? ', 가까운 기억' : ', 멀리 있는 기억, 가까이 이동'}`} aria-pressed={selectedId === star.id}
              onClick={() => { if (suppressNextTap.current) return; selectedId === star.id && detailReady ? closeSelectedStar() : visitStar(star.id, star.depth, selectable ? 760 : 1080); }}><span className="proximity-ring" /><span className="star-core" /><span className="star-label"><strong>{star.name}</strong><small>{distance < .26 ? hasPhoto ? '지금 열어볼 수 있어요' : '기억을 기다려요' : '조금 더 가까이'}</small></span></button>;
          })}
        </div>

        <div className={`cat-wrap${walking ? ' walking' : ''}`} aria-hidden="true">
          <div className="cat-art"><Image className="cat-idle" src="/assets/cat-back-v3.webp" alt="" fill sizes="(max-width: 640px) 42vw, 16vw" style={{ objectFit: 'contain', objectPosition: 'center bottom' }} priority unoptimized /></div>
        </div>
        <div className="horizon-haze" aria-hidden="true" />
      </section>

      <div className={`journey-guide${atStoryEnd ? ' at-story-end' : ''}`}><span aria-live="polite">{journeyText}</span><div className="journey-track" aria-hidden="true"><i style={{ width: `${(travel / MAX_TRAVEL) * 100}%` }} /></div><div className="journey-actions"><button type="button" onClick={() => stepJourney(-1)} disabled={travel <= 0} aria-label="가까운 기억 쪽으로 한 걸음">‹</button><button type="button" onClick={() => stepJourney(1)} aria-label={atStoryEnd ? '다음 작은 말 듣기' : '먼 기억 쪽으로 한 걸음'}>›</button></div></div>
      <aside key={storyPulse} className={`cat-story${storyActive ? ' visible' : ''}${detailVisible || centerOpen || createOpen ? ' soft-hidden' : ''}`} aria-live="polite">
        <span>{currentStory.title}</span>
        <p>{currentStory.body}</p>
      </aside>
      {openingStoryOpen && <section className="opening-story" role="dialog" aria-modal="true" aria-label="고양이의 별 오프닝 이야기">
        <div className="opening-story-card">
          <span>고양이의 별</span>
          <h1>아주 조용한 밤,<br />작은 별 하나가 먼저 켜졌어요.</h1>
          <p>루루가 머물렀던 시간은 사라지지 않고, 밤하늘 어딘가에 천천히 남아 있어요. 사진 한 장을 꺼낼 때마다 기억은 별이 되고, 당신은 그 별 사이를 걸어가게 됩니다.</p>
          <button type="button" onClick={closeOpeningStory}>밤하늘로 들어가기 <b>✦</b></button>
        </div>
      </section>}
      <aside className={`memory-detail${detailVisible ? ' visible' : ''}${selected && photoUrls[selected.id]?.[0] ? ' filled-detail' : ' empty-detail'} ${detailOnRight ? 'visit-right' : 'visit-left'}`} style={detailStyle} aria-live="polite">
        {selected && (() => {
          const photos = photoUrls[selected.id] ?? [];
          const activePhotoIndex = photos.length ? Math.min(detailPhotoIndex, photos.length - 1) : 0;
          const activePhoto = photos[activePhotoIndex];
          const hasPhoto = Boolean(activePhoto);
          return <>
            <button className="memory-close" type="button" aria-label="기억 닫기" onClick={closeSelectedStar}>×</button>
            <figure className={`memory-photo${hasPhoto ? ' has-photo' : ' empty-photo'}${photos.length > 1 ? ' swipeable-photo' : ''}`} aria-label={`${selected.name}의 사진`} style={hasPhoto ? { backgroundImage: `url(${activePhoto})` } : undefined} onTouchStart={(event) => { event.stopPropagation(); handleDetailPhotoTouchStart(event); }} onTouchMove={(event) => event.stopPropagation()} onTouchEnd={(event) => { event.stopPropagation(); handleDetailPhotoTouchEnd(event, photos.length); }}>
              {!hasPhoto && <><span>✦</span><small>기억을 기다리는 별</small></>}
              {photos.length > 1 && <>
                <b>{photos.length}장의 기억</b>
                <div className="memory-photo-nav" aria-label="기억 사진 넘기기">
                  <button type="button" aria-label="이전 사진" onClick={() => shiftDetailPhoto(-1, photos.length)}>‹</button>
                  <span>{activePhotoIndex + 1} / {photos.length}</span>
                  <button type="button" aria-label="다음 사진" onClick={() => shiftDetailPhoto(1, photos.length)}>›</button>
                </div>
                <div className="memory-photo-dots" aria-hidden="true">
                  {photos.map((photo, index) => <i key={`${photo}-${index}`} className={index === activePhotoIndex ? 'active' : ''} />)}
                </div>
              </>}
            </figure>
            <div className="memory-copy">
              <i className="memory-detail-glint" aria-hidden="true">✦</i>
              <span className="memory-kicker">{hasPhoto ? 'MEMORY STAR' : 'WAITING STAR'} · {selected.date}</span>
              <strong>{selected.name}</strong>
              <em className={`activity-chip tone-${activityStyles[activityFor(selected)].tone}`}>{activityFor(selected)}</em>
              <p>{hasPhoto ? addedNotes[selected.id] ?? memoryNotes[(selected.id - 1) % memoryNotes.length] : '아직 아무 장면도 머물지 않은 별이에요. 기억을 담으면 이 자리에서 조금 더 따뜻하게 빛나요.'}</p>
              {hasPhoto ? <small className="memory-distance">{photos.length > 1 ? `${photos.length}장의 사진이 이 별 하나에 함께 머물러요` : '같은 활동의 별도 은은하게 빛나요'}</small> : <button className="fill-memory-button" type="button" onClick={() => openFillMemory(selected)}>별 채우기 <span>✦</span></button>}
            </div>
          </>;
        })()}
      </aside>
      <aside className={`center-star-detail${centerOpen ? ' visible' : ''}${centerEditing ? ' editing' : ''}${centerTouched ? ' center-touched' : ''}`} aria-live="polite">
        {centerOpen && (centerEditing ? <form className="center-profile-form" onSubmit={saveCatProfileDetails}>
          <button className="center-close" type="button" aria-label="고양이별 편집 닫기" onClick={() => setCenterEditing(false)}>×</button>
          <figure className="center-profile-photo">
            <Image src={profilePortraitUrl ?? '/assets/mock-memory-window.png'} alt={`${profileDraft.name || catProfile.name}의 대표 사진`} fill sizes="180px" unoptimized />
            <label>대표 사진 바꾸기<input type="file" accept="image/*" onChange={handleProfilePortraitSelected} /></label>
          </figure>
          <div className="center-profile-fields">
            <span>CAT PROFILE</span><h2>고양이별 편집</h2>
            <label>이름<input value={profileDraft.name} onChange={(event) => setProfileDraft({ ...profileDraft, name: event.target.value })} placeholder="고양이 이름" /></label>
            <label>만난 날<input type="date" value={profileDraft.metDate} onChange={(event) => setProfileDraft({ ...profileDraft, metDate: event.target.value })} /></label>
            <label>생일<input type="date" value={profileDraft.birthday} onChange={(event) => setProfileDraft({ ...profileDraft, birthday: event.target.value })} /></label>
            <label>보호자 이름<input value={profileDraft.guardianName} onChange={(event) => setProfileDraft({ ...profileDraft, guardianName: event.target.value })} placeholder="선택 입력" /></label>
            <label className="profile-description">짧은 소개<textarea rows={3} value={profileDraft.description} onChange={(event) => setProfileDraft({ ...profileDraft, description: event.target.value })} /></label>
            <div className="center-actions"><button type="button" onClick={() => setCenterEditing(false)}>취소</button><button type="submit">저장하기</button></div>
          </div>
        </form> : <>
          <button className="center-close" type="button" aria-label={`${catProfile.name}의 별 닫기`} onClick={() => setCenterOpen(false)}>×</button>
          <figure className="center-profile-photo">
            <Image src={profilePortraitUrl ?? '/assets/mock-memory-window.png'} alt={`${catProfile.name}의 대표 사진`} fill sizes="180px" unoptimized />
            <figcaption>{catProfile.name}의 중심별</figcaption>
          </figure>
          <div className="center-copy">
            <span>{catProfile.name}의 별</span><h2>{catProfile.name}의 중심별</h2>
            <p>{catProfile.description}</p>
            <dl>
              <div><dt>함께 머문 날</dt><dd>{togetherDays ? `${togetherDays.toLocaleString('ko-KR')}일의 온기` : '아직 입력 전'}</dd></div>
              <div><dt>밝혀둔 기억</dt><dd>{filledMemoryStars.length}개의 별 · 사진 {totalPhotoCount}장</dd></div>
              <div><dt>처음 켜진 빛</dt><dd>{firstMemory ? `${firstMemory.date}부터` : displayDate(catProfile.metDate)}</dd></div>
              <div><dt>가장 최근의 별</dt><dd>{recentMemory ? recentMemory.date : '아직 준비 중'}</dd></div>
              <div><dt>자주 빛난 순간</dt><dd>{topActivity}</dd></div>
              <div><dt>생일의 자리</dt><dd>{catProfile.birthday ? displayDate(catProfile.birthday) : '아직 입력 전'}</dd></div>
            </dl>
            <div className="center-actions"><button type="button" onClick={openCenterProfileEdit}>고양이별 수정</button>{firstMemory && <button type="button" onClick={() => { setCenterOpen(false); focusStar(firstMemory.id, firstMemory.depth); }}>첫 기억 만나기</button>}<button className="touch-star-button" type="button" onClick={touchCenterStar}>별빛 쓰다듬기 <span>✦</span></button></div>
          </div>
        </>)}
      </aside>
      <aside className={`creation-notice${creationNotice ? ' visible' : ''}`} aria-live="polite">{creationNotice && <><span>기억이 별빛이 되었어요</span><strong>{creationNotice.name}</strong><small>{creationNotice.message}</small><button type="button" onClick={() => focusStar(creationNotice.id, allStars.find((star) => star.id === creationNotice.id)?.depth)}>그 별 곁으로 가기 <b>✦</b></button></>}</aside>
      <p className="whisper">함께한 기억은,<br />조금 멀리서도 계속 빛나요.</p>
      {isLocalDevelopment && <div className="dev-memory-tools" aria-label="개발용 기억 테스트 도구"><button className="seed-memories" type="button" onPointerDown={(event) => event.stopPropagation()} onClick={seedTenTestMemories} disabled={seedingTestMemories}>{seedingTestMemories ? '테스트 별 채우는 중' : '사진 10장 테스트'} <span>✦</span></button><button className="clear-test-memories" type="button" onPointerDown={(event) => event.stopPropagation()} onClick={clearTestMemories} disabled={seedingTestMemories}>테스트 별 지우기</button></div>}
      <div className={`creator-backdrop${createOpen ? ' open' : ''}`} role="presentation">
        <button className="creator-dismiss-layer" type="button" aria-label="만들기 창 바깥을 눌러 닫기" onClick={() => closeCreator()} />
        <form className={`memory-creator${creatingMemory ? ' creating' : ''}`} onSubmit={createStars} aria-label="기억별 만들기">
          <button className="creator-close" type="button" aria-label="만들기 닫기" onClick={() => closeCreator()} disabled={creatingMemory}>×</button>
          {creatingMemory && <div className="creation-ritual" aria-live="polite"><span>✦</span><p>기억이 별빛으로 모이고 있어요</p></div>}
          <span className="creator-kicker">{fillTargetId ? 'FILL MEMORY STAR' : 'NEW MEMORY STAR'}</span><h2>{fillTargetId ? '이 별에 어떤 순간을 담을까요?' : '오늘은 어떤 기억을 별로 띄울까요?'}</h2>
          <input ref={fileInputRef} className="photo-file-input" aria-label="이 기억의 사진 한 장 선택" type="file" accept="image/*" onChange={handleFilesSelected} />
          <button className={`photo-drop${pendingFiles.length ? ' ready' : ''}${singlePreview ? ' single-ready' : ''}`} data-photo-count="사진 1장" type="button" onClick={() => fileInputRef.current?.click()} style={singlePreview ? { '--single-preview': `url(${singlePreview})` } as CSSProperties : undefined}><span>{pendingFiles.length ? '이 사진이 별의 첫빛이 돼요' : '별로 남길 사진 한 장을 골라주세요'}</span><small>{pendingFiles.length ? '이 순간 하나가 밤하늘에 천천히 놓여요' : '기억 하나씩, 별 하나씩 밝혀요'}</small></button>
          <fieldset className="activity-picker"><legend>어떤 활동의 기억인가요?</legend>{activityTags.map((activity) => <button key={activity} type="button" aria-pressed={draft.activity === activity} className={`tone-${activityStyles[activity].tone}`} onClick={() => setDraft({ ...draft, activity })}><i className={`tag-star shape-${activityStyles[activity].shape}`} />{activity}</button>)}</fieldset>
          <div className="single-fields"><label><span>기억 이름</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="예: 창가에서 보낸 오후" /></label><label><span>날짜</span><input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></label><label className="note-field"><span>짧은 기억</span><textarea value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder="그날의 온기를 한두 문장으로 남겨요" rows={3} /></label></div>
          <button className="create-submit" type="submit" disabled={pendingFiles.length === 0 || creatingMemory}>{creatingMemory ? '별빛이 모이는 중' : fillTargetId ? '이 별에 기억 담기' : '이 기억을 별로 띄우기'} <span>✦</span></button>
          <p className="creator-note">새 별은 밤하늘과 다시 보는 기억에 함께 머물러요.</p>
        </form>
      </div>
    </main>
  );
}
