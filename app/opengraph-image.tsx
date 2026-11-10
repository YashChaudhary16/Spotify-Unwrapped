import { ImageResponse } from 'next/og';

export const alt = 'Unwrapped — your Spotify listening history, visualized';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Social preview card (also used for Twitter/X). Generated at build time. */
export default function OpengraphImage() {
  // Decorative listening-over-time bars.
  const bars = [32, 48, 40, 64, 56, 88, 72, 104, 96, 128, 112, 152, 136, 176, 160, 200, 184, 224];
  const logoBars = [22, 40, 28, 34];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(160deg, #1a3d27 0%, #121212 55%)',
          color: '#FFFFFF',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: '50%',
              background: '#1ED760',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {logoBars.map((h, i) => (
              <div key={i} style={{ width: 8, height: h, borderRadius: 4, background: '#000000' }} />
            ))}
          </div>
          <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -2 }}>Unwrapped</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 48 }}>
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 600 }}>
            <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1 }}>
              Your full Spotify listening history, visualized.
            </div>
            <div style={{ marginTop: 20, fontSize: 28, color: '#B3B3B3' }}>
              Private by design — processed entirely in your browser.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 230, flexShrink: 0 }}>
            {bars.map((h, i) => (
              <div
                key={i}
                style={{
                  width: 14,
                  height: h,
                  borderRadius: 4,
                  background: '#1ED760',
                  opacity: 0.35 + (0.65 * i) / (bars.length - 1),
                }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}
