import { useCallback, useEffect, useRef, useState } from "react";
import { signal } from "../lib/api";

const ICE_SERVERS = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
];
if (import.meta.env.VITE_TURN_URL) {
  ICE_SERVERS.push({
    urls: import.meta.env.VITE_TURN_URL,
    username: import.meta.env.VITE_TURN_USER,
    credential: import.meta.env.VITE_TURN_PASS,
  });
}

function getClientId() {
  let id = sessionStorage.getItem("pb-client");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("pb-client", id);
  }
  return id;
}

async function getMedia() {
  const video = { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" };
  try {
    return await navigator.mediaDevices.getUserMedia({ video, audio: true });
  } catch {
    // mikrofon ditolak/tidak ada: coba video saja
    return await navigator.mediaDevices.getUserMedia({ video, audio: false });
  }
}

function friendly(e) {
  if (e?.name === "NotAllowedError") return "Izin kamera ditolak. Izinkan kamera di pengaturan browser, lalu coba lagi.";
  if (e?.name === "NotFoundError") return "Kamera tidak ditemukan.";
  if (e?.name === "NotReadableError") return "Kamera sedang dipakai aplikasi lain. Tutup aplikasi itu lalu coba lagi.";
  return e?.message || "Terjadi kesalahan.";
}

/**
 * status: starting | waiting | connecting | connected | error
 * onMessage dipanggil untuk pesan dari pasangan lewat data channel.
 */
export default function usePeer(room, onMessage) {
  const [status, setStatus] = useState("starting");
  const [error, setError] = useState("");
  const [role, setRole] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const channelRef = useRef(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  });

  useEffect(() => {
    let dead = false;
    let pc = null;
    let stream = null;
    let timer = null;
    let myRole = null;
    let connected = false;
    let busy = false;
    let oid = null; // id negosiasi, supaya pesan lama diabaikan
    let pendingIce = [];
    let queue = Promise.resolve(); // kirim pesan berurutan
    const clientId = getClientId();

    const send = (msg) => {
      queue = queue
        .then(() => signal("send", { room, clientId, role: myRole, msg }))
        .catch(() => {});
      return queue;
    };

    const flushIce = async () => {
      const list = pendingIce;
      pendingIce = [];
      for (const c of list) await pc.addIceCandidate(c).catch(() => {});
    };

    const wireChannel = (ch) => {
      channelRef.current = ch;
      ch.onopen = () => {
        if (channelRef.current !== ch) return;
        connected = true;
        setStatus("connected");
      };
      ch.onmessage = (e) => {
        try {
          onMessageRef.current?.(JSON.parse(e.data));
        } catch {
          /* abaikan pesan rusak */
        }
      };
      ch.onclose = () => {
        if (channelRef.current !== ch) return;
        channelRef.current = null;
        connected = false;
        setRemoteStream(null);
        setStatus("waiting");
      };
    };

    const makePc = () => {
      channelRef.current = null;
      connected = false;
      if (pc) {
        pc.onconnectionstatechange = null;
        pc.close();
      }
      pendingIce = [];
      const p = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pc = p;
      stream.getTracks().forEach((t) => p.addTrack(t, stream));
      p.onicecandidate = (e) => {
        if (e.candidate) send({ type: "ice", oid, candidate: e.candidate.toJSON() });
      };
      p.ontrack = (e) => setRemoteStream(e.streams[0]);
      p.ondatachannel = (e) => wireChannel(e.channel);
      p.onconnectionstatechange = () => {
        if (p.connectionState === "failed") {
          connected = false;
          setStatus("error");
          setError(
            "Tidak bisa tersambung langsung ke pasanganmu. Biasanya karena jaringan membatasi koneksi. Coba ganti jaringan, atau tambahkan server TURN."
          );
        }
      };
      return p;
    };

    const handle = async (m) => {
      if (m.type === "hello") {
        if (myRole === "guest") {
          send({ type: "hello" }); // minta host membuat offer
          return;
        }
        setStatus("connecting");
        setError("");
        oid = Date.now();
        const p = makePc();
        wireChannel(p.createDataChannel("pb"));
        await p.setLocalDescription(await p.createOffer());
        send({ type: "offer", oid, sdp: p.localDescription.toJSON() });
        return;
      }
      if (m.type === "offer" && myRole === "guest") {
        setStatus("connecting");
        setError("");
        oid = m.oid;
        const p = makePc();
        await p.setRemoteDescription(m.sdp);
        await flushIce();
        await p.setLocalDescription(await p.createAnswer());
        send({ type: "answer", oid, sdp: p.localDescription.toJSON() });
        return;
      }
      if (m.type === "answer" && myRole === "host" && m.oid === oid && pc) {
        await pc.setRemoteDescription(m.sdp);
        await flushIce();
        return;
      }
      if (m.type === "ice" && m.oid === oid && pc) {
        if (pc.remoteDescription) await pc.addIceCandidate(m.candidate).catch(() => {});
        else pendingIce.push(m.candidate);
      }
    };

    const poll = async () => {
      if (busy) return;
      busy = true;
      try {
        const { msgs } = await signal("poll", { room, clientId, role: myRole });
        for (const m of msgs) {
          try {
            await handle(m);
          } catch (e) {
            console.warn("signaling:", e);
          }
        }
      } catch (e) {
        if (e.status === 403 && !dead) {
          dead = true;
          setStatus("error");
          setError("Sesi room kedaluwarsa. Muat ulang halaman lalu masuk lagi.");
        }
      } finally {
        busy = false;
      }
    };

    const loop = async () => {
      if (dead) return;
      await poll();
      // cepat saat mencari pasangan, pelan saat sudah tersambung (hemat kuota)
      if (!dead) timer = setTimeout(loop, connected ? 3000 : 1000);
    };

    (async () => {
      try {
        setStatus("starting");
        setError("");
        const s = await getMedia();
        if (dead) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        setLocalStream(s);
        const j = await signal("join", { room, clientId });
        if (dead) return;
        myRole = j.role;
        setRole(j.role);
        setStatus("waiting");
        await send({ type: "hello" });
        loop();
      } catch (e) {
        if (!dead) {
          setError(friendly(e));
          setStatus("error");
        }
      }
    })();

    return () => {
      dead = true;
      clearTimeout(timer);
      if (pc) {
        pc.onconnectionstatechange = null;
        pc.close();
      }
      stream?.getTracks().forEach((t) => t.stop());
      channelRef.current = null;
    };
  }, [room, attempt]);

  const sendData = useCallback((obj) => {
    const ch = channelRef.current;
    if (ch?.readyState !== "open") return false;
    ch.send(JSON.stringify(obj));
    return true;
  }, []);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  const leave = useCallback(async () => {
    if (!role) return;
    await signal("leave", { room, clientId: getClientId(), role }).catch(() => {});
  }, [room, role]);

  return { status, error, role, localStream, remoteStream, sendData, retry, leave };
}
