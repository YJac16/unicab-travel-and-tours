import { useEffect } from 'react';

/** Sets document title + basic meta description for SPA routes */
export default function DocumentTitle({ title, description }) {
  useEffect(() => {
    const prev = document.title;
    document.title = title
      ? `${title} | UNICAB Travel & Tours`
      : 'UNICAB Travel & Tours | Private Luxury Transfers & Tours';

    let meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute('content') || '';
    if (description && meta) meta.setAttribute('content', description);

    return () => {
      document.title = prev;
      if (meta && description) meta.setAttribute('content', prevDesc);
    };
  }, [title, description]);

  return null;
}
