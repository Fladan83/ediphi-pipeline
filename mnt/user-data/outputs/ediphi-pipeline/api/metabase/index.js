// Vercel Serverless Function — proxies SQL queries to data.ediphi.com (Metabase)
// Keeps Metabase API key and device cookie server-side
// Usage: POST /api/metabase { sql: "SELECT ..." }

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { sql } = req.body;
  if (!sql) return res.status(400).json({ error: "Missing sql" });

  const apiKey = process.env.METABASE_API_KEY;
  const deviceCookie = process.env.METABASE_DEVICE_COOKIE;
  const dbId = process.env.METABASE_DB_ID || "661";

  if (!apiKey) return res.status(500).json({ error: "Metabase credentials not configured on server" });

  const metabaseUrl = "https://data.ediphi.com/api/dataset/json";

  try {
    const queryPayload = JSON.stringify({
      database: parseInt(dbId),
      type: "native",
      native: { query: sql },
    });

    const headers = {
      "X-API-KEY": apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    };
    if (deviceCookie) headers["Cookie"] = `metabase.DEVICE=${deviceCookie}`;

    const upstream = await fetch(metabaseUrl, {
      method: "POST",
      headers,
      body: "query=" + encodeURIComponent(queryPayload),
    });

    const data = await upstream.json().catch(() => ({}));
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: `Metabase proxy error: ${err.message}` });
  }
}
