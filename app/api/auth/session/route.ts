import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isAnonymousUser } from '@/lib/supabase/auth-helpers';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ authenticated: false, isAnonymous: false, email: null });
  }

  const anonymous = isAnonymousUser(user);
  return NextResponse.json({
    authenticated: !anonymous,
    isAnonymous: anonymous,
    email: user.email ?? null,
  });
}
