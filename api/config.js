export default function handler(req, res) {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  res.setHeader("Cache-Control", "no-store");

  // This endpoint is public. Never return an accidentally configured privileged key.
  let publicKey = String(key || '').startsWith('sb_publishable_');
  try { publicKey ||= JSON.parse(Buffer.from(String(key).split('.')[1], 'base64url').toString()).role === 'anon'; } catch (_) {}
  if (!url || !key || !publicKey || key === process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({
      ok: false,
      error: "Cloud configuration is missing"
    });
  }

  return res.status(200).json({
    ok: true,
    url,
    key
  });
}
