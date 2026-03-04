// Vercel Serverless Function — proxies SQL queries to data.ediphi.com (Metabase)
// Keeps API key and device cookie server-side via environment variables
// Usage: POST /api/metabase { sql: "SELECT ..." }
// Returns: JSON array of row objects

export default async function handler(req, res) {
  // CORS headers for local dev
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { sql } = req.body;
  if (!sql) return res.status(400).json({ error: "Missing sql" });

  // Credentials from Vercel environment variables
  const apiKey = process.env.METABASE_API_KEY;
  const deviceCookie = process.env.METABASE_DEVICE_COOKIE;
  const dbId = process.env.METABASE_DB_ID || "661";
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

    // Use Metabase's native query dataset endpoint
    const upstream = await fetch(`${baseUrl}/api/dataset`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        database: parseInt(dbId, 10),
        type: "native",
        native: { query: sql },
      }),
    });

    const result = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: result.message || `Metabase error ${upstream.status}` });
    }

    // Transform Metabase dataset response into array of row objects
    // Metabase returns { data: { cols: [{name}...], rows: [[val, val]...] } }
    if (result.data && result.data.cols && result.data.rows) {
      const colNames = result.data.cols.map(c => c.name);
      const rows = result.data.rows.map(row => {
        const obj = {};
        colNames.forEach((name, i) => { obj[name] = row[i]; });
        return obj;
      });
      return res.status(200).json(rows);
    }

    // Fallback: return raw result
    return res.status(200).json(result);
  } catch (err) {
    return res.status(502).json({ error: `Metabase proxy error: ${err.message}` });
  }
}
