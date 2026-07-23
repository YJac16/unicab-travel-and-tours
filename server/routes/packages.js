// Public packages catalogue
const express = require('express');
const router = express.Router();
const { getSupabaseAdmin, isSupabaseConfigured } = require('../../lib/supabaseAdmin');

const FALLBACK = [
  {
    id: 'cape-highlights',
    name: 'Cape Highlights Day',
    summary: 'Table Mountain, Cape Point & Boulders in one curated private day.',
    from_price_zar: 4500,
    bookable: true,
  },
  {
    id: 'wine-and-coast',
    name: 'Wine & Coast Escape',
    summary: 'Stellenbosch tasting circuit with scenic coastal transfer.',
    from_price_zar: 3800,
    bookable: true,
  },
  {
    id: 'corporate-delegate',
    name: 'Corporate Delegate',
    summary: 'Airport meet & greet, hotel runs, and confidential chauffeur cover.',
    from_price_zar: null,
    bookable: false,
  },
];

router.get('/', async (_req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });
      if (!error && data?.length) {
        return res.json({ success: true, data });
      }
    }
    return res.json({ success: true, data: FALLBACK });
  } catch (error) {
    console.error('Packages list error:', error);
    return res.json({ success: true, data: FALLBACK });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('id', req.params.id)
        .eq('active', true)
        .maybeSingle();
      if (!error && data) {
        return res.json({ success: true, data });
      }
    }
    const fallback = FALLBACK.find((p) => p.id === req.params.id);
    if (!fallback) {
      return res.status(404).json({ success: false, error: 'Package not found' });
    }
    return res.json({ success: true, data: fallback });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
