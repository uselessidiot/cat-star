'use client';
/* oxlint-disable next/no-html-link-for-pages */

import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type PointerEvent, type SyntheticEvent, type TouchEvent, type WheelEvent } from 'react';
import Image from 'next/image';
import { CatStarOpening, CAT_STAR_OPENING_SEEN } from '@/components/sky/CatStarOpening';
import { catMotionCssVars, catMotionSprites, resolveCatMotion, type CatMoment } from '@/lib/cat-motion';
import { activityFor, activityStyles, activityTags, constellationPairs, memoryStars, mobileStarPositions, starDepths, type ActivityTag, type MemoryStarData } from '@/lib/memory-stars';
import { deleteStoredMemory, getStoredCatProfile, getStoredMemories, MEMORY_STORE_CHANGED, saveStoredCatProfile, saveStoredMemories, type CatProfile } from '@/lib/memory-store';
import { createApiMemoryStar, fillApiMemoryStar, getApiCatProfile, getApiMemories, validateMemoryPhotos } from '@/lib/memory-api';

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
  const projectionScale = Math.min(4.1, Math.max(.46, .32 + 1.12 / Math.max(.22, distance + .46)));
  const visualScale = Math.min(2.05, projectionScale);
  const projectedX = 50 + (x - 50) * projectionScale;
  const projectedY = 46 + (y - 46) * projectionScale;
  const centerPull = distance >= .02 && distance <= .82 ? Math.max(0, 1 - Math.abs(distance - .34) / .72) * .2 : 0;
  const passedFade = distance <= -.3 ? 0 : distance < .12 ? Math.max(0, (distance + .3) / .42) : 1;
  const farFade = Math.min(1, .36 + visualScale * .34);
  return {
    distance,
    scale: visualScale,
    x: projectedX + (50 - projectedX) * centerPull,
    y: projectedY + (46 - projectedY) * centerPull,
    opacity: passedFade * farFade,
    selectable: distance >= .08 && distance <= .66,
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

type SkyTime = 'morning' | 'afternoon' | 'evening' | 'night';

function skyTimeFromClock(date = new Date()): SkyTime {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'evening';
  return 'night';
}

function readSkyTimeOverride(): SkyTime | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const value = params.get('sky-time') ?? params.get('sky');
    if (value === 'night' || value === 'evening' || value === 'afternoon' || value === 'morning') return value;
  } catch {
    // URL parameters are unavailable during the first render in some environments.
  }
  return null;
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

const RECENT_CREATED_PLACES = [
  [52, 42], [43, 48], [61, 49], [36, 39], [69, 39], [49, 58],
] as const;

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
  { name: '테스트 11 · 문틈 시선', date: '2020-04-06', note: '별이 더 많아져도 시선이 산만하지 않은지 확인해요.', activity: '함께한 일상', palette: ['#60699b', '#d5b2cf', '#fff0c8'] },
  { name: '테스트 12 · 작은 상자', date: '2020-04-09', note: '놀이 기억이 작은 별 모양으로 과하지 않게 섞이는지 봐요.', activity: '놀이', palette: ['#76609a', '#f3b0a0', '#fff6d7'] },
  { name: '테스트 13 · 긴 하품', date: '2020-04-13', note: '낮잠 별이 많아져도 부드러운 빛으로 남는지 확인해요.', activity: '낮잠', palette: ['#62719f', '#e9c0b4', '#fff5d6'] },
  { name: '테스트 14 · 복도 탐험', date: '2020-04-16', note: '외곽 별이 여행감은 주되 화면을 채우지 않는지 보는 테스트예요.', activity: '산책·외출', palette: ['#5d5b91', '#c9b4dd', '#fce0bf'] },
  { name: '테스트 15 · 노을 수염', date: '2020-04-19', note: 'peach glow가 많은 별 사이에서도 따뜻하게만 남는지 확인해요.', activity: '창가 구경', palette: ['#626a9a', '#efa994', '#ffd8a6'] },
  { name: '테스트 16 · 밤의 골골송', date: '2020-04-23', note: '어두운 사진 느낌의 기억도 차갑지 않게 보이는지 봐요.', activity: '함께한 일상', palette: ['#535f8f', '#bda9d2', '#f7dbc4'] },
  { name: '테스트 17 · 리본 그림자', date: '2020-04-26', note: '특별한 날의 별이 튀지 않고 살짝만 깊어지는지 확인해요.', activity: '특별한 날', palette: ['#765c90', '#eba3b5', '#fff0c0'] },
  { name: '테스트 18 · 간식 소리', date: '2020-04-29', note: '식사 기억의 금빛이 강한 노란색으로 보이지 않는지 봐요.', activity: '식사·간식', palette: ['#73679a', '#efbd7e', '#fff3c5'] },
  { name: '테스트 19 · 달빛 등', date: '2020-05-03', note: '먼 별이 작고 희미하게 남아 깊이감을 주는지 확인해요.', activity: '함께한 일상', palette: ['#56699a', '#cbb8d9', '#f8e0c9'] },
  { name: '테스트 20 · 다시 온 밤', date: '2020-05-07', note: '스무 개의 테스트 별이 생겼을 때도 고양이가 머무는 밤처럼 느껴지는지 봐요.', activity: '특별한 날', palette: ['#725e94', '#e8a6bb', '#fff1c8'] },
];

function memoryDateSortValue(star: MemoryStarData) {
  const input = dateInputFromDisplay(star.date) || star.date.replaceAll('. ', '-');
  const value = new Date(`${input}T00:00:00`).getTime();
  return Number.isFinite(value) ? value : 0;
}

function createdStarPlace(rankFromNewest: number, total: number, id: number) {
  if (rankFromNewest < RECENT_CREATED_PLACES.length) {
    const [x, y] = RECENT_CREATED_PLACES[rankFromNewest];
    return {
      x,
      y,
      depth: .98 + rankFromNewest * .09,
      size: Math.max(7, 10 - rankFromNewest % 3),
    };
  }

  const progress = total <= 1 ? 0 : rankFromNewest / Math.max(1, total - 1);
  const theta = ((rankFromNewest * 137.508 + (id % 9) * 13 - 94) * Math.PI) / 180;
  const radiusX = 22 + Math.pow(progress, .68) * 54;
  const radiusY = 13 + Math.pow(progress, .72) * 34;
  const edgeDrift = Math.min(1, Math.max(0, (rankFromNewest - 8) / 18));
  const x = 50 + Math.cos(theta) * radiusX * (1 + edgeDrift * .18);
  const y = 43 + Math.sin(theta) * radiusY + progress * 13;

  return {
    x: Math.max(-12, Math.min(112, x)),
    y: Math.max(14, Math.min(84, y)),
    depth: Math.min(2.24, 1.38 + Math.pow(progress, .74) * .76 + rankFromNewest * .025),
    size: 6 + (id + rankFromNewest) % 4,
  };
}

function layoutCreatedStars(stars: MemoryStarData[]) {
  const ranked = [...stars].sort((a, b) => memoryDateSortValue(b) - memoryDateSortValue(a) || b.id - a.id);
  const rankById = new Map(ranked.map((star, index) => [star.id, index]));
  return stars.map((star) => {
    const rank = rankById.get(star.id) ?? 0;
    const place = createdStarPlace(rank, stars.length, star.id);
    return { ...star, ...place, created: true };
  });
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
  const [imageOpeningOpen, setImageOpeningOpen] = useState(false);
  const [openingStoryStep, setOpeningStoryStep] = useState(0);
  const [centerTouched, setCenterTouched] = useState(false);
  const [fillTargetId, setFillTargetId] = useState<number | null>(null);
  const [creatingMemory, setCreatingMemory] = useState(false);
  const [seedingTestMemories, setSeedingTestMemories] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [singlePreview, setSinglePreview] = useState<string | null>(null);
  const [bornIds, setBornIds] = useState<number[]>([]);
  const [creationNotice, setCreationNotice] = useState<{ id: number; name: string; label?: string; message: string; actionLabel?: string } | null>(null);
  const [personalMemoryCount, setPersonalMemoryCount] = useState(0);
  const [catProfileId, setCatProfileId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ name: string; date: string; note: string; activity: ActivityTag }>({ name: '', date: '', note: '', activity: '함께한 일상' });
  const [travel, setTravel] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [walking, setWalking] = useState(false);
  const [catSettling, setCatSettling] = useState(false);
  const [catMoment, setCatMoment] = useState<CatMoment | null>(null);
  const [skyTime, setSkyTime] = useState<SkyTime>('afternoon');
  const [storyStep, setStoryStep] = useState(0);
  const [storyPulse, setStoryPulse] = useState(0);
  const [endScrolls, setEndScrolls] = useState(0);
  const [catProfile, setCatProfile] = useState<CatProfile>(defaultCatProfile);
  const [profileDraft, setProfileDraft] = useState<CatProfile>(defaultCatProfile);
  const [centerEditing, setCenterEditing] = useState(false);
  const [profilePortraitUrl, setProfilePortraitUrl] = useState<string | null>(null);
  const [profilePortraitBlob, setProfilePortraitBlob] = useState<Blob | undefined>(undefined);
  const walkingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settlingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const catMomentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const catMomentDelayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const dragPull = Math.min(1, Math.hypot(pan.x / 120, pan.y / 80));
  const dragSpread = 1 + dragPull * .045;
  const selectedProjection = selected ? projected.find((item) => item.star.id === selected.id) : null;
  const detailVisible = Boolean(selected && detailReady);
  const detailOnRight = !selectedProjection || selectedProjection.x < 52;
  const catVisitShift = selectedProjection ? Math.min(9.5, Math.max(-9.5, (selectedProjection.x - 50) / 5.6)) : 0;
  const skyFollowShift = Math.min(1.25, Math.max(-1.25, catVisitShift * .13));
  const catLean = selectedProjection ? Math.min(1.15, Math.max(-1.15, (selectedProjection.x - 50) / 28)) : 0;
  const catStep = selectedProjection ? Math.min(5, Math.max(-5, (selectedProjection.x - 50) / 14)) : 0;
  const catMotion = resolveCatMotion(walking, catSettling, catMoment);
  const detailStyle = selectedProjection ? {
    '--detail-x': `${Math.min(82, Math.max(18, selectedProjection.x + (detailOnRight ? 8 : -8)))}%`,
    '--detail-y': `${Math.min(74, Math.max(24, selectedProjection.y + 2))}%`,
  } as CSSProperties : undefined;
  const closest = projected.filter((item) => item.selectable).sort((a, b) => a.distance - b.distance)[0];
  const atStoryEnd = travel >= END_STORY_GATE;
  const storyActive = storyPulse > 0 && atStoryEnd && !detailVisible && !centerOpen && !createOpen && !openingStoryOpen;
  const currentStory = catStoryMessages[storyStep % catStoryMessages.length];
  const endApproach = Math.min(1, Math.max(0, (travel - STORY_APPROACH_START) / (MAX_TRAVEL - STORY_APPROACH_START)));
  const duskProgress = skyTime === 'night' ? 1 : skyTime === 'evening' ? .58 : skyTime === 'morning' ? .12 : .24;
  const journeyText = atStoryEnd ? '밤 끝에서 · 천천히 더 걸으면 작은 말이 떠올라요' : endApproach > .55 ? '말이 떠오르는 밤끝으로 가는 중' : travel < .1 ? '스크롤·스와이프로 별 사이 걷기' : closest ? `${closest.star.name} 가까이` : '더 먼 기억으로 걷는 중';
  const endWarmth = Math.min(1, endApproach * .42 + (atStoryEnd ? endScrolls / 9 * .58 : 0));
  const sceneStyle = {
    '--travel': travel,
    '--dusk-progress': duskProgress,
    '--end-warmth': endWarmth,
    '--pan-x': `${pan.x}px`,
    '--pan-y': `${pan.y}px`,
    '--drag-pull': dragPull,
    '--drag-spread': dragSpread,
    '--cat-shift': `${Math.sin(travel * 3.4) * 2.35}vw`,
    '--cat-visit-shift': `${catVisitShift}vw`,
    '--sky-follow-shift': `${skyFollowShift}vw`,
    '--cat-lean': `${catLean}deg`,
    '--cat-counter-lean': `${-catLean * .6}deg`,
    '--cat-step-x': `${catStep}px`,
    ...catMotionCssVars(),
  } as CSSProperties;
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
  const hasPersonalMemories = personalMemoryCount > 0;
  const openingStorySteps = hasPersonalMemories ? [
    {
      kicker: '다시 찾아온 밤',
      title: <>아주 조용한 밤,<br />작은 별들이 다시 숨을 쉬어요.</>,
      body: '이곳은 함께한 시간을 천천히 다시 만나는 밤하늘이에요. 사진 한 장마다 기억 하나가 별이 되고, 별 사이를 걸을 때마다 오래된 온기가 조금씩 돌아와요.',
    },
    {
      kicker: '별 사이를 걷는 법',
      title: <>서두르지 않아도 괜찮아요.</>,
      body: '스크롤하거나 손끝으로 밀면 루루가 별 사이를 걸어요. 가까워진 별을 누르면 그날의 사진과 짧은 이야기가 조용히 열립니다.',
    },
    {
      kicker: '오늘의 작은 약속',
      title: <>보고 싶은 날마다,<br />별 하나를 더 밝혀도 좋아요.</>,
      body: '이미 남겨둔 기억은 다시 보는 기억에 모여 있고, 새로운 사진 한 장은 또 다른 별이 되어 이 밤하늘에 자리를 찾아요.',
    },
  ] : [
    {
      kicker: '처음 켜지는 밤',
      title: <>아주 조용한 밤,<br />아직 비어 있는 하늘이 기다려요.</>,
      body: '이곳은 함께한 시간을 별로 남기는 작은 밤하늘이에요. 거창하게 정리하지 않아도 괜찮아요. 먼저 사진 한 장, 기억 하나만 꺼내면 돼요.',
    },
    {
      kicker: '기억 하나, 별 하나',
      title: <>사진 한 장을 고르면<br />그 순간이 별이 돼요.</>,
      body: '창가에 앉아 있던 오후, 담요 위의 낮잠, 이름을 불렀을 때 돌아보던 얼굴. 한 장면을 천천히 적으면 그 기억은 루루 곁의 작은 별로 놓입니다.',
    },
    {
      kicker: '첫 별을 만드는 순간',
      title: <>첫 기억별이 켜지면,<br />이 밤하늘은 당신의 이야기가 돼요.</>,
      body: '이 안내가 끝나면 바로 첫 기억별을 만들 수 있어요. 사진 한 장을 고르고 짧게 적으면, 그 별 곁으로 천천히 걸어갈 수 있습니다.',
    },
  ];
  const openingStory = openingStorySteps[Math.min(openingStoryStep, openingStorySteps.length - 1)];
  const isOpeningLastStep = openingStoryStep >= openingStorySteps.length - 1;
  const isFirstMemoryCreation = !hasPersonalMemories && !fillTargetId;

  useEffect(() => {
    travelRef.current = travel;
    if (travel < END_STORY_GATE && endScrolls) {
      setEndScrolls(0);
      setStoryPulse(0);
    }
  }, [travel]);

  useEffect(() => {
    function syncSkyTime() {
      setSkyTime(readSkyTimeOverride() ?? skyTimeFromClock());
    }
    syncSkyTime();
    const interval = window.setInterval(syncSkyTime, 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') { closeSelectedStar(); setCreateOpen(false); setCenterOpen(false); closeOpeningStory(); }
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      if (walkingTimer.current) clearTimeout(walkingTimer.current);
      if (settlingTimer.current) clearTimeout(settlingTimer.current);
      if (catMomentTimer.current) clearTimeout(catMomentTimer.current);
      if (catMomentDelayTimer.current) clearTimeout(catMomentDelayTimer.current);
      if (detailTimer.current) clearTimeout(detailTimer.current);
      if (centerTouchTimer.current) clearTimeout(centerTouchTimer.current);
      if (travelAnimation.current != null) cancelAnimationFrame(travelAnimation.current);
    };
  }, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const hasRequestedMemory = Boolean(params.get('memory'));
      const forceOpening = params.get('opening') === '1';
      const hasSeenOpening = window.localStorage.getItem(CAT_STAR_OPENING_SEEN) === 'true';
      if (forceOpening || (!hasRequestedMemory && !hasSeenOpening)) {
        setOpeningStoryOpen(false);
        setImageOpeningOpen(true);
      }
    } catch {
      setImageOpeningOpen(true);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const urls: string[] = [];
    function loadMemoriesFromStore() {
      getApiMemories().catch(() => getStoredMemories().then((stored) => stored.map((memory) => {
        const photos = memory.photos.map((photo) => ({ id: `${memory.id}-${urls.length}`, url: URL.createObjectURL(photo), uploadedAt: memory.createdAt, order: urls.length }));
        photos.forEach((photo) => urls.push(photo.url));
        return { ...memory, remoteId: String(memory.id), photos };
      }))).then((stored) => {
      if (!active) return;
      const storedBaseStars = stored.filter((memory) => memory.id <= 20);
      const storedAddedStars = stored.filter((memory) => memory.id > 20);
      const personalMemories = stored.filter((memory) => !memory.testSeed && !memory.note.startsWith(TEST_SEED_MARKER));
      setPersonalMemoryCount(personalMemories.length);
      setFilledStars(Object.fromEntries(storedBaseStars.map((memory) => [memory.id, memory.star])));
      setAddedStars(layoutCreatedStars(storedAddedStars.map((memory) => memory.star)));
      setAddedNotes(Object.fromEntries(stored.map((memory) => [memory.id, readableMemoryNote(memory.note)])));
      setPhotoUrls(Object.fromEntries(stored.map((memory) => {
        const photos = memory.photos.map((photo) => photo.url);
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
    getApiCatProfile().catch(() => getStoredCatProfile()).then((profile) => {
      if (!active || !profile) return;
      if ('id' in profile && profile.id) setCatProfileId(profile.id);
      const next = { ...defaultCatProfile, ...profile };
      setCatProfile(next);
      setProfileDraft(next);
      setProfilePortraitBlob('portrait' in profile ? profile.portrait : undefined);
      if ('portrait' in profile && profile.portrait) {
        const url = URL.createObjectURL(profile.portrait);
        urls.push(url);
        setProfilePortraitUrl(url);
      } else if ('portraitUrl' in profile && typeof profile.portraitUrl === 'string') {
        setProfilePortraitUrl(profile.portraitUrl);
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

  function clearCatMoment() {
    if (catMomentTimer.current) clearTimeout(catMomentTimer.current);
    if (catMomentDelayTimer.current) clearTimeout(catMomentDelayTimer.current);
    catMomentTimer.current = null;
    catMomentDelayTimer.current = null;
    setCatMoment(null);
  }

  function playCatMoment(moment: CatMoment, duration = 1800, delay = 0) {
    if (catMomentTimer.current) clearTimeout(catMomentTimer.current);
    if (catMomentDelayTimer.current) clearTimeout(catMomentDelayTimer.current);
    const startMoment = () => {
      setCatMoment(moment);
      catMomentTimer.current = setTimeout(() => {
        setCatMoment((current) => current === moment ? null : current);
        catMomentTimer.current = null;
      }, duration);
    };
    if (delay > 0) {
      catMomentDelayTimer.current = setTimeout(() => {
        catMomentDelayTimer.current = null;
        startMoment();
      }, delay);
      return;
    }
    startMoment();
  }

  function beginWalking(duration = 560) {
    const walkingDuration = Math.max(duration, 900);
    clearCatMoment();
    setWalking(true);
    setCatSettling(false);
    if (walkingTimer.current) clearTimeout(walkingTimer.current);
    if (settlingTimer.current) clearTimeout(settlingTimer.current);
    walkingTimer.current = setTimeout(() => {
      setWalking(false);
      setCatSettling(true);
      settlingTimer.current = setTimeout(() => {
        setCatSettling(false);
        if (travelRef.current >= END_STORY_GATE) playCatMoment('turn-back', 2200, 260);
      }, 900);
    }, walkingDuration);
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
    playCatMoment('center-touch', 2200);
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

  function completeImageOpening() {
    setImageOpeningOpen(false);
    setOpeningStoryOpen(false);
    try {
      window.localStorage.setItem(CAT_STAR_OPENING_SEEN, 'true');
      window.localStorage.setItem(OPENING_STORY_SEEN, 'true');
    } catch {
      // Local preview storage can be unavailable in private or restricted contexts.
    }
  }

  function replayOpeningStory() {
    closeSelectedStar();
    setCenterOpen(false);
    setCreateOpen(false);
    setOpeningStoryStep(0);
    setOpeningStoryOpen(false);
    setImageOpeningOpen(true);
  }

  function continueOpeningStory() {
    if (!isOpeningLastStep) {
      setOpeningStoryStep((step) => Math.min(openingStorySteps.length - 1, step + 1));
      return;
    }
    if (!hasPersonalMemories) {
      closeOpeningStory();
      openCreatorForNewStar();
      return;
    }
    closeOpeningStory();
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
    setOpeningStoryOpen(false);
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
    const selectedFiles = Array.from(event.target.files ?? []).slice(0, 1);
    const validation = validateMemoryPhotos(selectedFiles);
    if (validation) {
      setCreationNotice({ id: fillTargetId ?? memoryStars[0].id, name: '사진을 다시 확인해 주세요', message: validation });
      setTimeout(() => setCreationNotice(null), 5200);
      event.target.value = '';
      return;
    }
    const accepted = selectedFiles;
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

  function handleMemoryStarClick(star: MemoryStarData, selectable: boolean) {
    if (suppressNextTap.current) return;
    if (selectedId === star.id && detailReady) {
      closeSelectedStar();
      return;
    }
    visitStar(star.id, star.depth, selectable ? 760 : 1080);
  }

  function handleWheel(event: WheelEvent<HTMLElement>) {
    if (openingStoryOpen || imageOpeningOpen) return;
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
    const validation = validateMemoryPhotos([file]);
    if (validation) {
      setCreationNotice({ id: fillTargetId ?? memoryStars[0].id, name: '사진을 다시 확인해 주세요', message: validation });
      setTimeout(() => setCreationNotice(null), 5200);
      return;
    }
    setCreatingMemory(true);
    const isFirstPersonalMemory = personalMemoryCount === 0;
    const source = { date: draft.date || dateFromFile(file), name: draft.name.trim() || file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '), file, preview: singlePreview, activity: draft.activity };
    if (fillTargetId) {
      const baseStar = allStars.find((star) => star.id === fillTargetId) ?? memoryStars.find((star) => star.id === fillTargetId);
      if (!baseStar) {
        setCreatingMemory(false);
        return;
      }
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
      let saved = { id: filledStar.id, star: filledStar, note, photos: source.preview ? [{ url: source.preview }] : [] };
      try {
        saved = await fillApiMemoryStar({ starId: String(baseStar.remoteId ?? baseStar.id), name: source.name, date: source.date, activity: source.activity, note }, [source.file], filledStar);
      } catch {
        await saveStoredMemories([{ id: filledStar.id, star: filledStar, note, photos: [source.file], createdAt: new Date().toISOString() }]);
      }
      const savedStar = saved.star;
      setFilledStars((stars) => ({ ...stars, [savedStar.id]: savedStar }));
      setPhotoUrls((current) => ({ ...current, [savedStar.id]: saved.photos.map((photo) => photo.url) }));
      setAddedNotes((current) => ({ ...current, [savedStar.id]: note }));
      setPersonalMemoryCount((count) => count + 1);
      setBornIds([savedStar.id]);
      setCreationNotice(isFirstPersonalMemory
        ? { id: savedStar.id, name: savedStar.name, label: '첫 기억별이 켜졌어요', message: '이제 이 밤하늘은 루루와 당신의 이야기로 시작돼요.', actionLabel: '첫 별 곁으로 가기' }
        : { id: savedStar.id, name: savedStar.name, message: '기다리던 별에 기억이 스며들었어요.' });
      setTimeout(() => setBornIds([]), 2800);
      setTimeout(() => setCreationNotice(null), 6800);
      await wait(540);
      setCreatingMemory(false);
      closeCreator(true);
      setPendingFiles([]);
      setSinglePreview(null);
      setDraft({ name: '', date: '', note: '', activity: '함께한 일상' });
      playCatMoment('star-birth', 1500);
      await wait(760);
      focusStar(savedStar.id, savedStar.depth);
      return;
    }
    const style = activityStyles[source.activity ?? '함께한 일상'];
    const nextId = Math.max(20, ...allStars.map((star) => star.id)) + 1;
    const created: MemoryStarData = {
      id: nextId,
      name: source.name,
      date: source.date.replaceAll('-', '. '),
      x: 50,
      y: 42,
      size: 8,
      shape: style.shape,
      tone: style.tone,
      activity: source.activity ?? undefined,
      depth: 1,
      photoCount: 1,
      created: true,
    };
    const note = draft.note.trim() || '이 순간이 밤하늘에 새 별로 머물러요.';
    let saved = { id: created.id, star: created, note, photos: source.preview ? [{ url: source.preview }] : [] };
    try {
      const profile = catProfileId ?? (await getApiCatProfile()).id;
      if (!catProfileId) setCatProfileId(profile);
      saved = await createApiMemoryStar({ catProfileId: profile, name: source.name, date: source.date, activity: source.activity, note }, [source.file]);
    } catch {
      const createdWithPlace = layoutCreatedStars([...addedStars, created]).find((star) => star.id === created.id) ?? created;
      await saveStoredMemories([{ id: createdWithPlace.id, star: createdWithPlace, note, photos: [source.file], createdAt: new Date().toISOString() }]);
      saved = { id: createdWithPlace.id, star: createdWithPlace, note, photos: source.preview ? [{ url: source.preview }] : [] };
    }
    const savedStar = saved.star;
    setAddedStars((stars) => [...stars.filter((star) => star.id !== savedStar.id), savedStar]);
    setPhotoUrls((current) => ({ ...current, [savedStar.id]: saved.photos.map((photo) => photo.url) }));
    setAddedNotes((current) => ({ ...current, [savedStar.id]: note }));
    setPersonalMemoryCount((count) => count + 1);
    setBornIds([savedStar.id]);
    setCreationNotice(isFirstPersonalMemory
      ? { id: savedStar.id, name: savedStar.name, label: '첫 기억별이 켜졌어요', message: '이제 이 밤하늘은 루루와 당신의 이야기로 시작돼요.', actionLabel: '첫 별 곁으로 가기' }
      : { id: savedStar.id, name: savedStar.name, message: '작은 빛이 자리를 찾아 새 기억별이 되었어요.' });
    setTimeout(() => setBornIds([]), 2800);
    setTimeout(() => setCreationNotice(null), 6800);
    await wait(540);
    setCreatingMemory(false);
    closeCreator(true);
    setPendingFiles([]);
    setSinglePreview(null);
    setDraft({ name: '', date: '', note: '', activity: '함께한 일상' });
    playCatMoment('star-birth', 1500);
    await wait(760);
    focusStar(savedStar.id, savedStar.depth);
  }

  async function seedTestMemories() {
    if (seedingTestMemories) return;
    setSeedingTestMemories(true);
    try {
      const stored = await getStoredMemories();
      const testSeeds = stored.filter((memory) => memory.testSeed || memory.note.startsWith(TEST_SEED_MARKER));
      const preserved = stored.filter((memory) => !memory.testSeed && !memory.note.startsWith(TEST_SEED_MARKER));
      await Promise.all(testSeeds.map((memory) => deleteStoredMemory(memory.id)));

      const existingStars = [...memoryStars, ...preserved.map((memory) => memory.star)];
      const firstId = Math.max(20, ...existingStars.map((star) => star.id)) + 1;
      const createdAt = new Date().toISOString();
      const seeded = testMemorySeeds.map((seed, index) => {
        const style = activityStyles[seed.activity];
        const star: MemoryStarData = {
          id: firstId + index,
          name: seed.name,
          date: seed.date.replaceAll('-', '. '),
          x: 50,
          y: 42,
          size: 8,
          shape: style.shape,
          tone: style.tone,
          activity: seed.activity,
          depth: 1,
          photoCount: 1,
          created: true,
        };
        return { id: star.id, star, note: seed.note, photos: [makeTestMemoryPhoto(seed, index)], createdAt, testSeed: true };
      });

      const preservedAdded = preserved.filter((memory) => memory.id > 20).map((memory) => memory.star);
      const laidOutSeedStars = layoutCreatedStars([...preservedAdded, ...seeded.map((memory) => memory.star)]);
      const laidOutSeeded = seeded.map((memory) => ({ ...memory, star: laidOutSeedStars.find((star) => star.id === memory.id) ?? memory.star }));
      await saveStoredMemories(laidOutSeeded);
      setAddedStars(laidOutSeedStars);
      setFilledStars(Object.fromEntries(preserved.filter((memory) => memory.id <= 20).map((memory) => [memory.id, memory.star])));
      setAddedNotes(Object.fromEntries([...preserved, ...laidOutSeeded].map((memory) => [memory.id, readableMemoryNote(memory.note)])));
      setPhotoUrls(Object.fromEntries([...preserved, ...laidOutSeeded].map((memory) => [memory.id, memory.photos.map((photo) => URL.createObjectURL(photo))])));
      setBornIds(laidOutSeeded.map((memory) => memory.id));
      setCreationNotice({ id: seeded[seeded.length - 1].id, name: '테스트 사진 20장', message: '사진을 하나씩 넣었을 때 생기는 별 20개를 채웠어요.' });
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
      setAddedStars(layoutCreatedStars(preserved.filter((memory) => memory.id > 20).map((memory) => memory.star)));
      setFilledStars(Object.fromEntries(preserved.filter((memory) => memory.id <= 20).map((memory) => [memory.id, memory.star])));
      setAddedNotes(Object.fromEntries(preserved.map((memory) => [memory.id, readableMemoryNote(memory.note)])));
      setPhotoUrls(Object.fromEntries(preserved.map((memory) => [memory.id, memory.photos.map((photo) => URL.createObjectURL(photo))])));
      setPersonalMemoryCount(preserved.length);
      setBornIds([]);
      closeSelectedStar();
      setCenterOpen(false);
      setCreationNotice({ id: memoryStars[0].id, name: '테스트 기억을 지웠어요', message: '사진 20장 테스트로 만든 별만 밤하늘에서 비웠어요.' });
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
      closeSelectedStar(); beginWalking(500); return;
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
      beginWalking(500);
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
    <main className={`sky-scene sky-${skyTime}${endWarmth > .04 ? ' story-near' : ''}${atStoryEnd ? ' story-end' : ''}`} onWheel={handleWheel} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={() => { pointerDrag.current = null; }} onPointerCancel={() => { pointerDrag.current = null; }} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onTouchCancel={handleTouchEnd} style={sceneStyle}>
      <CatStarOpening open={imageOpeningOpen} onComplete={completeImageOpening} />
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
            const isMobileLabelStar = selectedId === star.id || closest?.star.id === star.id;
            return <button key={star.id} type="button" data-reachability={selectable ? 'selectable' : 'approach'}
              data-depth={starDepths[star.id] ?? 'far'} data-distance={distance < .03 ? 'passed' : selectable ? 'close' : 'far'} data-memory={hasPhoto ? 'filled' : 'empty'}
              data-mobile-label={isMobileLabelStar ? 'true' : undefined}
              className={`memory-star shape-${visual.shape} tone-${visual.tone}${star.favorite ? ' favorite' : ''}${hasPhoto ? ' filled' : ' empty'}${star.created ? ' created' : ''}${bornIds.includes(star.id) ? ' newly-born' : ''}${selectedId === star.id ? ' selected' : ''}${related ? ' tag-related' : ''}${selectedId && selectedId !== star.id && !related ? ' dimmed' : ''}`}
              style={{ left:`${x}%`, top:`${y}%`, opacity, '--depth-scale': scale, '--label-scale': Math.min(1, 1 / Math.max(scale, 1)).toFixed(3), '--mobile-x':`${mobile.x}%`, '--mobile-y':`${mobile.y}%`, '--star-size':`${star.size}px`, '--twinkle-delay':`${(-((star.id * 1.37) % 8)).toFixed(2)}s`, '--twinkle-duration':`${(5.4 + (star.id % 5) * 1.1).toFixed(1)}s`, '--arrival-delay':`${120 + star.id * 42}ms` } as CSSProperties}
              aria-label={`${star.name}, ${star.date}${selectable ? ', 가까운 기억' : ', 멀리 있는 기억, 가까이 이동'}`} aria-pressed={selectedId === star.id}
              onClick={() => handleMemoryStarClick(star, selectable)}><span className="proximity-ring" /><span className="star-core" /><span className="star-label"><strong>{star.name}</strong><small>{distance < .26 ? hasPhoto ? '기억이 떠올라요' : '별을 채울 수 있어요' : '조금 더 가까이'}</small></span></button>;
          })}
        </div>

        <div className="sky-surface" aria-hidden="true" />
        <div className={`cat-wrap${walking ? ' walking' : ''}${catSettling ? ' settling' : ''}${catMoment ? ` cat-${catMoment}` : ''}`} data-cat-motion={catMotion} aria-hidden="true">
          <div className="cat-art">
            <span className="cat-walk-layer" aria-hidden="true" />
            <Image className="cat-idle" src={catMotionSprites.idle.src} alt="" fill sizes="(max-width: 640px) 42vw, 16vw" style={{ objectFit: 'contain', objectPosition: 'center bottom' }} priority unoptimized />
          </div>
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
          <button className="opening-story-close" type="button" aria-label="오프닝 이야기 닫기" onClick={closeOpeningStory}>×</button>
          <span>{openingStory.kicker}</span>
          <h1>{openingStory.title}</h1>
          <p>{openingStory.body}</p>
          <div className="opening-story-progress" aria-label={`오프닝 이야기 ${openingStoryStep + 1} / ${openingStorySteps.length}`}>
            {openingStorySteps.map((step, index) => <i key={step.kicker} className={index === openingStoryStep ? 'active' : ''} />)}
          </div>
          <div className="opening-story-actions">
            {openingStoryStep > 0 && <button className="opening-back" type="button" onClick={() => setOpeningStoryStep((step) => Math.max(0, step - 1))}>이전 밤</button>}
            <button type="button" onClick={continueOpeningStory}>{isOpeningLastStep ? hasPersonalMemories ? '밤하늘로 들어가기' : '첫 기억별 만들기' : '다음 이야기'} <b>✦</b></button>
          </div>
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
              {!hasPhoto && <><span>✦</span><small>아직 비어 있는 별</small></>}
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
              <span className="memory-kicker">{hasPhoto ? 'MEMORY STAR' : 'EMPTY STAR'} · {selected.date}</span>
              <strong>{selected.name}</strong>
              <em className={`activity-chip tone-${activityStyles[activityFor(selected)].tone}`}>{activityFor(selected)}</em>
              <p>{hasPhoto ? addedNotes[selected.id] ?? memoryNotes[(selected.id - 1) % memoryNotes.length] : '아직 아무 장면도 머물지 않은 별이에요. 사진과 이야기를 담으면, 이 자리는 그대로 두고 조금 더 따뜻한 기억별로 살아나요.'}</p>
              {hasPhoto ? <small className="memory-distance">{photos.length > 1 ? `${photos.length}장의 사진이 이 별 하나에 함께 머물러요` : '같은 활동의 별도 은은하게 빛나요'}</small> : <button className="fill-memory-button" type="button" onClick={() => openFillMemory(selected)}>별 채우기 <span>✦</span></button>}
            </div>
          </>;
        })()}
      </aside>
      <aside className={`center-star-detail${centerOpen ? ' visible' : ''}${centerEditing ? ' editing' : ' center-world'}${centerTouched ? ' center-touched' : ''}`} aria-live="polite">
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
          <div className="center-world-sky" aria-hidden="true">
            <i className="center-world-star star-one" />
            <i className="center-world-star star-two" />
            <i className="center-world-star star-three" />
            <i className="center-world-star star-four" />
            <i className="center-world-star star-five" />
            <i className="center-world-star star-six" />
          </div>
          <div className="center-world-planet" aria-hidden="true" />
          <div className="center-world-cat" aria-hidden="true" />
          <button className="center-close" type="button" aria-label={`${catProfile.name}의 별 닫기`} onClick={() => setCenterOpen(false)}>×</button>
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
      <aside className={`creation-notice${creationNotice ? ' visible' : ''}`} aria-live="polite">{creationNotice && <><span>{creationNotice.label ?? '기억이 별빛이 되었어요'}</span><strong>{creationNotice.name}</strong><small>{creationNotice.message}</small><button type="button" onClick={() => focusStar(creationNotice.id, allStars.find((star) => star.id === creationNotice.id)?.depth)}>{creationNotice.actionLabel ?? '그 별 곁으로 가기'} <b>✦</b></button></>}</aside>
      <p className="whisper">함께한 기억은,<br />조금 멀리서도 계속 빛나요.</p>
      {isLocalDevelopment && <div className="dev-memory-tools" aria-label="개발용 기억 테스트 도구"><button className="seed-memories" type="button" onPointerDown={(event) => event.stopPropagation()} onClick={seedTestMemories} disabled={seedingTestMemories}>{seedingTestMemories ? '테스트 별 채우는 중' : '사진 20장 테스트'} <span>✦</span></button><button className="clear-test-memories" type="button" onPointerDown={(event) => event.stopPropagation()} onClick={clearTestMemories} disabled={seedingTestMemories}>테스트 별 지우기</button></div>}
      <div className={`creator-backdrop${createOpen ? ' open' : ''}`} role="presentation">
        <button className="creator-dismiss-layer" type="button" aria-label="만들기 창 바깥을 눌러 닫기" onClick={() => closeCreator()} />
        <form className={`memory-creator${creatingMemory ? ' creating' : ''}${isFirstMemoryCreation ? ' first-memory-creator' : ''}`} onSubmit={createStars} aria-label="기억별 만들기">
          <button className="creator-close" type="button" aria-label="만들기 닫기" onClick={() => closeCreator()} disabled={creatingMemory}>×</button>
          {creatingMemory && <div className="creation-ritual" aria-live="polite"><span>✦</span><p>{isFirstMemoryCreation ? '첫 기억이 별빛으로 태어나고 있어요' : '기억이 별빛으로 모이고 있어요'}</p></div>}
          <span className="creator-kicker">{isFirstMemoryCreation ? 'FIRST MEMORY STAR' : fillTargetId ? 'FILL MEMORY STAR' : 'NEW MEMORY STAR'}</span><h2>{isFirstMemoryCreation ? '첫 별에 어떤 장면을 담을까요?' : fillTargetId ? '이 별에 어떤 순간을 담을까요?' : '오늘은 어떤 기억을 별로 띄울까요?'}</h2>
          <input ref={fileInputRef} className="photo-file-input" aria-label="이 기억의 사진 한 장 선택" type="file" accept="image/*" onChange={handleFilesSelected} />
          <button className={`photo-drop${pendingFiles.length ? ' ready' : ''}${singlePreview ? ' single-ready' : ''}${isFirstMemoryCreation ? ' first-photo-drop' : ''}`} data-photo-count={isFirstMemoryCreation ? '첫 사진' : '사진 1장'} type="button" onClick={() => fileInputRef.current?.click()} style={singlePreview ? { '--single-preview': `url(${singlePreview})` } as CSSProperties : undefined}><span>{pendingFiles.length ? isFirstMemoryCreation ? '이 장면이 첫 별의 빛이 돼요' : '이 사진이 별의 첫빛이 돼요' : isFirstMemoryCreation ? '처음으로 남길 사진 한 장을 골라주세요' : '별로 남길 사진 한 장을 골라주세요'}</span><small>{pendingFiles.length ? isFirstMemoryCreation ? '조금 뒤 이 밤하늘에 첫 기억별이 켜져요' : '이 순간 하나가 밤하늘에 천천히 놓여요' : isFirstMemoryCreation ? '창가, 담요, 눈빛처럼 가장 먼저 떠오르는 장면이면 충분해요' : '기억 하나씩, 별 하나씩 밝혀요'}</small></button>
          <fieldset className="activity-picker"><legend>어떤 활동의 기억인가요?</legend>{activityTags.map((activity) => <button key={activity} type="button" aria-pressed={draft.activity === activity} className={`tone-${activityStyles[activity].tone}`} onClick={() => setDraft({ ...draft, activity })}><i className={`tag-star shape-${activityStyles[activity].shape}`} />{activity}</button>)}</fieldset>
          <div className="single-fields"><label><span>기억 이름</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder={isFirstMemoryCreation ? '예: 루루와 처음 남기는 별' : '예: 창가에서 보낸 오후'} /></label><label><span>날짜</span><input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></label><label className="note-field"><span>짧은 기억</span><textarea value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder={isFirstMemoryCreation ? '그날의 온기, 이름을 불렀던 순간, 기억나는 표정을 적어도 좋아요' : '그날의 온기를 한두 문장으로 남겨요'} rows={3} /></label></div>
          <button className="create-submit" type="submit" disabled={pendingFiles.length === 0 || creatingMemory}>{creatingMemory ? isFirstMemoryCreation ? '첫 별이 켜지는 중' : '별빛이 모이는 중' : isFirstMemoryCreation ? '첫 기억별 띄우기' : fillTargetId ? '이 별에 기억 담기' : '이 기억을 별로 띄우기'} <span>✦</span></button>
          <p className="creator-note">{isFirstMemoryCreation ? '첫 별이 켜지면 이 밤하늘은 루루와 당신의 이야기로 시작돼요.' : '새 별은 밤하늘과 다시 보는 기억에 함께 머물러요.'}</p>
        </form>
      </div>
    </main>
  );
}
