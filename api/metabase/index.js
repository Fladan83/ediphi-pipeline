// Vercel Serverless Function — proxies requests to data.ediphi.com (Metabase)
// Keeps API key and device cookie server-side via environment variables
// Usage: POST /api/metabase { endpoint: "/api/card/123/query/json", method: "GET", body?: {} }

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
  const apiKey = process.env.METABASE_API_KEY;
  const deviceCookie = process.env.METABASE_DEVICE_COOKIE;
  if (!apiKey) return res.status(500).json({ error: "Metabase credentials not configured on server" });

  const baseUrl = "https://data.ediphi.com";

  try {
    const headers = {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    };
    if (deviceCookie) {
      headers["Cookie"] = `metabase.DEVICE=${deviceCookie}`;
    }

    const fetchOpts = { method, headers };
    if (body && method !== "GET") fetchOpts.body = JSON.stringify(body);

    const upstream = await fetch(`${baseUrl}${endpoint}`, fetchOpts);
    const data = await upstream.json().catch(() => ({}));

    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: `Metabase proxy error: ${err.message}` });
  }
}
