export const FRAME_COLORS = [
  { id: 'sunprint', name: 'Sunprint', bg: '#dce8fa', fg: '#0a1f4d' },
  { id: 'flash', name: 'Flash', bg: '#ffffff', fg: '#0a1f4d' },
  { id: 'cyano', name: 'Cyano', bg: '#1e4fd6', fg: '#ffffff' },
  { id: 'ink', name: 'Ink', bg: '#0a1f4d', fg: '#dce8fa' },
  { id: 'lamp', name: 'Lamp', bg: '#ffc83d', fg: '#0a1f4d' },
]

export const LAYOUTS = {
  strip: { label: 'Strip', cols: 1 },
  grid: { label: 'Kolase', cols: 2 },
}

export const FILTERS = {
  none: { label: 'Asli', css: '' },
  cyanotype: { label: 'Cyanotype', css: 'grayscale(1) sepia(1) hue-rotate(180deg) saturate(2.5)' },
  vintage: { label: 'Vintage', css: 'sepia(0.55) contrast(1.1) saturate(0.9)' },
  mono: { label: 'Hitam putih', css: 'grayscale(1) contrast(1.1)' },
  warm: { label: 'Hangat', css: 'sepia(0.25) saturate(1.3) hue-rotate(-10deg)' },
}

const loadImg = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

// Menggabungkan foto + frame + caption menjadi satu canvas.
// Dipakai untuk pratinjau (scale 1) dan ekspor (scale 2), jadi hasilnya identik.
export async function renderStrip({
  photos,
  layout = 'strip',
  frame = FRAME_COLORS[0],
  filter = 'none',
  brightness = 100,
  contrast = 100,
  caption = '',
  showDate = true,
  scale = 1,
}) {
  await document.fonts.load('700 40px Gaegu')
  await document.fonts.load('600 24px Archivo')
  const imgs = await Promise.all(photos.map(loadImg))

  const s = scale
  const cols = LAYOUTS[layout].cols
  const rows = Math.ceil(imgs.length / cols)
  const pw = 480 * s
  const ph = 360 * s
  const gap = 24 * s
  const pad = 36 * s
  const textH = ((caption ? 64 : 0) + (showDate ? 42 : 0)) * s
  const gridH = rows * ph + (rows - 1) * gap

  const c = document.createElement('canvas')
  c.width = pad * 2 + cols * pw + (cols - 1) * gap
  c.height = pad * 2 + gridH + textH
  const ctx = c.getContext('2d')
  ctx.fillStyle = frame.bg
  ctx.fillRect(0, 0, c.width, c.height)

  const css = [FILTERS[filter].css, `brightness(${brightness}%)`, `contrast(${contrast}%)`].filter(Boolean).join(' ')
  imgs.forEach((img, i) => {
    const x = pad + (i % cols) * (pw + gap)
    const y = pad + Math.floor(i / cols) * (ph + gap)
    ctx.filter = css
    ctx.drawImage(img, x, y, pw, ph)
    ctx.filter = 'none'
  })

  ctx.fillStyle = frame.fg
  ctx.textAlign = 'center'
  const baseY = pad + gridH
  if (caption) {
    ctx.font = `700 ${46 * s}px Gaegu, cursive`
    ctx.fillText(caption, c.width / 2, baseY + 58 * s)
  }
  if (showDate) {
    ctx.font = `600 ${22 * s}px Archivo, sans-serif`
    const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    ctx.fillText(date, c.width / 2, baseY + (caption ? 98 : 44) * s)
  }
  return c
}
