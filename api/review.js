// Vercel serverless function for review submissions
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
  console.log("New review submission:", payload);

  // Format email content
  const emailSubject = `New ${payload.type === 'driver' ? 'Driver' : 'Tour'} Review - ${payload.targetName}`;
  const emailBody = `
New Review Submission

Review Type: ${payload.type === 'driver' ? 'Driver Review' : 'Tour Review'}
${payload.type === 'driver' ? 'Driver' : 'Tour'}: ${payload.targetName}
Reviewer Name: ${payload.name}
Rating: ${payload.rating}/5
Review Text:
${payload.text}

Submitted: ${new Date(payload.date).toLocaleString()}

---
This is an automated notification from UNICAB Travel & Tours website.
  `.trim();

  // TODO: Add email service integration here
  // Example with SendGrid, Nodemailer, etc.
  // For production, integrate with an email service like:
  // - SendGrid
  // - Mailgun
  // - AWS SES
  // - Nodemailer with SMTP

  // For now, log the email content
  console.log("Email would be sent to: info@unicabtravel.co.za");
  console.log("Subject:", emailSubject);
  console.log("Body:", emailBody);

  return res.status(200).json({
    ok: true,
    message: "Review submitted successfully"
  });
};










