import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isUserResult, jsonError, mapStarRow, requireUser, visualFor, type MemoryStarRow } from '@/lib/supabase/api-helpers';
import { legacyStarDepth } from '@/lib/star-position';
import { memoryStars } from '@/lib/memory-stars';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const userResult = await requireUser(supabase);
  if (isUserResult(userResult)) return userResult;

  const body = await request.json().catch(() => null) as
    | { name?: string; date?: string; activity?: string; note?: string }
    | null;
  if (!body || !body.name || !body.date) return jsonError(400, 'name and date are required.');

  const visual = visualFor(body.activity);

  const { data: existing, error: loadError } = await supabase
    .from('memory_stars')
    .select('*')
    .eq('owner_id', userResult.id)
    .eq('public_id', id)
    .is('deleted_at', null)
    .maybeSingle<MemoryStarRow>();
  if (loadError) return jsonError(500, loadError.message);

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from('memory_stars')
      .update({
        name: body.name,
        memory_date: body.date,
        activity: body.activity ?? null,
        note: body.note ?? '',
        status: 'filled',
        visual: { ...(existing.visual as Record<string, unknown>), shape: visual.shape, tone: visual.tone },
        filled_at: existing.filled_at ?? new Date().toISOString(),
      })
      .eq('row_id', existing.row_id)
      .select('*')
      .single<MemoryStarRow>();
    if (updateError || !updated) return jsonError(500, updateError?.message ?? 'Failed to fill memory star.');
    return NextResponse.json(mapStarRow(updated, []));
  }

  // No row yet — this must be one of the 20 pre-seeded mock star slots on
  // the frontend (lib/memory-stars.ts). Create it now, reusing that slot's
  // original position/depth so it keeps the place it always had in the sky.
  const legacySlot = Number(id);
  const baseStar = Number.isInteger(legacySlot) ? memoryStars.find((star) => star.id === legacySlot) : undefined;
  if (!baseStar) return jsonError(404, 'Unknown memory star slot.');

  const { data: created, error: insertError } = await supabase
    .from('memory_stars')
    .insert({
      owner_id: userResult.id,
      public_id: id,
      status: 'filled',
      name: body.name,
      memory_date: body.date,
      activity: body.activity ?? null,
      note: body.note ?? '',
      position: { x: baseStar.x, y: baseStar.y, depth: legacyStarDepth(legacySlot) },
      visual: { size: baseStar.size, shape: visual.shape, tone: visual.tone },
      source: { kind: 'initial-empty' },
      filled_at: new Date().toISOString(),
    })
    .select('*')
    .single<MemoryStarRow>();
  if (insertError || !created) return jsonError(500, insertError?.message ?? 'Failed to fill memory star.');

  return NextResponse.json(mapStarRow(created, []));
}
