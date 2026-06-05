import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; responseId: string }> }
) {
  try {
    const { id, responseId } = await params;

    let host_token: string | undefined;
    try {
      const body = await req.json();
      host_token = body?.host_token;
    } catch {
      // No body is fine — respondent self-delete path
    }

    const supabase = createSupabaseAdminClient();

    // If host_token is supplied, validate it before allowing deletion of any response
    if (host_token) {
      const { data: event } = await supabase
        .from('events')
        .select('host_token')
        .eq('id', id)
        .single();

      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }

      if (event.host_token !== host_token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

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
