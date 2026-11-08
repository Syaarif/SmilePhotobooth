import { useState } from "react";

const ROOM_RE = /^[A-Za-z0-9_-]{6,64}$/;
const randomRoom = () => crypto.randomUUID().replace(/-/g, "").slice(0, 20);

export default function Home({ initial = "", onEnter }) {
  const [code, setCode] = useState(initial);
  const clean = code.trim().replace(/\s+/g, "-");
  const valid = ROOM_RE.test(clean);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6">
      <h1 className="text-4xl font-bold text-blue-900">Smile Photobooth</h1>
      <p className="text-blue-900/80">
        Foto bareng dari dua tempat berbeda. Buat kode room, kirim ke pasanganmu, lalu masuk berdua.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onEnter(clean);
        }}
        className="space-y-3"
      >
        <label htmlFor="room" className="block text-sm font-medium text-blue-900">
          Kode room
        </label>
        <input
          id="room"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
          className="w-full rounded-xl border border-blue-300 bg-white px-4 py-3 text-blue-950 focus-visible:outline-2 focus-visible:outline-blue-700"
        />
        <p className="text-sm text-blue-900/70">
          6 sampai 64 karakter: huruf, angka, - atau _. Pakai kode panjang dan acak supaya tidak ada
          orang lain yang bisa masuk.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={!valid}
            className="rounded-full bg-blue-700 px-6 py-2.5 font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:opacity-50"
          >
            Masuk room
          </button>
          <button
            type="button"
            onClick={() => setCode(randomRoom())}
            className="rounded-full border border-blue-300 px-5 py-2.5 font-medium text-blue-900 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            Buat kode acak
          </button>
        </div>
      </form>
    </main>
  );
}
