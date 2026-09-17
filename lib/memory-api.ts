import { activityFor, activityStyles, type ActivityTag, type MemoryStarData, type StarShape, type StarTone } from '@/lib/memory-stars';
import { MEMORY_STORE_CHANGED, type CatProfile } from '@/lib/memory-store';

export const MAX_PHOTO_SIZE_BYTES = 8 * 1024 * 1024;
export const MAX_PHOTOS_PER_STAR = 6;

export type ApiMemoryPhoto = {
  id: string;
  url: string;
  storagePath?: string;
  width?: number;
  height?: number;
  mimeType?: string;
  sizeBytes?: number;
  takenAt?: string | null;
  uploadedAt?: string;
  order?: number;
  alt?: string;
  dominantColor?: string;
  blurDataUrl?: string;
};

export type ApiMemoryStar = {
  id: string;
  catProfileId?: string;
  status?: 'empty' | 'filled' | 'archived' | string;
  name: string;
  date?: string;
  memoryDate?: string;
  activity?: ActivityTag | string;
  note?: string;
  photos?: ApiMemoryPhoto[];
  coverPhotoId?: string | null;
  position?: {
    x?: number;
    y?: number;
    mobileX?: number;
    mobileY?: number;
    depth?: number;
    layer?: 'far' | 'mid' | 'near' | string;
    order?: number;
  };
  visual?: {
    size?: number;
    shape?: StarShape | string;
    tone?: StarTone | string;
    glow?: string;
    favorite?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
  filledAt?: string | null;
  deletedAt?: string | null;
  source?: {
    kind?: string;
    batchId?: string;
  };
  metadata?: Record<string, unknown>;
};

export type ApiStoredMemory = {
  id: number;
  remoteId: string;
  star: MemoryStarData;
  note: string;
  photos: ApiMemoryPhoto[];
  createdAt: string;
  testSeed?: boolean;
};

export type CreateMemoryStarInput = {
  catProfileId: string;
  name: string;
  date: string;
  activity?: string;
  note?: string;
};

export type FillEmptyStarInput = {
  starId: string;
  name: string;
  date: string;
  activity?: string;
  note?: string;
};

function announceApiMemoryChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(MEMORY_STORE_CHANGED));
  try {
    window.localStorage.setItem(MEMORY_STORE_CHANGED, String(Date.now()));
  } catch {
    // Ignore storage sync failures in restricted preview contexts.
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: init?.body instanceof FormData ? init.headers : { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function numericIdFromRemoteId(remoteId: string) {
  const numeric = Number(remoteId);
  if (Number.isInteger(numeric) && numeric > 0 && numeric < 1_000_000) return numeric;
  let hash = 0;
  for (const char of remoteId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return 10_000 + (hash % 900_000);
}

function displayDate(date?: string) {
  if (!date) return '';
  return date.includes('-') ? date.replaceAll('-', '. ') : date;
}

function asActivity(activity?: string): ActivityTag | undefined {
  return activity as ActivityTag | undefined;
}

export function validateMemoryPhotos(files: File[], existingCount = 0) {
  if (existingCount + files.length > MAX_PHOTOS_PER_STAR) {
    return `별 하나에는 사진을 최대 ${MAX_PHOTOS_PER_STAR}장까지 담을 수 있어요.`;
  }
  const invalidType = files.find((file) => !file.type.startsWith('image/'));
  if (invalidType) return '사진 파일만 올릴 수 있어요.';
  const oversized = files.find((file) => file.size > MAX_PHOTO_SIZE_BYTES);
  if (oversized) return '사진 1장당 최대 8MB까지 올릴 수 있어요.';
  return null;
}

export function apiStarToMemoryData(apiStar: ApiMemoryStar, fallback?: Partial<MemoryStarData>): MemoryStarData {
  const activity = asActivity(apiStar.activity) ?? fallback?.activity;
  const style = activity ? activityStyles[activity] : undefined;
  return {
    id: fallback?.id ?? numericIdFromRemoteId(apiStar.id),
    remoteId: apiStar.id,
    name: apiStar.name,
    date: displayDate(apiStar.date ?? apiStar.memoryDate ?? fallback?.date),
    x: apiStar.position?.x ?? fallback?.x ?? 50,
    y: apiStar.position?.y ?? fallback?.y ?? 42,
    size: apiStar.visual?.size ?? fallback?.size ?? 8,
    shape: (apiStar.visual?.shape as StarShape | undefined) ?? style?.shape ?? fallback?.shape ?? 'dot',
    tone: (apiStar.visual?.tone as StarTone | undefined) ?? style?.tone ?? fallback?.tone ?? 'cream',
    activity,
    favorite: apiStar.visual?.favorite ?? fallback?.favorite,
    depth: apiStar.position?.depth ?? fallback?.depth ?? 1,
    photoCount: apiStar.photos?.length ?? fallback?.photoCount ?? 0,
    created: apiStar.status === 'filled' || (apiStar.photos?.length ?? 0) > 0 || fallback?.created,
  };
}

export function apiStarToStoredMemory(apiStar: ApiMemoryStar, fallback?: Partial<MemoryStarData>): ApiStoredMemory {
  const star = apiStarToMemoryData(apiStar, fallback);
  return {
    id: star.id,
    remoteId: apiStar.id,
    star,
    note: apiStar.note ?? '',
    photos: apiStar.photos ?? [],
    createdAt: apiStar.createdAt ?? new Date().toISOString(),
    testSeed: apiStar.source?.kind === 'test-seed',
  };
}

export async function getApiCatProfile() {
  return requestJson<CatProfile & { id: string }>('/api/cat-profile');
}

export async function updateApiCatProfile(profile: Pick<CatProfile, 'name' | 'guardianName' | 'metDate' | 'birthday' | 'description'>) {
  return requestJson<CatProfile & { id: string }>('/api/cat-profile', {
    method: 'PATCH',
    body: JSON.stringify(profile),
  });
}

export async function getApiMemories() {
  const stars = await requestJson<ApiMemoryStar[]>('/api/memory-stars');
  return stars.map((star) => apiStarToStoredMemory(star));
}

export async function createApiMemoryStar(input: CreateMemoryStarInput, photos: File[]) {
  const created = await requestJson<ApiMemoryStar>('/api/memory-stars', { method: 'POST', body: JSON.stringify(input) });
  const withPhotos = photos.length ? await uploadApiMemoryPhotos(created.id, photos) : created;
  announceApiMemoryChanged();
  return apiStarToStoredMemory(withPhotos);
}

export async function fillApiMemoryStar(input: FillEmptyStarInput, photos: File[], fallback?: Partial<MemoryStarData>) {
  const filled = await requestJson<ApiMemoryStar>(`/api/memory-stars/${encodeURIComponent(input.starId)}/fill`, {
    method: 'POST',
    body: JSON.stringify({ name: input.name, date: input.date, activity: input.activity, note: input.note }),
  });
  const withPhotos = photos.length ? await uploadApiMemoryPhotos(filled.id, photos) : filled;
  announceApiMemoryChanged();
  return apiStarToStoredMemory(withPhotos, fallback);
}

export async function uploadApiMemoryPhotos(starId: string, photos: File[]) {
  const form = new FormData();
  photos.forEach((photo) => form.append('photos', photo));
  return requestJson<ApiMemoryStar>(`/api/memory-stars/${encodeURIComponent(starId)}/photos`, { method: 'POST', body: form });
}

export async function updateApiMemoryStar(starId: string, updates: { name?: string; date?: string; activity?: string; note?: string; coverPhotoId?: string | null }) {
  const updated = await requestJson<ApiMemoryStar>(`/api/memory-stars/${encodeURIComponent(starId)}`, { method: 'PATCH', body: JSON.stringify(updates) });
  announceApiMemoryChanged();
  return apiStarToStoredMemory(updated);
}

export async function deleteApiMemoryStar(starId: string) {
  await fetch(`/api/memory-stars/${encodeURIComponent(starId)}`, { method: 'DELETE' }).then((response) => {
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  });
  announceApiMemoryChanged();
}
