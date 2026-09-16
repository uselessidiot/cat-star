import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  isUserResult,
  jsonError,
  mapPhotoRow,
  mapStarRow,
  PHOTO_BUCKET,
  requireUser,
  sanitizeFileName,
  validatePhotoFiles,
  type MemoryPhotoRow,
  type MemoryStarRow,
} from '@/lib/supabase/api-helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const userResult = await requireUser(supabase);
  if (isUserResult(userResult)) return userResult;

  const { data: star, error: starError } = await supabase
    .from('memory_stars')
    .select('*')
    .eq('owner_id', userResult.id)
    .eq('public_id', id)
    .is('deleted_at', null)
    .maybeSingle<MemoryStarRow>();
  if (starError) return jsonError(500, starError.message);
  if (!star) return jsonError(404, 'Memory star not found.');

  const form = await request.formData().catch(() => null);
  if (!form) return jsonError(400, 'Expected multipart/form-data.');
  const files = form.getAll('photos').filter((entry): entry is File => entry instanceof File);
  if (!files.length) return jsonError(400, 'No photos were attached.');

  const { count: existingCount, error: countError } = await supabase
    .from('memory_photos')
    .select('id', { count: 'exact', head: true })
    .eq('memory_star_row_id', star.row_id);
  if (countError) return jsonError(500, countError.message);

  const validation = validatePhotoFiles(files, existingCount ?? 0);
  if (validation) return jsonError(400, validation);

  const uploaded: MemoryPhotoRow[] = [];
  for (const [index, file] of files.entries()) {
    const photoId = crypto.randomUUID();
    const path = `${userResult.id}/${id}/${photoId}-${sanitizeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) return jsonError(500, `Photo upload failed: ${uploadError.message}`);

    const { data: publicUrlData } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);

    const { data: photoRow, error: insertError } = await supabase
      .from('memory_photos')
      .insert({
        id: photoId,
        owner_id: userResult.id,
        memory_star_row_id: star.row_id,
        storage_path: path,
        public_url: publicUrlData.publicUrl,
        mime_type: file.type,
        size_bytes: file.size,
        sort_order: (existingCount ?? 0) + index,
      })
      .select('*')
      .single<MemoryPhotoRow>();
    if (insertError || !photoRow) {
      await supabase.storage.from(PHOTO_BUCKET).remove([path]);
      return jsonError(500, insertError?.message ?? 'Failed to record uploaded photo.');
    }
    uploaded.push(photoRow);
  }

  const { data: allPhotos, error: photosError } = await supabase
    .from('memory_photos')
    .select('*')
    .eq('memory_star_row_id', star.row_id)
    .order('sort_order', { ascending: true })
    .overrideTypes<MemoryPhotoRow[], { merge: false }>();
  if (photosError) return jsonError(500, photosError.message);

  return NextResponse.json(mapStarRow(star, (allPhotos ?? uploaded).map(mapPhotoRow)));
}
