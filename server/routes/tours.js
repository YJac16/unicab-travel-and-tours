// Tours API — Supabase-backed with graceful empty response
const express = require('express');
const router = express.Router();
const { getSupabaseAdmin, isSupabaseConfigured } = require('../../lib/supabaseAdmin');

function mapTourRow(row) {
  if (!row) return null;
  return {
    id: row.slug || row.id,
    dbId: row.id,
    name: row.name,
    description: row.description,
    shortDescription: row.short_description || row.description,
    duration: row.duration,
    price: Number(row.price_zar) || 0,
    maxGuests: row.max_people || 22,
    image: row.image_url || '',
    highlights: row.highlights || [],
    pricing: row.pricing || null,
    active: row.active !== false,
  };
}

router.get('/', async (_req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.json({ success: true, data: [], source: 'unconfigured' });
    }
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('tours')
      .select('*')
      .eq('active', true)
      .order('name');
    if (error) throw error;
    return res.json({
      success: true,
      data: (data || []).map(mapTourRow),
      source: 'supabase',
    });
  } catch (error) {
    console.error('Error fetching tours:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch tours',
      message: error.message,
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(404).json({ success: false, error: 'Tour not found' });
    }
    const admin = getSupabaseAdmin();
    const id = req.params.id;
    let { data, error } = await admin.from('tours').select('*').eq('slug', id).maybeSingle();
    if (error) throw error;
    if (!data) {
      const byId = await admin.from('tours').select('*').eq('id', id).maybeSingle();
      if (byId.error) throw byId.error;
      data = byId.data;
    }
    if (!data || data.active === false) {
      return res.status(404).json({ success: false, error: 'Tour not found' });
    }
    return res.json({ success: true, data: mapTourRow(data) });
  } catch (error) {
    console.error('Error fetching tour:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch tour',
      message: error.message,
    });
  }
});

module.exports = router;
