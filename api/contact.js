// Vercel serverless function — contact form via Resend
const { sendContactEmail } = require("../lib/sendContactEmail");

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const payload = parseBody(req);
  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim();
  const phone = String(payload.phone || "").trim();
  const message = String(payload.message || "").trim();

  if (name.length < 2) {
    return res.status(400).json({ ok: false, message: "Please provide your full name." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, message: "Please provide a valid email address." });
  }
  if (message.length < 10) {
    return res.status(400).json({ ok: false, message: "Please provide a message (at least 10 characters)." });
  }

  try {
    await sendContactEmail({ name, email, phone, message });
    return res.status(200).json({
      ok: true,
      message:
        "Thank you. Your request has been received. Our team will respond with a detailed proposal shortly.",
    });
  } catch (err) {
    console.error("Contact handler error:", err);
    if (err.code === "CONFIG") {
      return res.status(503).json({
        ok: false,
        message: "Contact email is not configured yet. Please email info@unicabtravel.co.za directly.",
      });
    }
    return res.status(502).json({
      ok: false,
      message: err.message || "Failed to send email. Please try again or email us directly.",
    });
  }
};
