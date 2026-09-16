import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isUserResult, jsonError, requireUser } from '@/lib/supabase/api-helpers';

type CatProfileRow = {
  owner_id: string;
  name: string;
  guardian_name: string;
  met_date: string | null;
  birthday: string | null;
  description: string;
  portrait_path: string | null;
  portrait_url: string | null;
  created_at: string;
  updated_at: string;
};

function mapProfile(row: CatProfileRow) {
  return {
    id: row.owner_id,
    name: row.name,
    guardianName: row.guardian_name,
    metDate: row.met_date ?? undefined,
    birthday: row.birthday ?? undefined,
    description: row.description,
    portraitUrl: row.portrait_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const userResult = await requireUser(supabase);
  if (isUserResult(userResult)) return userResult;

  const { data: existing, error: selectError } = await supabase
    .from('cat_profiles')
    .select('*')
    .eq('owner_id', userResult.id)
    .maybeSingle();
  if (selectError) return jsonError(500, selectError.message);
  if (existing) return NextResponse.json(mapProfile(existing));

  const { data: created, error: insertError } = await supabase
    .from('cat_profiles')
    .insert({ owner_id: userResult.id })
    .select('*')
    .single();
  if (insertError || !created) return jsonError(500, insertError?.message ?? 'Failed to create cat profile.');
  return NextResponse.json(mapProfile(created));
}

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const userResult = await requireUser(supabase);
  if (isUserResult(userResult)) return userResult;

  const body = await request.json().catch(() => null) as
    | { name?: string; guardianName?: string; metDate?: string; birthday?: string; description?: string; portraitUrl?: string }
    | null;
  if (!body) return jsonError(400, 'Invalid JSON body.');

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.guardianName !== undefined) updates.guardian_name = body.guardianName;
  if (body.metDate !== undefined) updates.met_date = body.metDate || null;
  if (body.birthday !== undefined) updates.birthday = body.birthday || null;
  if (body.description !== undefined) updates.description = body.description;
  if (body.portraitUrl !== undefined) updates.portrait_url = body.portraitUrl || null;

  const { data: updated, error } = await supabase
    .from('cat_profiles')
    .upsert({ owner_id: userResult.id, ...updates }, { onConflict: 'owner_id' })
    .select('*')
    .single();
  if (error || !updated) return jsonError(500, error?.message ?? 'Failed to update cat profile.');
  return NextResponse.json(mapProfile(updated));
}
