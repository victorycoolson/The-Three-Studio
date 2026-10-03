// Sokak sahnesi: sitenin (neo-street) sprite atlası, ödeme kolları ve çizim
// rutinleri kullanılarak deterministik, sıkıştırılmış bir müşteri koreografisi.
import { HEIGHT, PORT, WAIT, SLOTS, SERVICE_GROUND, WALK_OUT, WALK_IN, createCast, chamberGrip, routes } from './site-stop-motion.js';

const load = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(src)); i.src = src; });
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const mix = (a, b, k) => a + (b - a) * k;
const smooth = k => { k = clamp(k); return k * k * (3 - 2 * k); };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// Ödeme sırasında kart okuyucu (dünya koordinatı) ve ürün yerleşimi (site: performance-v111.css)
export const READER = [662, 548];
const PRODUCT = { x: 517.275, y: 365.75, w: 191.58333, h: 310.8875 };

// Zaman çizelgesi (sahne başına göre saniye)
export const PAY_A = 0.40, PAY_B = 2.80;
export const TX = { A: { amount: 60, count: 10, coin: 6, litres: 19 }, B: { amount: 20, count: 4, coin: 5, litres: 5 } };
export const COIN_FLIGHT = 0.8, COIN_STAGGER = 0.06;

function pathAt(points, q) {
  const L = points.slice(1).map((p, i) => dist(points[i], p)), total = L.reduce((a, b) => a + b, 0);
  let rest = clamp(q) * total, i = 0;
  while (i < L.length - 1 && rest > L[i]) rest -= L[i++];
  const a = points[i], b = points[i + 1], u = rest / (L[i] || 1);
  return [mix(a[0], b[0], u), mix(a[1], b[1], u)];
}
function walk(points, u, u0, dur, cels, fps = 9) {
  const k = clamp((u - u0) / dur);
  // yumuşak kalkış/duruş, sabit hızlı orta bölüm
  const r = .18, p = k < r ? k * k / (2 * r) : k > 1 - r ? 1 - r - (1 - k) * (1 - k) / (2 * r) : k - r / 2;
  return { point: pathAt(points, p / (1 - r)), cel: cels[Math.floor(Math.max(0, u - u0) * fps) % cels.length] };
}
const step = (u, table) => { let v = table[0][1]; for (const [t, c] of table) if (u >= t) v = c; return v; };

export function choreography(u) {
  const people = [];
  const exits = routes.exit, entries = routes.entries;
  // A — erkek, 19 L damacana: kartla öder, kapak açılır, damacanasını alır, gider
  {
    const station = SERVICE_GROUND.jug;
    let cel, point = station, carrying = false, inside = false, opacity = 1;
    if (u < 1.32) {
      cel = step(u, [[0, 8], [0.16, 37], [PAY_A - .04, 20], [0.64, 37], [0.78, 8], [1.02, 9], [1.12, 10], [1.24, 9]]);
      inside = cel === 10;
      carrying = u >= 1.18;
    } else {
      const w = walk([station, ...exits], u, 1.32, 2.7, WALK_OUT);
      point = w.point; cel = w.cel; carrying = true; opacity = 1 - clamp((u - 3.6) / .4);
    }
    people.push({ type: 0, cel, point, carrying, inside, container: 'jug', opacity });
  }
  // B — kadın, 5 L şişe: sıradan ilerler, şişeyi yerleştirir, kapak kapanır, kartla öder
  {
    const station = SERVICE_GROUND.bottle;
    let cel, point, carrying = true, inside = false;
    if (u < 1.42) { point = WAIT; cel = (Math.floor(u / .5) % 2) ? 11 : 8; }
    else if (u < 2.02) { const w = walk([WAIT, station], u, 1.42, .6, WALK_IN, 11); point = w.point; cel = w.cel; }
    else {
      point = station;
      cel = step(u, [[2.02, 8], [2.1, 9], [2.18, 10], [2.32, 9], [2.4, 8], [2.62, 37], [PAY_B - .04, 20], [3.02, 37], [3.12, 8]]);
      inside = cel === 10;
      carrying = u < 2.26;
    }
    people.push({ type: 1, cel, point, carrying, inside, container: 'bottle', opacity: 1 });
  }
  // C — erkek, sırada bekler, bir adım ilerler
  {
    let point = SLOTS[1], cel = (Math.floor(u / .55 + 1) % 2) ? 11 : 8;
    if (u >= 1.6 && u < 2.3) { const w = walk([SLOTS[1], WAIT], u, 1.6, .7, WALK_IN, 11); point = w.point; cel = w.cel; }
    else if (u >= 2.3) { point = WAIT; cel = 8; }
    people.push({ type: 0, cel, point, carrying: true, inside: false, container: 'bottle', opacity: 1 });
  }
  // D — kadın, sağdan sıraya katılır
  if (u >= 1.9) {
    const w = walk([...entries[1], SLOTS[1]], u, 1.9, 1.5, WALK_IN, 10);
    const done = u >= 3.4;
    people.push({ type: 1, cel: done ? 8 : w.cel, point: done ? SLOTS[1] : w.point, carrying: true, inside: false, container: 'jug', opacity: clamp((u - 1.9) / .25) });
  }
  // makine: içeride hangi kap var, kapak (0 açık, 1 kapalı)
  let bottle = null, door = 0;
  if (u < 1.18) bottle = 'jug'; else if (u >= 2.26) bottle = 'bottle';
  if (u < .7) door = 1; else if (u < .98) door = 1 - smooth((u - .7) / .28); else if (u < 2.42) door = 0; else if (u < 2.62) door = smooth((u - 2.42) / .2); else door = 1;
  return { people, machine: { bottle, door } };
}

export async function createStreet() {
  const [atlas, props] = await Promise.all([fetch('assets/site/atlas.json').then(r => r.json()), fetch('assets/site/props.json').then(r => r.json())]);
  const files = { ext: 'street-extended.webp', shadow: 'street-shadow.webp', product: 'neo-product.webp', 'walk-man-v20': 'walk-man-v20.webp', 'walk-woman-v20': 'walk-woman-v20.webp', 'service-v21': 'service-v21.webp', 'payment-arms-v22': 'payment-arms-v22.webp', bottle: 'bottle.webp', jug: 'jug.webp', closed: 'neo-closed.webp' };
  const images = {};
  await Promise.all(Object.entries(files).map(async ([k, f]) => { images[k] = await load('assets/site/' + f); }));
  const cast = createCast(atlas, props);
  // sokak plakası: sitedeki gibi gölgeli plaka 785→941 arasında genişletilmiş plakaya erir
  const plate = document.createElement('canvas'); plate.width = 1672; plate.height = 941;
  { const c = plate.getContext('2d'); c.drawImage(images.shadow, 0, 0); c.globalCompositeOperation = 'destination-in'; const g = c.createLinearGradient(0, 0, 0, 941); g.addColorStop(0, '#000'); g.addColorStop(785 / 941, '#000'); g.addColorStop(840 / 941, 'rgba(0,0,0,.8)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 1672, 941); }

  let ctx;
  const outline = poly => { ctx.beginPath(); poly.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); };
  function paintBottle(point, name, inside = false) {
    const prop = props[name], { width, height } = prop, anchor = inside ? chamberGrip(name, props) : point;
    ctx.save(); if (inside) { outline(PORT); ctx.clip(); }
    const x = anchor[0] - prop.gripX * width, y = anchor[1] - prop.gripY * height;
    if (inside) { ctx.fillStyle = '#183d552e'; ctx.beginPath(); ctx.ellipse(x + width * .55, y + height, width * .38, 1.6, -.3, 0, Math.PI * 2); ctx.fill(); }
    ctx.drawImage(images[name], x, y, width, height); ctx.restore();
  }
  function paintMachine(m) {
    if (m.bottle) paintBottle(chamberGrip(m.bottle, props), m.bottle, true);
    if (m.door > 0) {
      const shift = (1 - m.door) * 80;
      ctx.save(); outline(PORT); ctx.clip(); outline(PORT.map(([x, y]) => [x, y - shift])); ctx.clip();
      ctx.drawImage(images.closed, 616.55, 519.0166666666667 - shift, 34.833333333333336, 76.63333333333334); ctx.restore();
    }
  }
  function decorate(p) {
    const sprite = cast[p.type].cels[p.cel], scale = HEIGHT / sprite.height;
    p.scale = scale;
    p.hand = [p.point[0] + (sprite.grip[0] - sprite.anchor[0]) * scale, p.point[1] + (sprite.grip[1] - sprite.anchor[1]) * scale];
    return p;
  }
  function paintCustomer(p) {
    const cel = cast[p.type].cels[p.cel], image = images[cel.asset || cast[p.type].name], s = p.scale, [x, y, w, h] = cel.crop;
    const dx = p.point[0] + (x - cel.anchor[0]) * s, dy = p.point[1] + (y - cel.anchor[1]) * s;
    const sprite = () => ctx.drawImage(image, x, y, w, h, dx, dy, w * s, h * s);
    const payment = cel.paymentOverlay;
    const local = ([a, b]) => [p.point[0] + (a - 256) * s, p.point[1] + (b - 464) * s];
    const handBox = [p.hand[0] - 15, p.hand[1] - 20, 37, 44];
    ctx.save(); ctx.globalAlpha = p.opacity;
    ctx.fillStyle = '#3853751d'; ctx.beginPath(); ctx.ellipse(p.point[0] - 15, p.point[1] + 7, 32, 6, -.42, 0, Math.PI * 2); ctx.fill();
    if (cel.soles) { ctx.fillStyle = '#26394b36'; for (const sole of cel.soles) { const sx = p.point[0] + (sole[0] - cel.anchor[0]) * s, sy = p.point[1] + (sole[1] - cel.anchor[1]) * s; ctx.beginPath(); ctx.ellipse(sx, sy, 12, 2.2, -.12, 0, Math.PI * 2); ctx.fill(); } }
    if (payment) {
      const [ox, oy, ow, oh] = payment.crop;
      const overlay = () => ctx.drawImage(images[payment.asset], ox, oy, ow, oh, p.point[0] + (ox - payment.anchor[0]) * s, p.point[1] + (oy - payment.anchor[1]) * s, ow * s, oh * s);
      ctx.save(); ctx.translate(-6 * s, 0); outline(payment.left.map(local)); ctx.clip(); overlay(); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(-100, -100, 1900, 1800); payment.right.map(local).forEach((q, i) => i ? ctx.lineTo(...q) : ctx.moveTo(...q)); ctx.closePath(); ctx.clip('evenodd'); sprite(); ctx.restore();
      ctx.save(); outline(payment.right.map(local)); ctx.clip(); outline(payment.head.map(local)); ctx.clip(); sprite(); ctx.restore();
      ctx.save(); outline(payment.right.map(local)); ctx.clip(); ctx.beginPath(); ctx.rect(-100, -100, 1900, 1800); payment.head.map(local).forEach((q, i) => i ? ctx.lineTo(...q) : ctx.moveTo(...q)); ctx.closePath(); ctx.clip('evenodd'); overlay(); ctx.restore();
    } else if (p.inside) {
      ctx.save(); ctx.beginPath(); ctx.rect(-100, -100, 1900, 1800); ctx.rect(...handBox); ctx.clip('evenodd'); sprite(); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(...handBox); ctx.clip(); outline(PORT); ctx.clip(); sprite(); ctx.restore();
    } else sprite();
    if (p.carrying) {
      paintBottle(p.hand, p.container, p.inside);
      ctx.save(); if (p.inside) { outline(PORT); ctx.clip(); }
      ctx.beginPath(); ctx.ellipse(p.hand[0], p.hand[1] - 2, 7.5, 9, 0, 0, Math.PI * 2); ctx.clip(); sprite(); ctx.restore();
    }
    ctx.restore();
  }

  // cam: {fx, fy, z, sx, sy} dünya noktası (fx,fy) ekranda (sx,sy)'ye düşer
  function draw(context, u, cam, ratio = 2) {
    ctx = context;
    const W = 600, H = 1300;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = '#eef2f7'; ctx.fillRect(0, 0, W, H);
    ctx.setTransform(ratio * cam.z, 0, 0, ratio * cam.z, ratio * (cam.sx - cam.fx * cam.z), ratio * (cam.sy - cam.fy * cam.z));
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(images.ext, 0, 0, 1672, 2311);
    ctx.drawImage(plate, 0, 0);
    ctx.drawImage(images.product, PRODUCT.x, PRODUCT.y, PRODUCT.w, PRODUCT.h);
    const sc = choreography(u);
    paintMachine(sc.machine);
    sc.people.map(decorate).filter(p => p.opacity > 0).sort((a, b) => a.point[1] - b.point[1]).forEach(paintCustomer);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return sc;
  }
  return { draw, images };
}

// Sitenin altın sikke çizimi (revenue.js) — ekran koordinatında
export function drawCoin(ctx, x, y, turn, alpha, r = 17) {
  const face = Math.max(.1, Math.abs(Math.cos(turn))), depth = 5 * Math.abs(Math.sin(turn)) + 1;
  ctx.save(); ctx.translate(x, y); ctx.rotate(-.14); ctx.globalAlpha = alpha;
  ctx.shadowColor = '#bc7d2238'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  const metal = ctx.createLinearGradient(-r, -r, r, r);
  metal.addColorStop(0, '#d69727'); metal.addColorStop(.35, '#8b4d06'); metal.addColorStop(.7, '#eebf4a'); metal.addColorStop(1, '#aa630e');
  ctx.fillStyle = metal;
  for (let d = depth; d >= 0; d -= .8) { ctx.beginPath(); ctx.ellipse(d, 1, r * face, r, 0, 0, 7); ctx.fill(); }
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.strokeStyle = '#ffdb72'; ctx.lineWidth = .65;
  for (let yy = -r + 3; yy < r; yy += 3) { const edge = Math.sqrt(Math.max(0, 1 - yy * yy / (r * r))) * r * face; ctx.beginPath(); ctx.moveTo(edge, yy); ctx.lineTo(edge + depth, yy + 1); ctx.stroke(); }
  ctx.scale(face, 1);
  const gold = ctx.createLinearGradient(-r, -r, r, r);
  gold.addColorStop(0, '#fff5b7'); gold.addColorStop(.32, '#ffdb66'); gold.addColorStop(.64, '#f4b832'); gold.addColorStop(1, '#ce8a14');
  ctx.fillStyle = gold; ctx.strokeStyle = '#b5740c'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#fff0a0'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(-.3, -.3, r - 2.5, 0, 7); ctx.stroke();
  ctx.font = `600 ${r * 1.25}px TL, Outfit`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff3ac'; ctx.fillText('₺', -.6, .1); ctx.fillStyle = '#b77712'; ctx.fillText('₺', .4, 1.1);
  ctx.restore();
}
