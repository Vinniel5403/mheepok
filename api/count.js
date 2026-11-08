// Global spin counter for Vercel.
// GET  /api/count -> { count }      current total
// POST /api/count -> { count }      +1, returns new total
// Storage: Upstash Redis REST (add it from Vercel Marketplace -> Storage -> Upstash for Redis).
// Reads KV_REST_API_URL/KV_REST_API_TOKEN or UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN.

const KEY = "mheepok:spins";

module.exports = async (req, res) => {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  res.setHeader("Cache-Control", "no-store");
  if (!url || !token) return res.status(503).json({ error: "counter storage not configured" });

  let cmd;
  if (req.method === "GET") cmd = "get";
  else if (req.method === "POST") cmd = "incr";
  else { res.setHeader("Allow", "GET, POST"); return res.status(405).json({ error: "method not allowed" }); }

  try {
    const r = await fetch(`${url}/${cmd}/${encodeURIComponent(KEY)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) throw new Error(`redis ${r.status}`);
    const { result } = await r.json();
    return res.status(200).json({ count: Number(result) || 0 });
  } catch (e) {
    return res.status(502).json({ error: "counter unavailable" });
  }
};
