import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'seeya — find a time everyone loves';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0c0a09',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Ambient blobs */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'rgba(217, 119, 6, 0.15)',
            filter: 'blur(80px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -50,
            right: 100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.1)',
            filter: 'blur(80px)',
          }}
        />

        {/* Wordmark */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 600,
            color: '#fafaf9',
            letterSpacing: '-0.02em',
            marginBottom: 24,
          }}
        >
          seeya
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: '#fafaf9',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            marginBottom: 32,
            maxWidth: 900,
          }}
        >
          find a time{' '}
          <span style={{ color: '#f59e0b' }}>everyone loves</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: '#78716c',
            lineHeight: 1.4,
            maxWidth: 700,
          }}
        >
          Share a link. Everyone marks when they&apos;re free. The best time finds itself.
        </div>

        {/* Domain */}
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            right: 80,
            fontSize: 22,
            color: '#44403c',
            letterSpacing: '0.01em',
          }}
        >
          seeyasoon.digital
        </div>
      </div>
    ),
    { ...size }
  );
}
