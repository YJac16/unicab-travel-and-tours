/**
 * Persist a sales lead (contact / package enquire). Uses service role; no public insert RLS.
 */
async function createLead({
  source = 'contact',
  name,
  email,
  phone,
  message,
  package_id,
  meta,
}) {
  const { getSupabaseAdmin, isSupabaseConfigured } = require('./supabaseAdmin');
  if (!isSupabaseConfigured()) return { skipped: true };
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('leads')
    .insert({
      source,
      name: String(name || '').trim(),
      email: String(email || '').trim().toLowerCase(),
      phone: phone ? String(phone).trim() : null,
      message: message ? String(message).trim() : null,
      package_id: package_id || null,
      meta: meta || {},
      status: 'new',
    })
    .select('*')
    .maybeSingle();
  if (error) {
    console.warn('Lead insert failed:', error.message);
    return { error };
  }
  return { data };
}

module.exports = { createLead };
