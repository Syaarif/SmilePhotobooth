export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const app = process.env.METERED_APP;
  const key = process.env.METERED_API_KEY;

  if (!app || !key) {
    return res.status(200).json({ iceServers: [], debug: { appTerbaca: !!app, keyTerbaca: !!key } });
  }
  if (!/^[a-z0-9-]+$/i.test(app)) {
    return res.status(200).json({ iceServers: [], debug: "METERED_APP berisi karakter yang tidak valid" });
  }

  try {
    const r = await fetch(
      `https://${app}.metered.live/api/v1/turn/credentials?apiKey=${encodeURIComponent(key)}`
    );
    if (!r.ok) {
      return res.status(200).json({ iceServers: [], debug: { statusMetered: r.status } });
    }
    const list = await r.json();
    return res.status(200).json({ iceServers: Array.isArray(list) ? list : [] });
  } catch (e) {
    return res.status(200).json({ iceServers: [], debug: { error: String(e.message) } });
  }
}