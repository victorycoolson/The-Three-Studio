/* SULOOK Neo — V4 dikey (1080×1920), 40 sn, 120 BPM kinetik kurgu. Deterministik: window.seek(t). */
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
  sBu: .5, sNeyi: 1.0, sAciyor: 1.5,
  perde: 2.0, p1: 2.0, p2: 2.75, p3: 3.5,
  reveal: 4.0, rSub: 5.0,
  // ağ → sokak
  map: 6.0, mT1: 6.2, mT2: 7.0, pull: 8.0, mT3: 8.25, tap: 9.2, zoom: 9.35, zoomEnd: 9.85,
  street: 9.85, sT1: 10.4, sT2: 11.4,
  c724: 12.5, c724b: 13.0,
  // makine montajı
  mach: 14.0, gpd: 15.0, depo: 16.0, kabin: 17.0, led: 18.0, kart: 19.0,
  dash: 20.0, notif: 22.0, notifGap: .3, dashOut: 23.6,
  // kampanya
  offer: 24.0, perk0: 24.5, perkGap: .5, recap: 27.0,
  // fiyat
  ask: 29.0, ask2: 29.5, ask3: 30.0,
  key: 925.5 / 30,                     // 30 fps çıktı karesi k = 60 fps alt-kareler (2k−1, 2k) → PNG n = çıktı karesi 925+n
  price: 31.0, strike: 31.5,
};
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
const HITS = [[.5, 10], [1.0, 12], [1.5, 18], [2.0, 8], [2.75, 8], [3.5, 14], [4.0, 26], [6.0, 10], [7.0, 14], [10.4, 8], [11.4, 12], [12.5, 14],
  [14.0, 22], [15.0, 12], [16.0, 12], [17.0, 12], [18.0, 10], [19.0, 10], [20.0, 6], [24.0, 16], [24.5, 8], [25.0, 8], [25.5, 8], [26.0, 8], [26.5, 8], [27.0, 8],
  [29.0, 12], [29.5, 12], [30.0, 22], [31.0, 14], [31.5, 12], [32.0, 30], [32.5, 10], [33.0, 10], [38.0, 8]];
function shake(t) {
  let x = 0, y = 0;
  for (const [h, a] of HITS) { const d = t - h; if (d < 0 || d > .4) continue; const env = a * Math.exp(-d * 12); x += env * Math.sin(d * 95 + h * 7); y += env * Math.cos(d * 83 + h * 3); }
  return [x, y];
}
const GROOVE = [[4.0, 12.5], [14.0, 29.0], [32.0, 39.5]];
function pulse(t) { if (!GROOVE.some(([a, b]) => t >= a && t < b)) return 0; const f = t % BEAT; return Math.exp(-f * 11); }
const FLASH = [[2.0, .22], [4.0, .9], [9.8, .8], [12.5, .3], [14.0, .75], [32.0, .5], [38.0, .25]];
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

/* ------------------------------------------------------------ tipografi motoru: "slam" */
const typeLayer = $('#type'), SL = [];
function slam(html, cls, top, t0, t1, o = {}) {
  const el = document.createElement('div'); el.className = 'sl ' + cls; el.innerHTML = html;
  set(el, { top: top + 'px', fontSize: (o.size || 100) + 'px' });
  (o.parent || typeLayer).appendChild(el);
  const r = { el, t0, t1, o }; SL.push(r); return r;
}
function renderSlam({ el, t0, t1, o }, t) {
  const d = t - t0;
  if (d < 0 || t >= t1) { el.style.visibility = 'hidden'; return; }
  el.style.visibility = 'visible';
  const k = eOut(clamp(d / (o.dur || .2)));
  let s = lerp(o.from ?? 1.45, 1, k) * (1 + (o.drift ?? .03) * d), x = (o.dx || 0) * (1 - k), y = (o.dy || 0) * (1 - k);
  let op = clamp(d / .04), blur = (1 - k) * (o.blur ?? 16);
  const X = o.exit || 'cut', xd = o.xdur || .18, r = t1 - t;
  if (X !== 'cut' && r < xd) {
    const q = p2i(1 - r / xd);
    if (X === 'up') { y -= 110 * q; op *= 1 - q; blur += 8 * q; }
    if (X === 'zoom') { s *= 1 + .6 * q; op *= 1 - q; blur += 16 * q; }
    if (X === 'fade') op *= 1 - q;
    if (X === 'left') { x -= 420 * q; op *= 1 - q; }
  }
  el.style.opacity = op;
  el.style.transform = `translate(${x}px,${y}px) scale(${s})${o.rot ? ` rotate(${o.rot}deg)` : ''}`;
  el.style.filter = blur > .4 ? `blur(${blur.toFixed(1)}px)` : 'none';
}
// genişliğe sığdır (Lemon Milk geniş bir yazı tipi)
function fit(el, maxW) {
  const fs = parseFloat(el.style.fontSize || getComputedStyle(el).fontSize), pw = el.style.width, pr = el.style.right;
  el.style.transform = 'none'; el.style.width = 'max-content'; el.style.right = 'auto';
  const w = el.getBoundingClientRect().width; el.style.width = pw; el.style.right = pr;
  if (w > maxW) el.style.fontSize = (fs * maxW / w).toFixed(1) + 'px';
}

/* ============================================================ 1 · KANCA: "Bu anahtar neyi açıyor?" */
slam('BU ANAHTAR', 'LM c-w glow', 170, T.sBu, T.perde, { size: 112, from: 1.6 });
slam('NEYİ', 'LM c-c glow', 1380, T.sNeyi, T.perde, { size: 190, from: 1.7, blur: 20 });
slam('AÇIYOR?', 'LM c-w glow', 1580, T.sAciyor, T.perde, { size: 190, from: 1.9, blur: 24 });
// perde: "Bir dükkânı değil. Bir ofisi değil. Kendi işini."
slam('BİR DÜKKÂNI<br>DEĞİL.', 'LM c-w shadow', 1330, T.p1, T.p2, { size: 104, from: 1.35, dy: 40 });
slam('BİR OFİSİ<br>DEĞİL.', 'LM c-w shadow', 1330, T.p2, T.p3, { size: 104, from: 1.35, dy: 40 });
slam('KENDİ<br>İŞİNİ.', 'LM c-c glow', 1290, T.p3, T.reveal, { size: 170, from: 1.8, blur: 22 });

/* ============================================================ 2 · ÜRÜN AÇILIŞI */
slam('SULOOK', 'LM c-w shadow', 190, T.reveal + .08, T.map, { size: 96, from: 1.3, exit: 'up' });
slam('YENİ NESİL', 'LM c-l shadow', 1600, T.rSub, T.map, { size: 62, from: 1.3, exit: 'up' });
slam('OTOMAT İŞLETMECİLİĞİ.', 'LM c-w shadow', 1680, T.rSub + .25, T.map, { size: 62, from: 1.3, exit: 'up', fit: 980 });
const bigTxt = $('#bigTxt');
const BIG = [
  { t: T.reveal, html: '<span class="bt grad" style="font-size:390px">NEO.</span>', top: 300 },
  { t: T.mach, html: '<span class="bt c-w" style="font-size:156px">YENİLENEN</span><span class="bt c-c" style="font-size:156px">YÜZÜYLE</span>', top: 250 },
  { t: T.gpd, html: '<span class="bt grad" style="font-size:430px" data-n="1330">1330</span>', top: 300, count: 1330 },
  { t: T.depo, html: '<span class="bt grad" style="font-size:430px" data-n="160">160 L</span>', top: 300, count: 160, suffix: ' L' },
  { t: T.kabin, html: '<span class="bt grad" style="font-size:320px">KABİN</span>', top: 230 },
  { t: T.led, html: '<span class="bt grad" style="font-size:520px">LED</span>', top: 250 },
  { t: T.kart, html: '<span class="bt grad" style="font-size:420px">KART</span>', top: 300 },
];
const BIG_OFF = [[T.map, T.mach], [T.dash, 1e9]];
const LABELS = [
  { t: T.gpd, b: 'GPD ARITMA KAPASİTESİ' }, { t: T.depo, b: 'DEPO KAPASİTESİ' }, { t: T.kabin, b: 'DOLUM KABİNİ', st: 'door' },
  { t: T.led, b: 'LED AYDINLATMA', st: 'led' }, { t: T.kart, b: 'KARTLI ÖDEME' },
];

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
S.map = { fx: HUB[0], fy: HUB[1], z: 1.25 };
tl.to(S.map, { fx: 780, fy: 470, z: .84, duration: 1.9, ease: 'power3.out' }, T.map);
tl.to(S.map, { fx: 860, fy: 460, z: .9, duration: T.tap - T.map - 1.9, ease: 'sine.inOut' }, T.map + 1.9);
tl.to(S.map, { fx: PTS[0].x, fy: PTS[0].y - 40, z: 5.2, duration: T.zoomEnd - T.zoom, ease: 'power4.in' }, T.zoom);
const tap = $('#tap'), [tapDot, tapRing] = $$('#tap i');
slam('ŞEHRİN HER<br>NOKTASINDAN', 'LM c-n', 150, T.mT1, T.pull, { size: 78, from: 1.3, exit: 'up' });
slam('PASİF GELİR.', 'LM c-b', 345, T.mT2, T.pull, { size: 150, from: 1.8, blur: 20, exit: 'up', fit: 940 });
slam('HEPSİNİ', 'LM c-n', 140, T.mT3, T.zoom + .3, { size: 100, from: 1.4, exit: 'up' });
slam('TELEFONUNDAN', 'LM c-b', 255, T.mT3 + .25, T.zoom + .3, { size: 100, from: 1.4, exit: 'up', fit: 1000 });
slam('YÖNET.', 'LM c-n', 370, T.mT3 + .5, T.zoom + .3, { size: 160, from: 1.8, blur: 20, exit: 'up' });
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
slam('KENDİ KENDİNE', 'LM c-n', 1500, T.sT1, T.sT2, { size: 100, from: 1.4, fit: 1000 });
slam('SATAR,', 'LM c-n', 1610, T.sT1 + .25, T.sT2, { size: 100, from: 1.4 });
slam('SEN', 'LM c-b', 1470, T.sT2, T.c724, { size: 110, from: 1.6 });
slam('KAZANIRSIN.', 'LM c-b', 1590, T.sT2 + .18, T.c724, { size: 140, from: 1.9, blur: 22, fit: 1010 });

/* ============================================================ 4 · 7/24 */
const inter = $('#inter'), arc = $('#iArc'), arcHead = $('#iHead');
{ const tk = $('#iTicks'); for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2, r0 = i % 4 ? 268 : 258, r1 = 282;
    const l = document.createElementNS(SVGNS, 'line'); l.setAttribute('x1', 320 + Math.sin(a) * r0); l.setAttribute('y1', 320 - Math.cos(a) * r0); l.setAttribute('x2', 320 + Math.sin(a) * r1); l.setAttribute('y2', 320 - Math.cos(a) * r1); l.dataset.k = i / 48; tk.appendChild(l); } }
S.inter = { arc: 0 };
tl.to(S.inter, { arc: 1, duration: .55, ease: 'power2.inOut' }, T.c724 + .02);
slam('SEN UYURKEN BİLE', 'LM c-w', 1230, T.c724b, T.mach, { size: 70, from: 1.3, fit: 980 });
slam('KAZANMAYA DEVAM.', 'LM c-c glow', 1330, T.c724b + .25, T.mach, { size: 70, from: 1.3, fit: 980 });

/* ============================================================ 5 · MAKİNE MONTAJI (her vuruşta yeni kadraj) */
const AX = 557, AY = 965;
// kadraj: render noktası (ax,ay) sahnede (sx,sy)'ye; 'c' = ürün merkezi; tween: önceki kadrajdan geçiş süresi
const SHOTS = [
  { t: T.reveal, s: 1.0, a: 'c', sx: 540, sy: 1060 },
  { t: T.mach, s: .95, a: 'c', sx: 540, sy: 1030 },
  { t: T.gpd, s: 1.08, a: 'c', sx: 660, sy: 1090 },
  { t: T.depo, s: 1.08, a: 'c', sx: 420, sy: 1090 },
  { t: T.kabin, s: 1.12, a: 'cabin', sx: 640, sy: 1010 },
  { t: T.led, s: 1.2, a: 'led', sx: 540, sy: 780 },
  { t: T.kart, s: 1.02, a: 'c', sx: 540, sy: 1040 },
  { t: T.dash, s: .86, a: 'c', sx: 318, sy: 1150, tween: .45 },
];
const PROD_A = [[T.reveal, 15], [T.reveal + .55, 35]];
const PROD_B = [[T.mach, 35], [T.mach + .8, 62], [T.kabin - .05, 88], [T.kabin, 90], [T.kabin + .5, 106], [T.led, 108], [T.dash - .1, 150]];
const ledOff = $('#ledOff'), ledGlow = $('#ledGlow'), ledWash = $('#ledWash'), ledDim = $('#ledDim');
const LED_STATES = [[T.led, 0], [T.led + .25, 1], [T.led + .5, 0], [T.led + .75, 1]];
const mLabel = $('#mLabel'), mlB = $('b', mLabel), mlSt = $('.st', mLabel);
const cardFly = $('#cardFly'), tapSvg = $('#tapSvg');
const WAVES = [0, 1, 2].map(() => { const c = document.createElementNS(SVGNS, 'circle'); tapSvg.appendChild(c); return c; });

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
const perkSlam = $('#perkSlam'), PCARDS = [];
{ // giriş kartı
  const el = document.createElement('div'); el.className = 'pcard pc-white';
  el.innerHTML = `<div class="sl LM c-b" style="top:760px;font-size:150px">KAMPANYAYA</div><div class="sl LM c-n" style="top:930px;font-size:200px">ÖZEL</div>`;
  perkSlam.appendChild(el); PCARDS.push({ el, t0: T.offer, t1: T.perk0, intro: true });
}
PK.forEach((p, i) => {
  const el = document.createElement('div'); el.className = 'pcard ' + PK_SKIN[i];
  el.innerHTML = `<div class="pc-ix">${String(i + 1).padStart(2, '0')} / 05</div><div class="pc-ic"><svg><use href="#${p[0]}"/></svg></div><div class="pc-top">${PK_TOP[i]}</div><div class="pc-main">${PK_MAIN[i]}</div><div class="pc-ck"><svg><use href="#i-check"/></svg></div>`;
  perkSlam.appendChild(el);
  PCARDS.push({ el, t0: T.perk0 + i * T.perkGap, t1: T.perk0 + (i + 1) * T.perkGap, ic: $('.pc-ic', el), top: $('.pc-top', el), main: $('.pc-main', el), ck: $('.pc-ck', el), ix: $('.pc-ix', el) });
});
// özet listesi
const recap = $('#recap'), pkList = $('.pk-list', recap);
const RC = PK.map(([ic, top, main], i) => {
  const el = document.createElement('div'); el.className = 'perk';
  el.innerHTML = `<span class="pi"><svg><use href="#${ic}"/></svg></span><span class="pt"><small>${top}</small>${main}</span><span class="pc"><svg><use href="#i-check"/></svg></span><i class="shine"></i>`;
  pkList.appendChild(el); return { el, pc: $('.pc', el), shine: $('.shine', el), t: T.recap + .05 + i * .1 };
});
slam('KAMPANYAYA ÖZEL', 'LM c-l', 360, T.recap, T.ask, { size: 52, from: 1.2, exit: 'up' });

/* ============================================================ 8 · "PEKİ TÜM BUNLAR KAÇA?" */
slam('PEKİ', 'LM c-c glow', 600, T.ask, T.key - .05, { size: 130, from: 1.6, exit: 'zoom' });
slam('TÜM BUNLAR', 'LM c-w glow', 760, T.ask2, T.key - .05, { size: 120, from: 1.6, exit: 'zoom', fit: 1000 });
slam('KAÇA?', 'LM grad', 920, T.ask3, T.key - .05, { size: 330, from: 2.2, blur: 28, exit: 'zoom', drift: .08 });

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
const NAVY_ON = [[0, T.reveal], [T.c724, T.mach], [T.recap, 1e9]], BLUE_ON = [[T.reveal, T.map], [T.mach, T.offer]], LIGHT_ON = [[T.map, T.c724]];
const anyOn = (R, t) => R.some(([a, b]) => t >= a && t < b);
function updateBg(t) {
  vis($('#bgNavy'), anyOn(NAVY_ON, t)); vis($('#bgBlue'), anyOn(BLUE_ON, t)); vis($('#bgLight'), anyOn(LIGHT_ON, t));
  vis($('#light'), anyOn(LIGHT_ON, t));
  const [sx, sy] = shake(t), pz = 1 + .014 * pulse(t);
  world.style.transform = `translate(${sx * .6}px,${sy * .6}px) scale(${pz})`;
  $('#flash').style.opacity = flashAt(t);
  const note = $('#note'), non = inR(t, T.map + .3, T.c724) || inR(t, T.dash + .4, T.dashOut);
  vis(note, non); note.classList.toggle('dark', t < T.c724);
}

// --- anahtar (kanca + fiyat/son)
function updateKey(t) {
  const hook = t < T.perde, main = t >= T.key - .05;
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
  keyScene.style.opacity = hook ? clamp(t / .12) * (1 - prog(t, T.perde - .08, T.perde)) : 1;
}

// --- perde
function updatePerde(t) {
  const on = inR(t, T.perde - .02, T.reveal + .05); vis($('#sPerde'), on); if (!on) return;
  const u = t - T.perde, f = Math.min(241, 60 + Math.floor(u * 24));
  setFrame(perde, 'perde', `assets/seq/perde/${String(f).padStart(4, '0')}.jpg`);
  perde.style.transform = `scale(${1.12 + u * .05}) rotate(${-.6 + u * .3}deg)`;
  // ilk anda yana savrulma (whip) girişi
  const wk = 1 - eOut(clamp(u / .25));
  $('#sPerde').style.transform = `translateX(${wk * 260}px)`; $('#sPerde').style.filter = wk > .02 ? `blur(${wk * 18}px)` : 'none';
}

// --- ürün
const prodCam = $('#prodCam');
function shotAt(t) { let i = -1; for (let j = 0; j < SHOTS.length; j++) if (t >= SHOTS[j].t) i = j; return i; }
function shotCam(sh, t) {
  const n = 0; let ax = AX, ay = AY;
  if (sh.a === 'cabin') [ax, ay] = track('cabin', 98); else if (sh.a === 'led') [ax, ay] = track('led', 112);
  const d = t - sh.t, punch = sh.tween ? 1 : 1 + .07 * Math.exp(-d * 14), drift = 1 + .03 * d;
  return { s: sh.s * punch * drift, ax, ay, sx: sh.sx, sy: sh.sy };
}
function updateProd(t) {
  const on = inR(t, T.reveal, T.map) || inR(t, T.mach, T.offer);
  vis(prodCam, on); vis(ledDim, on && inR(t, T.led, T.kart)); vis(mLabel, false); vis(cardFly, false); vis(tapSvg, false);
  if (!on) { vis(bigTxt, false); return; }
  const n = t < T.map ? mapF(t, PROD_A) : mapF(t, PROD_B); S.prodN = n;
  setFrame(prodImg, 'prod', `assets/seq/kampanya/${String(n).padStart(4, '0')}.webp`);
  const i = shotAt(t), sh = SHOTS[i];
  let c = shotCam(sh, t);
  if (sh.tween) { const prev = shotCam(SHOTS[i - 1], sh.t), k = p3io(prog(t, sh.t, sh.t + sh.tween)); c = { s: lerp(prev.s, sh.s, k), ax: lerp(prev.ax, AX, k), ay: lerp(prev.ay, AY, k), sx: lerp(prev.sx, sh.sx, k), sy: lerp(prev.sy, sh.sy, k) }; }
  let o = 1, blur = 0;
  if (t >= T.dashOut) { const q = p2i(prog(t, T.dashOut, T.offer)); c.s *= 1 + .5 * q; o = 1 - q; blur = 14 * q; }
  if (t < T.map && t > T.map - .2) { const q = prog(t, T.map - .2, T.map); o = 1 - q; }
  S.cam = c;
  prodCam.style.transform = `translate(${c.sx - c.ax * c.s}px,${c.sy - c.ay * c.s}px) scale(${c.s})`;
  prodCam.style.opacity = o; prodCam.style.filter = blur > .3 ? `blur(${blur}px)` : 'none';
  // reveal: dönerek gelirken hafif bulanıklıktan netleşme
  if (t < T.reveal + .6) { const q = 1 - eOut(prog(t, T.reveal, T.reveal + .5)); prodCam.style.filter = q > .02 ? `blur(${q * 14}px)` : 'none'; }
  // dev yazı (ürünün arkasında)
  const bOff = BIG_OFF.some(([a, b]) => t >= a && t < b);
  let bi = -1; for (let j = 0; j < BIG.length; j++) if (t >= BIG[j].t) bi = j;
  vis(bigTxt, !bOff && bi >= 0);
  if (!bOff && bi >= 0) {
    const B = BIG[bi], d = t - B.t;
    if (bigTxt.dataset.i !== String(bi)) { bigTxt.innerHTML = B.html; bigTxt.dataset.i = bi; }
    if (B.count) { const sp = $('[data-n]', bigTxt); sp.textContent = tr(B.count * p2o(prog(d, 0, .4))).replace(/\./g, '') + (B.suffix || ''); }
    const k = eOut(clamp(d / .22)), s = lerp(1.35, 1, k) * (1 + .035 * d), dx = (bi % 2 ? -1 : 1) * 30 * d;
    let bo = clamp(d / .05);
    if (t >= T.dashOut) bo *= 1 - prog(t, T.dashOut, T.offer);
    set(bigTxt, { top: B.top + 'px', opacity: bo, transform: `translateX(${dx}px) scale(${s})`, filter: k < .98 ? `blur(${(1 - k) * 18}px)` : 'none' });
  }
  // LED
  let led = 1; for (const [ts, v] of LED_STATES) if (t >= ts) led = v;
  let lastOn = -9; for (const [ts, v] of LED_STATES) if (v && t >= ts) lastOn = ts;
  const ledT = inR(t, T.led, T.dash) && n >= TRACKS.first;
  vis(ledOff, ledT && !led); vis(ledGlow, ledT && !!led); vis(ledWash, ledT && !!led);
  if (ledT) {
    const len = alongLed(ledOff, n, 0, 0, 1, 0), th = len * .052;
    alongLed(ledOff, n, len * .015, len * .015, th, len * .004);
    alongLed(ledGlow, n, len * .16, len * .16, th * 9, 0);
    alongLed(ledWash, n, len * .05, len * .05, len * .9, len * .45);
    const dl = t - lastOn;
    ledGlow.style.opacity = led ? .3 + .7 * Math.exp(-dl * 3.2) : 0; ledWash.style.opacity = led ? .7 * Math.exp(-dl * 2) : 0;
    ledDim.style.opacity = led ? .0 : .5;
  }
  // etiket
  let li = -1; for (let j = 0; j < LABELS.length; j++) if (t >= LABELS[j].t) li = j;
  if (li >= 0 && t < T.dash) {
    const L = LABELS[li], d = t - L.t, k = eOut(clamp(d / .25));
    vis(mLabel, true); mlB.textContent = L.b;
    if (L.st) { const isOn = L.st === 'led' ? !!led : n < 98; mlSt.textContent = isOn ? 'AÇIK' : 'KAPALI'; mlSt.classList.toggle('off', !isOn); } else mlSt.textContent = '';
    set(mLabel, { opacity: clamp(d / .05), transform: `translateY(${(1 - k) * 60}px) scale(${lerp(1.2, 1, k)})` });
  }
  // kartla ödeme: kart terminale uçar, temassız dalgalar
  if (inR(t, T.kart, T.dash)) {
    const [tx, ty] = track('term', n), X = c.sx + (tx - c.ax) * c.s, Y = c.sy + (ty - c.ay) * c.s, d = t - T.kart;
    const k = E('power3.out')(prog(d, .05, .32)), x = lerp(1250, X + 40, k), y = lerp(1500, Y + 20, k);
    vis(cardFly, d >= .05);
    set(cardFly, { transform: `translate(${x - 75}px,${y - 48}px) rotate(${lerp(30, -8, k)}deg) scale(${1 - .1 * prog(d, .32, .4)})`, opacity: 1 - prog(d, .75, .95) });
    vis(tapSvg, d > .3);
    WAVES.forEach((w, j) => { const q = prog(d, .32 + j * .1, .8 + j * .1); w.setAttribute('cx', X); w.setAttribute('cy', Y); w.setAttribute('r', 20 + q * 150); w.style.opacity = q > 0 && q < 1 ? (1 - q) * .9 : 0; });
  }
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
  const cam = { fx: s.fx, fy: s.fy, z: s.z, sx: 300, sy: 640 };
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
  const on = inR(t, T.c724, T.mach); vis(inter, on); if (!on) return;
  const d = t - T.c724, kk = eOut(clamp(d / .25));
  set(inter, { opacity: clamp(d / .05), transform: `scale(${lerp(1.4, 1, kk) * (1 + .03 * d)})`, filter: kk < .98 ? `blur(${(1 - kk) * 16}px)` : 'none' });
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

// --- kampanya kartları + özet
function updatePerks(t) {
  PCARDS.forEach((c, i) => {
    const on = inR(t, c.t0, c.t1); vis(c.el, on);
    if (!on) { if (c.intro) $$('.sl', c.el).forEach(s => { s.style.visibility = 'hidden'; }); return; }
    const d = t - c.t0;
    if (c.intro) { $$('.sl', c.el).forEach((s, j) => { const k = eOut(clamp((d - j * .12) / .2)); set(s, { visibility: d >= j * .12 ? 'visible' : 'hidden', transform: `scale(${lerp(1.6, 1, k) * (1 + .05 * d)})`, filter: k < .98 ? `blur(${(1 - k) * 18}px)` : 'none' }); }); return; }
    const ki = bOut(clamp(d / .22)), kt = eOut(clamp((d - .04) / .2)), kc = E('back.out(3)')(clamp((d - .16) / .2));
    c.ic.style.transform = `scale(${ki}) rotate(${(1 - ki) * -25}deg)`;
    set(c.top, { opacity: clamp((d - .03) / .06), transform: `translateY(${(1 - kt) * 40}px)` });
    set(c.main, { opacity: clamp((d - .05) / .06), transform: `scale(${lerp(1.35, 1, kt) * (1 + .04 * d)})`, filter: kt < .98 ? `blur(${(1 - kt) * 14}px)` : 'none' });
    c.ck.style.transform = `scale(${d < .16 ? 0 : kc})`;
    c.ix.style.opacity = .75;
    c.el.style.transform = `translateX(${(1 - eOut(clamp(d / .12))) * 120 * (i % 2 ? -1 : 1)}px)`;
  });
  const ron = inR(t, T.recap, T.ask + .3); vis(recap, ron);
  if (ron) {
    const out = p2i(prog(t, T.ask - .05, T.ask + .25));
    recap.style.opacity = 1 - out; recap.style.transform = `scale(${1 + .15 * out})`; recap.style.filter = out > .02 ? `blur(${out * 12}px)` : 'none';
    RC.forEach(r => {
      const d = t - r.t, k = eOut(clamp(d / .3));
      set(r.el, { opacity: clamp(d / .06), transform: `translateX(${(1 - k) * -360}px) skewX(${(1 - k) * -12}deg)` });
      const kc = E('back.out(3)')(clamp((d - .12) / .3)); r.pc.style.transform = `scale(${d < .12 ? 0 : kc}) rotate(${(1 - kc) * -90}deg)`;
      r.shine.style.transform = `translateX(${p3io(prog(d, .15, .8)) * 1300}px)`;
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
  for (const r of SL) renderSlam(r, t);
}

/* ------------------------------------------------------------ seek */
const decodeImg = i => (i.src ? (i.complete ? (i.decode ? i.decode().catch(() => { }) : 0) : new Promise(r => { i.onload = i.onerror = r; })) : 0);
window.seek = async t => {
  tl.seek(t, false); update(t);
  await Promise.all([perde, keyImg, prodImg].map(decodeImg));
  updateWatermark(t); drawMotes(t);
};
window.ready = (async () => {
  await document.fonts.load('700 100px "Lemon Milk"'); await document.fonts.load('400 100px Outfit'); await document.fonts.load('700 100px Outfit'); await document.fonts.ready;
  [TRACKS, KEYC] = await Promise.all([fetch('assets/seq/kampanya/tracks.json').then(r => r.json()), fetch('assets/seq/keypng/centers.json').then(r => r.json())]);
  buildGrain();
  for (const r of SL) fit(r.el, r.o.fit || 1010);
  $$('.pcard .pc-main').forEach(el => fit(el, 1000)); $$('.pcard .sl').forEach(el => fit(el, 1000));
  street = await createStreet();
  // ciro hedefi (telefon ekranı koordinatı)
  { const prev = phoneWrap.style.transform; phoneWrap.style.transform = 'none'; phone.style.transform = 'none';
    const sr = screen.getBoundingClientRect(), r = $('#rvCiro').getBoundingClientRect(); rvTarget = [r.left - sr.left + r.width * .45, r.top - sr.top + r.height * .5]; phoneWrap.style.transform = prev; }
  await Promise.all($$('img').filter(i => i.getAttribute('src')).map(i => i.decode().catch(() => { })));
  await window.seek(0);
  return true;
})();
