import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from('events').select('id').limit(1);
    if (error) throw error;
    return Response.json({ ok: true, timestamp: new Date().toISOString() });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : 'unknown error' },
      { status: 500 }
    );
  }
}
