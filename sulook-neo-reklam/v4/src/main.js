/* SULOOK Neo — V4.1 dikey (1080×1920), 40 sn, 120 BPM kurgu; yumuşak tipografi. Deterministik: window.seek(t). */
import { createStreet, drawCoin, READER, PAY_A, PAY_B, TX, COIN_FLIGHT, COIN_STAGGER } from './street.js';
import { createWatermark } from './watermark.js';

const W = 1080, H = 1920;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, k) => a + (b - a) * k;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const E = n => gsap.parseEase(n);
const eOut = E('expo.out'), eIn = E('expo.in'), bOut = E('back.out(2)'), p2o = E('power2.out'), p2i = E('power2.in'), p3io = E('power3.inOut'), p4o = E('power4.out');
const tr = n => Math.round(n).toLocaleString('tr-TR');
const hash = n => { let s = (n * 9973 + 17) | 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const qbez = (p0, c, p1, k) => [lerp(lerp(p0[0], c[0], k), lerp(c[0], p1[0], k), k), lerp(lerp(p0[1], c[1], k), lerp(c[1], p1[1], k), k)];
const set = (el, css) => { for (const k in css) el.style[k] = css[k]; };
const vis = (el, on) => { el.style.visibility = on ? 'visible' : 'hidden'; };
const inR = (t, a, b) => t >= a && t < b;
const SVGNS = 'http://www.w3.org/2000/svg';

/* ------------------------------------------------------------ zamanlama (120 BPM, vuruş = 0,5 sn) */
const BEAT = .5;
const T = {
  // kanca
  hook1: .2, hook2: .5, hook3: .65,
  perde: 2.0, p1: 2.05, p2: 2.4, p3: 2.85,
  reveal: 4.0, rSub: 4.55,
  // ağ → sokak
  map: 6.0, mT1: 6.15, mT2: 6.45, pull: 8.0, mT3: 8.2, tap: 9.2, zoom: 9.35, zoomEnd: 9.85,
  street: 9.85, sT1: 10.15, sT2: 10.75,
  c724: 12.5, c724b: 12.75,
  // ürün tanıtımı (V3 animasyonu)
  mach: 14.0, title: 14.25, led: 16.4, coOut: 19.45, titleOut: 19.45,
  dash: 20.0, notif: 22.0, notifGap: .3, dashOut: 23.6,
  // kampanya
  offer: 24.0, perk0: 24.9, perkGap: .42, recap: 27.0,
  // fiyat
  ask: 29.0,
  key: 925.5 / 30,                     // 30 fps çıktı karesi k = 60 fps alt-kareler (2k−1, 2k) → PNG n = çıktı karesi 925+n
  price: 31.0, strike: 31.5,
};
T.co = [15.0, T.led, 16.75, 17.0, 17.25];   // kabin, LED, GPD, depo, kart
T.newPrice = T.key + 34 / 30 - 1 / 60;   // yeni fiyat anahtarın 35. karesinde (çıktı karesi 960) girer
T.accent = T.key + 34 / 30 + 1 / 60;     // = 32,0 sn: o karenin ekrana geldiği an, müzikal vurgu
T.tak1 = 32.5; T.tak2 = 33.0;
T.keyShrink = T.key + 81 / 30;           // anahtar kadraj kenarlarından ayrıldığı kare
T.endLogo = 34.0; T.endK = 34.5; T.endSent = 35.0; T.endMq = 35.5; T.endUrl = 36.0; T.sting = 38.0;
T.end = 40.0;
window.DURATION = T.end; window.T = T;

/* ------------------------------------------------------------ elemanlar */
const stage = $('#stage'), world = $('#world');
const perde = $('#perde'), keyImg = $('#keyImg'), prodImg = $('#prodImg');
const phoneWrap = $('#phoneWrap'), phone = $('#phone'), screen = $('#screen');
const appMap = $('#appMap'), appStreet = $('#appStreet');
const tl = gsap.timeline({ paused: true });
const S = {};

/* ------------------------------------------------------------ vuruş, sarsıntı, flaş */
// sarsıntı ve vuruşla nefes yalnızca fiyat sahnesinde (marka dili: yumuşak)
const HITS = [[31.0, 14], [31.5, 12], [32.0, 30], [32.5, 10], [33.0, 10], [38.0, 8]];
function shake(t) {
  let x = 0, y = 0;
  for (const [h, a] of HITS) { const d = t - h; if (d < 0 || d > .4) continue; const env = a * Math.exp(-d * 12); x += env * Math.sin(d * 95 + h * 7); y += env * Math.cos(d * 83 + h * 3); }
  return [x, y];
}
const GROOVE = [[32.0, 39.5]];
function pulse(t) { if (!GROOVE.some(([a, b]) => t >= a && t < b)) return 0; const f = t % BEAT; return Math.exp(-f * 11); }
const FLASH = [[2.0, .22], [4.0, .9], [6.0, .25], [9.8, .8], [12.5, .3], [14.0, .75], [24.0, .55], [32.0, .5], [38.0, .25]];
function flashAt(t) { let o = 0; for (const [h, a] of FLASH) { const d = t - h; if (d >= -.02 && d < .5) o = Math.max(o, a * Math.exp(-Math.max(0, d) * 9)); } return o; }
// markanın −π/7 eğik bıçağıyla geçiş (tc anında ekranı tamamen örter)
const WIPES = [6.0, 24.0, 29.0];
function updateWipes(t) {
  for (const [el, lag] of [[$('#wipeA'), -.05], [$('#wipeB'), .03]]) {
    let on = false;
    for (const tc of WIPES) {
      const k = (t - (tc + lag) + .25) / .5; if (k < 0 || k > 1) continue;
      on = true; const cx = lerp(-1850, 2950, p3io(k));
      el.style.transform = `translateX(${cx}px) rotate(${-180 / 7}deg)`;
    }
    vis(el, on);
  }
}

/* ------------------------------------------------------------ tipografi: kelime kelime yumuşak yükseliş + vurgu font geçişi */
const typeLayer = $('#type'), PH = [];
window.POPS = [];
const TRU = s => s.toLocaleUpperCase('tr-TR');
// anlatım satırı: kelimeler sırayla maskenin altından yükselir
function phrase(text, cls, top, t0, t1, o = {}) {
  const el = document.createElement('div'); el.className = 'ph ' + cls;
  set(el, { top: top + 'px', fontSize: (o.size || 90) + 'px' });
  const words = text.split(' ').map((w, i) => {
    if (i) { const sp = document.createElement('span'); sp.className = 'sp'; el.appendChild(sp); }
    const wd = document.createElement('span'); wd.className = 'wd'; const inn = document.createElement('span'); inn.className = 'in ' + (o.font || 'f-o5'); inn.textContent = w;
    wd.appendChild(inn); el.appendChild(wd); return { wd, inn };
  });
  (o.parent || typeLayer).appendChild(el);
  const r = { kind: 'ph', el, words, t0, t1, o }; PH.push(r); return r;
}
// vurgu kelimesi: harf harf yazılır, sonra kısa bir font geçişiyle (serif italik → Outfit kalın → hedef) oturur
function emph(text, cls, top, t0, t1, o = {}) {
  const el = document.createElement('div'); el.className = 'ph ' + cls;
  set(el, { top: top + 'px', fontSize: (o.size || 140) + 'px' });
  const wd = document.createElement('span'); wd.className = 'wd'; const inn = document.createElement('span'); inn.className = 'in ' + (o.font || 'f-o4');
  const chars = [...text].map(ch => { const c = document.createElement('span'); c.className = 'c'; c.textContent = ch === ' ' ? ' ' : ch; c.dataset.o = c.textContent; c.dataset.u = TRU(c.textContent); inn.appendChild(c); return c; });
  wd.appendChild(inn); el.appendChild(wd); (o.parent || typeLayer).appendChild(el);
  const final = o.final || 'f-lm', cs = o.cst ?? Math.min(.035, .3 / chars.length);
  const steps = [...['f-serif', 'f-o8', 'f-lm'].filter(f => f !== final), final];
  const shuf = t0 + chars.length * cs + (o.wait ?? .28), land = shuf + (steps.length - 1) * .07;
  window.POPS.push({ t: shuf, k: 'shuffle', a: steps.length }, { t: land, k: 'land', a: 1 });
  const r = { kind: 'em', el, inn, chars, t0, t1, o, cs, steps, shuf, land, font: o.font || 'f-o4', final, cur: null }; PH.push(r); return r;
}
function setFont(r, font) {
  if (r.cur === font) return;
  r.inn.className = 'in ' + font; const up = font === 'f-lm';
  r.chars.forEach(c => { c.textContent = up ? c.dataset.u : c.dataset.o; }); r.cur = font;
}
function exitK(r, t, i = 0) {   // 0→1 çıkış ilerlemesi
  const X = r.o.exit || 'up', xd = r.o.xdur || .42; if (X === 'cut') return 0;
  return p2i(clamp((t - (r.t1 - xd) - i * .03) / (xd - .1)));
}
function renderPhrase(r, t) {
  const on = t >= r.t0 && t < r.t1; r.el.style.visibility = on ? 'inherit' : 'hidden'; if (!on) return;
  const X = r.o.exit || 'up';
  r.el.style.transform = `translateY(${-10 * (t - r.t0)}px)`;   // hafif, sürekli süzülme
  if (r.kind === 'ph') {
    r.words.forEach((w, i) => {
      const d = t - (r.t0 + i * (r.o.st ?? .08)), k = E('power3.out')(clamp(d / .62)), q = exitK(r, t, i);
      const y = (1 - k) * 112 - (X === 'up' ? q * 112 : 0);
      w.inn.style.transform = `translateY(${y.toFixed(2)}%)`; w.inn.style.opacity = clamp(d / .25) * (X === 'fade' ? 1 - q : 1);
    });
    return;
  }
  let font = r.font;
  if (t >= r.shuf) font = r.steps[Math.min(r.steps.length - 1, Math.floor((t - r.shuf) / .07))];
  setFont(r, font);
  const landed = t >= r.land, dl = t - r.land;
  r.inn.style.color = landed || t >= r.shuf ? (r.o.accent || '#38bdf8') : '';
  const pop = landed && dl < .4 ? 1 + .06 * Math.sin(dl / .4 * Math.PI) : 1, q = exitK(r, t);
  r.inn.style.transform = `translateY(${X === 'up' ? (-q * 112).toFixed(2) : 0}%) scale(${pop.toFixed(4)})`;
  r.inn.style.opacity = X === 'fade' ? 1 - q : 1;
  r.chars.forEach((c, i) => { const d = t - (r.t0 + i * r.cs), k = E('power3.out')(clamp(d / .42)); c.style.transform = `translateY(${((1 - k) * 110).toFixed(2)}%)`; c.style.opacity = clamp(d / .16); });
}
// genişliğe sığdır: vurgu kelimesi hedef fontunda ölçülür
function fitPh(r, maxW) {
  const el = r.el; if (r.kind === 'em') setFont(r, r.final);
  el.style.width = 'max-content'; el.style.right = 'auto';
  const w = el.getBoundingClientRect().width; el.style.width = ''; el.style.right = '';
  if (w > maxW) el.style.fontSize = (parseFloat(el.style.fontSize) * maxW / w).toFixed(1) + 'px';
  if (r.kind === 'em') { r.cur = null; setFont(r, r.font); }
}

// blok elemanı içerik genişliğine göre sığdır
function fit(el, maxW) {
  const fs = parseFloat(el.style.fontSize || getComputedStyle(el).fontSize);
  el.style.width = 'max-content'; el.style.right = 'auto';
  const w = el.getBoundingClientRect().width; el.style.width = ''; el.style.right = '';
  if (w > maxW) el.style.fontSize = (fs * maxW / w).toFixed(1) + 'px';
}

/* ============================================================ 1 · KANCA: "Bu anahtar neyi açıyor?" */
phrase('Bu anahtar', 'c-w sh2', 180, T.hook1, T.perde, { size: 100, font: 'f-o4' });
phrase('neyi', 'c-w sh2', 1390, T.hook2, T.perde, { size: 100, font: 'f-o4' });
emph('açıyor?', 'c-w glow', 1500, T.hook3, T.perde + .02, { size: 176, accent: '#38bdf8', xdur: .32, wait: .22 });
// perde: "Bir dükkânı değil. Bir ofisi değil. Kendi işini."
phrase('Bir dükkânı değil.', 'c-w sh2', 1230, T.p1, T.p3, { size: 86, font: 'f-o4' });
phrase('Bir ofisi değil.', 'c-w sh2', 1340, T.p2, T.p3, { size: 86, font: 'f-o4' });
phrase('Kendi', 'c-w sh2', 1220, T.p3, T.reveal + .02, { size: 100, font: 'f-o4', exit: 'fade', xdur: .22 });
emph('işini.', 'c-w glow', 1340, T.p3 + .1, T.reveal + .02, { size: 200, accent: '#38bdf8', exit: 'fade', xdur: .22, wait: .18 });

/* ============================================================ 2 · ÜRÜN AÇILIŞI */
phrase('SULOOK', 'c-w sh2', 190, T.reveal + .12, T.map, { size: 96, font: 'f-lm' });
emph('Akıllı', 'c-w sh2', 1560, T.rSub, T.map, { size: 120, final: 'f-serif', accent: '#bae6fd' });
phrase('su dolum otomatı', 'c-w sh2', 1700, T.rSub + .25, T.map, { size: 80, font: 'f-o5' });
const bigTxt = $('#bigTxt');
// ürünün arkasındaki dev "NEO." (yumuşakça aşağıdan yükselir)
const BIG = [{ t: T.reveal, html: '<span class="bt grad" style="font-size:390px">NEO.</span>', top: 300 }];
const BIG_OFF = [[T.map, 1e9]];

/* ============================================================ 3 · AĞ (tam ekran harita → telefon) */
const mapCam = $('#mapCam'), linkLayer = $('#linkLayer'), packetLayer = $('#packetLayer'), markers = $('#mapMarkers');
const HUB = [.632 * 1672, .55 * 941];
const PTS = [
  { name: 'Mahalle Marketi', no: '01', x: .39 * 1672, y: .37 * 941 },
  { name: 'Yaşam Sitesi', no: '02', x: .30 * 1672, y: .58 * 941 },
  { name: 'Meydan', no: '03', x: .46 * 1672, y: .77 * 941 },
  { name: 'İş Merkezi', no: '04', x: .69 * 1672, y: .40 * 941, labelDx: -8 },
  { name: 'Köşe Kafe', no: '05', x: .72 * 1672, y: .63 * 941, labelDx: -26 },
  { name: 'Zincir Market', no: '06', x: .57 * 1672, y: .17 * 941 },
  { name: 'Sahil Sitesi', no: '07', x: 870, y: 610 },
];
const POP_ORDER = [0, 3, 1, 4, 2, 5, 6];
PTS.forEach((p, i) => {
  p.pop = T.map + .15 + POP_ORDER.indexOf(i) * .25;
  const el = document.createElement('div'); el.className = 'mk';
  el.innerHTML = `<div class="mk-base"></div><div class="mk-ripple"></div><div class="mk-pin"><img src="assets/img/pin.png"></div><div class="mk-name"><span class="mk-label">${p.name}</span><small>${p.no}</small></div>`;
  markers.appendChild(el);
  p.el = el; p.pin = $('.mk-pin', el); p.rip = $('.mk-ripple', el); p.nameEl = $('.mk-name', el);
  if (p.labelDx) p.nameEl.style.marginLeft = p.labelDx + 'px';
  const [x1, y1] = [p.x, p.y], [x2, y2] = HUB, d0 = Math.hypot(x2 - x1, y2 - y1), mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - d0 * .26;
  const d = `M${x1.toFixed(1)} ${y1.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  for (const cls of ['lk-glow', 'lk']) { const path = document.createElementNS(SVGNS, 'path'); path.setAttribute('d', d); path.setAttribute('class', cls); path.setAttribute('vector-effect', 'non-scaling-stroke'); linkLayer.appendChild(path); p[cls === 'lk' ? 'link' : 'glow'] = path; }
  p.len = p.link.getTotalLength();
});
const hub = document.createElement('div'); hub.className = 'hub';
hub.innerHTML = `<div class="hub-base"></div><div class="hub-stem"></div><div class="hub-ring"></div><div class="hub-ring"></div><div class="hub-core"><img src="assets/site/hub-face-v33.png"></div><div class="hub-name">SULOOK Merkez</div>`;
markers.appendChild(hub);
const FILLS = [[7.0, 2, 20], [7.25, 3, 60], [7.5, 0, 20], [7.75, 4, 20], [8.0, 1, 60], [8.3, 5, 20], [8.55, 6, 60], [8.8, 0, 20], [9.05, 2, 20]].map(([t, i, a]) => ({ t, i, a }));
FILLS.forEach(f => {
  const g = document.createElementNS(SVGNS, 'g'); g.setAttribute('class', 'pk'); g.innerHTML = '<circle class="pk-halo" r="14"/><circle class="pk-dot" r="6"/>'; packetLayer.appendChild(g); f.g = g;
  const e = document.createElement('div'); e.className = 'earn'; e.innerHTML = `<i>₺</i>+₺${f.a}`; markers.appendChild(e); f.earn = e;
});
S.map = { fx: HUB[0], fy: HUB[1], z: 1.7 };
tl.to(S.map, { fx: 780, fy: 470, z: .84, duration: 1.9, ease: 'power3.out' }, T.map);
tl.to(S.map, { fx: 860, fy: 460, z: .9, duration: T.tap - T.map - 1.9, ease: 'sine.inOut' }, T.map + 1.9);
tl.to(S.map, { fx: PTS[0].x, fy: PTS[0].y - 40, z: 5.2, duration: T.zoomEnd - T.zoom, ease: 'power4.in' }, T.zoom);
const tap = $('#tap'), [tapDot, tapRing] = $$('#tap i');
phrase('Şehrin her noktasından', 'c-n', 175, T.mT1, T.pull + .15, { size: 74 });
emph('pasif gelir.', 'c-n', 290, T.mT2, T.pull + .15, { size: 150, accent: '#0284c7' });
phrase('Hepsini', 'c-n', 150, T.mT3, T.zoomEnd + .1, { size: 88 });
phrase('telefonundan', 'c-n', 262, T.mT3 + .15, T.zoomEnd + .1, { size: 88 });
emph('yönet.', 'c-n', 378, T.mT3 + .3, T.zoomEnd + .1, { size: 160, accent: '#0284c7' });
// telefon: tam ekran (ekran üstü = sahne üstü) ↔ elde
const FULL = { x: 540, y: 1170, s: 1.8 }, HAND = { x: 540, y: 1225, s: .9 };
S.ph = { ...FULL, rx: 0, ry: 0, rz: 0, float: 0, chrome: 0 };
tl.to(S.ph, { ...HAND, rx: 6, ry: -10, rz: -2, float: 1, chrome: 1, duration: .65, ease: 'expo.out' }, T.pull);
tl.to(S.ph, { rx: 0, ry: 0, rz: 0, float: 0, duration: .3, ease: 'power2.inOut' }, T.tap - .3);
tl.to(S.ph, { ...FULL, chrome: 0, duration: .5, ease: 'expo.inOut' }, T.zoomEnd + .02);
tl.fromTo('#scrFlash', { opacity: 0 }, { opacity: 1, duration: .1, ease: 'power1.in', immediateRender: false }, T.zoomEnd - .12);
tl.to('#scrFlash', { opacity: 0, duration: .32, ease: 'power2.out' }, T.zoomEnd - .02);

/* ============================================================ sokak (tam ekran) */
const stCanvas = $('#streetCanvas'), stCtx = stCanvas.getContext('2d'), coinCanvas = $('#coinCanvas'), coinCtx = coinCanvas.getContext('2d');
stCanvas.width = 1200; stCanvas.height = 2600; coinCanvas.width = 1200; coinCanvas.height = 2600;
let street = null;
const ST_SPEED = 1.45;
S.st = { fx: 640, fy: 540, z: 2.4 };
tl.to(S.st, { fx: 700, fy: 560, z: 1.5, duration: .9, ease: 'expo.out' }, T.street);
tl.to(S.st, { fx: 712, fy: 566, z: 1.56, duration: T.c724 - T.street - .9, ease: 'none' }, T.street + .9);
const RV_BASE = [24, 20, 23, 17, 21, 14, 18, 12, 16, 9, 13, 8];
phrase('Kendi kendine satar,', 'c-n', 1515, T.sT1, T.c724, { size: 80 });
phrase('sen', 'c-n', 1612, T.sT2, T.c724, { size: 80 });
emph('kazanırsın.', 'c-n', 1698, T.sT2 + .15, T.c724, { size: 122, accent: '#0284c7' });

/* ============================================================ 4 · 7/24 */
const inter = $('#inter'), arc = $('#iArc'), arcHead = $('#iHead');
{ const tk = $('#iTicks'); for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2, r0 = i % 4 ? 268 : 258, r1 = 282;
    const l = document.createElementNS(SVGNS, 'line'); l.setAttribute('x1', 320 + Math.sin(a) * r0); l.setAttribute('y1', 320 - Math.cos(a) * r0); l.setAttribute('x2', 320 + Math.sin(a) * r1); l.setAttribute('y2', 320 - Math.cos(a) * r1); l.dataset.k = i / 48; tk.appendChild(l); } }
S.inter = { arc: 0 };
tl.to(S.inter, { arc: 1, duration: .55, ease: 'power2.inOut' }, T.c724 + .02);
phrase('Sen uyurken bile', 'c-w', 1235, T.c724b, T.mach, { size: 74, font: 'f-o4', exit: 'fade', xdur: .3 });
emph('kazanmaya devam.', 'c-w', 1335, T.c724b + .15, T.mach, { size: 104, final: 'f-serif', accent: '#7dd3fc', exit: 'fade', xdur: .3, wait: .15 });

/* ============================================================ 5 · ÜRÜN TANITIMI (V3 animasyonu) */
const AX = 557, AY = 965;
const ytext = $('#ytext');
set(ytext, { top: '126px' });
gsap.set('#ytext .in', { yPercent: 118 });
tl.to('#ytext .in', { yPercent: 0, duration: .8, ease: 'power4.out' }, T.mach + .05);
tl.to(ytext, { opacity: 0, y: -40, duration: .35, ease: 'power2.in' }, T.titleOut);
const hTitle = $('#hTitle'); hTitle.style.top = '214px';
const hnS = $('.hn-s'), hnNeo = $('.hn-neo'), htSpec = $('.ht-spec');
gsap.set(hnS, { opacity: 0, y: 50, filter: 'blur(14px)' }); gsap.set(hnNeo, { opacity: 0, x: -30, filter: 'blur(14px)' }); gsap.set(htSpec, { opacity: 0, y: 24 });
tl.to(hnS, { opacity: 1, y: 0, filter: 'blur(0px)', duration: .6, ease: 'expo.out' }, T.title);
tl.to(hnNeo, { opacity: 1, x: 0, filter: 'blur(0px)', duration: .6, ease: 'expo.out' }, T.title + .16);
tl.to(htSpec, { opacity: 1, y: 0, duration: .5, ease: 'power3.out' }, T.title + .42);
S.spec = { g: 0, l: 0 };
tl.to(S.spec, { g: 1330, l: 160, duration: .8, ease: 'power2.out' }, T.title + .42);
tl.to(hTitle, { opacity: 0, y: -40, duration: .35, ease: 'power2.in' }, T.titleOut);
// ürün kamerası: render pikseli (x,y) → sahne (cx + (x-AX)·s, cy + (y-AY)·s)
const P0 = { s: 1, cx: AX, cy: AY }, P1 = { s: .74, cx: 548, cy: 1010 }, P1b = { s: .86, cx: 548, cy: 1000 }, P2 = { s: .86, cx: 318, cy: 1150 };
S.prod = { s: 1, cx: 540, cy: 1060 };            // açılış kadrajı (4–6 sn)
tl.set(S.prod, { ...P0, immediateRender: false }, T.mach - .3);
tl.to(S.prod, { ...P1, duration: .7, ease: 'power3.inOut' }, T.co[0] - .35);
tl.to(S.prod, { ...P1b, duration: 18.6 - 16.3, ease: 'sine.inOut' }, 16.3);
tl.to(S.prod, { ...P2, duration: .75, ease: 'power3.inOut' }, T.dash - .3);
// kampanya renderı kare haritası: kapak 35–44, damacana 45–60, kapanış 90–106, geri çekilme 106–150
const PROD_A = [[T.reveal, 15], [T.reveal + .55, 35]];
const PROD_B = [[T.mach, 35], [14.4, 45], [14.9, 62], [15.75, 90], [16.3, 106], [18.6, 150]];
const ledOff = $('#ledOff'), ledGlow = $('#ledGlow'), ledWash = $('#ledWash');
const LED_STATES = [[T.led + .12, 0], [T.led + .28, 1], [T.led + .44, 0], [T.led + .6, 1]];
// callout'lar (ankraj: render karesinde izlenen nokta)
const callSvg = $('#callSvg'), callouts = $('#callouts');
callSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
const CO = [
  { ic: 'i-door', b: 'Dolum Kabini', st: 'door', a: 'cabin', l: [36, 1210], side: 'L' },
  { ic: 'i-light', b: 'LED Aydınlatma', st: 'led', a: 'led', l: [36, 560], side: 'L' },
  { ic: 'i-filter', b: '1330 GPD', s: 'Arıtma kapasitesi', a: 'gpd', l: [36, 620], side: 'R' },
  { ic: 'i-tank', b: '160 L', s: 'Depo kapasitesi', a: 'depo', l: [36, 1290], side: 'R' },
  { ic: 'i-card', b: 'Kartlı Ödeme', s: 'Temassız ödeme', a: 'term', l: [36, 940], side: 'R' },
];
CO.forEach((c, i) => {
  const el = document.createElement('div'); el.className = 'tag callout';
  el.innerHTML = `<span class="ci"><svg><use href="#${c.ic}"/></svg></span><span class="ctx"><b>${c.b}</b>${c.s ? `<small>${c.s}</small>` : ''}</span>${c.st ? '<span class="st">Açık</span>' : ''}`;
  el.style.top = c.l[1] + 'px'; if (c.side === 'L') el.style.left = c.l[0] + 'px'; else el.style.right = c.l[0] + 'px';
  callouts.appendChild(el);
  const path = document.createElementNS(SVGNS, 'path'), dot = document.createElementNS(SVGNS, 'circle'), ring = document.createElementNS(SVGNS, 'circle');
  dot.setAttribute('class', 'ad'); dot.setAttribute('r', 8); ring.setAttribute('class', 'ar'); ring.setAttribute('r', 8);
  callSvg.append(path, ring, dot);
  Object.assign(c, { el, path, dot, ring, t: T.co[i], stEl: $('.st', el) });
  gsap.set(el, { opacity: 0, x: c.side === 'L' ? -40 : 40 });
  tl.to(el, { opacity: 1, x: 0, duration: .42, ease: 'expo.out' }, c.t + .2);
  tl.to(el, { opacity: 0, x: c.side === 'L' ? -30 : 30, duration: .22, ease: 'power2.in' }, T.coOut + i * .02);
});

/* ============================================================ 6 · PANEL + BİLDİRİM */
const panels = $('#panels');
const PN = [
  { t: 'Günlük dolum', html: `<div class="pv"><span data-c="240">0</span></div><div class="bars">${[.45, .62, .5, .78, .66, .9, .74, 1].map(h => `<i style="height:${h * 100}%"></i>`).join('')}</div>` },
  { t: 'Filtre ömrü', html: `<div class="pv"><span data-c="82">0</span><small>%</small></div><svg class="ring" viewBox="0 0 104 104"><circle class="rb" cx="52" cy="52" r="44"/><circle class="rf" cx="52" cy="52" r="44" stroke-dasharray="276.5" stroke-dashoffset="276.5"/></svg><div class="lvl" style="margin-top:22px;width:200px"><i data-w="82"></i></div>` },
  { t: 'Depo seviyesi', html: `<div class="pv"><span data-c="160">0</span><small>L</small></div><div class="lvl"><i data-w="100"></i></div>` },
];
const PANEL_POS = [[592, 770], [592, 1080], [592, 1370]];
PN.forEach((p, i) => {
  const el = document.createElement('div'); el.className = 'glass panel';
  el.innerHTML = `<div class="pt"><i class="live"></i>${p.t}</div>${p.html}`;
  set(el, { left: PANEL_POS[i][0] + 'px', top: PANEL_POS[i][1] + 'px', width: (W - PANEL_POS[i][0] - 40) + 'px' });
  panels.appendChild(el);
  const t0 = T.dash + .5 + i * .5;
  gsap.set(el, { opacity: 0, x: 140, scale: 1.15 });
  tl.to(el, { opacity: 1, x: 0, scale: 1, duration: .4, ease: 'expo.out' }, t0);
  const cnt = $('[data-c]', el), obj = { v: 0 };
  tl.to(obj, { v: +cnt.dataset.c, duration: .7, ease: 'power2.out', onUpdate: () => { cnt.textContent = tr(obj.v); } }, t0 + .05);
  $$('.bars i', el).forEach((b, j) => { gsap.set(b, { scaleY: 0 }); tl.to(b, { scaleY: 1, duration: .35, ease: 'back.out(1.6)' }, t0 + .1 + j * .03); });
  const rf = $('.rf', el); if (rf) tl.to(rf, { attr: { 'stroke-dashoffset': 276.5 * (1 - .82) }, duration: .7, ease: 'power2.out' }, t0 + .05);
  $$('.lvl i', el).forEach(b => tl.to(b, { width: b.dataset.w + '%', duration: .7, ease: 'power2.out' }, t0 + .1));
  tl.to(el, { opacity: 0, x: 160, scale: 1.2, filter: 'blur(10px)', duration: .3, ease: 'power2.in' }, T.dashOut + i * .03);
});
const NT = [
  { tone: 'green', h: 'Günlük rapor', b: 'Bugün 240 dolum yapıldı', s: 'Mahalle Marketi · Nokta 01', chip: '+₺6.720' },
  { tone: 'blue', h: 'Depo', b: 'Depo doldu, satışa hazır', s: 'Arıtma tamamlandı · 160 L', chip: '%100' },
  { tone: 'orange', h: 'Servis', b: 'Filtre bakımı planlandı', s: 'İş Merkezi · Nokta 04', chip: 'Yarın' },
];
const NOTIF_TOP = 112, NOTIF_STEP = 202;
NT.forEach((n, i) => {
  const el = document.createElement('div'); el.className = 'nt nt-' + n.tone;
  el.innerHTML = `<span class="nt-ic"><img src="assets/img/app-icon.png" alt=""></span><span class="nt-bd"><span class="nt-hd"><b>SULOOK</b><i>${n.h}</i><em>şimdi</em></span><span class="nt-tt">${n.b}</span><span class="nt-sb">${n.s}</span></span><span class="nt-chip">${n.chip}</span>`;
  $('#notifs').appendChild(el);
  n.el = el; n.t = T.notif + i * T.notifGap;
});

/* ============================================================ 7 · KAMPANYA: vuruş başına tam ekran kart */
const PK = [['i-truck', 'Ücretsiz', 'Nakliye'], ['i-tool', 'Ücretsiz', 'Kurulum'], ['i-filter', '1 Yıl Ücretsiz', 'Filtre Bakımı'], ['i-headset', '1 Yıl', 'Call Center Yardımı'], ['i-link', '1 Yıl Ücretsiz', 'Otis Bağlantı Hizmeti']];
const PK_MAIN = ['NAKLİYE', 'KURULUM', 'FİLTRE<br>BAKIMI', 'CALL CENTER<br>YARDIMI', 'OTİS BAĞLANTI<br>HİZMETİ'];
const PK_TOP = ['ÜCRETSİZ', 'ÜCRETSİZ', '1 YIL ÜCRETSİZ', '1 YIL', '1 YIL ÜCRETSİZ'];
const PK_SKIN = ['pc-blue', 'pc-white', 'pc-navy', 'pc-cyan', 'pc-blue'];
const PK_END = T.recap;
const perkSlam = $('#perkSlam'), PCARDS = [];
{ // giriş kartı
  const el = document.createElement('div'); el.className = 'pcard pc-white';
  perkSlam.appendChild(el);
  const tEnd = T.perk0 + .22;
  phrase('Kampanyaya', 'c-n', 770, T.offer + .05, tEnd, { size: 120, font: 'f-o4', parent: el, exit: 'cut' });
  emph('özel', 'c-n', 910, T.offer + .15, tEnd, { size: 230, accent: '#0284c7', parent: el, exit: 'cut', cst: .03, wait: .16 });
  PCARDS.push({ el, t0: T.offer, t1: T.perk0, intro: true });
}
PK.forEach((p, i) => {
  const el = document.createElement('div'); el.className = 'pcard ' + PK_SKIN[i];
  el.innerHTML = `<div class="pc-ix">${String(i + 1).padStart(2, '0')} / 05</div><div class="pc-ic"><svg><use href="#${p[0]}"/></svg></div><div class="pc-top">${PK_TOP[i]}</div><div class="pc-main">${PK_MAIN[i]}</div><div class="pc-ck"><svg><use href="#i-check"/></svg></div>`;
  perkSlam.appendChild(el);
  PCARDS.push({ el, t0: T.perk0 + i * T.perkGap, t1: i < 4 ? T.perk0 + (i + 1) * T.perkGap : PK_END, ic: $('.pc-ic', el), top: $('.pc-top', el), main: $('.pc-main', el), ck: $('.pc-ck', el), ix: $('.pc-ix', el) });
});
// özet listesi
const recap = $('#recap'), pkList = $('.pk-list', recap);
const RC = PK.map(([ic, top, main], i) => {
  const el = document.createElement('div'); el.className = 'perk';
  el.innerHTML = `<span class="pi"><svg><use href="#${ic}"/></svg></span><span class="pt"><small>${top}</small>${main}</span><span class="pc"><svg><use href="#i-check"/></svg></span><i class="shine"></i>`;
  pkList.appendChild(el); return { el, pc: $('.pc', el), shine: $('.shine', el), t: T.recap + .05 + i * .1 };
});
phrase('Kampanyaya özel', 'c-l', 350, T.recap + .1, T.ask, { size: 58, font: 'f-o5' });

/* ============================================================ 8 · "Lansman özel fiyatı ile" */
phrase('Lansman', 'c-w sh2', 640, T.ask + .05, T.key + .15, { size: 124, font: 'f-o3' });
emph('özel fiyatı', 'c-w glow', 790, T.ask + .4, T.key + .15, { size: 156, accent: '#38bdf8' });
phrase('ile', 'c-w sh2', 1000, T.ask + 1.05, T.key + .15, { size: 124, font: 'f-o3' });

/* ============================================================ 9 · FİYAT (anahtar arka planda, yeni fiyat 35. karede) */
const keyScene = $('#keyScene'), keyCam = $('#keyCam'), keyGlow = $('#keyGlow');
const KEY_HOOK = { s: .7, y: 259 }, KEY_K1 = { s: 1, y: -210 }, KEY_E = { s: .46, y: 196 };
S.key = { ...KEY_K1, glow: 0 };
tl.to(S.key, { ...KEY_E, duration: 1.05, ease: 'power3.inOut' }, T.keyShrink);
tl.fromTo('#keyShade', { opacity: 0 }, { opacity: 1, duration: .5, immediateRender: false }, T.price - .2);
tl.to('#keyShade', { opacity: 0, duration: .8 }, T.keyShrink);
const pKicker = $('#pKicker'), pOld = $('#pOld'), pNew = $('#pNew'), pSent = $('#pSent'), pTaksit = $('#pTaksit'), pStrike = $('#pStrike'), pTag = $('#pTag'), pTak1 = $('#pTak1'), pTak2 = $('#pTak2');
const PP = { p: { old: 1200, new: 1390, tak1: 1560, tak2: 1670 }, e: { kick: 1046, old: 1112, new: 1206, sent: 1318, tak: 1392 } };
S.pr = { oldY: PP.p.old, oldS: 1, newY: PP.p.new, newS: 1 };
tl.fromTo(pOld, { opacity: 0, scale: 1.8, filter: 'blur(18px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: .3, ease: 'expo.out', immediateRender: false }, T.price);
gsap.set(pStrike, { scaleX: 0, rotation: -8 });
tl.to(pStrike, { scaleX: 1, duration: .16, ease: 'power4.in' }, T.strike);
tl.to(pOld, { opacity: .5, duration: .25 }, T.strike + .16);
tl.to(S.pr, { oldY: PP.p.old - 40, oldS: .7, duration: .35, ease: 'power3.out' }, T.strike + .16);
tl.fromTo(pNew, { opacity: 0, scale: 2.8, filter: 'blur(26px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: .28, ease: 'expo.out', immediateRender: false }, T.newPrice);
gsap.set(pTag, { scale: 0, rotation: -30 });
tl.to(pTag, { scale: 1, rotation: -7, duration: .4, ease: 'back.out(3)' }, T.newPrice + .25);
for (const [el, t0] of [[pTak1, T.tak1], [pTak2, T.tak2]]) {
  tl.fromTo(el, { opacity: 0, scale: 1.7, filter: 'blur(16px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: .25, ease: 'expo.out', immediateRender: false }, t0);
  tl.to(el, { opacity: 0, y: -30, duration: .3, ease: 'power2.in' }, T.keyShrink + .15);
}
tl.fromTo(pTaksit, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .5, ease: 'expo.out', immediateRender: false }, T.keyShrink + .45);
tl.fromTo(S.key, { glow: 0 }, { glow: 1, duration: .06, immediateRender: false }, T.newPrice);
tl.to(S.key, { glow: .25, duration: 1.3, ease: 'power2.out' }, T.newPrice + .06);
// son kart: logo üstte, anahtar ortada, metin altta
tl.to(S.pr, { oldY: PP.e.old, oldS: .55, newY: PP.e.new, newS: .78, duration: .95, ease: 'power3.inOut' }, T.keyShrink + .08);
tl.fromTo('#endLogo', { opacity: 0, y: -40, scale: .9 }, { opacity: 1, y: 0, scale: 1, duration: .7, ease: 'expo.out', immediateRender: false }, T.endLogo);
tl.fromTo(pKicker, { opacity: 0, y: 30, scale: 1.3 }, { opacity: 1, y: 0, scale: 1, duration: .45, ease: 'expo.out', immediateRender: false }, T.endK);
tl.fromTo(pSent, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .5, ease: 'expo.out', immediateRender: false }, T.endSent);
const mq = $('#marquee'), mqIn = $('.mq-in', mq);
mq.style.top = '1452px';
const mqItems = PK.map(([ic, top, main]) => `<span class="mq-it"><i><svg><use href="#i-check"/></svg></i>${top} ${main}</span>`).join('');
mqIn.innerHTML = mqItems + mqItems + mqItems;
tl.to(mq, { opacity: 1, duration: .5 }, T.endMq);
const endUrl = $('#endUrl'); endUrl.style.top = '1556px';
tl.fromTo(endUrl, { opacity: 0, y: 30, scale: .9 }, { opacity: 1, y: 0, scale: 1, duration: .5, ease: 'back.out(2)', immediateRender: false }, T.endUrl);

/* ============================================================ güncelleme */
const frameSrc = { perde: -1, key: -1, prod: -1 };
function setFrame(el, kind, path) { if (frameSrc[kind] === path) return; el.src = path; frameSrc[kind] = path; }
function mapF(t, M) {
  if (t <= M[0][0]) return M[0][1];
  for (let i = 1; i < M.length; i++) { const [t1, f1] = M[i], [t0, f0] = M[i - 1]; if (t < t1) return Math.round(f0 + (f1 - f0) * (t - t0) / (t1 - t0)); }
  return M[M.length - 1][1];
}
let TRACKS = null, KEYC = null;
function track(name, n) {
  const tr = TRACKS.tracks, i = clamp(n - TRACKS.first, 0, tr.center.length - 1);
  if (name === 'led') { const a = tr.ledL[i], b = tr.ledR[i]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }
  return tr[name][i];
}

// --- zeminler ve genel katmanlar
const NAVY_ON = [[0, T.reveal], [T.c724, T.mach + .1], [T.recap, 1e9]], BLUE_ON = [[T.reveal, T.map], [T.mach - .2, T.offer]], LIGHT_ON = [[T.map, T.c724]];
const anyOn = (R, t) => R.some(([a, b]) => t >= a && t < b);
function updateBg(t) {
  vis($('#bgNavy'), anyOn(NAVY_ON, t)); vis($('#bgBlue'), anyOn(BLUE_ON, t)); vis($('#bgLight'), anyOn(LIGHT_ON, t));
  $('#bgBlue').style.opacity = t < T.map ? 1 : E('power2.inOut')(prog(t, T.mach - .2, T.mach + .1));
  vis($('#light'), anyOn(LIGHT_ON, t));
  const [sx, sy] = shake(t), pz = 1 + .014 * pulse(t);
  world.style.transform = `translate(${sx * .6}px,${sy * .6}px) scale(${pz})`;
  $('#flash').style.opacity = flashAt(t);
  const note = $('#note'), non = inR(t, T.map + .3, T.c724) || inR(t, T.dash + .4, T.dashOut);
  vis(note, non); note.classList.toggle('dark', t < T.c724);
}

// --- anahtar (kanca + fiyat/son)
function updateKey(t) {
  const hook = t < T.perde, main = t >= T.key;
  vis($('#keyScene'), hook || main);
  if (!(hook || main)) return;
  let kf, k;
  if (hook) { kf = 100 + Math.floor(t * 30 + 1e-4); k = { s: KEY_HOOK.s * (1.12 - .12 * eOut(clamp(t / .5))) * (1 + .02 * t), y: KEY_HOOK.y, glow: .35 }; }
  else {
    const dv = Math.max(0, t - T.key), n = Math.floor(dv * 30 + 1e-4) + 1;
    kf = n <= 250 ? n : 250 - (n - 250);   // 250'den sonra geriye salınım
    k = S.key;
  }
  kf = clamp(kf, 1, 250);
  setFrame(keyImg, 'key', `assets/seq/keypng/${String(kf).padStart(4, '0')}.webp`);
  keyCam.style.transform = `translateY(${k.y}px) scale(${k.s})`;
  const g = k.glow, [gx, gy] = KEYC[kf - 1];
  keyImg.style.filter = g > .02 ? `drop-shadow(0 0 ${12 + 44 * g}px rgba(125,211,252,${(.9 * g).toFixed(3)}))` : 'none';
  const fin = hook ? clamp(t / .35) : clamp((t - T.key) / .4);
  set(keyGlow, { left: gx + 'px', top: gy + 'px', opacity: (.55 + .45 * g) * fin, transform: `translate(-50%,-50%) scale(${1 + .35 * g})` });
  // fiyat sahnesinde anahtar önce akmaya başlar, opaklığı akarken açılır
  keyScene.style.opacity = hook ? clamp(t / .12) * (1 - prog(t, T.perde - .08, T.perde)) : p2o(prog(t, T.key, T.key + .65));
}

// --- perde
function updatePerde(t) {
  const on = inR(t, T.perde - .02, T.reveal + .05); vis($('#sPerde'), on); if (!on) return;
  const u = t - T.perde, f = Math.min(241, 60 + Math.floor(u * 24));
  setFrame(perde, 'perde', `assets/seq/perde/${String(f).padStart(4, '0')}.jpg`);
  perde.style.transform = `scale(${1.12 + u * .05}) rotate(${-.6 + u * .3}deg)`;
  // ilk anda yana savrulma (whip) girişi
  const wk = 1 - E('power3.out')(clamp(u / .55));
  $('#sPerde').style.transform = `translateX(${wk * 160}px)`; $('#sPerde').style.opacity = 1 - wk * .9; $('#sPerde').style.filter = 'none';
}

// --- ürün (açılış + V3 tanıtımı + panel)
const prodCam = $('#prodCam');
const toStage = ([x, y]) => [S.prod.cx + (x - AX) * S.prod.s, S.prod.cy + (y - AY) * S.prod.s];
function updateProd(t) {
  const on = inR(t, T.reveal, T.map) || inR(t, T.mach - .2, T.offer);
  vis(prodCam, on);
  vis(ytext, inR(t, T.mach, T.dash)); vis(hTitle, inR(t, T.mach, T.dash));
  if (!on) { vis(bigTxt, false); CO.forEach(co => { for (const e of [co.path, co.dot, co.ring]) e.style.visibility = 'hidden'; }); return; }
  const n = t < T.map ? mapF(t, PROD_A) : mapF(t, PROD_B); S.prodN = n;
  setFrame(prodImg, 'prod', `assets/seq/kampanya/${String(n).padStart(4, '0')}.webp`);
  const p = S.prod;
  let s = p.s, dy = 0, o = 1, blur = 0;
  if (t < T.map) { s *= 1 + .03 * (t - T.reveal); const q = 1 - E('power3.out')(prog(t, T.reveal, T.reveal + .6)); blur = q * 10; o = 1 - prog(t, T.map - .2, T.map); }
  else if (t < T.mach + .5) { const k = E('power3.out')(prog(t, T.mach - .2, T.mach + .5)); o = clamp((t - (T.mach - .2)) / .3); dy = (1 - k) * 110; }
  if (t >= T.dashOut) { const q = p2i(prog(t, T.dashOut, T.offer)); s *= 1 + .35 * q; o = 1 - q; blur = 12 * q; }
  prodCam.style.transform = `translate(${p.cx - AX * s}px,${p.cy - AY * s + dy}px) scale(${s})`;
  prodCam.style.opacity = o; prodCam.style.filter = blur > .3 ? `blur(${blur}px)` : 'none';
  // dev "NEO." (ürünün arkasında, aşağıdan yumuşakça yükselir)
  const bOn = inR(t, T.reveal, T.map); vis(bigTxt, bOn);
  if (bOn) {
    const B = BIG[0], d = t - B.t;
    if (bigTxt.dataset.i !== '0') { bigTxt.innerHTML = B.html; bigTxt.dataset.i = '0'; }
    const k = E('power3.out')(clamp(d / .8));
    set(bigTxt, { top: B.top + 'px', opacity: clamp(d / .3) * (1 - prog(t, T.map - .25, T.map)), transform: `translateY(${(1 - k) * 160}px) scale(${1 + .025 * d})`, filter: 'none' });
  }
  $('#gpd').textContent = Math.round(S.spec.g); $('#lt').textContent = Math.round(S.spec.l);
  // LED
  let led = 1; for (const [ts, v] of LED_STATES) if (t >= ts) led = v;
  let lastOn = -9; for (const [ts, v] of LED_STATES) if (v && t >= ts) lastOn = ts;
  const ledT = inR(t, T.led, T.dash + .8) && n >= TRACKS.first;
  vis(ledOff, ledT && !led); vis(ledGlow, ledT && !!led); vis(ledWash, ledT && !!led);
  if (ledT) {
    const len = alongLed(ledOff, n, 0, 0, 1, 0), th = len * .052;
    alongLed(ledOff, n, len * .015, len * .015, th, len * .004);
    alongLed(ledGlow, n, len * .16, len * .16, th * 9, 0);
    alongLed(ledWash, n, len * .05, len * .05, len * .9, len * .45);
    const dl = t - lastOn;
    ledGlow.style.opacity = led ? .25 + .75 * Math.exp(-dl * 3.2) : 0; ledWash.style.opacity = led ? .65 * Math.exp(-dl * 2) : 0;
  }
  // callout çizgileri (V3)
  const hr = $('#stage').getBoundingClientRect(), doorOpen = n >= 40 && n < 98;
  CO.forEach(co => {
    const d = t - co.t, live = d >= 0 && t < T.coOut + .25;
    for (const e of [co.path, co.dot, co.ring]) e.style.visibility = live ? 'visible' : 'hidden';
    if (!live) return;
    const [ax, ay] = toStage(track(co.a, n));
    const r = co.el.getBoundingClientRect(), lx = (co.side === 'L' ? r.right : r.left) - hr.left, ly = r.top + r.height / 2 - hr.top;
    const ex = lx + (co.side === 'L' ? 4 : -4), midx = lerp(ax, ex, .42);
    co.path.setAttribute('d', `M${ax.toFixed(1)} ${ay.toFixed(1)} L${midx.toFixed(1)} ${ly.toFixed(1)} L${ex.toFixed(1)} ${ly.toFixed(1)}`);
    const len = Math.hypot(midx - ax, ly - ay) + Math.abs(ex - midx), kd = E('power3.out')(prog(d, .06, .38)), ko = 1 - prog(t, T.coOut - .1, T.coOut + .12);
    co.path.style.strokeDasharray = len; co.path.style.strokeDashoffset = len * (1 - kd); co.path.style.opacity = ko;
    co.dot.setAttribute('cx', ax); co.dot.setAttribute('cy', ay); co.ring.setAttribute('cx', ax); co.ring.setAttribute('cy', ay);
    co.dot.style.opacity = ko; co.dot.setAttribute('r', 7 * bOut(prog(d, 0, .2)));
    const ph = (d * 1.2) % 1; co.ring.setAttribute('r', 7 + ph * 22); co.ring.style.opacity = (1 - ph) * ko;
    if (co.stEl) {
      const isOn = co.st === 'led' ? !!led : doorOpen;
      co.stEl.textContent = isOn ? 'Açık' : 'Kapalı'; co.stEl.classList.toggle('off', !isOn);
    }
  });
}
function alongLed(el, n, padL, padR, h, dy) {
  const i = n - TRACKS.first, a = TRACKS.tracks.ledL[i], b = TRACKS.tracks.ledR[i];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  set(el, { left: a[0] + 'px', top: a[1] + 'px', width: (len + padL + padR) + 'px', height: h + 'px', transform: `rotate(${ang}rad) translate(${-padL}px,${-h / 2 + dy}px)` });
  return len;
}

// --- telefon / harita / sokak
function updatePhone(t) {
  if (!anyOn(LIGHT_ON, t)) return;
  const p = S.ph, fl = p.float;
  const ry = p.ry + fl * 3.5 * Math.sin(t * 1.4), rx = p.rx + fl * 1.6 * Math.sin(t * 1.05 + 1), fy = fl * 10 * Math.sin(t * 1.2);
  phoneWrap.style.transform = `translate(${p.x - 320}px,${p.y - 670 + fy}px) scale(${p.s})`;
  phone.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${p.rz}deg)`;
  const ch = p.chrome;
  for (const s of ['#statusBar', '#homeInd', '.net-phone-bar', '#netPanel']) $(s).style.opacity = ch;
  $('.ph-glare').style.opacity = ch; $('.ph-shadow').style.opacity = ch;
  $('#bgLight').style.transform = `scale(${1.1 - .1 * ch})`;
}
function mapToScreen(x, y) { const m = S.map; return [300 + (x - m.fx) * m.z, 600 + (y - m.fy) * m.z]; }
function updateMap(t) {
  const on = inR(t, T.map, T.zoomEnd + .12); vis(appMap, on); if (!on) return;
  const m = S.map;
  mapCam.style.transform = `translate(${300 - m.fx * m.z}px,${600 - m.fy * m.z}px) scale(${m.z})`;
  const blur = prog(t, T.zoom + .25, T.zoomEnd) * 14;
  mapCam.style.filter = blur > .2 ? `blur(${blur}px)` : 'none'; markers.style.filter = mapCam.style.filter;
  const mScale = Math.min(2.4, Math.max(1, m.z / .84));
  { const [x, y] = mapToScreen(...HUB); hub.style.transform = `translate(${x}px,${y}px) scale(${mScale})`;
    let lastArr = -9; for (const f of FILLS) if (t >= f.t + .95) lastArr = f.t + .95;
    const dh = t - lastArr;
    $('.hub-core', hub).style.transform = `scale(${dh >= 0 && dh < .5 ? 1 + .12 * Math.sin(dh / .5 * Math.PI) : 1})`;
    $$('.hub-ring', hub).forEach((r, i) => { const ph = ((t * .55 + i * .5) % 1); r.style.transform = `scale(${1 + ph * 1.2})`; r.style.opacity = (1 - ph) * .7; }); }
  let online = 0;
  PTS.forEach((p, i) => {
    const [x, y] = mapToScreen(p.x, p.y), dp = t - p.pop;
    p.el.style.transform = `translate(${x}px,${y}px) scale(${mScale})`;
    if (dp < 0) { p.el.style.opacity = 0; for (const path of [p.link, p.glow]) path.style.opacity = 0; return; }
    online++;
    p.el.style.opacity = 1;
    let pinS = bOut(prog(dp, 0, .3)), pinY = -180 * (1 - E('power2.in')(prog(dp, 0, .16)));
    if (dp > .16) pinY = 0;
    for (const f of FILLS) if (f.i === i) { const d = t - f.t; if (d >= 0 && d < .5) pinS *= 1 + .14 * Math.sin(d * 18) * Math.exp(-d * 7); }
    if (i === 0 && t > T.tap - .05) pinS *= 1 + .16 * bOut(prog(t, T.tap, T.tap + .25));
    p.pin.style.transform = `translateY(${pinY}px) scale(${pinS})`;
    p.nameEl.style.opacity = prog(dp, .15, .35);
    let lastF = dp >= .16 ? p.pop + .16 : -9; for (const f of FILLS) if (f.i === i && t >= f.t) lastF = Math.max(lastF, f.t);
    const dr = t - lastF; p.rip.style.opacity = dr < 1.1 ? (1 - dr / 1.1) : 0; p.rip.style.transform = `scale(${.5 + prog(dr, 0, 1.1) * 1.3})`;
    const linkK = p2o(prog(dp, .1, .5));
    for (const path of [p.link, p.glow]) { path.style.strokeDasharray = `${p.len} ${p.len}`; path.style.strokeDashoffset = p.len * (1 - linkK); path.style.opacity = ''; }
  });
  let fills = 216, income = 6000;
  FILLS.forEach(f => {
    const p = PTS[f.i], d = t - f.t, kp = prog(d, 0, .95);
    if (d >= 0 && d < .95) { const pt = p.link.getPointAtLength(p.len * E('power1.inOut')(kp)); f.g.setAttribute('transform', `translate(${pt.x},${pt.y}) scale(${1 / m.z})`); f.g.style.opacity = 1; } else f.g.style.opacity = 0;
    if (d >= .95) { fills++; income += f.a; }
    const [x, y] = mapToScreen(p.x, p.y), eo = d < 0 ? 0 : clamp(d / .12) * (1 - prog(d, .85, 1.15));
    set(f.earn, { opacity: eo, transform: `translate(${x + 46}px,${y - 110 - 50 * p2o(prog(d, 0, 1.1))}px) translate(-50%,-50%) scale(${d < 0 ? .6 : lerp(.6, 1, bOut(prog(d, 0, .3)))})` });
  });
  $('#npOn').textContent = online; $('#npTot').textContent = 7; $('#nOnline').textContent = online;
  $('#npFills').textContent = tr(fills); $('#npIncome').textContent = tr(income); $('#npAlert').style.opacity = 0;
  const d = t - T.tap;
  if (d < -.15 || d > .6) tap.style.opacity = 0;
  else {
    const [x, y] = mapToScreen(PTS[0].x, PTS[0].y);
    set(tap, { opacity: clamp((d + .15) / .1) * (1 - prog(d, .4, .6)), left: x + 'px', top: (y - 52 * mScale) + 'px' });
    tapDot.style.transform = `scale(${d < 0 ? 1.4 - (d + .15) / .15 * .4 : d < .12 ? 1 - .2 * d / .12 : .8})`;
    tapRing.style.transform = `scale(${d < 0 ? 1 : 1 + prog(d, 0, .45) * 1.6})`; tapRing.style.opacity = d < 0 ? 0 : 1 - prog(d, 0, .45);
  }
}
let rvTarget = [440, 225];
function updateStreet(t) {
  const on = inR(t, T.street - .05, T.c724); vis(appStreet, on); if (!on || !street) return;
  const u = (t - T.street) * ST_SPEED, s = S.st;
  const cam = { fx: s.fx, fy: s.fy, z: s.z, sx: 300, sy: 570 };
  street.draw(stCtx, u, cam, 2);
  stCanvas.style.filter = u < .35 ? `blur(${(1 - u / .35) * 8}px)` : 'none';
  const toScr = ([x, y]) => [cam.sx + (x - cam.fx) * cam.z, cam.sy + (y - cam.fy) * cam.z];
  coinCtx.setTransform(1, 0, 0, 1, 0, 0); coinCtx.clearRect(0, 0, 1200, 2600); coinCtx.setTransform(2, 0, 0, 2, 0, 0);
  let ciro = 3820, lastAmt = null, lastArrive = -9;
  for (const [pay, tx] of [[PAY_A, TX.A], [PAY_B, TX.B]]) {
    const from = toScr(READER);
    for (let i = 0; i < tx.count; i++) {
      const t0 = pay + .05 + i * COIN_STAGGER, kk = (u - t0) / COIN_FLIGHT;
      if (kk >= 1) { ciro += tx.coin; lastAmt = tx.amount; lastArrive = Math.max(lastArrive, t0 + COIN_FLIGHT); continue; }
      if (kk < 0) continue;
      const e = E('power2.in')(kk), spread = (i - tx.count / 2) * 7;
      const [x, y] = qbez([from[0] + spread, from[1] - 10], [lerp(from[0], rvTarget[0], .25) - 70 + spread, from[1] - 300], rvTarget, e);
      drawCoin(coinCtx, x, y, kk * 11 + i, Math.min(1, kk * 6) * (1 - prog(kk, .9, 1)), 15 - 4 * e);
    }
  }
  $('#rvLitre').textContent = tr(840 + (u >= .98 ? 19 : 0)); $('#rvCiro').textContent = tr(ciro);
  const dl = u - lastArrive;
  $('#rvLast').textContent = lastAmt ? `+₺${lastAmt}` : 'Canlı akış';
  $('.rv-trend').style.transform = `scale(${dl >= 0 && dl < .4 ? 1 + .18 * Math.sin(dl / .4 * Math.PI) : 1})`;
  $('#rvCiro').style.color = dl >= 0 && dl < .5 ? '#15803d' : '';
  const gain = (ciro - 3820) / 80;
  const pts = RV_BASE.map((v, i) => [i * 272 / 11, (i === 11 ? v - gain * 6 : i === 10 ? v - gain * 2 : v) + 1.2 * Math.sin(t * 2.4 + i)]);
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2; d += `C${cx} ${y0} ${cx} ${y1} ${x1} ${y1}`; }
  $('#rvLine').setAttribute('d', d); $('#rvFill').setAttribute('d', d + 'V38H0Z');
  $('#rvDot').setAttribute('cx', pts[11][0]); $('#rvDot').setAttribute('cy', pts[11][1]);
}

// --- 7/24
function updateInter(t) {
  const on = inR(t, T.c724, T.mach + .05); vis(inter, on); if (!on) return;
  const d = t - T.c724, kk = E('power3.out')(clamp(d / .6)), out = E('power2.in')(prog(t, T.mach - .25, T.mach + .05));
  set(inter, { opacity: clamp(d / .3) * (1 - out), transform: `translateY(${(1 - kk) * 70 - out * 60}px) scale(${lerp(.92, 1, kk) * (1 + .02 * d)})`, filter: 'none' });
  const k = S.inter.arc, C = 2 * Math.PI * 270;
  arc.style.strokeDasharray = C; arc.style.strokeDashoffset = C * (1 - k);
  const a = k * Math.PI * 2; arcHead.setAttribute('cx', 320 + Math.sin(a) * 270); arcHead.setAttribute('cy', 320 - Math.cos(a) * 270); arcHead.style.opacity = k > .01 && k < .995 ? 1 : 0;
  $$('#iTicks line').forEach(l => l.classList.toggle('on', +l.dataset.k <= k));
}

// --- bildirim yığını
function updateNotifs(t) {
  NT.forEach((nn, i) => {
    const d = t - nn.t;
    if (d < 0 || t > T.offer) { nn.el.style.visibility = 'hidden'; return; }
    nn.el.style.visibility = 'visible';
    let shift = 0; for (let j = i + 1; j < NT.length; j++) shift += eOut(prog(t - NT[j].t, 0, .4));
    const kin = E('back.out(1.25)')(prog(d, 0, .45)), out = p2i(prog(t, T.dashOut + (NT.length - 1 - i) * .03, T.dashOut + .3));
    const y = NOTIF_TOP + shift * NOTIF_STEP - (1 - kin) * 170 - out * 160;
    set(nn.el, { opacity: clamp(d / .1) * (1 - out) * (1 - .1 * shift), transform: `translate(${(W - 980) / 2}px,${y}px) scale(${(1 - .03 * shift) * lerp(.9, 1, kin) * (1 + .2 * out)})`, filter: out > .02 ? `blur(${out * 10}px)` : 'none' });
  });
}

// --- kampanya kartları (yumuşak kayan karusel) + özet
function updatePerks(t) {
  PCARDS.forEach((c, i) => {
    const tIn = c.t0, tOut = c.t1;
    const on = c.intro ? inR(t, tIn, tOut + .25) : inR(t, tIn - .22, tOut + .25); vis(c.el, on); if (!on) return;
    const kIn = c.intro ? 1 : E('power3.inOut')(prog(t, tIn - .22, tIn + .2)), kOut = E('power3.inOut')(prog(t, tOut - .2, tOut + .22));
    set(c.el, { transform: `translateX(${((1 - kIn) * 1080 - kOut * 340).toFixed(1)}px)`, filter: kOut > .01 ? `brightness(${1 - .3 * kOut})` : 'none' });
    if (c.intro) return;
    const d = t - tIn, ki = E('back.out(1.8)')(clamp((d + .05) / .4)), kt = E('power3.out')(clamp((d - .02) / .45)), km = E('power3.out')(clamp((d - .06) / .5)), kc = E('back.out(2.4)')(clamp((d - .18) / .35));
    c.ic.style.transform = `scale(${ki.toFixed(3)})`;
    set(c.top, { opacity: clamp((d - .02) / .2), transform: `translateY(${((1 - kt) * 50).toFixed(1)}px)` });
    set(c.main, { opacity: clamp((d - .06) / .22), transform: `translateY(${((1 - km) * 80).toFixed(1)}px)`, filter: 'none' });
    c.ck.style.transform = `scale(${d < .18 ? 0 : kc.toFixed(3)})`;
    c.ix.style.opacity = .75;
  });
  const ron = inR(t, T.recap - .2, T.ask + .3); vis(recap, ron);
  if (ron) {
    const out = p2i(prog(t, T.ask - .05, T.ask + .25));
    recap.style.opacity = 1 - out; recap.style.transform = `translateY(${-out * 80}px)`; recap.style.filter = 'none';
    RC.forEach(r => {
      const d = t - r.t, k = E('power3.out')(clamp(d / .5));
      set(r.el, { opacity: clamp(d / .2), transform: `translateY(${((1 - k) * 90).toFixed(1)}px)` });
      const kc = E('back.out(2.4)')(clamp((d - .15) / .35)); r.pc.style.transform = `scale(${d < .15 ? 0 : kc.toFixed(3)})`;
      r.shine.style.transform = `translateX(${p3io(prog(d, .2, .9)) * 1300}px)`;
    });
  }
}

// --- fiyat + son kart
function updatePrice(t) {
  const on = t >= T.key - .05; vis($('#price'), on); vis($('#endLogo'), on); vis(mq, on); vis(endUrl, on);
  if (!on) return;
  const pr = S.pr, centerAt = (el, y) => { el.style.top = (y - el.offsetHeight / 2) + 'px'; };
  centerAt(pOld, pr.oldY); centerAt(pNew, pr.newY); centerAt(pKicker, PP.e.kick); centerAt(pSent, PP.e.sent); centerAt(pTaksit, PP.e.tak);
  centerAt(pTak1, PP.p.tak1); centerAt(pTak2, PP.p.tak2);
  pOld.firstElementChild.style.transform = `scale(${pr.oldS})`; pNew.firstElementChild.style.transform = `scale(${pr.newS})`;
  const nw = pNew.firstElementChild.offsetWidth * pr.newS, tw = pTag.offsetWidth;
  set(pTag, { left: Math.min(W / 2 + nw / 2 - tw * .6, W - 30 - tw) + 'px', top: (-50 + (1 - pr.newS) * 70) + 'px' });
  const mqw = mqIn.scrollWidth / 3;
  mqIn.style.transform = `translateX(${-(((t - T.endMq) * 70) % mqw) - 40}px)`;
  // kapanış vurgusu
  const ds = t - T.sting, sp = ds >= 0 && ds < .6 ? Math.sin(ds / .6 * Math.PI) : 0;
  $('#endLogo').style.filter = `drop-shadow(0 10px 30px rgba(0,10,40,.45)) brightness(${1 + .5 * sp})`;
}

// --- filigran, zerreler, gren
const wm = createWatermark($('#wmCanvas'));
function updateWatermark(t) {
  const o = anyOn(BLUE_ON, t) ? .04 : anyOn(NAVY_ON, t) && t >= T.c724 ? .03 : 0;
  wm.draw(t * 1000, o, null);
}
const motes = $('#motes'), mctx = motes.getContext('2d');
function drawMotes(t) {
  mctx.setTransform(1, 0, 0, 1, 0, 0); mctx.clearRect(0, 0, W, H);
  if (!anyOn(NAVY_ON, t)) return;
  const g = t >= T.key ? S.key.glow : 0;
  for (let i = 0; i < 54; i++) {
    const big = i < 10, r = big ? 26 + hash(i * 13 + 3) * 34 : 2.2 + hash(i * 13 + 3) * 4.5;
    const sp = (big ? 14 : 26) + hash(i * 7 + 2) * (big ? 22 : 64), span = H + 300;
    const x = hash(i * 3 + 1) * W + Math.sin(t * .55 + i * 1.7) * 26 + (hash(i * 5) - .5) * g * 90;
    const y = ((hash(i * 11 + 5) * span - t * sp) % span + span) % span - 150;
    const a = (big ? .05 + .06 * hash(i * 17) : .22 + .45 * hash(i * 17)) * (1 + 1.6 * g) * (.7 + .3 * Math.sin(t * 2.1 + i));
    const gr = mctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(186,230,253,${Math.min(1, a).toFixed(3)})`); gr.addColorStop(1, 'rgba(186,230,253,0)');
    mctx.fillStyle = gr; mctx.beginPath(); mctx.arc(x, y, r, 0, Math.PI * 2); mctx.fill();
  }
}
const grainTiles = [];
function buildGrain() { for (let i = 0; i < 4; i++) { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), d = g.createImageData(256, 256); for (let j = 0; j < d.data.length; j += 4) { const v = 128 + (hash(j * 3 + i * 101) - .5) * 255; d.data[j] = d.data[j + 1] = d.data[j + 2] = v; d.data[j + 3] = 255; } g.putImageData(d, 0, 0); grainTiles.push(c.toDataURL()); } }
function updateGrain(t) { const g = $('#grain'); g.style.backgroundImage = `url(${grainTiles[Math.floor(t * 30) % 4]})`; g.style.opacity = anyOn(LIGHT_ON, t) ? .025 : .05; }

function update(t) {
  updateBg(t); updateKey(t); updatePerde(t); updateProd(t); updatePhone(t); updateMap(t); updateStreet(t);
  updateInter(t); updateNotifs(t); updatePerks(t); updatePrice(t); updateWipes(t); updateGrain(t);
  for (const r of PH) renderPhrase(r, t);
}

/* ------------------------------------------------------------ seek */
const decodeImg = i => (i.src ? (i.complete ? (i.decode ? i.decode().catch(() => { }) : 0) : new Promise(r => { i.onload = i.onerror = r; })) : 0);
window.seek = async t => {
  tl.seek(t, false); update(t);
  await Promise.all([perde, keyImg, prodImg].map(decodeImg));
  updateWatermark(t); drawMotes(t);
};
window.ready = (async () => {
  await document.fonts.load('700 100px "Lemon Milk"'); await document.fonts.load('italic 400 100px "Instrument Serif"'); await document.fonts.load('italic 400 100px "Instrument Serif"', 'ğşİ');
  for (const w of [300, 400, 500, 700, 800]) await document.fonts.load(`${w} 100px Outfit`, 'aŞğİı');
  await document.fonts.ready;
  [TRACKS, KEYC] = await Promise.all([fetch('assets/seq/kampanya/tracks.json').then(r => r.json()), fetch('assets/seq/keypng/centers.json').then(r => r.json())]);
  buildGrain();
  for (const r of PH) fitPh(r, r.o.fit || 1000);
  $$('.pcard .pc-main').forEach(el => fit(el, 1000));
  street = await createStreet();
  // ciro hedefi (telefon ekranı koordinatı)
  { const prev = phoneWrap.style.transform; phoneWrap.style.transform = 'none'; phone.style.transform = 'none';
    const sr = screen.getBoundingClientRect(), r = $('#rvCiro').getBoundingClientRect(); rvTarget = [r.left - sr.left + r.width * .45, r.top - sr.top + r.height * .5]; phoneWrap.style.transform = prev; }
  await Promise.all($$('img').filter(i => i.getAttribute('src')).map(i => i.decode().catch(() => { })));
  await window.seek(0);
  return true;
})();
