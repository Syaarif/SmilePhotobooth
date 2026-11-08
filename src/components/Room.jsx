import { useEffect, useRef, useState } from "react";
import usePeer from "../hooks/usePeer";
import { buildStrip, grabSquare } from "../lib/strip";

const SHOTS = 3; // jumlah foto per strip
const COUNT = 3; // hitung mundur (detik)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

// Satu jendela bilik: kotak persegi bergaris, label di bawahnya.
function Window({ label, children }) {
  return (
    <figure className="m-0">
      <div className="relative aspect-square overflow-hidden border-2 border-deep bg-ink">
        {children}
      </div>
      <figcaption className="mt-2 text-sm font-bold">{label}</figcaption>
    </figure>
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

  const isError = status === "error";

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-5 px-4 pb-8 pt-4 sm:px-6">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="placard mr-auto flex items-center gap-2 text-3xl text-sunprint">
          <span
            aria-hidden="true"
            className={`size-3 rounded-full ${status === "connected" ? "bg-lamp" : "bg-ink"}`}
          />
          Smile
        </h1>
        <button onClick={copyLink} className="btn-quiet !min-h-10 !px-4 text-sm">
          {copied ? "Link tersalin" : "Salin link ajakan"}
        </button>
        <button onClick={leaveRoom} className="btn-quiet !min-h-10 !px-4 text-sm">
          Keluar
        </button>
      </header>

      {/* Kemajuan sesi: tiga bingkai strip, bingkai aktif berwarna lampu. */}
      <div className="flex items-center gap-3">
        <ol aria-hidden="true" className="flex gap-1.5">
          {Array.from({ length: SHOTS }, (_, i) => {
            const n = i + 1;
            const cls =
              shot === n
                ? "bg-lamp border-lamp"
                : shot > n
                ? "bg-sunprint border-sunprint"
                : "border-sky";
            return <li key={n} className={`h-5 w-7 border-2 ${cls}`} />;
          })}
        </ol>
        <p className="text-sm font-semibold">
          {shot > 0 ? `Foto ${shot} dari ${SHOTS}` : `${SHOTS} foto per strip`}
        </p>
      </div>

      <div className="relative">
        <div className="grid grid-cols-2 gap-3">
          <Window label="Kamu">
            <Video stream={localStream} muted videoRef={localEl} />
          </Window>
          <Window label="Pasangan">
            <Video stream={remoteStream} videoRef={remoteEl} />
            {!remoteStream && (
              <p className="absolute inset-0 grid place-items-center bg-ink p-4 text-center text-sm text-sky">
                Belum ada pasangan
              </p>
            )}
          </Window>
        </div>

        {count !== null && (
          <p
            aria-live="assertive"
            className="placard pointer-events-none absolute inset-x-0 top-0 grid aspect-[2/1] place-items-center bg-ink/40 text-[min(36vw,11rem)] text-lamp"
          >
            {count}
          </p>
        )}
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 aspect-[2/1] bg-white transition-opacity duration-150 ${
            flash ? "opacity-90" : "opacity-0"
          }`}
        />
      </div>

      {isError ? (
        <div role="status" className="bg-sunprint p-4 font-semibold text-ink">
          {messages.error}
        </div>
      ) : (
        <p role="status" className="font-semibold">
          {messages[status]}
        </p>
      )}

      <div className="flex">
        {isError ? (
          <button onClick={retry} className="btn-go w-full sm:w-auto">
            Coba lagi
          </button>
        ) : (
          <button
            onClick={start}
            disabled={status !== "connected" || shot > 0}
            className="btn-go w-full sm:w-auto"
          >
            {shot > 0 ? "Sedang memotret…" : "Mulai foto"}
          </button>
        )}
      </div>
      <p className="text-sm">
        Pakai headset supaya suara tidak bergema. Setiap foto diambil setelah hitung mundur {COUNT} detik.
      </p>

      {strip && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Hasil photostrip"
          className="fixed inset-0 z-10 flex flex-col items-center justify-center gap-5 overflow-y-auto bg-ink/95 p-4"
        >
          <div className="overflow-hidden pb-2">
            <img src={strip} alt="Hasil photostrip" className="strip-out max-h-[70dvh] w-auto" />
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={strip} download="smile-photobooth.png" className="btn-go">
              Unduh PNG
            </a>
            <button onClick={() => setStrip(null)} className="btn-quiet">
              Foto lagi
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
