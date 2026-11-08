import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const ROOM_TTL = 60 * 60 * 2; // room hidup 2 jam
const MSG_TTL = 60 * 5; // pesan signaling hidup 5 menit
const ROOM_RE = /^[A-Za-z0-9_-]{6,64}$/;
const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

const slot = (room, role) => `pb:${room}:${role}`;
const inbox = (room, role) => `pb:${room}:inbox:${role}`;
const other = (role) => (role === "host" ? "guest" : "host");

async function claim(room, role, clientId) {
  const ok = await redis.set(slot(room, role), clientId, { nx: true, ex: ROOM_TTL });
  if (ok) return true;
  return String(await redis.get(slot(room, role))) === clientId;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Gunakan POST." });

  const { action, room, clientId, role, msg } = req.body ?? {};
  if (!ROOM_RE.test(room ?? "") || !ID_RE.test(clientId ?? "")) {
    return res.status(400).json({ error: "Kode room atau ID tidak valid." });
  }

  try {
    if (action === "join") {
      const mine = (await claim(room, "host", clientId))
        ? "host"
        : (await claim(room, "guest", clientId))
        ? "guest"
        : null;
      if (!mine) return res.status(409).json({ error: "Room sudah penuh (maksimal 2 orang)." });
      await redis.del(inbox(room, mine));
      return res.json({ role: mine });
    }

    if (role !== "host" && role !== "guest") {
      return res.status(400).json({ error: "Role tidak valid." });
    }
    if (String(await redis.get(slot(room, role))) !== clientId) {
      return res.status(403).json({ error: "Sesi room tidak valid atau sudah kedaluwarsa." });
    }

    if (action === "send") {
      if (JSON.stringify(msg ?? null).length > 10000) {
        return res.status(413).json({ error: "Pesan terlalu besar." });
      }
      const key = inbox(room, other(role));
      await redis.rpush(key, msg);
      await redis.expire(key, MSG_TTL);
      return res.json({ ok: true });
    }

    if (action === "poll") {
      const msgs = (await redis.lpop(inbox(room, role), 50)) ?? [];
      return res.json({ msgs });
    }

    if (action === "leave") {
      await redis.del(slot(room, role));
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: "Aksi tidak dikenal." });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error." });
  }
}
