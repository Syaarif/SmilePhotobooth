import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useCamera from '../hooks/useCamera'
import { useSession } from '../hooks/useSession'
import { grabFrame } from '../utils/camera'

const COUNTS = [2, 3, 4, 6]
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export default function Camera() {
  const nav = useNavigate()
  const { count, setCount, photos, setPhotos } = useSession()
  const { videoRef, devices, deviceId, mirror, status, start } = useCamera()
  const [tick, setTick] = useState(0)
  const [flash, setFlash] = useState(false)
  const [busy, setBusy] = useState(false)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    start()
    return () => {
      alive.current = false
    }
  }, [start])

  // Hitung mundur 3 detik, lalu ambil satu frame.
  async function snap() {
    for (let n = 3; n > 0; n--) {
      setTick(n)
      await wait(1000)
      if (!alive.current) return null
    }
    setTick(0)
    const url = grabFrame(videoRef.current, mirror)
    setFlash(true)
    setTimeout(() => setFlash(false), 180)
    return url
  }

  async function runSession() {
    setBusy(true)
    setPhotos([])
    const got = []
    for (let i = 0; i < count; i++) {
      const url = await snap()
      if (!url) break
      got.push(url)
      setPhotos([...got])
      await wait(600)
    }
    setBusy(false)
  }

  async function retake(i) {
    if (busy) return
    setBusy(true)
    const url = await snap()
    if (url) setPhotos((p) => p.map((x, j) => (j === i ? url : x)))
    setBusy(false)
  }

  const done = photos.length === count && !busy

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-6 pb-16 pt-4 lg:grid-cols-[1fr_20rem]">
      <section>
        <div className="relative aspect-[4/3] overflow-hidden border-2 border-deep bg-ink">
          <video ref={videoRef} autoPlay muted playsInline className={`h-full w-full object-cover ${mirror ? '-scale-x-100' : ''}`} />
          {status !== 'ready' && (
            <div className="absolute inset-0 grid place-items-center p-8 text-center">
              {status === 'loading' && <p>Menyalakan kamera…</p>}
              {status === 'denied' && (
                <div>
                  <p className="mb-4">Izin kamera ditolak. Klik ikon gembok di address bar, izinkan kamera, lalu coba lagi.</p>
                  <button className="btn-go" onClick={() => start()}>Coba lagi</button>
                </div>
              )}
              {status === 'error' && (
                <div>
                  <p className="mb-4">Kamera tidak ditemukan atau sedang dipakai aplikasi lain.</p>
                  <button className="btn-go" onClick={() => start()}>Coba lagi</button>
                </div>
              )}
            </div>
          )}
          {tick > 0 && (
            <div className="placard absolute inset-0 grid place-items-center text-[min(40vw,16rem)] text-lamp" aria-live="assertive">
              {tick}
            </div>
          )}
          <div className={`pointer-events-none absolute inset-0 bg-white transition-opacity duration-150 ${flash ? 'opacity-100' : 'opacity-0'}`} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-4">
          <div role="group" aria-label="Jumlah foto" className="flex items-center gap-2">
            <span className="mr-1 text-sm">Jumlah foto</span>
            {COUNTS.map((n) => (
              <button
                key={n}
                disabled={busy}
                aria-pressed={count === n}
                onClick={() => {
                  setCount(n)
                  setPhotos([])
                }}
                className={`size-11 rounded-full border-2 font-bold ${count === n ? 'border-lamp bg-lamp text-ink' : 'border-sky/60 hover:bg-deep'}`}
              >
                {n}
              </button>
            ))}
          </div>
          {devices.length > 1 && (
            <select
              aria-label="Pilih kamera"
              value={deviceId}
              onChange={(e) => start(e.target.value)}
              className="rounded-full border-2 border-sky/60 bg-ink px-4 py-2 text-sm"
            >
              {devices.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || `Kamera ${i + 1}`}</option>
              ))}
            </select>
          )}
          <div className="ml-auto flex gap-3">
            {done ? (
              <>
                <button className="btn-quiet" onClick={runSession}>Ulangi sesi</button>
                <button className="btn-go" onClick={() => nav('/editor')}>Lanjut ke editor</button>
              </>
            ) : (
              <button className="btn-go" disabled={status !== 'ready' || busy} onClick={runSession}>
                {busy ? 'Sedang memotret…' : 'Mulai sesi'}
              </button>
            )}
          </div>
        </div>
      </section>

      <aside aria-label="Strip foto">
        <div className={`grid gap-2 bg-sunprint p-3 text-ink ${count > 4 ? 'grid-cols-2' : ''}`}>
          {Array.from({ length: count }, (_, i) =>
            photos[i] ? (
              <button key={i} onClick={() => retake(i)} disabled={busy} aria-label={`Foto ${i + 1}, klik untuk foto ulang`} className="group relative block aspect-[4/3] overflow-hidden">
                <img src={photos[i]} alt="" className="h-full w-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-1 text-xs font-semibold text-sunprint opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">Foto ulang</span>
              </button>
            ) : (
              <div key={i} className="grid aspect-[4/3] place-items-center border-2 border-dashed border-sky text-sm font-semibold">Bingkai {i + 1}</div>
            ),
          )}
        </div>
        {photos.length > 0 && <p className="mt-3 text-sm">Klik sebuah foto untuk mengulangnya.</p>}
      </aside>
    </main>
  )
}
