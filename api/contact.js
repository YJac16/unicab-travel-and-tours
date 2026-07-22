// Vercel serverless function for contact form
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const payload = req.body || {};
  console.log("New contact enquiry:", payload);

  // TODO: Add email service integration here
  // Example with SendGrid, Nodemailer, etc.

  return res.status(200).json({
    ok: true,
    message:
      "Thank you. Your request has been received. Our team will respond with a detailed proposal shortly."
  });
};

