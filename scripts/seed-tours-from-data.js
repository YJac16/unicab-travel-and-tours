/**
 * Seed tours table from src/data.js progressive pricing.
 * Usage: node scripts/seed-tours-from-data.js
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '')
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/$/, '');
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_SECRET ||
  process.env.SUPABASE_SERVICE_KEY;

async function main() {
  if (!url || !key) {
    console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Load data.js via dynamic import of built-like content is hard in CJS;
  // parse a minimal extract by requiring through vite-unfriendly path — use eval of export.
  const dataPath = path.join(__dirname, '..', 'src', 'data.js');
  const raw = fs.readFileSync(dataPath, 'utf8');
  // Extract tours array with a Function wrapper after converting export to module.exports-like
  const transformed = raw
    .replace(/export const /g, 'const ')
    .replace(/export \{[^}]+\};?/g, '');
  const fn = new Function(`${transformed}\nreturn { tours, membershipPlans };`);
  const { tours } = fn();

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`Seeding ${tours.length} tours to ${url}...`);

  for (const t of tours) {
    const price =
      t.pricing?.base ||
      (typeof t.price === 'number' ? t.price : null) ||
      0;
    const row = {
      name: t.name,
      slug: t.id,
      description: t.description || t.shortDescription || '',
      short_description: t.shortDescription || '',
      duration: t.duration || '',
      price_zar: price,
      max_people: t.maxGuests || 22,
      image_url: t.image || null,
      highlights: t.highlights || [],
      pricing: t.pricing || null,
      active: true,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await admin
      .from('tours')
      .select('id')
      .eq('slug', t.id)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await admin.from('tours').update(row).eq('id', existing.id);
      if (error) console.error('Update failed', t.id, error.message);
      else console.log('Updated', t.id);
    } else {
      const { error } = await admin.from('tours').insert(row);
      if (error) console.error('Insert failed', t.id, error.message);
      else console.log('Inserted', t.id);
    }
  }

  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
