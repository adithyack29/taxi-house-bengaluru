/**
 * Static route map drawn from the OSRM route geometry (GeoJSON [lng, lat] pairs) — no map tiles or API key,
 * so it is never empty. Falls back to a labelled panel when no geometry is available.
 */
export default function RouteMap({ coords, label }) {
  const W = 640;
  const H = 130;
  const P = 22;
  let path = null;
  let a = null;
  let b = null;

  if (coords && coords.length > 1) {
    const midLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
    const k = Math.cos((midLat * Math.PI) / 180);
    const xs = coords.map((c) => c[0] * k);
    const ys = coords.map((c) => -c[1]);
    const minX = Math.min(...xs); const maxX = Math.max(...xs);
    const minY = Math.min(...ys); const maxY = Math.max(...ys);
    const s = Math.min((W - P * 2) / (maxX - minX || 1), (H - P * 2) / (maxY - minY || 1));
    const ox = (W - (maxX - minX) * s) / 2;
    const oy = (H - (maxY - minY) * s) / 2;
    const pts = xs.map((x, i) => [ox + (x - minX) * s, oy + (ys[i] - minY) * s]);
    path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    [a, b] = [pts[0], pts[pts.length - 1]];
  }

  return (
    <div className="routemap" role="img" aria-label={label}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
        <defs>
          <pattern id="rm-grid" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M16 0H0V16" fill="none" stroke="var(--paper)" strokeOpacity=".06" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#rm-grid)" />
        {path && (
          <>
            <path d={path} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={a[0]} cy={a[1]} r="6" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
            <circle cx={b[0]} cy={b[1]} r="7" fill="var(--accent)" stroke="var(--ink)" strokeWidth="2" />
          </>
        )}
      </svg>
      <span className="routemap__label">{label}</span>
    </div>
  );
}
