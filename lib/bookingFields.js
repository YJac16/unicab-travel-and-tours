/**
 * Normalize booking row fields for emails and responses.
 * Schema uses customer_* / total_price (not guest_* / total_amount).
 */
function bookingEmailFields(booking) {
  if (!booking) return null;
  const email =
    booking.customer_email ||
    booking.guest_email ||
    booking.email ||
    null;
  const name =
    booking.customer_name ||
    booking.guest_name ||
    booking.name ||
    null;
  const amount =
    booking.total_price != null
      ? booking.total_price
      : booking.total_amount != null
        ? booking.total_amount
        : null;
  const tourName =
    booking.tours?.name ||
    booking.tour?.name ||
    booking.tour_name ||
    null;
  return {
    email,
    name,
    amount,
    tourName,
    bookingId: booking.id,
    date: booking.booking_date,
    time: booking.booking_time,
  };
}

const BOOKING_EMAIL_SELECT =
  'id, customer_name, customer_email, booking_date, booking_time, total_price, package_id, tours(name)';

module.exports = {
  bookingEmailFields,
  BOOKING_EMAIL_SELECT,
};
