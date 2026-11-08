import { useState } from "react";

const ROOM_RE = /^[A-Za-z0-9_-]{6,64}$/;
const randomRoom = () => crypto.randomUUID().replace(/-/g, "").slice(0, 20);

// Urutan ini nyata (alur pemakaian), jadi penomoran bermakna.
const steps = ["Buat kode", "Kirim link ajakan", "Masuk berdua", "Foto 3 kali"];

function Face() {
  return (
    <svg viewBox="0 0 40 30" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="14" cy="11" r="1.2" />
      <circle cx="26" cy="11" r="1.2" />
      <path d="M11 18q9 8 18 0" />
    </svg>
  );
}

// Bilik dengan dua jendela, dan strip dua kolom yang keluar dari slot.
function Booth() {
  return (
    <div className="mx-auto w-full max-w-xs" aria-hidden="true">
      <div className="rounded-t-[2.5rem] border-2 border-deep bg-ink px-6 pb-5 pt-6">
        <div className="mx-auto size-3 rounded-full bg-lamp" />
        <div className="mt-5 grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="aspect-square border-2 border-deep p-3 text-sky">
              <Face />
            </div>
          ))}
        </div>
        <div className="mt-5 h-3 rounded-full bg-black/60" />
      </div>
      <div className="mx-auto -mt-3 w-40 overflow-hidden pb-2">
        <div className="strip-out grid grid-cols-2 gap-2 bg-sunprint p-2 text-ink">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="aspect-square bg-sky p-1.5">
              <Face />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home({ initial = "", onEnter }) {
  const [code, setCode] = useState(initial);
  const clean = code.trim().replace(/\s+/g, "-");
  const valid = ROOM_RE.test(clean);

  return (
    <main className="mx-auto grid min-h-dvh max-w-6xl items-center gap-12 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr]">
      <section>
        <h1 className="placard text-[clamp(4rem,14vw,9rem)] text-sunprint">Smile</h1>
        <p className="mt-6 max-w-md text-xl leading-snug">
          Foto bareng dari dua tempat berbeda. Buat kode room, kirim ke pasanganmu, lalu masuk berdua.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) onEnter(clean);
          }}
          className="panel mt-8 max-w-md"
        >
          <label htmlFor="room" className="mb-2 block text-sm font-bold text-sky">
            Kode room
          </label>
          <input
            id="room"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            className="w-full bg-sunprint px-4 py-3 text-lg font-semibold text-ink"
          />
          <p className="mt-2 text-sm text-sky">
            6 sampai 64 karakter: huruf, angka, - atau _. Pakai kode panjang dan acak supaya tidak ada
            orang lain yang bisa masuk.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="submit" disabled={!valid} className="btn-go">
              Masuk room
            </button>
            <button type="button" onClick={() => setCode(randomRoom())} className="btn-quiet">
              Buat kode acak
            </button>
          </div>
        </form>

        <ol className="mt-12 grid max-w-xl grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s} className="border-t-2 border-sky pt-3">
              <span className="placard text-3xl">{i + 1}</span>
              <p className="mt-2 text-sm">{s}</p>
            </li>
          ))}
        </ol>
      </section>
      <Booth />
    </main>
  );
}
