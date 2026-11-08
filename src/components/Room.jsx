import { useEffect, useRef, useState } from "react";
import usePeer from "../hooks/usePeer";
import { buildStrip, grabSquare } from "../lib/strip";

const SHOTS = 3; // jumlah foto per strip
const COUNT = 3; // hitung mundur (detik)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const btn =
  "rounded-full bg-blue-700 px-6 py-2.5 font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:opacity-50";
const ghost =
  "rounded-full border border-blue-300 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700";

function Video({ stream, muted, videoRef }) {
  useEffect(() => {
    const v = videoRef.current;
    if (v) v.srcObject = stream ?? null;
  }, [stream, videoRef]);
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className="h-full w-full object-cover"
    />
  );
}

function Cell({ label, children }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-2xl bg-blue-950">
      {children}
      <span className="absolute bottom-2 left-2 rounded-full bg-blue-950/70 px-3 py-1 text-sm text-white">
        {label}
      </span>
    </div>
  );
}

export default function Room({ room, onLeave }) {
  const localEl = useRef(null);
  const remoteEl = useRef(null);
  const running = useRef(false);
  const roleRef = useRef(null);
  const [count, setCount] = useState(null);
  const [shot, setShot] = useState(0);
  const [flash, setFlash] = useState(false);
  const [strip, setStrip] = useState(null);
  const [copied, setCopied] = useState(false);

  const { status, error, role, localStream, remoteStream, sendData, retry, leave } = usePeer(
    room,
    (m) => {
      if (m.type === "start") runSession();
    }
  );

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  async function runSession() {
    if (running.current) return;
    running.current = true;
    setStrip(null);
    const taken = [];
    try {
      for (let i = 1; i <= SHOTS; i++) {
        setShot(i);
        for (let c = COUNT; c >= 1; c--) {
          setCount(c);
          await sleep(1000);
        }
        setCount(null);
        taken.push({ local: grabSquare(localEl.current), remote: grabSquare(remoteEl.current) });
        setFlash(true);
        await sleep(180);
        setFlash(false);
        await sleep(700);
      }
      setStrip(buildStrip(taken, roleRef.current));
    } finally {
      setShot(0);
      setCount(null);
      running.current = false;
    }
  }

  const start = () => {
    if (sendData({ type: "start" })) runSession();
  };

  const copyLink = async () => {
    const link = `${window.location.origin}${window.location.pathname}#${room}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Salin link ini:", link);
    }
  };

  const leaveRoom = async () => {
    await leave();
    onLeave();
  };

  const messages = {
    starting: "Membuka kamera…",
    waiting: "Menunggu pasanganmu masuk. Kirim link ajakan ke dia.",
    connecting: "Menyambungkan ke pasanganmu…",
    connected: "Terhubung. Siap foto.",
    error,
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-xl font-bold text-blue-900">Smile Photobooth</h1>
        <button onClick={copyLink} className={ghost}>
          {copied ? "Link tersalin" : "Salin link ajakan"}
        </button>
        <button onClick={leaveRoom} className={ghost}>
          Keluar
        </button>
      </header>

      <div className="relative grid grid-cols-2 gap-3">
        <Cell label="Kamu">
          <Video stream={localStream} muted videoRef={localEl} />
        </Cell>
        <Cell label="Pasangan">
          <Video stream={remoteStream} videoRef={remoteEl} />
          {!remoteStream && (
            <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-blue-100">
              Belum ada pasangan
            </p>
          )}
        </Cell>

        {shot > 0 && (
          <p className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-blue-950/70 px-4 py-1 text-sm text-white">
            Foto {shot} dari {SHOTS}
          </p>
        )}
        {count !== null && (
          <p
            aria-live="assertive"
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-9xl font-bold text-white drop-shadow-lg"
          >
            {count}
          </p>
        )}
        <div
          className={`pointer-events-none absolute inset-0 rounded-2xl bg-white transition-opacity duration-150 ${
            flash ? "opacity-90" : "opacity-0"
          }`}
        />
      </div>

      <p role="status" className={status === "error" ? "text-red-700" : "text-blue-900"}>
        {messages[status]}
      </p>

      <div className="flex flex-wrap gap-3">
        {status === "error" ? (
          <button onClick={retry} className={btn}>
            Coba lagi
          </button>
        ) : (
          <button onClick={start} disabled={status !== "connected" || shot > 0} className={btn}>
            Mulai foto
          </button>
        )}
      </div>
      <p className="text-sm text-blue-900/70">
        Pakai headset supaya suara tidak bergema. Foto diambil {SHOTS} kali, masing-masing setelah
        hitung mundur {COUNT} detik.
      </p>

      {strip && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Hasil photostrip"
          className="fixed inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-blue-950/85 p-4"
        >
          <img src={strip} alt="Hasil photostrip" className="max-h-[75vh] rounded-lg" />
          <div className="flex gap-3">
            <a href={strip} download="smile-photobooth.png" className={btn}>
              Unduh PNG
            </a>
            <button onClick={() => setStrip(null)} className={ghost + " bg-white"}>
              Foto lagi
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
