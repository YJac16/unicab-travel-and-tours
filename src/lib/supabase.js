import { createClient } from '@supabase/supabase-js';

/**
 * Supabase JS expects the project root URL only, e.g.
 * https://xxxx.supabase.co
 * If Railway/env mistakenly includes /rest/v1, strip it to avoid /rest/v1/rest/v1/...
 */
export const normalizeSupabaseUrl = (rawUrl = '') => {
  let url = String(rawUrl || '').trim().replace(/\/+$/, '');
  if (!url) return '';

  // Common misconfiguration: pasted REST endpoint instead of project URL
  url = url.replace(/\/rest\/v1(?:\/.*)?$/i, '');
  url = url.replace(/\/auth\/v1(?:\/.*)?$/i, '');
  url = url.replace(/\/storage\/v1(?:\/.*)?$/i, '');
  url = url.replace(/\/+$/, '');

  return url;
};

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseUrl = normalizeSupabaseUrl(rawUrl);
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

const PLACEHOLDER_URL = 'https://placeholder.supabase.co';

if (rawUrl && rawUrl !== supabaseUrl) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL included an API path and was normalized to the project root:',
    supabaseUrl
  );
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not set. Using local/offline mode.');
}

export const supabase = createClient(
  supabaseUrl || PLACEHOLDER_URL,
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'sb-auth-token',
    },
  }
);

/** True when Vite env vars look configured (may still be unreachable). */
export const isSupabaseConfigured = () => {
  return !!(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== PLACEHOLDER_URL &&
    !supabaseUrl.includes('placeholder')
  );
};

/** Detect network / DNS / offline Supabase failures */
export const isSupabaseNetworkError = (error) => {
  if (!error) return false;
  const message = String(error.message || error.details || error || '').toLowerCase();
  return (
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('err_name_not_resolved') ||
    message.includes('load failed') ||
    message.includes('network request failed') ||
    error.name === 'TypeError'
  );
};
