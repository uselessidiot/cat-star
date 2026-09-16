import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  isUserResult,
  jsonError,
  mapPhotoRow,
  mapStarRow,
  PHOTO_BUCKET,
  requireUser,
  visualFor,
  type MemoryPhotoRow,
  type MemoryStarRow,
  type StarShape,
  type StarTone,
} from '@/lib/supabase/api-helpers';

type RouteContext = { params: Promise<{ id: string }> };

async function loadStar(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, ownerId: string, publicId: string) {
  const { data, error } = await supabase
    .from('memory_stars')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('public_id', publicId)
    .is('deleted_at', null)
    .maybeSingle<MemoryStarRow>();
  return { data, error };
}

async function loadPhotos(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, rowId: string) {
  const { data, error } = await supabase
    .from('memory_photos')
    .select('*')
    .eq('memory_star_row_id', rowId)
    .order('sort_order', { ascending: true })
    .overrideTypes<MemoryPhotoRow[], { merge: false }>();
  return { data: data ?? [], error };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const userResult = await requireUser(supabase);
  if (isUserResult(userResult)) return userResult;

  const body = await request.json().catch(() => null) as
    | { name?: string; date?: string; activity?: string; note?: string; coverPhotoId?: string | null }
    | null;
  if (!body) return jsonError(400, 'Invalid JSON body.');

  const { data: existing, error: loadError } = await loadStar(supabase, userResult.id, id);
  if (loadError) return jsonError(500, loadError.message);
  if (!existing) return jsonError(404, 'Memory star not found.');

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.date !== undefined) updates.memory_date = body.date;
  if (body.note !== undefined) updates.note = body.note;
  if (body.coverPhotoId !== undefined) updates.cover_photo_id = body.coverPhotoId;
  if (body.activity !== undefined) {
    updates.activity = body.activity;
    const existingVisual = existing.visual as { shape?: StarShape; tone?: StarTone };
    const visual = visualFor(body.activity, existingVisual);
    updates.visual = { ...(existing.visual as Record<string, unknown>), shape: visual.shape, tone: visual.tone };
  }

  const { data: updated, error: updateError } = await supabase
    .from('memory_stars')
    .update(updates)
    .eq('row_id', existing.row_id)
    .select('*')
    .single<MemoryStarRow>();
  if (updateError || !updated) return jsonError(500, updateError?.message ?? 'Failed to update memory star.');

  const { data: photos, error: photosError } = await loadPhotos(supabase, updated.row_id);
  if (photosError) return jsonError(500, photosError.message);

  return NextResponse.json(mapStarRow(updated, photos.map(mapPhotoRow)));
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const userResult = await requireUser(supabase);
  if (isUserResult(userResult)) return userResult;

  const { data: existing, error: loadError } = await loadStar(supabase, userResult.id, id);
  if (loadError) return jsonError(500, loadError.message);
  if (!existing) return jsonError(404, 'Memory star not found.');

  const { data: photos } = await loadPhotos(supabase, existing.row_id);
  if (photos.length) {
    await supabase.storage.from(PHOTO_BUCKET).remove(photos.map((photo) => photo.storage_path));
  }

  const { error: deleteError } = await supabase.from('memory_stars').delete().eq('row_id', existing.row_id);
  if (deleteError) return jsonError(500, deleteError.message);

  return new NextResponse(null, { status: 204 });
}
