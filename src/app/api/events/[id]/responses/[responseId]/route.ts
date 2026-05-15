import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; responseId: string }> }
) {
  try {
    const { id, responseId } = await params;
    const supabase = createSupabaseAdminClient();

    const { data: response } = await supabase
      .from('responses')
      .select('event_id')
      .eq('id', responseId)
      .single();

    if (!response || response.event_id !== id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await supabase.from('responses').delete().eq('id', responseId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/events/[id]/responses/[responseId]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
