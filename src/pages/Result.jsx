import { Link, Navigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'

export default function Result() {
  const { final, setPhotos, setFinal } = useSession()
  if (!final) return <Navigate to="/camera" replace />

  const name = `smile-${new Date().toISOString().slice(0, 10)}.png`
  const canShare = typeof navigator.canShare === 'function'

  async function share() {
    const blob = await (await fetch(final)).blob()
    const file = new File([blob], name, { type: 'image/png' })
    if (navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: 'Smile Photobooth' }).catch(() => {})
  }

  function again() {
    setPhotos([])
    setFinal(null)
  }

  return (
    <main className="mx-auto grid max-w-5xl items-center gap-12 px-6 pb-16 pt-4 md:grid-cols-2">
      <div className="mx-auto w-full max-w-xs overflow-hidden pb-2">
        <img src={final} alt="Photostrip hasilmu" className="strip-out w-full" />
      </div>
      <section>
        <h1 className="placard text-5xl text-sunprint md:text-6xl">Strip jadi.</h1>
        <p className="mt-4 max-w-sm text-lg">Unduh sebelum menutup halaman ini. Hasilnya belum disimpan di server.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={final} download={name} className="btn-go">Unduh PNG</a>
          {canShare && <button className="btn-quiet" onClick={share}>Bagikan</button>}
          <Link to="/camera" onClick={again} className="btn-quiet">Foto lagi</Link>
        </div>
      </section>
    </main>
  )
}
