import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  isUserResult,
  jsonError,
  mapPhotoRow,
  mapStarRow,
  requireUser,
  visualFor,
  type MemoryPhotoRow,
  type MemoryStarRow,
} from '@/lib/supabase/api-helpers';
import { placeAddedStar } from '@/lib/star-position';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const userResult = await requireUser(supabase);
  if (isUserResult(userResult)) return userResult;

  const { data: stars, error: starsError } = await supabase
    .from('memory_stars')
    .select('*')
    .eq('owner_id', userResult.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .overrideTypes<MemoryStarRow[], { merge: false }>();
  if (starsError) return jsonError(500, starsError.message);

  const rowIds = (stars ?? []).map((star) => star.row_id);
  let photosByStar = new Map<string, ReturnType<typeof mapPhotoRow>[]>();
  if (rowIds.length) {
    const { data: photos, error: photosError } = await supabase
      .from('memory_photos')
      .select('*')
      .in('memory_star_row_id', rowIds)
      .order('sort_order', { ascending: true })
      .overrideTypes<MemoryPhotoRow[], { merge: false }>();
    if (photosError) return jsonError(500, photosError.message);
    photosByStar = (photos ?? []).reduce((map, photo) => {
      const list = map.get(photo.memory_star_row_id) ?? [];
      list.push(mapPhotoRow(photo));
      map.set(photo.memory_star_row_id, list);
      return map;
    }, new Map<string, ReturnType<typeof mapPhotoRow>[]>());
  }

  const result = (stars ?? []).map((star) => mapStarRow(star, photosByStar.get(star.row_id) ?? []));
  return NextResponse.json(result);
}

function hashToInt(value: string) {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash;
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const userResult = await requireUser(supabase);
  if (isUserResult(userResult)) return userResult;

  const body = await request.json().catch(() => null) as
    | { catProfileId?: string; name?: string; date?: string; activity?: string; note?: string }
    | null;
  if (!body || !body.name || !body.date) return jsonError(400, 'name and date are required.');

  // Existing "created" (non-legacy) stars decide this star's rank among the
  // spiral layout — see lib/star-position.ts for why this only needs to be
  // approximate.
  const { data: siblings, error: siblingsError } = await supabase
    .from('memory_stars')
    .select('memory_date')
    .eq('owner_id', userResult.id)
    .eq('source->>kind', 'single-upload')
    .is('deleted_at', null)
    .overrideTypes<Array<{ memory_date: string | null }>, { merge: false }>();
  if (siblingsError) return jsonError(500, siblingsError.message);

  const newDate = body.date;
  const newerCount = (siblings ?? []).filter((row) => (row.memory_date ?? '') > newDate).length;
  const total = (siblings?.length ?? 0) + 1;
  const publicId = crypto.randomUUID();
  const jitterSeed = hashToInt(publicId) % 997;
  const placement = placeAddedStar({ id: jitterSeed, rankFromNewest: newerCount, total });
  const visual = visualFor(body.activity);

  const { data: created, error: insertError } = await supabase
    .from('memory_stars')
    .insert({
      owner_id: userResult.id,
      public_id: publicId,
      status: 'filled',
      name: body.name,
      memory_date: body.date,
      activity: body.activity ?? null,
      note: body.note ?? '',
      position: { x: placement.x, y: placement.y, depth: placement.depth },
      visual: { size: placement.size, shape: visual.shape, tone: visual.tone },
      source: { kind: 'single-upload' },
      filled_at: new Date().toISOString(),
    })
    .select('*')
    .single<MemoryStarRow>();
  if (insertError || !created) return jsonError(500, insertError?.message ?? 'Failed to create memory star.');

  return NextResponse.json(mapStarRow(created, []));
}
