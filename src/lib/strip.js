const CELL = 480;
const GAP = 16;
const PAD = 32;
const FOOT = 96;

// Ambil frame video, crop persegi dari tengah (sama dengan tampilan preview)
export function grabSquare(video, size = CELL) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const w = video?.videoWidth;
  const h = video?.videoHeight;
  if (!w || !h) {
    ctx.fillStyle = "#1e3a8a";
    ctx.fillRect(0, 0, size, size);
    return c;
  }
  const s = Math.min(w, h);
  ctx.drawImage(video, (w - s) / 2, (h - s) / 2, s, s, 0, 0, size, size);
  return c;
}

// Susun photostrip: host selalu di kiri, guest di kanan (sama di kedua sisi)
export function buildStrip(shots, role) {
  const n = shots.length;
  const W = PAD * 2 + CELL * 2 + GAP;
  const yEnd = PAD + CELL * n + GAP * (n - 1);
  const H = yEnd + PAD + FOOT;

  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#1d4ed8";
  ctx.fillRect(0, 0, W, H);

  shots.forEach((s, i) => {
    const y = PAD + i * (CELL + GAP);
    const [left, right] = role === "guest" ? [s.remote, s.local] : [s.local, s.remote];
    ctx.drawImage(left, PAD, y);
    ctx.drawImage(right, PAD + CELL + GAP, y);
  });

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "700 40px system-ui, sans-serif";
  ctx.fillText("Smile Photobooth", W / 2, yEnd + PAD + 36);
  ctx.font = "400 24px system-ui, sans-serif";
  const date = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  ctx.fillText(date, W / 2, yEnd + PAD + 76);

  return c.toDataURL("image/png");
}
