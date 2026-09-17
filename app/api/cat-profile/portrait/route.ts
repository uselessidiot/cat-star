import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  isUserResult,
  jsonError,
  MAX_PHOTO_SIZE_BYTES,
  PHOTO_BUCKET,
  requireUser,
  sanitizeFileName,
} from '@/lib/supabase/api-helpers';

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

// Uploads the cat's portrait to the shared photo bucket under the user's own
// "_profile" folder, then records the path/url on cat_profiles. The center
// star (the cat itself) is the emotional core of the app, so it must survive
// across devices — not just live in one browser's IndexedDB.
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const userResult = await requireUser(supabase);
  if (isUserResult(userResult)) return userResult;

  const form = await request.formData().catch(() => null);
  if (!form) return jsonError(400, 'Expected multipart/form-data.');
  const file = form.get('portrait');
  if (!(file instanceof File)) return jsonError(400, '고양이 사진을 찾을 수 없어요.');
  if (!file.type.startsWith('image/')) return jsonError(400, '사진 파일만 올릴 수 있어요.');
  if (file.size > MAX_PHOTO_SIZE_BYTES) return jsonError(400, '사진은 최대 8MB까지 올릴 수 있어요.');

  const { data: existing } = await supabase
    .from('cat_profiles')
    .select('*')
    .eq('owner_id', userResult.id)
    .maybeSingle<CatProfileRow>();
  const previousPath = existing?.portrait_path ?? null;

  const path = `${userResult.id}/_profile/portrait-${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) return jsonError(500, `Portrait upload failed: ${uploadError.message}`);

  const { data: publicUrlData } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);

  const { data: updated, error: updateError } = await supabase
    .from('cat_profiles')
    .upsert({ owner_id: userResult.id, portrait_path: path, portrait_url: publicUrlData.publicUrl }, { onConflict: 'owner_id' })
    .select('*')
    .single<CatProfileRow>();
  if (updateError || !updated) {
    await supabase.storage.from(PHOTO_BUCKET).remove([path]);
    return jsonError(500, updateError?.message ?? 'Failed to save portrait.');
  }

  // Best-effort cleanup of the replaced portrait so storage does not accumulate.
  if (previousPath && previousPath !== path) {
    await supabase.storage.from(PHOTO_BUCKET).remove([previousPath]);
  }

  return NextResponse.json(mapProfile(updated));
}
