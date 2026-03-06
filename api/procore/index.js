// Vercel Serverless Function — Procore API proxy with OAuth Client Credentials
// Usage: POST /api/procore { action, endpoint, method, body }
//
// Actions:
//   "proxy"  — Proxies a request to the Procore API (default)
//   "token"  — Returns a fresh access token (for debugging only)
//
// Env vars required:
//   PROCORE_CLIENT_ID, PROCORE_CLIENT_SECRET
//   PROCORE_ENV = "sandbox" (default) | "production"

// ── Token cache (persists across warm invocations) ──────────────────────────
let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiry - 60000) return cachedToken;

  const clientId = process.env.PROCORE_CLIENT_ID;
  const clientSecret = process.env.PROCORE_CLIENT_SECRET;
  const env = (process.env.PROCORE_ENV || "sandbox").toLowerCase();

  if (!clientId || !clientSecret) throw new Error("PROCORE_CLIENT_ID and PROCORE_CLIENT_SECRET must be set");

  // Sandbox vs production login endpoints
  const loginUrl = env === "production"
    ? "https://login.procore.com/oauth/token"
    : "https://login-sandbox.procore.com/oauth/token";

  const res = await fetch(loginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error_description || data.error || `OAuth error ${res.status}`);
  }

  cachedToken = data.access_token;
  // expires_in is in seconds; default to 2 hours if not provided
  tokenExpiry = Date.now() + (data.expires_in || 7200) * 1000;
  return cachedToken;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { action = "proxy", endpoint, method = "GET", body } = req.body || {};

  try {
    const token = await getAccessToken();

    // Token debug action
    if (action === "token") {
      return res.status(200).json({ ok: true, tokenPrefix: token.substring(0, 12) + "…" });
    }

    // Proxy action — forward request to Procore API
    if (!endpoint) return res.status(400).json({ error: "Missing endpoint" });

    const env = (process.env.PROCORE_ENV || "sandbox").toLowerCase();
    const apiBase = env === "production"
      ? "https://api.procore.com"
      : "https://sandbox.procore.com";

    const url = `${apiBase}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

    const headers = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Procore-Company-Id": req.body.companyId ? String(req.body.companyId) : undefined,
    };
    // Remove undefined headers
    Object.keys(headers).forEach(k => headers[k] === undefined && delete headers[k]);

    const fetchOpts = { method: method.toUpperCase(), headers };
    if (body && ["POST", "PATCH", "PUT"].includes(fetchOpts.method)) {
      fetchOpts.body = JSON.stringify(body);
    }

    const upstream = await fetch(url, fetchOpts);

    // Handle pagination headers
    const pagination = {
      total: upstream.headers.get("Total"),
      perPage: upstream.headers.get("Per-Page"),
      page: upstream.headers.get("Page"),
    };

    // Handle empty responses (204 No Content, etc.)
    if (upstream.status === 204) {
      return res.status(200).json({ ok: true, data: null, pagination });
    }

    const result = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: result.message || result.errors || `Procore error ${upstream.status}`,
        details: result,
      });
    }

    return res.status(200).json({ ok: true, data: result, pagination });

  } catch (err) {
    // If token is expired/invalid, clear cache so next request gets a fresh one
    cachedToken = null;
    tokenExpiry = 0;
    return res.status(502).json({ error: `Procore proxy error: ${err.message}` });
  }
}
