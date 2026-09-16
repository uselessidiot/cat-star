import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseEnv } from '@/lib/supabase/env';

export async function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Route handlers can set cookies; other contexts (e.g. a Server Component
          // render) cannot. Middleware refreshes the session in those cases.
        }
      },
    },
  });
}
