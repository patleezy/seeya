import { NextRequest, NextResponse } from 'next/server';
import { isValidUUID } from '@/lib/validation';

// Short link used in email invites: /e/[id]/apple → the event's .ics file.
// The ICS route handles the "not found / not finalized" cases.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const res = NextResponse.redirect(new URL(`/api/events/${id}/ics`, req.url), 302);
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
