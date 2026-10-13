import { createServerClient } from '@supabase/ssr';

// Server-only. The anon key has no table access (RLS with no policies), so all
// reads and writes go through this client and must be sanitized before reaching
// the browser — see src/lib/sanitize.ts.
export function createSupabaseAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}
