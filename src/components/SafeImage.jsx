import React, { useState } from 'react';

/**
 * Image with graceful fallback when the asset is missing or fails to load.
 */
export default function SafeImage({
  src,
  alt = '',
  className = '',
  style = {},
  fallbackLabel = '',
}) {
  const [failed, setFailed] = useState(!src);

  if (failed) {
    return (
      <div
        className={className}
        role="img"
        aria-label={alt || fallbackLabel || 'Image unavailable'}
        style={{
          ...style,
          background: 'linear-gradient(135deg, #1a2a3a 0%, #3d5a6c 50%, #c9a227 100%)',
          display: 'grid',
          placeItems: 'center',
          color: 'rgba(255,255,255,0.85)',
          fontSize: '0.85rem',
          textAlign: 'center',
          padding: '1rem',
          minHeight: style.minHeight || style.height || 160,
        }}
      >
        {fallbackLabel || alt || 'UNICAB'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
