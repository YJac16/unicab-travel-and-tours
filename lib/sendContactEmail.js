const { Resend } = require("resend");

/**
 * Shared contact mailer for Express + serverless.
 */
async function sendContactEmail({ name, email, phone, message }) {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL || "info@unicabtravel.co.za";
  const fromEmail =
    process.env.CONTACT_FROM_EMAIL || "UNICAB Travel & Tours <onboarding@resend.dev>";

  if (!apiKey) {
    const err = new Error("RESEND_API_KEY is not configured");
    err.code = "CONFIG";
    throw err;
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: [toEmail],
    replyTo: email,
    subject: `Website enquiry from ${name}`,
    text: [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "—"}`,
      "",
      "Message:",
      message,
    ].join("\n"),
    html: `
      <h2>New website enquiry</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone || "—")}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
    `,
  });

  if (error) {
    const err = new Error(error.message || "Resend send failed");
    err.code = "RESEND";
    throw err;
  }

  return data;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = { sendContactEmail };
