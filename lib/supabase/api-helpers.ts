import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { activityFor, activityStyles, type ActivityTag, type StarShape, type StarTone, type MemoryStarData } from '@/lib/memory-stars';

export const MAX_PHOTOS_PER_STAR = 6;
export const MAX_PHOTO_SIZE_BYTES = 8 * 1024 * 1024;
export const PHOTO_BUCKET = 'memory-photos';

export function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Resolves the authenticated (possibly anonymous) user for the current
 * request, or returns a 401 Response. middleware.ts signs every visitor in
 * anonymously before this ever runs, so a missing user here means Supabase
 * isn't configured or the client dropped its session cookie.
 */
export async function requireUser(supabase: SupabaseClient): Promise<User | NextResponse> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return jsonError(401, 'Not signed in.');
  return data.user;
}

export function isUserResult(value: User | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}

function visualFor(activity: string | undefined | null, fallback?: { shape?: StarShape; tone?: StarTone }) {
  const style = activity ? activityStyles[activity as ActivityTag] : undefined;
  return {
    shape: style?.shape ?? fallback?.shape ?? 'dot',
    tone: style?.tone ?? fallback?.tone ?? 'cream',
  };
}

export { visualFor, activityFor };

export type MemoryStarRow = {
  row_id: string;
  owner_id: string;
  public_id: string;
  status: string;
  name: string;
  memory_date: string | null;
  activity: string | null;
  note: string;
  cover_photo_id: string | null;
  position: Record<string, unknown>;
  visual: Record<string, unknown>;
  source: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  filled_at: string | null;
  deleted_at: string | null;
};

export type MemoryPhotoRow = {
  id: string;
  owner_id: string;
  memory_star_row_id: string;
  storage_path: string;
  public_url: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  taken_at: string | null;
  uploaded_at: string;
  sort_order: number;
  alt: string | null;
  dominant_color: string | null;
  blur_data_url: string | null;
  metadata: Record<string, unknown>;
};

export function mapPhotoRow(row: MemoryPhotoRow) {
  return {
    id: row.id,
    url: row.public_url ?? '',
    storagePath: row.storage_path,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    mimeType: row.mime_type ?? undefined,
    sizeBytes: row.size_bytes ?? undefined,
    takenAt: row.taken_at,
    uploadedAt: row.uploaded_at,
    order: row.sort_order,
    alt: row.alt ?? undefined,
    dominantColor: row.dominant_color ?? undefined,
    blurDataUrl: row.blur_data_url ?? undefined,
  };
}

export function mapStarRow(row: MemoryStarRow, photos: ReturnType<typeof mapPhotoRow>[]) {
  return {
    id: row.public_id,
    catProfileId: row.owner_id,
    status: row.status,
    name: row.name,
    date: row.memory_date ?? undefined,
    activity: row.activity ?? undefined,
    note: row.note,
    photos,
    coverPhotoId: row.cover_photo_id,
    position: row.position,
    visual: row.visual,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    filledAt: row.filled_at,
    deletedAt: row.deleted_at,
    source: row.source,
    metadata: row.metadata,
  };
}

export function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80) || 'photo';
}

export function validatePhotoFiles(files: File[], existingCount: number) {
  if (existingCount + files.length > MAX_PHOTOS_PER_STAR) {
    return `별 하나에는 사진을 최대 ${MAX_PHOTOS_PER_STAR}장까지 담을 수 있어요.`;
  }
  const invalidType = files.find((file) => !file.type.startsWith('image/'));
  if (invalidType) return '사진 파일만 올릴 수 있어요.';
  const oversized = files.find((file) => file.size > MAX_PHOTO_SIZE_BYTES);
  if (oversized) return '사진 1장당 최대 8MB까지 올릴 수 있어요.';
  return null;
}

// Only referenced for its exported types (ActivityTag/StarShape/StarTone/MemoryStarData);
// keeps this module the single place API routes import shared frontend contracts from.
export type { ActivityTag, StarShape, StarTone, MemoryStarData };
