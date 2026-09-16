import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { friendlyAuthError, isAnonymousUser, validateCredentials } from '@/lib/supabase/auth-helpers';

// Converts the current anonymous session into a permanent email/password
// account. The Supabase user id is preserved, so every memory star and photo
// already created (scoped by owner_id = uid) carries over automatically — no
// data migration needed. From another device the user logs in and the same
// uid, and therefore the same data, comes back.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { email?: unknown; password?: unknown } | null;
  const email = typeof body?.email === 'string' ? body.email.trim() : undefined;
  const password = typeof body?.password === 'string' ? body.password : undefined;

  const validation = validateCredentials(email, password);
  if (validation) return NextResponse.json({ error: validation }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user && !isAnonymousUser(user)) {
    return NextResponse.json({ error: '이미 로그인되어 있어요.' }, { status: 409 });
  }

  // Anonymous session present: upgrade it in place (keeps uid + data).
  // No session at all: fall back to a fresh sign-up.
  if (user) {
    const { data, error } = await supabase.auth.updateUser({ email, password });
    if (error) return NextResponse.json({ error: friendlyAuthError(error.message) }, { status: 400 });
    return NextResponse.json({ ok: true, email: data.user.email ?? email });
  }

  const { data, error } = await supabase.auth.signUp({ email: email!, password: password! });
  if (error) return NextResponse.json({ error: friendlyAuthError(error.message) }, { status: 400 });
  return NextResponse.json({ ok: true, email: data.user?.email ?? email });
}
