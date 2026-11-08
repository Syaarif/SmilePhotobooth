import { useEffect, useState } from 'react'
import { renderStrip } from '../utils/imageExport'

// Pratinjau strip: dirender lewat canvas yang sama dengan hasil unduhan.
export default function PhotoStrip({ photos, layout, frame, filter, brightness, contrast, caption, showDate, className = '' }) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    let live = true
    renderStrip({ photos, layout, frame, filter, brightness, contrast, caption, showDate }).then((c) => {
      if (live) setUrl(c.toDataURL('image/jpeg', 0.85))
    })
    return () => {
      live = false
    }
  }, [photos, layout, frame, filter, brightness, contrast, caption, showDate])

  return url ? <img src={url} alt="Pratinjau photostrip" className={className} /> : null
}
