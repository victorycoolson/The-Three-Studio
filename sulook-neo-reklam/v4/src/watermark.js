// "SULOOK NEO" filigranı — sitenin sequence-renderer.js algoritmasının birebir uyarlaması:
// Lemon Milk Bold, -π/7 eğik satırlar, her satır kendi hızı ve yönüyle yatay kayar.
// Ürün, sitenin kare bazlı oklüzyon poligonları (veya şeffaf karenin kendisi) ile oyulur.
export function watermarkRowMotion(row, now, span) {
  const noise = n => { const v = Math.sin((n + 37) * 127.1) * 43758.5453; return v - Math.floor(v); };
  const speed = 20 + noise(row * 2) * 36, direction = noise(row * 2 + 1) < .5 ? -1 : 1;
  return { speed, direction, offset: ((now * .001 * speed * direction) % span + span) % span };
}

export function createWatermark(canvas) {
  const W = canvas.width, H = canvas.height, ctx = canvas.getContext('2d');
  const glyph = document.createElement('canvas'), g = glyph.getContext('2d');
  let tile = null;
  function glyphTile() {
    if (tile) return tile;
    const size = Math.max(110, Math.min(280, W * .17)), font = `700 ${size}px "Lemon Milk"`;
    g.font = font; g.textBaseline = 'middle';
    const m = g.measureText('SULOOK NEO'), ink = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    const pitch = ink + (size * 1.38 - ink) / 4, span = m.width + size * .48;
    glyph.width = Math.ceil(span); glyph.height = Math.ceil(size * 2);
    g.setTransform(1, 0, 0, 1, 0, 0); g.font = font; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('SULOOK NEO', 0, size);
    return tile = { size, pitch, span: glyph.width, height: glyph.height, pattern: ctx.createPattern(glyph, 'repeat-x') };
  }
  // mask(ctx): ürün bölgesini 'destination-out' ile oyacak çizim
  function draw(now, opacity, mask) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, W, H);
    canvas.style.opacity = String(opacity);
    if (opacity <= 0) return;
    const { size, pitch, span, height, pattern } = glyphTile();
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-Math.PI / 7);
    const c = Math.cos(Math.PI / 7), s = Math.sin(Math.PI / 7), extent = (W * c + H * s) / 2 + span, rows = Math.ceil(((W * s + H * c) / 2 + size) / pitch);
    ctx.fillStyle = pattern;
    for (let row = -rows; row <= rows; row++) {
      const { offset } = watermarkRowMotion(row, now, span), x = -offset + (row % 2) * span * .35, y = row * pitch - size;
      ctx.save(); ctx.translate(x, y); ctx.fillRect(-extent - x, 0, extent * 2, height); ctx.restore();
    }
    ctx.restore();
    if (mask) { ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = '#000'; mask(ctx); ctx.globalCompositeOperation = 'source-over'; }
  }
  return { draw };
}
