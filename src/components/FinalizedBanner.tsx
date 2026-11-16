'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useEventResponses } from '@/components/HostResponsesProvider';
import { Event, SlotDensityMap } from '@/types';
import { CalendarExport } from '@/components/CalendarExport';
import { FinalizeButton } from '@/components/FinalizeButton';
import { CheckCircle, Mail, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAppUrl } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { shortCalendarLinks } from '@/lib/calendar';

function fmtTz(tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZoneName: 'short', timeZone: tz })
      .formatToParts(new Date())
      .find(p => p.type === 'timeZoneName')?.value ?? tz;
  } catch { return tz; }
}

function formatFinalizedSlot(slot: string, event: Event): string {
  if (event.mode === 'days') {
    return format(parseISO(slot), 'EEEE, MMMM d, yyyy');
  }
  const date = format(parseISO(slot.replace('T', ' ')), 'EEEE, MMMM d');
  const time = slot.slice(11);
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${date} at ${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface InviteContent {
  subject: string;
  text: string;
  html: string;
}

// Builds the invite in two flavors: plain text (mailto: bodies can only be plain text)
// and HTML with real hyperlinks (for the "Copy invite" clipboard button).
// Contains no invitee emails — those only ever go in the BCC field.
function buildInvite(slot: string, event: Event): InviteContent {
  const formattedDate = formatFinalizedSlot(slot, event);
  const tzSuffix = event.timezone ? ` (${fmtTz(event.timezone)})` : '';
  const links = shortCalendarLinks(event.id);
  const eventUrl = `${getAppUrl()}/event/${event.id}`;

  const subject = `You're invited: ${event.name} — ${formattedDate}${tzSuffix}`;

  const text = [
    `Hi there,`,
    ``,
    `${event.name} is set for ${formattedDate}${tzSuffix}.`,
    event.location ? `📍 ${event.location}` : null,
    event.description || null,
    ``,
    `Add to your calendar:`,
    `• Google: ${links.google}`,
    `• Apple / Outlook: ${links.apple}`,
    ``,
    `— ${event.creator_name}`,
  ].filter(s => s !== null).join('\r\n');

  const e = escapeHtml;
  const html = [
    `<p>Hi there,</p>`,
    `<p><strong>${e(event.name)}</strong> is set for <strong>${e(formattedDate + tzSuffix)}</strong>.</p>`,
    event.location ? `<p>📍 ${e(event.location)}</p>` : '',
    event.description ? `<p>${e(event.description).replace(/\n/g, '<br>')}</p>` : '',
    `<p>Add to your calendar: <a href="${e(links.google)}">Google Calendar</a> · <a href="${e(links.apple)}">Apple / Outlook</a></p>`,
    `<p>— ${e(event.creator_name)} · <a href="${e(eventUrl)}">View on Seeya</a></p>`,
  ].join('');

  return { subject, text, html };
}

interface Props {
  event: Event;
  bestSlots: string[];
  allSlotKeys: string[];
  densityMap: SlotDensityMap;
  totalResponders: number;
}

export function FinalizedBanner({ event, bestSlots, allSlotKeys, densityMap, totalResponders }: Props) {
  // Real names/emails only arrive when this browser holds the host token
  const { responses } = useEventResponses();
  const [finalizedSlot, setFinalizedSlot] = useState<string | null>(event.finalized_slot);
  const [isHost, setIsHost] = useState(false);
  const [unfinalizingPending, setUnfinalizingPending] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = sessionStorage.getItem(`host_token_${event.id}`);
    if (token) setIsHost(true);
  }, [event.id]);

  useEffect(() => {
    if (!finalizedSlot || !bannerRef.current) return;
    const container = bannerRef.current;
    const colors = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];
    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `position:absolute;width:8px;height:8px;border-radius:2px;left:${Math.random() * 100}%;top:-10px;background-color:${colors[Math.floor(Math.random() * colors.length)]};animation:confettiFall ${2 + Math.random() * 2}s ease-out forwards;animation-delay:${Math.random() * 0.5}s;pointer-events:none`;
      container.appendChild(particle);
      setTimeout(() => particle.remove(), 5000);
    }
  }, [finalizedSlot]);

  async function handleUnfinalize() {
    const token = sessionStorage.getItem(`host_token_${event.id}`);
    if (!token) return;
    setUnfinalizingPending(true);
    try {
      const res = await fetch(`/api/events/${event.id}/finalize`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host_token: token }),
      });
      if (res.ok) setFinalizedSlot(null);
    } finally {
      setUnfinalizingPending(false);
    }
  }

  const invite = useMemo(
    () => (finalizedSlot ? buildInvite(finalizedSlot, event) : null),
    [finalizedSlot, event]
  );

  const mailtoUrl = useMemo(() => {
    if (!invite) return null;
    const emailList = responses.filter(r => r.email && !r.declined).map(r => r.email as string);
    if (emailList.length === 0) return null;
    return `mailto:?bcc=${encodeURIComponent(emailList.join(','))}&subject=${encodeURIComponent(invite.subject)}&body=${encodeURIComponent(invite.text)}`;
  }, [invite, responses]);

  const [copied, setCopied] = useState(false);

  async function handleCopyInvite() {
    if (!invite) return;
    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        // Rich-text email editors (Gmail, Outlook, Apple Mail) paste the HTML with live links
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([invite.html], { type: 'text/html' }),
            'text/plain': new Blob([invite.text], { type: 'text/plain' }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(invite.text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (permissions / insecure context) — nothing else to do
    }
  }

  const emailCount = useMemo(
    () => responses.filter(r => r.email && !r.declined).length,
    [responses]
  );

  const nonDeclinedCount = useMemo(
    () => responses.filter(r => !r.declined).length,
    [responses]
  );

  const slotsForExport = finalizedSlot ? [finalizedSlot] : bestSlots;

  if (finalizedSlot) {
    return (
      <div ref={bannerRef} className="relative overflow-hidden rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              It&apos;s happening! 🎉
            </p>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-0.5">
              {event.name} is set for <span className="font-medium">{formatFinalizedSlot(finalizedSlot, event)}</span>
              {event.timezone ? ` (${fmtTz(event.timezone)})` : ''}.
            </p>
          </div>
          {isHost && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs flex-shrink-0 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg"
              onClick={handleUnfinalize}
              disabled={unfinalizingPending}
            >
              Change
            </Button>
          )}
        </div>
        <CalendarExport event={{ ...event, finalized_slot: finalizedSlot }} bestSlots={slotsForExport} responses={responses} />
        {isHost && (
          <div className="flex flex-wrap gap-2">
            {mailtoUrl && (
              <a href={mailtoUrl}>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-xl border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email invites ({emailCount < nonDeclinedCount ? `${emailCount} of ${nonDeclinedCount}` : emailCount})
                </Button>
              </a>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyInvite}
              title="Copy a formatted invite with clickable calendar links — paste it into any email"
              className="gap-1.5 rounded-xl border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy invite'}
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (!isHost) return null;

  return (
    <FinalizeButton
      event={event}
      bestSlot={bestSlots[0] ?? null}
      allSlotKeys={allSlotKeys}
      densityMap={densityMap}
      totalResponders={totalResponders}
      onFinalized={setFinalizedSlot}
    />
  );
}
