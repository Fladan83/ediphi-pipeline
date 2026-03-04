// Vercel Serverless Function — proxies requests to api.ediphi.com
// Keeps api-tenant and api-token server-side via environment variables
// Usage: POST /api/ediphi { endpoint: "/projects", method: "GET", body?: {} }

export default async function handler(req, res) {
  // CORS headers for local dev
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { endpoint, method = "GET", body } = req.body;
  if (!endpoint) return res.status(400).json({ error: "Missing endpoint" });

  // Credentials from Vercel environment variables
  const tenant = process.env.EDIPHI_TENANT;
  const token = process.env.EDIPHI_TOKEN;
  if (!tenant || !token) return res.status(500).json({ error: "Ediphi credentials not configured on server" });

  const baseUrl = "https://api.ediphi.com/api/external";

  try {
    const fetchOpts = {
      method,
      headers: {
        "Content-Type": "application/json",
        "api-tenant": tenant,
        "api-token": token,
      },
    };
    if (body && method !== "GET") fetchOpts.body = JSON.stringify(body);

    const upstream = await fetch(`${baseUrl}${endpoint}`, fetchOpts);
    const data = await upstream.json().catch(() => ({}));

    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: `Proxy error: ${err.message}` });
  }
}
