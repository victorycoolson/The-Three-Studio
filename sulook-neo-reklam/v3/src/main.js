/* SULOOK Neo — V3 dikey (1080×1920) reklam. Deterministik: window.seek(t). */
import { createStreet, drawCoin, READER, PAY_A, PAY_B, TX, COIN_FLIGHT, COIN_STAGGER } from './street.js';
import { createWatermark } from './watermark.js';

const W = 1080, H = 1920;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, k) => a + (b - a) * k;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const E = n => gsap.parseEase(n);
const eIn = E('expo.in'), bOut = E('back.out(2)'), p2o = E('power2.out'), p3io = E('power3.inOut'), sio = E('sine.inOut'), smooth = k => { k = clamp(k); return k * k * (3 - 2 * k); };
const tr = n => Math.round(n).toLocaleString('tr-TR');
const hash = n => { let s = (n * 9973 + 17) | 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const qbez = (p0, c, p1, k) => [lerp(lerp(p0[0], c[0], k), lerp(c[0], p1[0], k), k), lerp(lerp(p0[1], c[1], k), lerp(c[1], p1[1], k), k)];
const set = (el, css) => { for (const k in css) el.style[k] = css[k]; };
const vis = (el, on) => { el.style.visibility = on ? '' : 'hidden'; };

/* ------------------------------------------------------------ zamanlama */
const T = {
  q_ne: .10, q_o: .30, q_q: .55, glitch: [1.12, 1.68, 2.12],
  iris: 2.4, irisEnd: 2.86,
  tg1: 2.86, tg1out: 4.25, tg2: 4.62, yonet: 5.12, tg2out: 6.0,
  place1: 3.3, drop1: 3.62, link1: 3.9, online1: 4.3,
  place2: 4.5, drop2: 4.82, link2: 5.08, online2: 5.45,
  alert: 5.28, tap: 5.92, zoom: 6.06, zoomEnd: 6.56,
  street: 6.45, tg3: 6.62, tg3out: 9.95,
  device: 10.15, dive: 10.45, diveEnd: 11.15, ytext: 10.5,
  title: 11.3, led: 13.45, coOut: 14.72, titleOut: 14.72,
  layout2: 14.9, notif: 15.4, notifGap: .42, clear: 17.1,
  inter: 17.22, interOut: 18.2,
  perks: 18.4, perkGap: .36,
  keyDark: 20.42, key: 616.5 / 30,     // 30 fps çıktı karesi k = 60 fps alt-kareler (2k−1, 2k): PNG n tam olarak çıktı karesi 616+n
};
T.co = [12.3, T.led, 13.75, 13.95, 14.15];
T.price = T.key + .26; T.strike = T.key + .7;
T.newPrice = T.key + 34 / 30 - 1 / 60;  // yeni fiyat, anahtarın 35. karesini gösteren çıktı karesinde (651) girer
T.accent = T.key + 34 / 30 + 1 / 60;    // o karenin ekrana geldiği an (müzikal vurgu)
T.taksit = T.newPrice + .45;
T.keyShrink = T.key + 81 / 30;         // anahtar kadraj kenarlarından ayrıldığı kare
T.endLogo = T.keyShrink + .35; T.endTxt = T.keyShrink + .5;
T.keyEnd = T.key + 250 / 30;
T.end = T.keyEnd + .3;
// kampanya renderı (Kampanya-1-0015…0150) kare haritası: [zaman, kare]
const PROD_MAP = [[10.25, 15], [11.3, 35], [11.7, 45], [12.25, 62], [12.85, 90], [13.4, 106], [15.0, 150]];
window.DURATION = T.end; window.T = T;

/* ------------------------------------------------------------ elemanlar */
const stage = $('#stage');
const perde = $('#perde'), keyImg = $('#keyImg'), prodImg = $('#prodImg');
const phoneWrap = $('#phoneWrap'), phone = $('#phone'), screen = $('#screen');
const appMap = $('#appMap'), appStreet = $('#appStreet'), appDevice = $('#appDevice');
const heroWrap = $('#heroWrap'), hero = $('#hero');
const tl = gsap.timeline({ paused: true });
const S = {};

/* ============================================================ 1 · HOOK */
const neoq = $('#neoq');
set(neoq, { top: '300px', fontSize: '236px', height: '236px' });
const qW = $$('.q-base .w', neoq), [wNe, , wO] = qW;
gsap.set([wNe, wO], { opacity: 0 });
tl.fromTo(wNe, { opacity: 0, scale: 3, filter: 'blur(28px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: .26, ease: 'expo.out' }, T.q_ne);
tl.fromTo(wO, { opacity: 0, scale: 3, filter: 'blur(28px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: .26, ease: 'expo.out' }, T.q_o);

// dev soru işareti: canvas üzerinde çizilir (nokta merkezi pikselden bulunur → iris geçişi buradan açılır)
const bigq = $('#bigq');
const QC = document.createElement('canvas'); QC.width = 900; QC.height = 1150; QC.id = 'qcanvas';
bigq.innerHTML = ''; bigq.appendChild(QC);
set(bigq, { top: '470px', height: '1150px' });
set(QC, { position: 'absolute', left: '90px', top: '0px', width: '900px', height: '1150px', transformOrigin: '50% 82%' });
const qctx = QC.getContext('2d');
const QFONT = '400 1080px Outfit';   // heroshot'taki "Neo." ile aynı kesim
let qGlyph = null, qDot = [450, 900];
function buildQ() {
  const c = document.createElement('canvas'); c.width = 900; c.height = 1150; const g = c.getContext('2d');
  g.font = QFONT; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const grad = g.createLinearGradient(0, 120, 0, 1060);
  grad.addColorStop(0, '#ffffff'); grad.addColorStop(.42, '#e0f4ff'); grad.addColorStop(.75, '#7dd3fc'); grad.addColorStop(1, '#38bdf8');
  g.fillStyle = grad; g.fillText('?', 450, 1040);
  // nokta: en alttaki bağımsız leke
  const d = g.getImageData(0, 0, 900, 1150).data; const rowHas = y => { for (let x = 0; x < 900; x += 2) if (d[(y * 900 + x) * 4 + 3] > 40) return true; return false; };
  let y1 = 1149; while (y1 > 0 && !rowHas(y1)) y1--; let y0 = y1; while (y0 > 0 && rowHas(y0)) y0--;
  let xs = 900, xe = 0; for (let y = y0; y <= y1; y++) for (let x = 0; x < 900; x++) if (d[(y * 900 + x) * 4 + 3] > 40) { xs = Math.min(xs, x); xe = Math.max(xe, x); }
  qDot = [(xs + xe) / 2, (y0 + y1) / 2]; S.qDotR = (y1 - y0) / 2;
  qGlyph = c;
}
function drawQ(g) {
  qctx.clearRect(0, 0, 900, 1150);
  qctx.save(); qctx.filter = 'blur(38px)'; qctx.globalAlpha = .5; qctx.drawImage(qGlyph, 0, 0); qctx.restore();
  if (g > 0) {
    const fi = Math.floor(S.now * 30);
    for (const [col, dir] of [['#00e5ff', 1], ['#ff2d6a', -1]]) {
      const off = dir * (14 + 30 * g) + (hash(fi + dir * 7) - .5) * 24;
      const a = hash(fi + 31 + dir) * 1150 * .8, b = a + 60 + hash(fi + 5 + dir) * 260;
      qctx.save(); qctx.globalCompositeOperation = 'screen'; qctx.globalAlpha = .9 * g;
      qctx.beginPath(); qctx.rect(0, a, 900, b - a); qctx.clip();
      qctx.drawImage(qGlyph, off, 0); qctx.globalCompositeOperation = 'source-atop'; qctx.fillStyle = col; qctx.fillRect(0, a, 900, b - a);
      qctx.restore();
    }
  }
  qctx.drawImage(qGlyph, 0, 0);
}
S.q = { s: 0, r: -40, y: -380, o: 0 };
tl.to(S.q, { s: 1, r: 8, y: 0, o: 1, duration: .38, ease: 'back.out(2.2)' }, T.q_q);
tl.to(S.q, { r: 0, duration: .6, ease: 'elastic.out(1,.35)' }, T.q_q + .38);

/* ============================================================ açık dünya metinleri */
const tg = ['#tg1', '#tg2', '#tg3'].map(s => $(s));
tg.forEach(g => { g.style.top = '168px'; gsap.set($$('.mline .in', g), { yPercent: 118 }); });
const linesIn = (g, t, st = .1) => tl.to($$('.mline .in', g), { yPercent: 0, duration: .75, ease: 'power4.out', stagger: st }, t);
const linesOut = (g, t) => tl.to($$('.mline .in', g), { yPercent: -118, duration: .34, ease: 'power3.in', stagger: .05 }, t);
linesIn(tg[0], T.tg1, .1); linesOut(tg[0], T.tg1out);
linesIn(tg[1], T.tg2, .12); linesOut(tg[1], T.tg2out);
linesIn(tg[2], T.tg3, .12); linesOut(tg[2], T.tg3out);
const yonet = $('#yonet');
gsap.set(yonet, { opacity: 0, scale: .7, y: 18 });
tl.to(yonet, { opacity: 1, scale: 1, y: 0, duration: .5, ease: 'back.out(2)' }, T.yonet);
tl.to(yonet, { opacity: 0, y: -16, duration: .25, ease: 'power2.in' }, T.tg2out);

/* ============================================================ telefon */
const PH = { x: 540, y: 1215, s: .9 };
S.ph = { x: PH.x, y: PH.y + 130, s: PH.s * 1.3, rx: 10, ry: 22, rz: -9, float: 1 };
tl.to(S.ph, { y: PH.y, s: PH.s, rx: 4, ry: -7, rz: 0, duration: 1.05, ease: 'expo.out' }, T.iris + .05);
tl.to(S.ph, { rx: 0, ry: 0, rz: 0, float: 0, duration: .5, ease: 'power2.inOut' }, T.device - .1);
tl.to(S.ph, { x: 540, y: H / 2, s: 1080 / 600, duration: T.diveEnd - T.dive, ease: 'power3.inOut' }, T.dive);
const k = 600 / W;
const heroInPhone = `translate(0px, ${(1300 - H * k) / 2}px) scale(${k})`;
heroWrap.style.transform = heroInPhone;

/* ============================================================ harita */
const mapCam = $('#mapCam'), linkLayer = $('#linkLayer'), packetLayer = $('#packetLayer'), markers = $('#mapMarkers');
const SVGNS = 'http://www.w3.org/2000/svg';
const HUB = [.632 * 1672, .55 * 941];
const PTS = [
  { name: 'Mahalle Marketi', no: '01', x: .39 * 1672, y: .37 * 941 },
  { name: 'Yaşam Sitesi', no: '02', x: .30 * 1672, y: .58 * 941 },
  { name: 'Meydan', no: '03', x: .46 * 1672, y: .77 * 941 },
  { name: 'İş Merkezi', no: '04', x: .69 * 1672, y: .40 * 941, labelDx: -8 },
  { name: 'Köşe Kafe', no: '05', x: .72 * 1672, y: .63 * 941, labelDx: -26 },
  { name: 'Zincir Market', no: '06', x: .57 * 1672, y: .17 * 941, place: T.place1, drop: T.drop1, link: T.link1, online: T.online1 },
  { name: 'Sahil Sitesi', no: '07', x: 870, y: 610, place: T.place2, drop: T.drop2, link: T.link2, online: T.online2 },
];
const ALERT_I = 3;
PTS.forEach((p, i) => {
  const el = document.createElement('div'); el.className = 'mk' + (p.place ? ' new' : '');
  el.innerHTML = `<div class="mk-base"></div><div class="mk-ripple"></div><div class="mk-prod"><img src="assets/img/point-product.png"></div><div class="mk-pin"><img src="assets/img/pin.png"></div><div class="mk-name"><span class="mk-label">${p.name}</span><small>${p.no}</small></div>`;
  markers.appendChild(el);
  p.el = el; p.pin = $('.mk-pin', el); p.prod = $('.mk-prod', el); p.rip = $('.mk-ripple', el); p.nameEl = $('.mk-name', el); p.label = $('.mk-label', el);
  if (p.labelDx) p.nameEl.style.marginLeft = p.labelDx + 'px';
  if (p.place) {
    const sp = document.createElement('div'); sp.className = 'spot';
    sp.innerHTML = `<div class="spot-ring"></div><div class="spot-plus">+</div>`;
    markers.appendChild(sp); p.spot = sp;
  }
  const [x1, y1] = [p.x, p.y], [x2, y2] = HUB, d0 = Math.hypot(x2 - x1, y2 - y1), mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - d0 * .26;
  const d = `M${x1.toFixed(1)} ${y1.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  for (const cls of ['lk-glow', 'lk']) { const path = document.createElementNS(SVGNS, 'path'); path.setAttribute('d', d); path.setAttribute('class', cls); path.setAttribute('vector-effect', 'non-scaling-stroke'); linkLayer.appendChild(path); p[cls === 'lk' ? 'link' : 'glow'] = path; }
  p.len = p.link.getTotalLength();
  p.ctrl = [mx, my];
});
const hub = document.createElement('div'); hub.className = 'hub';
hub.innerHTML = `<div class="hub-base"></div><div class="hub-stem"></div><div class="hub-ring"></div><div class="hub-ring"></div><div class="hub-core"><img src="assets/site/hub-face-v33.png"></div><div class="hub-name">SULOOK Merkez</div>`;
markers.appendChild(hub);
const alertChip = document.createElement('div'); alertChip.className = 'net-alert'; alertChip.innerHTML = '<span>!</span>Servis bildirimi'; markers.appendChild(alertChip);
// gelir olayları (dolum paketleri)
const FILLS = [[3.0, 2, 20], [3.28, 3, 60], [3.58, 0, 20], [3.88, 4, 20], [4.16, 1, 60], [4.5, 2, 20], [4.78, 5, 20], [5.06, 0, 60], [5.48, 4, 20], [5.7, 6, 20], [5.86, 1, 20]].map(([t, i, a]) => ({ t, i, a }));
FILLS.forEach(f => {
  const g = document.createElementNS(SVGNS, 'g'); g.setAttribute('class', 'pk'); g.innerHTML = '<circle class="pk-halo" r="14"/><circle class="pk-dot" r="6"/>'; packetLayer.appendChild(g); f.g = g;
  const e = document.createElement('div'); e.className = 'earn'; e.innerHTML = `<i>₺</i>+₺${f.a}`; markers.appendChild(e); f.earn = e;
});
const alertPk = document.createElementNS(SVGNS, 'g'); alertPk.setAttribute('class', 'pk alert'); alertPk.innerHTML = '<circle class="pk-halo" r="15"/><circle class="pk-dot" r="7"/>'; packetLayer.appendChild(alertPk);
S.map = { fx: 760, fy: 470, z: .78 };
tl.to(S.map, { fx: 900, fy: 455, z: .84, duration: T.tap - T.irisEnd, ease: 'sine.inOut' }, T.irisEnd);
tl.to(S.map, { fx: PTS[0].x, fy: PTS[0].y - 40, z: 5.2, duration: T.zoomEnd - T.zoom, ease: 'power4.in' }, T.zoom);
tl.to('#netPanel', { y: 420, duration: .4, ease: 'power3.in' }, T.zoom);
tl.to('.net-phone-bar', { opacity: 0, duration: .3 }, T.zoom + .1);
tl.fromTo('#scrFlash', { opacity: 0 }, { opacity: 1, duration: .1, ease: 'power1.in' }, T.zoomEnd - .12);
tl.to('#scrFlash', { opacity: 0, duration: .32, ease: 'power2.out' }, T.zoomEnd - .02);
const tap = $('#tap'), [tapDot, tapRing] = $$('#tap i');

/* ============================================================ sokak */
const stCanvas = $('#streetCanvas'), stCtx = stCanvas.getContext('2d'), coinCanvas = $('#coinCanvas'), coinCtx = coinCanvas.getContext('2d');
stCanvas.width = 1200; stCanvas.height = 2600; coinCanvas.width = 1200; coinCanvas.height = 2600;
let street = null;
S.st = { fx: 640, fy: 540, z: 2.6 };
tl.to(S.st, { fx: 722, fy: 600, z: 1.34, duration: .9, ease: 'expo.out' }, T.street);
tl.to(S.st, { fx: 728, fy: 598, z: 1.4, duration: T.device - T.street - .9, ease: 'none' }, T.street + .9);
const RV_BASE = [24, 20, 23, 17, 21, 14, 18, 12, 16, 9, 13, 8];

/* ============================================================ cihaz + dalış + hero */
gsap.set(appDevice, { xPercent: 100 });
tl.to(appDevice, { xPercent: 0, duration: .55, ease: 'power3.inOut' }, T.device);
tl.to(appStreet, { xPercent: -28, opacity: .4, duration: .55, ease: 'power3.inOut' }, T.device);
tl.to('#devChrome', { opacity: 0, duration: .3 }, T.dive + .05);
tl.to(['#statusBar', '#homeInd'], { opacity: 0, duration: .25 }, T.dive + .05);
tl.to('#lbg', { scale: 1.5, duration: T.diveEnd - T.dive, ease: 'power3.inOut' }, T.dive);
// "Yenilenen yüzüyle" — sahne seviyesinde kalır, dalış sırasında renk değiştirir
const ytext = $('#ytext');
set(ytext, { top: '126px' });
gsap.set('#ytext .in', { yPercent: 118 });
tl.to('#ytext .in', { yPercent: 0, duration: .8, ease: 'power4.out' }, T.ytext);
tl.fromTo(ytext, { color: '#0f172a' }, { color: '#e0f2fe', duration: .45, ease: 'power1.inOut' }, T.dive + .35);
tl.to(ytext, { opacity: 0, y: -40, duration: .35, ease: 'power2.in' }, T.titleOut);
// başlık
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
const AX = 557, AY = 965;
const P1 = { s: .74, cx: 548, cy: 1010 }, P1b = { s: .86, cx: 548, cy: 1000 }, P2 = { s: .86, cx: 318, cy: 1150 }, P3 = { s: .96, cx: 540, cy: 1060 };
S.prod = { s: 1, cx: AX, cy: AY, o: 1, blur: 0 };
tl.to(S.prod, { ...P1, duration: .7, ease: 'power3.inOut' }, T.co[0] - .35);
tl.to(S.prod, { ...P1b, duration: T.layout2 - 13.4, ease: 'sine.inOut' }, 13.4);
tl.to(S.prod, { ...P2, duration: .75, ease: 'power3.inOut' }, T.layout2);
tl.to(S.prod, { ...P3, o: .32, blur: 7, duration: .7, ease: 'power3.inOut' }, T.clear);
tl.to(S.prod, { o: 0, duration: .45, ease: 'power2.in' }, T.keyDark);
// anahtar evresinde zemin koyulaşır (sitenin mavisi → gece laciverti)
tl.fromTo('#heroDark', { opacity: 0 }, { opacity: 1, duration: .7, ease: 'power2.inOut', immediateRender: false }, T.keyDark);

// LED (aç/kapa; render üzerinde homografi izleriyle)
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
// veri panelleri (ürün solda, paneller sağda)
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
  const t0 = T.layout2 + .3 + i * .15;
  gsap.set(el, { opacity: 0, x: 90 });
  tl.to(el, { opacity: 1, x: 0, duration: .55, ease: 'expo.out' }, t0);
  const cnt = $('[data-c]', el), obj = { v: 0 };
  tl.to(obj, { v: +cnt.dataset.c, duration: .9, ease: 'power2.out', onUpdate: () => { cnt.textContent = tr(obj.v); } }, t0 + .1);
  $$('.bars i', el).forEach((b, j) => { gsap.set(b, { scaleY: 0 }); tl.to(b, { scaleY: 1, duration: .45, ease: 'back.out(1.6)' }, t0 + .15 + j * .04); });
  const rf = $('.rf', el); if (rf) tl.to(rf, { attr: { 'stroke-dashoffset': 276.5 * (1 - .82) }, duration: .9, ease: 'power2.out' }, t0 + .1);
  $$('.lvl i', el).forEach(b => tl.to(b, { width: b.dataset.w + '%', duration: .9, ease: 'power2.out' }, t0 + .15));
  tl.to(el, { opacity: 0, x: 90, duration: .3, ease: 'power2.in' }, T.clear + i * .04);
});
// bildirimler: yığın; en yenisi üstten düşer, eskiler aşağı kayar (bildirim merkezi)
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

// ara sahne: 7/24
const inter = $('#inter'), arc = $('#iArc'), arcHead = $('#iHead');
{ const tk = $('#iTicks'); for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2, r0 = i % 4 ? 268 : 258, r1 = 282;
    const l = document.createElementNS(SVGNS, 'line'); l.setAttribute('x1', 320 + Math.sin(a) * r0); l.setAttribute('y1', 320 - Math.cos(a) * r0); l.setAttribute('x2', 320 + Math.sin(a) * r1); l.setAttribute('y2', 320 - Math.cos(a) * r1); l.dataset.k = i / 48; tk.appendChild(l); } }
S.inter = { arc: 0 };
gsap.set(inter, { opacity: 0, scale: .82 });
tl.to(inter, { opacity: 1, scale: 1, duration: .55, ease: 'expo.out' }, T.inter);
tl.to(S.inter, { arc: 1, duration: .85, ease: 'power2.inOut' }, T.inter + .05);
gsap.set('#iNum .ch', { opacity: 0, y: 60, filter: 'blur(12px)' });
tl.to('#iNum .ch', { opacity: 1, y: 0, filter: 'blur(0px)', duration: .45, ease: 'expo.out', stagger: .07 }, T.inter + .12);
gsap.set('#iCap', { opacity: 0, y: 14 });
tl.to('#iCap', { opacity: 1, y: 0, duration: .4, ease: 'power3.out' }, T.inter + .35);
gsap.set('#inter .mline .in', { yPercent: 118 });
tl.to('#inter .mline .in', { yPercent: 0, duration: .6, ease: 'power4.out', stagger: .1 }, T.inter + .3);
tl.to(inter, { opacity: 0, scale: 1.12, filter: 'blur(10px)', duration: .35, ease: 'power2.in' }, T.interOut);

// kampanya
const perks = $('#perks'), pkList = $('.pk-list', perks);
perks.style.top = '400px';
gsap.set('.pk-eyebrow .in', { yPercent: 118 });
tl.to('.pk-eyebrow .in', { yPercent: 0, duration: .6, ease: 'power4.out' }, T.perks - .25);
const PK = [['i-truck', 'Ücretsiz', 'Nakliye'], ['i-tool', 'Ücretsiz', 'Kurulum'], ['i-filter', '1 Yıl Ücretsiz', 'Filtre Bakımı'], ['i-headset', '1 Yıl', 'Call Center Yardımı'], ['i-link', '1 Yıl Ücretsiz', 'Otis Bağlantı Hizmeti']];
PK.forEach(([ic, top, main], i) => {
  const el = document.createElement('div'); el.className = 'perk';
  el.innerHTML = `<span class="pi"><svg><use href="#${ic}"/></svg></span><span class="pt"><small>${top}</small>${main}</span><span class="pc"><svg><use href="#i-check"/></svg></span><i class="shine"></i>`;
  pkList.appendChild(el);
  const t0 = T.perks + i * T.perkGap;
  gsap.set(el, { opacity: 0, x: -340, skewX: -12 });
  tl.to(el, { opacity: 1, x: 0, skewX: 0, duration: .5, ease: 'expo.out' }, t0);
  const pc = $('.pc', el); gsap.set(pc, { scale: 0, rotation: -90 }); tl.to(pc, { scale: 1, rotation: 0, duration: .4, ease: 'back.out(3)' }, t0 + .16);
  tl.fromTo($('.pi', el), { scale: .5 }, { scale: 1, duration: .45, ease: 'back.out(3)' }, t0 + .04);
  tl.fromTo($('.shine', el), { x: 0 }, { x: 1300, duration: .7, ease: 'power2.inOut' }, t0 + .2);
});
tl.to(perks, { opacity: 0, y: -70, scale: .94, duration: .45, ease: 'power2.in' }, T.keyDark - .05);

// anahtar (şeffaf PNG) — fiyat önünde akar; yeni fiyat anahtarın tam 35. karesinde girer
const keyScene = $('#keyScene');
const KEY_K1 = { s: 1, y: -210 }, KEY_E = { s: .46, y: 192 };
S.key = { ...KEY_K1, glow: 0 };
tl.to(keyScene, { opacity: 1, duration: .3, ease: 'power1.in' }, T.key - .05);
tl.to(S.key, { ...KEY_E, duration: 1.05, ease: 'power3.inOut' }, T.keyShrink);
tl.fromTo('#keyShade', { opacity: 0 }, { opacity: 1, duration: .5, immediateRender: false }, T.price - .2);
tl.to('#keyShade', { opacity: 0, duration: .8 }, T.keyShrink);
// fiyat
const pKicker = $('#pKicker'), pOld = $('#pOld'), pNew = $('#pNew'), pSent = $('#pSent'), pTaksit = $('#pTaksit'), pStrike = $('#pStrike'), pTag = $('#pTag');
const PP = { p: { old: 1236, new: 1400, tak: 1566 }, e: { kick: 1046, old: 1116, new: 1210, sent: 1322, tak: 1396 } };
S.pr = { oldY: PP.p.old, oldS: 1, newY: PP.p.new, newS: 1, takY: PP.p.tak, takS: 1 };
tl.fromTo(pOld, { opacity: 0, scale: 1.7, filter: 'blur(18px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: .35, ease: 'expo.out', immediateRender: false }, T.price);
gsap.set(pStrike, { scaleX: 0, rotation: -7 });
tl.to(pStrike, { scaleX: 1, duration: .2, ease: 'power4.in' }, T.strike);
tl.to(pOld, { opacity: .55, duration: .25 }, T.strike + .2);
tl.to(S.pr, { oldY: PP.p.old - 36, oldS: .76, duration: .4, ease: 'power3.out' }, T.strike + .2);
tl.fromTo(pNew, { opacity: 0, scale: 2.6, filter: 'blur(24px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: .3, ease: 'expo.out', immediateRender: false }, T.newPrice);
gsap.set(pTag, { scale: 0, rotation: -30 });
tl.to(pTag, { scale: 1, rotation: -7, duration: .45, ease: 'back.out(3)' }, T.newPrice + .24);
tl.fromTo(pTaksit, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power2.out', immediateRender: false }, T.taksit);
tl.fromTo('#hFlash', { opacity: 0 }, { opacity: .42, duration: .04, immediateRender: false }, T.newPrice);
tl.to('#hFlash', { opacity: 0, duration: .45, ease: 'power2.out' }, T.newPrice + .04);
tl.fromTo(S.key, { glow: 0 }, { glow: 1, duration: .06, immediateRender: false }, T.newPrice);
tl.to(S.key, { glow: .25, duration: 1.3, ease: 'power2.out' }, T.newPrice + .06);
// son kart: logo üstte, anahtar ortada, metin altta
tl.to(S.pr, { oldY: PP.e.old, oldS: .5, newY: PP.e.new, newS: .78, takY: PP.e.tak, takS: .9, duration: .95, ease: 'power3.inOut' }, T.keyShrink + .08);
tl.fromTo('#endLogo', { opacity: 0, y: -40, scale: .9 }, { opacity: 1, y: 0, scale: 1, duration: .7, ease: 'expo.out', immediateRender: false }, T.endLogo);
tl.fromTo(pKicker, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .55, ease: 'expo.out', immediateRender: false }, T.endTxt);
tl.fromTo(pSent, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .55, ease: 'expo.out', immediateRender: false }, T.endTxt + .22);
const mq = $('#marquee'), mqIn = $('.mq-in', mq);
mq.style.top = '1452px';
const mqItems = PK.map(([ic, top, main]) => `<span class="mq-it"><i><svg><use href="#i-check"/></svg></i>${top} ${main}</span>`).join('');
mqIn.innerHTML = mqItems + mqItems + mqItems;
tl.to(mq, { opacity: 1, duration: .5 }, T.endTxt + .45);
const endUrl = $('#endUrl'); endUrl.style.top = '1556px';
tl.fromTo(endUrl, { opacity: 0, y: 30, scale: .9 }, { opacity: 1, y: 0, scale: 1, duration: .55, ease: 'back.out(2)', immediateRender: false }, T.endTxt + .65);

/* ============================================================ prosedürel güncelleme */
const shakeHits = [[T.q_ne + .05, 20], [T.q_o + .05, 20], [T.q_q + .1, 30], [T.glitch[0], 12], [T.glitch[1], 14], [T.glitch[2], 16], [12.2, 5], [T.price + .03, 14], [T.strike + .18, 10], [T.newPrice + .04, 26]];
function shake(t) {
  let x = 0, y = 0;
  for (const [h, a] of shakeHits) { const d = t - h; if (d < 0 || d > .4) continue; const env = a * Math.exp(-d * 11); x += env * Math.sin(d * 95 + h * 7); y += env * Math.cos(d * 83 + h * 3); }
  return [x, y];
}
function glitchAmt(t) { let g = 0; for (const h of T.glitch) { const d = t - h; if (d >= 0 && d < .14) g = Math.max(g, 1 - d / .14); } for (const h of [T.q_ne, T.q_o, T.q_q]) { const d = t - h; if (d >= 0 && d < .07) g = Math.max(g, .55); } return g; }
const frameSrc = { perde: -1, key: -1, prod: -1 };
function setFrame(el, kind, path) { if (frameSrc[kind] === path) return; el.src = path; frameSrc[kind] = path; }

function updateS1(t) {
  const on = t < T.irisEnd + .02; vis($('#s1'), on); if (!on) return;
  const src = .25 + t * 1.25;
  setFrame(perde, 'perde', `assets/seq/perde/${String(Math.min(241, Math.floor(src * 24) + 1)).padStart(4, '0')}.jpg`);
  const [sx, sy] = shake(t);
  $('#s1cam').style.transform = `translate(${sx * .5}px,${sy * .5}px) scale(${1.08 + t * .035}) rotate(${-0.5 + t * .22}deg)`;
  $('#s1light').style.opacity = .5 + .5 * Math.sin(t * 5.1) * Math.sin(t * 2.3);
  const g = glitchAmt(t), fi = Math.floor(t * 30);
  const breath = 1 + t * .02;
  $('.q-base', neoq).style.transform = `translate(${sx + (g ? (hash(fi) - .5) * 36 * g : 0)}px,${sy}px) scale(${breath})`;
  $$('.q-glitch', neoq).forEach((c, i) => {
    if (!g) { c.style.opacity = 0; return; }
    $$('.w', c).forEach((w, j) => { w.style.opacity = qW[j].style.opacity === '' ? 1 : qW[j].style.opacity; });
    c.style.opacity = .85 * g;
    const off = (i ? -1 : 1) * (10 + 26 * g) + (hash(fi + i * 11) - .5) * 20, a = hash(fi + 31 + i) * 70, b = a + 10 + hash(fi + 7 + i) * 30;
    c.style.clipPath = `inset(${a}% 0 ${100 - b}% 0)`; c.style.transform = `translate(${sx + off}px,${sy}px) scale(${breath})`;
  });
  // dev ?
  S.now = t;
  const q = S.q, wob = t > T.q_q + .9 ? Math.sin((t - T.q_q) * 3.2) * 2.2 * (1 - prog(t, T.iris - .25, T.iris)) : 0;
  const sq = t > T.q_q + .3 ? 1 + .015 * Math.sin(t * 7) * (1 - prog(t, T.iris - .25, T.iris)) : 1;
  QC.style.opacity = q.o;
  QC.style.transform = `translate(${sx * 1.2}px,${q.y + sy}px) rotate(${q.r + wob}deg) scale(${q.s * sq},${q.s / sq})`;
  drawQ(g);
  let fl = 0; for (const h of [T.q_ne, T.q_o, T.q_q]) { const d = t - h; if (d >= 0 && d < .18) fl = Math.max(fl, .26 * (1 - d / .18)); }
  $('#s1flash').style.opacity = fl + (g > .8 ? .1 : 0);
}

function updateIris(t) {
  const light = $('#light'), iris = $('#iris');
  if (t < T.iris) { vis(light, false); iris.style.opacity = 0; return; }
  vis(light, true);
  if (t >= T.irisEnd) { light.style.clipPath = 'none'; iris.style.opacity = 0; return; }
  const r = QC.getBoundingClientRect(), sc = r.width / 900;
  const cx = r.left + qDot[0] * sc, cy = r.top + qDot[1] * (r.height / 1150);
  const kk = eIn(prog(t, T.iris, T.irisEnd)), R = S.qDotR * sc * .9 + kk * Math.hypot(W, H) * 1.05;
  light.style.clipPath = `circle(${R}px at ${cx}px ${cy}px)`;
  const bw = 18 + R * .2;
  set(iris, { opacity: 1, left: (cx - R - bw) + 'px', top: (cy - R - bw) + 'px', width: 2 * R + 'px', height: 2 * R + 'px', borderWidth: bw + 'px' });
}

function updatePhone(t) {
  const p = S.ph, fl = p.float;
  const ry = p.ry + fl * 3.5 * Math.sin(t * 1.4), rx = p.rx + fl * 1.6 * Math.sin(t * 1.05 + 1), fy = fl * 10 * Math.sin(t * 1.2);
  phoneWrap.style.transform = `translate(${p.x - 320}px,${p.y - 670 + fy}px) scale(${p.s})`;
  phone.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${p.rz}deg)`;
  const solo = t >= T.diveEnd;
  $('.ph-glare').style.opacity = 1 - prog(t, T.dive, T.diveEnd);
  vis($('#lbg'), !solo); vis($('#txt'), !solo);
}

function mapToScreen(x, y) { const m = S.map; return [300 + (x - m.fx) * m.z, 600 + (y - m.fy) * m.z]; }
function updateMap(t) {
  const on = t >= T.iris && t < T.zoomEnd + .15; vis(appMap, on); if (!on) return;
  const m = S.map;
  mapCam.style.transform = `translate(${300 - m.fx * m.z}px,${600 - m.fy * m.z}px) scale(${m.z})`;
  const blur = prog(t, T.zoom + .25, T.zoomEnd) * 14;
  mapCam.style.filter = blur > .2 ? `blur(${blur}px)` : 'none';
  markers.style.filter = mapCam.style.filter;
  const mScale = Math.min(2.4, Math.max(1, m.z / .84));   // zoomda işaretler de büyür
  // hub
  { const [x, y] = mapToScreen(...HUB); hub.style.transform = `translate(${x}px,${y}px) scale(${mScale})`;
    let lastArr = -9; for (const f of FILLS) if (t >= f.t + .95) lastArr = f.t + .95;
    const dh = t - lastArr, alert = t >= T.alert + .9;
    hub.classList.toggle('alert', alert && t < T.alert + 1.6);
    $('.hub-core', hub).style.transform = `scale(${dh >= 0 && dh < .5 ? 1 + .12 * Math.sin(dh / .5 * Math.PI) : 1})`;
    $$('.hub-ring', hub).forEach((r, i) => { const ph = ((t * .55 + i * .5) % 1); r.style.transform = `scale(${1 + ph * 1.2})`; r.style.opacity = (1 - ph) * .7; }); }
  // noktalar
  let online = 5, total = 5;
  PTS.forEach((p, i) => {
    const [x, y] = mapToScreen(p.x, p.y);
    p.el.style.transform = `translate(${x}px,${y}px) scale(${mScale})`;
    let pinS = 1, pinY = 0, pinO = 1, prodO = 0, prodY = 0, prodS = 1, elO = 1, linkK = 1;
    if (p.place) {
      const dsp = t - p.place, dd = t - p.drop, dl = t - p.link, don = t - p.online;
      if (p.spot) { const so = dsp < 0 ? 0 : clamp(dsp / .2) * (1 - prog(dd, 0, .2)); set(p.spot, { opacity: so, transform: `translate(${x}px,${y}px) scale(${(dsp < 0 ? .6 : lerp(.6, 1, bOut(prog(dsp, 0, .3)))) * (1 + .06 * Math.sin(t * 7))})` }); }
      if (dd < 0) { elO = 0; } else {
        prodO = 1 - prog(don, 0, .2); prodY = -220 * (1 - E('back.out(1.4)')(prog(dd, 0, .55))) ; prodS = .7 + .3 * p2o(prog(dd, 0, .5));
        pinO = prog(don, 0, .2); pinS = don < 0 ? 0 : bOut(prog(don, 0, .35));
      }
      linkK = p2o(prog(dl, 0, .45));
      if (t >= p.drop) total++;
      if (t >= p.online) online++;
      p.el.classList.toggle('online', t >= p.online);
      p.label.textContent = t >= p.online ? p.name : 'Yeni dolum noktası';
    }
    // gelir sıçraması
    for (const f of FILLS) if (f.i === i) { const d = t - f.t; if (d >= 0 && d < .5) { pinS *= 1 + .14 * Math.sin(d * 18) * Math.exp(-d * 7); } }
    if (i === 0 && t > T.tap - .05) pinS *= 1 + .16 * bOut(prog(t, T.tap, T.tap + .25));
    p.el.style.opacity = elO;
    p.pin.style.transform = `translateY(${pinY}px) scale(${pinS})`; p.pin.style.opacity = pinO;
    p.prod.style.opacity = prodO; p.prod.style.transform = `translateY(${prodY}px) scale(${prodS})`;
    // ripple: son dolum olayında
    let lastF = -9; for (const f of FILLS) if (f.i === i && t >= f.t) lastF = f.t;
    const dr = t - lastF; p.rip.style.opacity = dr < 1.1 ? (1 - dr / 1.1) : 0; p.rip.style.transform = `scale(${.5 + prog(dr, 0, 1.1) * 1.3})`;
    const alert = i === ALERT_I && t >= T.alert;
    p.el.classList.toggle('alert', alert);
    p.link.classList.toggle('alert', alert); p.glow.classList.toggle('alert', alert);
    for (const path of [p.link, p.glow]) { path.style.strokeDasharray = `${p.len} ${p.len}`; path.style.strokeDashoffset = p.len * (1 - linkK); path.style.opacity = linkK > 0 ? '' : 0; }
  });
  // paketler + kazanç rozetleri
  let fills = 216, income = 6000;
  FILLS.forEach(f => {
    const p = PTS[f.i], d = t - f.t, kp = prog(d, 0, .95);
    if (d >= 0 && d < .95) { const pt = p.link.getPointAtLength(p.len * E('power1.inOut')(kp)); f.g.setAttribute('transform', `translate(${pt.x},${pt.y}) scale(${1 / m.z})`); f.g.style.opacity = 1; } else f.g.style.opacity = 0;
    if (d >= .95) { fills++; income += f.a; }
    const [x, y] = mapToScreen(p.x, p.y);
    const eo = d < 0 ? 0 : clamp(d / .12) * (1 - prog(d, .85, 1.15));
    set(f.earn, { opacity: eo, transform: `translate(${x + 46}px,${y - 110 - 50 * p2o(prog(d, 0, 1.1))}px) translate(-50%,-50%) scale(${d < 0 ? .6 : lerp(.6, 1, bOut(prog(d, 0, .3)))})` });
  });
  // servis bildirimi
  { const p = PTS[ALERT_I], d = t - T.alert, [x, y] = mapToScreen(p.x, p.y);
    const kp = prog(d, .1, 1.0);
    if (d >= .1 && d < 1.0) { const pt = p.link.getPointAtLength(p.len * E('power1.inOut')(kp)); alertPk.setAttribute('transform', `translate(${pt.x},${pt.y}) scale(${1 / m.z})`); alertPk.style.opacity = 1; } else alertPk.style.opacity = 0;
    const co = d < .15 ? 0 : 1;
    set(alertChip, { opacity: co, transform: `translate(${x - 44}px,${y - 74}px) translate(-100%,-50%) scale(${co ? lerp(.6, 1, bOut(prog(d, .15, .45))) : .6})` });
    $('#npAlert').style.opacity = t >= T.alert + .9 ? 1 : 0; }
  $('#npOn').textContent = online; $('#npTot').textContent = total; $('#nOnline').textContent = online;
  $('#npFills').textContent = tr(fills); $('#npIncome').textContent = tr(income);
  // dokunma
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
  const on = t >= T.street - .05 && t < T.dive + .7; vis(appStreet, on); if (!on || !street) return;
  const u = t - T.street, s = S.st;
  const cam = { fx: s.fx, fy: s.fy, z: s.z, sx: 300, sy: 800 };
  street.draw(stCtx, u, cam, 2);
  stCanvas.style.filter = u < .35 ? `blur(${(1 - u / .35) * 8}px)` : 'none';
  const toScr = ([x, y]) => [cam.sx + (x - cam.fx) * cam.z, cam.sy + (y - cam.fy) * cam.z];
  // sikkeler
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
  const litres = 840 + (u >= .98 ? 19 : 0);
  $('#rvLitre').textContent = tr(litres); $('#rvCiro').textContent = tr(ciro);
  const dl = u - lastArrive;
  $('#rvLast').textContent = lastAmt ? `+₺${lastAmt}` : 'Canlı akış';
  $('.rv-trend').style.transform = `scale(${dl >= 0 && dl < .4 ? 1 + .18 * Math.sin(dl / .4 * Math.PI) : 1})`;
  $('#rvCiro').style.color = dl >= 0 && dl < .5 ? '#15803d' : '';
  // grafik: gelirle yükselen son nokta
  const gain = (ciro - 3820) / 80;
  const pts = RV_BASE.map((v, i) => [i * 272 / 11, (i === 11 ? v - gain * 6 : i === 10 ? v - gain * 2 : v) + 1.2 * Math.sin(t * 2.4 + i)]);
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2; d += `C${cx} ${y0} ${cx} ${y1} ${x1} ${y1}`; }
  $('#rvLine').setAttribute('d', d); $('#rvFill').setAttribute('d', d + 'V38H0Z');
  $('#rvDot').setAttribute('cx', pts[11][0]); $('#rvDot').setAttribute('cy', pts[11][1]);
  $('#statusBar').classList.toggle('dark', t >= T.device + .25);
  $('#homeInd').style.background = t >= T.device + .25 ? '#fff' : '#0f172a';
}

/* ---------- hero (V3: şeffaf kampanya renderı + site mavisi + filigran) ---------- */
const wm = createWatermark($('#wmCanvas'));
const prodCam = $('#prodCam'), keyCam = $('#keyCam'), keyGlow = $('#keyGlow');
const motes = $('#motes'), mctx = motes.getContext('2d');
let TRACKS = null, KEYC = null;
function prodFrameAt(t) {
  if (t <= PROD_MAP[0][0]) return PROD_MAP[0][1];
  for (let i = 1; i < PROD_MAP.length; i++) { const [t1, f1] = PROD_MAP[i], [t0, f0] = PROD_MAP[i - 1]; if (t < t1) return Math.round(f0 + (f1 - f0) * (t - t0) / (t1 - t0)); }
  return PROD_MAP[PROD_MAP.length - 1][1];
}
function track(name, n) {
  const tr = TRACKS.tracks, i = clamp(n - TRACKS.first, 0, tr.center.length - 1);
  if (name === 'led') { const a = tr.ledL[i], b = tr.ledR[i]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }
  return tr[name][i];
}
const toStage = ([x, y]) => [S.prod.cx + (x - AX) * S.prod.s, S.prod.cy + (y - AY) * S.prod.s];
// LED şeridi boyunca eleman yerleştir (render koordinatı, prodCam içinde)
function alongLed(el, n, padL, padR, h, dy) {
  const i = n - TRACKS.first, a = TRACKS.tracks.ledL[i], b = TRACKS.tracks.ledR[i];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  set(el, { left: a[0] + 'px', top: a[1] + 'px', width: (len + padL + padR) + 'px', height: h + 'px', transform: `rotate(${ang}rad) translate(${-padL}px,${-h / 2 + dy}px)` });
  return len;
}

function updateHero(t) {
  const on = t >= T.device - .05; vis(appDevice, on); if (!on) return;
  const solo = t >= T.diveEnd;
  if (solo && heroWrap.parentNode !== stage) { stage.insertBefore(heroWrap, $('#ytext')); heroWrap.style.transform = 'none'; }
  if (!solo && heroWrap.parentNode !== appDevice) { appDevice.insertBefore(heroWrap, $('#devChrome')); heroWrap.style.transform = heroInPhone; }
  vis($('#light'), !solo && t >= T.iris);
  const [sx, sy] = shake(t);
  hero.style.transform = solo ? `translate(${sx * .5}px,${sy * .5}px)` : '';
  // ürün
  const n = prodFrameAt(t), p = S.prod;
  const pv = t < T.keyDark + .5; vis(prodCam, pv);
  if (pv) {
    setFrame(prodImg, 'prod', `assets/seq/kampanya/${String(n).padStart(4, '0')}.webp`);
    prodCam.style.transform = `translate(${p.cx - AX * p.s}px,${p.cy - AY * p.s}px) scale(${p.s})`;
    prodCam.style.opacity = p.o; prodCam.style.filter = p.blur > .2 ? `blur(${p.blur}px)` : 'none';
  }
  // sayaçlar
  $('#gpd').textContent = Math.round(S.spec.g); $('#lt').textContent = Math.round(S.spec.l);
  // LED
  let led = 1; for (const [ts, v] of LED_STATES) if (t >= ts) led = v;
  let lastOn = -9; for (const [ts, v] of LED_STATES) if (v && t >= ts) lastOn = ts;
  const dl = t - lastOn, ledOn = t >= T.led && t < T.layout2 + 1 && n >= TRACKS.first;
  vis(ledOff, ledOn && !led); vis(ledGlow, ledOn && !!led); vis(ledWash, ledOn && !!led);
  if (ledOn) {
    const len = alongLed(ledOff, n, 0, 0, 1, 0);
    const th = len * .052;
    alongLed(ledOff, n, len * .015, len * .015, th, len * .004);
    alongLed(ledGlow, n, len * .16, len * .16, th * 9, 0);
    alongLed(ledWash, n, len * .05, len * .05, len * .9, len * .45);
    ledGlow.style.opacity = led ? .25 + .75 * Math.exp(-dl * 3.2) : 0;
    ledWash.style.opacity = led ? .65 * Math.exp(-dl * 2) : 0;
  }
  // callout çizgileri
  const hr = hero.getBoundingClientRect(), doorOpen = n >= 40 && n < 98;
  CO.forEach(co => {
    const d = t - co.t, live = d >= 0 && t < T.coOut + .25;
    for (const e of [co.path, co.dot, co.ring]) e.style.visibility = live ? '' : 'hidden';
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
      co.stEl.textContent = isOn ? 'Açık' : 'Kapalı';
      co.stEl.classList.toggle('off', !isOn);
    }
  });
  // bildirim yığını
  NT.forEach((nn, i) => {
    const d = t - nn.t;
    if (d < 0 || t > T.clear + .6) { nn.el.style.visibility = 'hidden'; return; }
    nn.el.style.visibility = 'visible';
    let shift = 0; for (let j = i + 1; j < NT.length; j++) shift += E('expo.out')(prog(t - NT[j].t, 0, .5));
    const kin = E('back.out(1.25)')(prog(d, 0, .55)), t0 = T.clear + (NT.length - 1 - i) * .05, out = E('power2.in')(prog(t, t0, t0 + .32));
    const y = NOTIF_TOP + shift * NOTIF_STEP - (1 - kin) * 170 - out * 140;
    set(nn.el, { opacity: clamp(d / .14) * (1 - out) * (1 - .1 * shift), transform: `translate(${(W - 980) / 2}px,${y}px) scale(${(1 - .03 * shift) * lerp(.9, 1, kin)})` });
  });
  // ara sahne halkası
  if (t >= T.inter - .1 && t < T.interOut + .5) {
    const k = S.inter.arc, C = 2 * Math.PI * 270;
    arc.style.strokeDasharray = C; arc.style.strokeDashoffset = C * (1 - k);
    const a = k * Math.PI * 2; arcHead.setAttribute('cx', 320 + Math.sin(a) * 270); arcHead.setAttribute('cy', 320 - Math.cos(a) * 270); arcHead.style.opacity = k > .01 && k < .995 ? 1 : 0;
    $$('#iTicks line').forEach(l => l.classList.toggle('on', +l.dataset.k <= k));
  }
  // fiyat
  const pr = S.pr, centerAt = (el, y) => { el.style.top = (y - el.offsetHeight / 2) + 'px'; };
  centerAt(pOld, pr.oldY); centerAt(pNew, pr.newY); centerAt(pTaksit, pr.takY); centerAt(pKicker, PP.e.kick); centerAt(pSent, PP.e.sent);
  pOld.firstElementChild.style.transform = `scale(${pr.oldS})`; pNew.firstElementChild.style.transform = `scale(${pr.newS})`; pTaksit.style.scale = pr.takS;
  const nw = pNew.firstElementChild.offsetWidth * pr.newS, tw = pTag.offsetWidth;
  set(pTag, { left: Math.min(W / 2 + nw / 2 - tw * .55, W - 34 - tw) + 'px', top: (-46 + (1 - pr.newS) * 72) + 'px' });
  // anahtar
  const dv = t - T.key;
  vis(keyScene, dv >= -.05);
  if (dv >= -.05) {
    const kf = clamp(Math.floor(Math.max(0, dv) * 30 + 1e-4) + 1, 1, 250);
    setFrame(keyImg, 'key', `assets/seq/keypng/${String(kf).padStart(4, '0')}.webp`);
    keyCam.style.transform = `translateY(${S.key.y}px) scale(${S.key.s})`;
    const g = S.key.glow, [gx, gy] = KEYC[kf - 1];
    keyImg.style.filter = g > .02 ? `drop-shadow(0 0 ${12 + 44 * g}px rgba(125,211,252,${(.9 * g).toFixed(3)}))` : 'none';
    set(keyGlow, { left: gx + 'px', top: gy + 'px', opacity: (.55 + .45 * g) * clamp(dv / .4), transform: `translate(-50%,-50%) scale(${1 + .35 * g})` });
  }
  const mqw = mqIn.scrollWidth / 3;
  mqIn.style.transform = `translateX(${-(((t - T.endTxt) * 64) % mqw) - 40}px)`;
}

// süzülen ışık zerreleri (anahtar sahnesi)
function drawMotes(t) {
  mctx.setTransform(1, 0, 0, 1, 0, 0); mctx.clearRect(0, 0, W, H);
  const base = prog(t, T.keyDark, T.keyDark + .9); if (base <= 0) return;
  const g = S.key.glow;
  for (let i = 0; i < 54; i++) {
    const big = i < 10, r = big ? 26 + hash(i * 13 + 3) * 34 : 2.2 + hash(i * 13 + 3) * 4.5;
    const sp = (big ? 14 : 26) + hash(i * 7 + 2) * (big ? 22 : 64), span = H + 300;
    const x = hash(i * 3 + 1) * W + Math.sin(t * .55 + i * 1.7) * 26 + (hash(i * 5) - .5) * g * 90;
    const y = ((hash(i * 11 + 5) * span - t * sp) % span + span) % span - 150;
    const a = base * (big ? .05 + .06 * hash(i * 17) : .22 + .45 * hash(i * 17)) * (1 + 1.6 * g) * (.7 + .3 * Math.sin(t * 2.1 + i));
    const gr = mctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(186,230,253,${Math.min(1, a).toFixed(3)})`); gr.addColorStop(1, 'rgba(186,230,253,0)');
    mctx.fillStyle = gr; mctx.beginPath(); mctx.arc(x, y, r, 0, Math.PI * 2); mctx.fill();
  }
}

function updateWatermark(t) {
  if (t < T.device - .05) { $('#wmCanvas').style.opacity = 0; return; }
  const o = .038 * prog(t, T.device + .1, T.device + .6) * (t < T.clear ? 1 : lerp(1, .72, prog(t, T.clear, T.clear + .5)));
  wm.draw(t * 1000, o, null);
}

/* grain */
const grainTiles = [];
function buildGrain() { for (let i = 0; i < 4; i++) { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), d = g.createImageData(256, 256); for (let j = 0; j < d.data.length; j += 4) { const v = 128 + (hash(j * 3 + i * 101) - .5) * 255; d.data[j] = d.data[j + 1] = d.data[j + 2] = v; d.data[j + 3] = 255; } g.putImageData(d, 0, 0); grainTiles.push(c.toDataURL()); } }
function updateGrain(t) { const i = Math.floor(t * 30) % 4; const g = $('#grain'); g.style.backgroundImage = `url(${grainTiles[i]})`; g.style.opacity = t < T.irisEnd ? .07 : t < T.device ? .025 : .045; }

function update(t) {
  updateS1(t); updateIris(t); updatePhone(t); updateMap(t); updateStreet(t); updateHero(t); updateGrain(t);
}

/* ------------------------------------------------------------ seek */
const decodeImg = i => (i.src ? (i.complete ? (i.decode ? i.decode().catch(() => { }) : 0) : new Promise(r => { i.onload = i.onerror = r; })) : 0);
window.seek = async t => {
  tl.seek(t, false); update(t);
  await Promise.all([perde, keyImg, prodImg].map(decodeImg));
  updateWatermark(t); drawMotes(t);
};
window.ready = (async () => {
  await document.fonts.load(QFONT); await document.fonts.load('700 100px "Lemon Milk"'); await document.fonts.ready;
  [TRACKS, KEYC] = await Promise.all([fetch('assets/seq/kampanya/tracks.json').then(r => r.json()), fetch('assets/seq/keypng/centers.json').then(r => r.json())]);
  buildQ(); buildGrain();
  street = await createStreet();
  // gelir panelindeki ciro hedefi (ekran koordinatı)
  { const sr = screen.getBoundingClientRect(), r = $('#rvCiro').getBoundingClientRect(); rvTarget = [r.left - sr.left + r.width * .45, r.top - sr.top + r.height * .5]; }
  await Promise.all($$('img').filter(i => i.getAttribute('src')).map(i => i.decode().catch(() => { })));
  await window.seek(0);
  return true;
})();
