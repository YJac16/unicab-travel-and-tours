import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_ORIGIN = 'https://www.unicabtraveltours.com';
const DEFAULT_TITLE = 'UNICAB Travel & Tours | Private Luxury Transfers & Tours';
const DEFAULT_DESCRIPTION =
  'UNICAB Travel & Tours offers private transfers, airport transfers, corporate and staff transport, and private tours across Cape Town and the Western Cape.';

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href) {
  if (!href) return;
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function buildCanonicalUrl(pathname) {
  const raw = pathname || '/';
  if (raw === '/') return `${SITE_ORIGIN}/`;
  const normalized = raw.endsWith('/') ? raw.slice(0, -1) : raw;
  return `${SITE_ORIGIN}${normalized}`;
}

/** Sets document title + meta description / Open Graph / canonical for SPA routes */
export default function DocumentTitle({ title, description, path }) {
  const location = useLocation();
  const pathname = path || location.pathname || '/';

  useEffect(() => {
    const prevTitle = document.title;
    const fullTitle = title ? `${title} | UNICAB Travel & Tours` : DEFAULT_TITLE;
    document.title = fullTitle;

    const desc = description || DEFAULT_DESCRIPTION;
    const prevDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const prevCanonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
    const prevOgUrl = document.querySelector('meta[property="og:url"]')?.getAttribute('content') || '';

    const canonicalUrl = buildCanonicalUrl(pathname);

    upsertMeta('name', 'description', desc);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', desc);
    upsertCanonical(canonicalUrl);

    return () => {
      document.title = prevTitle;
      upsertMeta('name', 'description', prevDesc || DEFAULT_DESCRIPTION);
      if (prevCanonical) upsertCanonical(prevCanonical);
      if (prevOgUrl) upsertMeta('property', 'og:url', prevOgUrl);
    };
  }, [title, description, pathname]);

  return null;
}
