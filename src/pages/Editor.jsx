import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import PhotoStrip from '../components/PhotoStrip'
import { useSession } from '../hooks/useSession'
import { FILTERS, FRAME_COLORS, LAYOUTS, renderStrip } from '../utils/imageExport'

function Group({ title, children }) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-bold text-sky">{title}</h2>
      {children}
    </div>
  )
}

function Choice({ items, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(([id, label]) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          aria-pressed={value === id}
          className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold ${value === id ? 'border-lamp bg-lamp text-ink' : 'border-sky/60 hover:bg-deep'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default function Editor() {
  const nav = useNavigate()
  const { photos, setFinal } = useSession()
  const [o, setO] = useState({ layout: 'strip', frameId: 'sunprint', filter: 'none', brightness: 100, contrast: 100, caption: '', showDate: true })
  const [saving, setSaving] = useState(false)

  if (!photos.length) return <Navigate to="/camera" replace />

  const set = (k) => (v) => setO((p) => ({ ...p, [k]: v }))
  const frame = FRAME_COLORS.find((f) => f.id === o.frameId)
  const opts = { photos, layout: o.layout, frame, filter: o.filter, brightness: o.brightness, contrast: o.contrast, caption: o.caption, showDate: o.showDate }

  async function finish() {
    setSaving(true)
    const c = await renderStrip({ ...opts, scale: 2 })
    setFinal(c.toDataURL('image/png'))
    nav('/result')
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-6 pb-16 pt-4 lg:grid-cols-[1fr_22rem]">
      <section className="panel flex justify-center">
        <PhotoStrip {...opts} className="max-h-[75dvh] w-auto max-w-full self-start" />
      </section>

      <aside className="panel flex flex-col gap-6">
        <Group title="Bentuk">
          <Choice items={Object.entries(LAYOUTS).map(([id, l]) => [id, l.label])} value={o.layout} onChange={set('layout')} />
        </Group>

        <Group title="Warna bingkai">
          <div className="flex gap-3">
            {FRAME_COLORS.map((f) => (
              <button
                key={f.id}
                aria-label={f.name}
                aria-pressed={o.frameId === f.id}
                onClick={() => set('frameId')(f.id)}
                style={{ background: f.bg }}
                className={`size-9 rounded-full border-2 ${o.frameId === f.id ? 'ring-4 ring-lamp ring-offset-2 ring-offset-ink' : 'border-sky/60'}`}
              />
            ))}
          </div>
        </Group>

        <Group title="Filter">
          <Choice items={Object.entries(FILTERS).map(([id, f]) => [id, f.label])} value={o.filter} onChange={set('filter')} />
        </Group>

        <Group title="Cahaya">
          <label className="block text-sm">Kecerahan
            <input type="range" min="70" max="130" value={o.brightness} onChange={(e) => set('brightness')(+e.target.value)} className="w-full accent-lamp" />
          </label>
          <label className="mt-2 block text-sm">Kontras
            <input type="range" min="70" max="130" value={o.contrast} onChange={(e) => set('contrast')(+e.target.value)} className="w-full accent-lamp" />
          </label>
        </Group>

        <Group title="Caption">
          <input
            aria-label="Caption"
            maxLength={28}
            value={o.caption}
            onChange={(e) => set('caption')(e.target.value)}
            placeholder="Tulis caption"
            className="w-full border-2 border-sky/60 bg-ink px-3 py-2 font-hand text-xl placeholder:text-sky"
          />
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={o.showDate} onChange={(e) => set('showDate')(e.target.checked)} className="size-4 accent-lamp" />
            Tampilkan tanggal
          </label>
        </Group>

        <div className="mt-auto flex flex-col gap-3">
          <button className="btn-go" disabled={saving} onClick={finish}>{saving ? 'Memproses…' : 'Selesai'}</button>
          <button className="btn-quiet" onClick={() => nav('/camera')}>Kembali ke kamera</button>
        </div>
      </aside>
    </main>
  )
}
