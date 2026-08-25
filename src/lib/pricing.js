/**
 * Progressive tour pricing helpers.
 * Supports exact tiers (1, 2, 3, 4) and range tiers ("3-4", "5-6", etc.).
 */

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const normalizePricing = (pricing) => {
  if (!pricing) return null;
  if (typeof pricing === 'string') {
    try {
      return JSON.parse(pricing);
    } catch {
      return null;
    }
  }
  return pricing;
};

export const getPriceForGroupSize = (pricing, groupSize) => {
  const tiers = normalizePricing(pricing);
  if (!tiers) return 0;

  const pax = parseInt(groupSize, 10);
  if (!pax || pax < 1) return 0;

  if (tiers[pax] != null) return toNumber(tiers[pax]);
  if (tiers[String(pax)] != null) return toNumber(tiers[String(pax)]);

  for (const [key, value] of Object.entries(tiers)) {
    const rangeMatch = String(key).match(/^(\d+)\s*-\s*(\d+)$/);
    if (!rangeMatch) continue;

    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);
    if (pax >= min && pax <= max) {
      return toNumber(value);
    }
  }

  const singleTiers = Object.entries(tiers)
    .map(([key, value]) => {
      const exact = parseInt(key, 10);
      if (Number.isNaN(exact) || String(exact) !== String(key).trim()) {
        return null;
      }
      return { pax: exact, price: toNumber(value) };
    })
    .filter(Boolean)
    .sort((a, b) => a.pax - b.pax);

  const nextTier = singleTiers.find((tier) => tier.pax >= pax);
  if (nextTier) return nextTier.price;

  if (singleTiers.length > 0) {
    return singleTiers[singleTiers.length - 1].price;
  }

  return 0;
};

export const calculateTourPrice = (tour, groupSize) => {
  if (!tour) return 0;

  const pax = parseInt(groupSize, 10);
  if (!pax || pax < 1) return 0;

  if (tour.pricing) {
    const price = getPriceForGroupSize(tour.pricing, pax);
    if (price > 0) return price;
  }

  if (typeof tour.getPrice === 'function') {
    const customPrice = toNumber(tour.getPrice(pax));
    if (customPrice > 0) return customPrice;
  }

  if (tour.price_zar != null) {
    const price = toNumber(tour.price_zar);
    if (price > 0) return price;
  }

  return 0;
};

export const formatTourPrice = (amount) => {
  if (!amount || amount <= 0) return 'Price on request';
  return `R${Number(amount).toLocaleString()}`;
};

/**
 * Public marketing price label.
 * Interim: do not surface conflicting From-prices until an authoritative
 * price list is confirmed. Checkout still uses progressive pricing tiers.
 */
export const PUBLIC_PRICE_ON_REQUEST = 'Price on request';

export const getPublicPriceLabel = (_tourOrPackage) => PUBLIC_PRICE_ON_REQUEST;

/** Apply active membership tier discount to a per-person or total amount. */
export const applyMembershipDiscount = (amount, tier) => {
  const base = toNumber(amount);
  if (!base) return 0;
  const rates = {
    explorer: 0.065, // mid of 5–8%
    frequent: 0.125, // mid of 10–15%
    elite: 0.15,
  };
  const rate = rates[String(tier || '').toLowerCase()] || 0;
  return Math.round(base * (1 - rate));
};

export const getMembershipDiscountLabel = (tier) => {
  const labels = {
    explorer: 'Member preferred rate',
    frequent: 'Member preferred rate',
    elite: 'Partner contracted rate',
  };
  return labels[String(tier || '').toLowerCase()] || null;
};
