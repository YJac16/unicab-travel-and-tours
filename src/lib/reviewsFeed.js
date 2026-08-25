import { getTourReviews, getDriverReviews } from './api';
import { tours, drivers } from '../data';

/**
 * Load a mixed feed of approved tour + driver reviews for marketing pages.
 * No static/fallback testimonials — empty means empty.
 */
export async function getPublicReviewsFeed(limit = 24) {
  const tourResults = await Promise.all(
    (tours || []).slice(0, 12).map(async (tour) => {
      const { data } = await getTourReviews(tour.id);
      return (data || []).map((r) => ({
        ...r,
        review_type: 'tour',
        target_name: tour.name,
        name: r.reviewer_name || r.name || 'Guest',
        text: r.comment || r.text,
        rating: r.rating || 5,
      }));
    })
  );

  const driverResults = await Promise.all(
    (drivers || []).map(async (driver) => {
      const key = driver.id || driver.name;
      const { data } = await getDriverReviews(key);
      return (data || []).map((r) => ({
        ...r,
        review_type: 'driver',
        target_name: driver.name,
        name: r.reviewer_name || r.name || 'Guest',
        text: r.comment || r.text,
        rating: r.rating || 5,
      }));
    })
  );

  const live = [...tourResults.flat(), ...driverResults.flat()].sort((a, b) => {
    const da = new Date(a.created_at || 0).getTime();
    const db = new Date(b.created_at || 0).getTime();
    return db - da;
  });

  return live.slice(0, limit);
}
