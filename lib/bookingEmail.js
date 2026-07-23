const { Resend } = require('resend');

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    const err = new Error('RESEND_API_KEY is not configured');
    err.code = 'CONFIG';
    throw err;
  }
  return new Resend(key);
}

function fromAddress() {
  return (
    process.env.CONTACT_FROM_EMAIL ||
    'UNICAB Travel & Tours <onboarding@resend.dev>'
  );
}

async function sendBookingConfirmationEmail({
  to,
  guestName,
  bookingId,
  tourName,
  date,
  time,
  amountZar,
}) {
  if (!to) return { skipped: true };
  const resend = getResend();
  const subject = `Booking confirmed — ${tourName || 'UNICAB tour'}`;
  const text = [
    `Hi ${guestName || 'there'},`,
    '',
    'Your UNICAB booking is confirmed.',
    `Reference: ${bookingId}`,
    tourName ? `Tour: ${tourName}` : null,
    date ? `Date: ${date}${time ? ` ${time}` : ''}` : null,
    amountZar != null ? `Amount: R${Number(amountZar).toFixed(2)}` : null,
    '',
    'We look forward to welcoming you.',
    'UNICAB Travel & Tours',
    'https://www.unicabtraveltours.com',
  ]
    .filter(Boolean)
    .join('\n');

  const { data, error } = await resend.emails.send({
    from: fromAddress(),
    to: [to],
    subject,
    text,
  });
  if (error) throw error;
  return data;
}

async function sendOpsNotificationEmail({ subject, text }) {
  const to = process.env.CONTACT_TO_EMAIL || process.env.OPS_NOTIFY_EMAIL;
  if (!to) return { skipped: true };
  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: fromAddress(),
    to: [to],
    subject,
    text,
  });
  if (error) throw error;
  return data;
}

async function sendReviewInviteEmail({ to, guestName, bookingId, tourName, reviewUrl }) {
  if (!to) return { skipped: true };
  const resend = getResend();
  const url =
    reviewUrl ||
    `${(process.env.BASE_URL || 'https://www.unicabtraveltours.com').replace(/\/+$/, '')}/member/bookings/${bookingId}`;
  const subject = `How was your UNICAB experience?`;
  const text = [
    `Hi ${guestName || 'there'},`,
    '',
    `Thanks for travelling with us${tourName ? ` on ${tourName}` : ''}.`,
    'We would love a short review — it helps other guests and our drivers.',
    '',
    `Leave a review: ${url}`,
    '',
    'UNICAB Travel & Tours',
  ].join('\n');

  const { data, error } = await resend.emails.send({
    from: fromAddress(),
    to: [to],
    subject,
    text,
  });
  if (error) throw error;
  return data;
}

module.exports = {
  sendBookingConfirmationEmail,
  sendOpsNotificationEmail,
  sendReviewInviteEmail,
};
