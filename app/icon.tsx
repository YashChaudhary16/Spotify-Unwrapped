import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/** Favicon: green circle with black "audio bars", matching the Brand mark. */
export default function Icon() {
  const bars = [10, 18, 12, 16];
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: '#1ED760',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        {bars.map((h, i) => (
          <div key={i} style={{ width: 3, height: h, borderRadius: 2, background: '#000000' }} />
        ))}
      </div>
    ),
    size
  );
}
