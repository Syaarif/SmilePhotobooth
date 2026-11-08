// Ambil satu frame dari <video>, dipotong ke rasio 4:3 (960x720).
export function grabFrame(video, mirror) {
  const w = 960
  const h = 720
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  const vw = video.videoWidth
  const vh = video.videoHeight
  let sw = vw
  let sh = vh
  if (vw / vh > w / h) sw = vh * (w / h)
  else sh = vw / (w / h)
  if (mirror) {
    ctx.translate(w, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(video, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, w, h)
  return c.toDataURL('image/jpeg', 0.92)
}
