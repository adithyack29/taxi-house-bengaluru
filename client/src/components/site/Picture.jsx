/** WebP with JPEG fallback, explicit size + aspect-ratio to prevent layout shift. */
export default function Picture({ name, alt, width, height, eager = false, className = 'photo', sizes }) {
  return (
    <picture>
      <source type="image/webp" srcSet={`/img/${name}.webp`} sizes={sizes} />
      <img
        className={className}
        src={`/img/${name}.jpg`}
        alt={alt}
        width={width}
        height={height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={eager ? 'high' : undefined}
        style={{ aspectRatio: `${width} / ${height}` }}
      />
    </picture>
  );
}
