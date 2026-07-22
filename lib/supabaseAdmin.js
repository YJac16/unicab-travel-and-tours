const { createClient } = require('@supabase/supabase-js');

let adminClient = null;

/**
 * Supabase JS expects the project root URL only.
 * Strip accidental /rest/v1 (or auth/storage) suffixes from env values.
 */
const normalizeSupabaseUrl = (rawUrl = '') => {
  let url = String(rawUrl || '').trim().replace(/\/+$/, '');
  if (!url) return '';

  url = url.replace(/\/rest\/v1(?:\/.*)?$/i, '');
  url = url.replace(/\/auth\/v1(?:\/.*)?$/i, '');
  url = url.replace(/\/storage\/v1(?:\/.*)?$/i, '');
  return url.replace(/\/+$/, '');
};

const getSupabaseConfig = () => {
  const rawUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    '';
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    '';

  return {
    url: normalizeSupabaseUrl(rawUrl),
    serviceKey: String(serviceKey || '').trim(),
    rawUrl: String(rawUrl || '').trim(),
  };
};

const isSupabaseConfigured = () => {
  const { url, serviceKey } = getSupabaseConfig();
  return Boolean(url && serviceKey && !url.includes('placeholder'));
};

const getSupabaseAdmin = () => {
  if (adminClient) {
    return adminClient;
  }

  const { url, serviceKey, rawUrl } = getSupabaseConfig();
  if (!url || !serviceKey) {
    throw new Error(
      'Supabase not configured. Set SUPABASE_URL (project root, e.g. https://xxxx.supabase.co) and SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  if (rawUrl && rawUrl !== url) {
    console.warn('[Supabase] SUPABASE_URL was normalized to project root:', url);
  }

  adminClient = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
};

module.exports = {
  getSupabaseAdmin,
  isSupabaseConfigured,
  normalizeSupabaseUrl,
};
