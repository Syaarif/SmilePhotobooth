// Mengambil kredensial TURN dari Metered. Kunci API hanya ada di server.
// Env: METERED_APP (bagian sebelum .metered.live) dan METERED_API_KEY
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const app = process.env.METERED_APP;
  const key = process.env.METERED_API_KEY;
  if (!app || !key || !/^[a-z0-9-]+$/i.test(app)) {
    return res.status(200).json({ iceServers: [] });
  }

  try {
    const r = await fetch(
      `https://${app}.metered.live/api/v1/turn/credentials?apiKey=${encodeURIComponent(key)}`
    );
    if (!r.ok) throw new Error(`Metered TURN ${r.status}`);
    const list = await r.json();
    return res.status(200).json({ iceServers: Array.isArray(list) ? list : [] });
  } catch (e) {
    console.error(e);
    return res.status(200).json({ iceServers: [] });
  }
}
