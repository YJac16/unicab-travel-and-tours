/**
 * Seed tours table from src/data.js progressive pricing.
 * Usage: node scripts/seed-tours-from-data.js
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

function parseToursFromDataJs(raw) {
  const start = raw.indexOf('export const tours = [');
  if (start < 0) throw new Error('tours export not found in data.js');
  let i = raw.indexOf('[', start);
  let depth = 0;
  let end = -1;
  for (; i < raw.length; i += 1) {
    const ch = raw[i];
    if (ch === '[') depth += 1;
    else if (ch === ']') {
      depth -= 1;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end < 0) throw new Error('Could not parse tours array');
  let body = raw.slice(raw.indexOf('[', start), end);
  // Strip getPrice methods which contain arrows/braces that break JSON-ish eval
  body = body.replace(/getPrice:\s*\([^)]*\)\s*=>\s*getPriceForPax\([\s\S]*?\),/g, '');
  // Quote unquoted keys carefully via Function
  const tours = new Function(`return (${body});`)();
  return tours;
}

async function main() {
  if (!url || !key) {
    console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const dataPath = path.join(__dirname, '..', 'src', 'data.js');
  const raw = fs.readFileSync(dataPath, 'utf8');
  const tours = parseToursFromDataJs(raw);

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`Seeding ${tours.length} tours to ${url}...`);

  for (const t of tours) {
    const price =
      t.pricing?.['1'] ||
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
