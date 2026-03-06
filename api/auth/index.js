// Vercel Serverless Function — validates email against APPROVED_EMAILS env var
// Usage: POST /api/auth { email }
// Returns: { ok: true, user: { email, name } } or { ok: false, error: "..." }
//
// Passwords are managed client-side (localStorage). This endpoint only checks
// that the email is on the approved list. Add emails to the APPROVED_EMAILS
// env var in Vercel as a comma-separated list:
//   APPROVED_EMAILS=dan@ediphi.com,jane@ediphi.com,bob@ediphi.com

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ ok: false, error: "Email required" });

  const approvedRaw = process.env.APPROVED_EMAILS || "";
  if (!approvedRaw.trim()) return res.status(500).json({ ok: false, error: "No approved users configured on server" });

  const approved = approvedRaw.split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  const normalizedEmail = email.trim().toLowerCase();

  if (!approved.includes(normalizedEmail)) {
    return res.status(401).json({ ok: false, error: "This email is not authorized. Contact your admin." });
  }

  // Derive a display name from the email (everything before @, capitalized)
  const namePart = normalizedEmail.split("@")[0].replace(/[._-]/g, " ");
  const displayName = namePart.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return res.status(200).json({
    ok: true,
    user: {
      email: normalizedEmail,
      name: displayName,
      role: "user",
    },
  });
}
