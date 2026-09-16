import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { friendlyAuthError, validateCredentials } from '@/lib/supabase/auth-helpers';

// Signs into an existing email/password account, replacing whatever session
// (usually a fresh anonymous one) the browser currently holds. The user's own
// uid — and therefore their stars/photos — comes back on any device.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { email?: unknown; password?: unknown } | null;
  const email = typeof body?.email === 'string' ? body.email.trim() : undefined;
  const password = typeof body?.password === 'string' ? body.password : undefined;

  const validation = validateCredentials(email, password);
  if (validation) return NextResponse.json({ error: validation }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: email!, password: password! });
  if (error) return NextResponse.json({ error: friendlyAuthError(error.message) }, { status: 401 });

  return NextResponse.json({ ok: true, email: data.user.email ?? email });
}
