import { Link } from 'react-router-dom'

// Urutan ini nyata (alur aplikasi), jadi penomoran memang bermakna.
const steps = ['Foto beberapa kali', 'Pilih bentuk strip', 'Edit dan beri caption', 'Unduh sebagai PNG']

function Face() {
  return (
    <svg viewBox="0 0 40 30" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="14" cy="11" r="1.2" />
      <circle cx="26" cy="11" r="1.2" />
      <path d="M11 18q9 8 18 0" />
    </svg>
  )
}

// Satu-satunya momen beranimasi di halaman ini: strip keluar dari slot bilik.
function Booth() {
  return (
    <div className="mx-auto w-full max-w-xs" aria-hidden="true">
      <div className="rounded-t-[2.5rem] border-2 border-deep bg-ink px-7 pb-6 pt-7">
        <div className="mx-auto size-3 rounded-full bg-lamp" />
        <div className="mt-7 h-3 rounded-full bg-black/60" />
      </div>
      <div className="mx-auto -mt-3 w-36 overflow-hidden pb-2">
        <div className="strip-out flex flex-col gap-2 bg-sunprint p-2 text-ink">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="aspect-[4/3] bg-sky p-2">
              <Face />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <main className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-16 pt-6 lg:grid-cols-[1.2fr_0.8fr] lg:pt-12">
      <section>
        <h1 className="placard text-[clamp(4rem,13vw,9rem)] text-sunprint">Smile</h1>
        <p className="mt-6 max-w-md text-xl leading-snug">
          Bilik foto yang jalan di browser. Fotomu diproses di perangkatmu dan tidak diunggah ke mana pun.
        </p>
        <Link to="/camera" className="btn-go mt-9">
          Masuk bilik
        </Link>
        <ol className="mt-16 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
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
  )
}
