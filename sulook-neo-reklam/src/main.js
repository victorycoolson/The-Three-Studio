/* SULOOK Neo — 9:16 / 4:5 sosyal medya reklamı
 * Tüm animasyon deterministik: window.seek(t) çağrısı sahneyi t saniyesine kurar.
 * GSAP sadece duraklatılmış bir timeline olarak kullanılır; prosedürel kısımlar update(t) içinde. */
(() => {
const QS = new URLSearchParams(location.search);
const FMT = QS.get('f') === '45' ? '45' : '916';
const W = 1080, H = FMT === '45' ? 1350 : 1920;
document.documentElement.style.setProperty('--H', H + 'px');
document.body.classList.add('f' + FMT);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, k) => a + (b - a) * k;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const E = n => gsap.parseEase(n);
const eOut = E('expo.out'), eIn = E('expo.in'), eIO = E('power3.inOut'), sIO = E('sine.inOut'), bOut = E('back.out(2)'), p2o = E('power2.out'), p4o = E('power4.out');
const fmtTL = v => '₺' + Math.round(v).toLocaleString('tr-TR');
const fmtN = v => Math.round(v).toLocaleString('tr-TR');
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hash = n => { const r = rng(n * 9973 + 17); return r(); };
const qbez = (p0, c, p1, k) => [lerp(lerp(p0[0], c[0], k), lerp(c[0], p1[0], k), k), lerp(lerp(p0[1], c[1], k), lerp(c[1], p1[1], k), k)];
const set = (el, css) => { for (const k in css) el.style[k] = css[k]; };
const vis = (el, on) => { el.style.visibility = on ? '' : 'hidden'; };

/* ------------------------------------------------------------------ zamanlama */
const T = {
  q_ne: .08, q_o: .36, q_q: .62, glitch: [1.22, 1.86, 2.32],
  iris: 2.62, irisEnd: 3.06,
  tg1: 3.02, tg1out: 4.72, newPin1: 3.95, newPin2: 5.05,
  tg2: 4.9, yonet: 5.55, tg2out: 6.72,
  tap: 6.45, zoom: 6.62, zoomEnd: 7.16,
  street: 7.1, tg3: 7.18, pay1: 7.95, pay2: 9.25, tg3out: 10.3,
  device: 10.45, tg4: 10.55, dive: 11.05, diveEnd: 11.85,
  title: 11.9, bottle: 12.15, bottleIn: 12.92,
  led: 13.05, door: 13.55, callouts: 13.05,
  layout2: 14.9, notif: 15.85, clear: 17.5,
  perks: 17.85, perkGap: .5,
  price: 21.0, strike: 21.55, newPrice: 21.82, taksit: 22.3,
  key: 23.75, endTxt: 24.85, end: 28.5,
};
window.DURATION = T.end;
window.T = T;
window.FPS = 30;

/* ------------------------------------------------------------------ yerleşim */
const LY = {
  '916': {
    neoq: { top: 930, size: 300 },
    phone: { x: 540, y: 1205, s: .9 },
    txtTop: 168, txtTop2: 168,
    hero: { title: 118, mach: [218, 585, 1], ped: [150, 1648], mach2: [40, 693, .9], machBg: [233, 639, .95] },
    callouts: [ // [ankraj local x,y], [label left/right, top], side
      { a: [215, 128], l: [40, 470], side: 'L' },
      { a: [150, 590], l: [40, 1000], side: 'L' },
      { a: [520, 300], l: [40, 760], side: 'R' },
      { a: [512, 840], l: [40, 1270], side: 'R' },
      { a: [285, 505], l: [40, 1370], side: 'L' },
    ],
    panels: [[590, 610], [590, 940], [590, 1270]],
    notifs: [96, 254, 412],
    perks: { top: 430, rowGap: 22, scaleSmall: .5, topSmall: 120 },
    price: {
      p: { old: 790, new: 1010, taksit: 1205 },
      e: { kicker: 968, old: 1046, oldS: .5, new: 1150, newS: .8, sent: 1270, taksit: 1352 },
    },
    key: { s: .58, top: -50 },
    marquee: 1442, url: 1540,
  },
  '45': {
    neoq: { top: 640, size: 260 },
    phone: { x: 540, y: 854, s: .74 },
    txtTop: 46, txtTop2: 46,
    hero: { title: 46, mach: [301, 404, .74], ped: [210, 1185], mach2: [30, 339, .8], machBg: [301, 404, .74] },
    callouts: [
      { a: [215, 128], l: [30, 330], side: 'L' },
      { a: [150, 590], l: [30, 720], side: 'L' },
      { a: [520, 300], l: [30, 470], side: 'R' },
      { a: [512, 840], l: [30, 900], side: 'R' },
      { a: [285, 505], l: [30, 1030], side: 'L' },
    ],
    panels: [[590, 520], [590, 800], [590, 1070]],
    notifs: [30, 178, 326],
    perks: { top: 250, rowGap: 14, scaleSmall: .5, topSmall: 40, rowScale: .86 },
    price: {
      p: { old: 580, new: 760, taksit: 925 },
      e: { kicker: 640, old: 712, oldS: .48, new: 808, newS: .74, sent: 918, taksit: 994 },
    },
    key: { s: .45, top: -75 },
    marquee: 1080, url: 1180,
  },
}[FMT];

/* ------------------------------------------------------------------ elemanlar */
const stage = $('#stage');
const perde = $('#perde'), keyImg = $('#keyImg');
const phoneWrap = $('#phoneWrap'), phone = $('#phone'), screen = $('#screen');
const appMap = $('#appMap'), appStreet = $('#appStreet'), appDevice = $('#appDevice');
const heroWrap = $('#heroWrap'), hero = $('#hero');
const mach = $('#mach');

const tl = gsap.timeline({ paused: true });
const S = {}; // GSAP ile tweenlenen düz nesneler

/* ---------------- sahne 1: ne o? ---------------- */
const neoq = $('#neoq');
set(neoq, { top: LY.neoq.top + 'px', fontSize: LY.neoq.size + 'px', height: LY.neoq.size + 'px' });
const qW = $$('.q-base .w', neoq);
const [wNe, wSp, wO, wQ] = qW;
gsap.set([wNe, wO, wQ], { opacity: 0 });
tl.fromTo(wNe, { opacity: 0, scale: 3.2, filter: 'blur(30px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: .26, ease: 'expo.out' }, T.q_ne);
tl.fromTo(wO, { opacity: 0, scale: 3.2, filter: 'blur(30px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: .26, ease: 'expo.out' }, T.q_o);
tl.fromTo(wQ, { opacity: 0, scale: 0, rotation: -120, y: -160 }, { opacity: 1, scale: 1, rotation: 12, y: 0, duration: .34, ease: 'back.out(2.6)' }, T.q_q);
tl.to(wQ, { rotation: 0, duration: .5, ease: 'elastic.out(1,.4)' }, T.q_q + .34);
S.s1 = { zoom: 0 };

/* ---------------- açık dünya metinleri ---------------- */
const tg = ['#tg1', '#tg2', '#tg3', '#tg4'].map(s => $(s));
tg.forEach(g => { g.style.top = LY.txtTop + 'px'; gsap.set($$('.mline .in', g), { yPercent: 115 }); });
function linesIn(g, t, st = .1) { tl.to($$('.mline .in', g), { yPercent: 0, duration: .7, ease: 'power4.out', stagger: st }, t); }
function linesOut(g, t) { tl.to($$('.mline .in', g), { yPercent: -115, duration: .34, ease: 'power3.in', stagger: .05 }, t); }
linesIn(tg[0], T.tg1, .11); linesOut(tg[0], T.tg1out);
linesIn(tg[1], T.tg2, .12); linesOut(tg[1], T.tg2out);
const yonet = $('#yonet');
gsap.set(yonet, { opacity: 0, scale: .6, y: 20 });
tl.to(yonet, { opacity: 1, scale: 1, y: 0, duration: .5, ease: 'back.out(2.2)' }, T.yonet);
tl.to(yonet, { opacity: 0, y: -20, duration: .25, ease: 'power2.in' }, T.tg2out);
linesIn(tg[2], T.tg3, .12); linesOut(tg[2], T.tg3out);
linesIn(tg[3], T.tg4, .1);

/* ---------------- telefon ---------------- */
S.ph = { x: LY.phone.x, y: LY.phone.y + 120, s: LY.phone.s * 1.32, rx: 10, ry: 22, rz: -9, float: 1 };
tl.to(S.ph, { y: LY.phone.y, s: LY.phone.s, rx: 4, ry: -7, rz: 0, duration: 1.0, ease: 'expo.out' }, T.iris + .05);
tl.to(S.ph, { rx: 0, ry: 0, rz: 0, float: 0, duration: .55, ease: 'power2.inOut' }, T.device);
const diveS = 1080 / 600;
tl.to(S.ph, { x: 540, y: H / 2, s: diveS, duration: T.diveEnd - T.dive, ease: 'power3.inOut' }, T.dive);

/* ---------------- harita uygulaması ---------------- */
const mapCam = $('#mapCam'), mapFx = $('#mapFx');
const PINS = {
  A: { x: 372, y: 352 }, B: { x: 216, y: 540 }, C: { x: 486, y: 730 }, D: { x: 865, y: 374, orange: 1 }, E: { x: 914, y: 600 },
  N1: { x: 640, y: 248, born: T.newPin1 }, N2: { x: 176, y: 772, born: T.newPin2 },
};
const HQ = [763, 528];
const CURVE = { A: [[384, 360], [640, 330]], B: [[268, 532], [560, 400]], C: [[505, 702], [640, 565]], E: [[896, 585], [842, 520]], D: [[852, 372], [822, 420]], N1: [[640, 250], [720, 360]], N2: [[200, 768], [470, 600]] };
for (const k in PINS) {
  const p = PINS[k];
  const w = document.createElement('div');
  w.className = 'pwrap'; w.style.cssText = `position:absolute;left:${p.x}px;top:${p.y}px`;
  w.innerHTML = `<div class="pshadow"></div><div class="pring"></div><div class="pring"></div><div class="mpin ${p.orange ? 'orange' : ''}"><svg><use href="#pin"/></svg></div>` + (p.born ? `<div class="newtag" style="top:-122px">Yeni nokta</div>` : '');
  mapFx.appendChild(w);
  p.el = w; p.pin = $('.mpin', w); p.rings = $$('.pring', w); p.tag = $('.newtag', w);
}
// gelir olayları
const POPS = window.POPS = [[3.3, 'C', 70], [3.66, 'D', 20], [4.12, 'N1', 70], [4.4, 'A', 70], [4.78, 'E', 20], [5.12, 'B', 70], [5.42, 'N2', 20], [5.72, 'C', 70], [6.0, 'A', 20], [6.26, 'D', 70]]
  .map(([t, k, a]) => ({ t, k, a }));
POPS.forEach(ev => {
  const p = PINS[ev.k];
  ev.coin = document.createElement('div'); ev.coin.className = 'coin'; ev.coin.innerHTML = '<svg><use href="#coin"/></svg>';
  ev.plus = document.createElement('div'); ev.plus.className = 'plus'; ev.plus.textContent = '+₺' + ev.a;
  ev.pk = document.createElement('div'); ev.pk.className = 'pkt';
  mapFx.append(ev.pk, ev.coin, ev.plus);
  ev.p = p;
});
const hqRing = document.createElement('div'); hqRing.className = 'pring'; hqRing.style.cssText = `left:${HQ[0]}px;top:${HQ[1] - 70}px;border-color:rgba(255,122,26,.8)`; mapFx.appendChild(hqRing);
const hqRing2 = hqRing.cloneNode(); mapFx.appendChild(hqRing2);

S.map = { fx: 600, fy: 470, z: .9, blur: 0 };
tl.to(S.map, { fx: 425, fy: 455, z: .97, duration: T.tap - T.irisEnd, ease: 'sine.inOut' }, T.irisEnd);
tl.to(S.map, { fx: 372, fy: 300, z: 6, duration: T.zoomEnd - T.zoom, ease: 'power4.in' }, T.zoom);
tl.to(S.map, { blur: 14, duration: .3, ease: 'power2.in' }, T.zoom + .24);
const statCard = $('#statCard');
tl.to(statCard, { y: 420, duration: .4, ease: 'power3.in' }, T.zoom);
tl.fromTo('#scrFlash', { opacity: 0 }, { opacity: 1, duration: .1, ease: 'power1.in' }, T.zoomEnd - .12);
tl.to('#scrFlash', { opacity: 0, duration: .3, ease: 'power2.out' }, T.zoomEnd - .02);
const tap = $('#tap');
const [tapDot, tapRing] = $$('#tap i');

/* ---------------- sokak uygulaması ---------------- */
const stCam = $('#stCam'), stFx = $('#stFx');
S.st = { fx: 430, fy: 700, z: 2.4, blur: 8 };
tl.to(S.st, { fx: 500, fy: 690, z: 1.25, blur: 0, duration: .85, ease: 'expo.out' }, T.street);
tl.to(S.st, { fx: 508, fy: 686, z: 1.3, duration: T.device - T.street - .85, ease: 'none' }, T.street + .85);
const PAYS = [
  { t: T.pay1, head: [510, 668], nfc: [462, 745], amt: 70, lt: 19, label: '19 L dolum', shift: -50 },
  { t: T.pay2, head: [684, 748], nfc: null, amt: 20, lt: 5, label: '5 L dolum', shift: -78 },
];
PAYS.forEach(p => {
  p.b = document.createElement('div'); p.b.className = 'bubble';
  p.b.innerHTML = `<span class="bk"><svg><use href="#i-check"/></svg></span><span><b>Ödeme alındı · +₺${p.amt}</b><small>${p.label}</small></span>`;
  p.b.style.left = p.head[0] + 'px'; p.b.style.top = p.head[1] + 'px';
  stFx.appendChild(p.b);
  p.rings = [];
  if (p.nfc) for (let i = 0; i < 3; i++) { const r = document.createElement('div'); r.className = 'nfc'; r.style.left = p.nfc[0] + 'px'; r.style.top = p.nfc[1] + 'px'; stFx.appendChild(r); p.rings.push(r); }
  p.coins = [];
  for (let i = 0; i < 4; i++) { const c = document.createElement('div'); c.className = 'coin'; c.innerHTML = '<svg><use href="#coin"/></svg>'; $('#coinsUI').appendChild(c); p.coins.push(c); }
});
const icChip = $('#icChip');
const SPARK = [38, 30, 34, 24, 29, 22, 27, 18, 23, 16, 21, 14];

/* ---------------- cihaz sayfası + dalış ---------------- */
gsap.set(appDevice, { xPercent: 100 });
tl.to(appDevice, { xPercent: 0, duration: .55, ease: 'power3.inOut' }, T.device);
tl.to(appStreet, { xPercent: -28, opacity: .4, duration: .55, ease: 'power3.inOut' }, T.device);
tl.to('#devChrome', { opacity: 0, duration: .3 }, T.dive + .05);
tl.to(['#statusBar', '#homeInd'], { opacity: 0, duration: .25 }, T.dive + .05);
tl.to(tg[3], { opacity: 0, scale: 1.5, y: -120, duration: .45, ease: 'power2.in' }, T.dive);
tl.to('#lbg', { scale: 1.6, duration: T.diveEnd - T.dive, ease: 'power3.inOut' }, T.dive);
const k = 600 / W;
heroWrap.style.transform = `translate(0px, ${(1300 - H * k) / 2}px) scale(${k})`;

/* ---------------- hero ---------------- */
const HL = LY.hero;
$('#hTitle').style.top = HL.title + 'px';
const ped = $('#pedestal');
set(ped, { left: HL.ped[0] + 'px', right: HL.ped[0] + 'px', top: HL.ped[1] + 'px', bottom: '-400px' });
S.m = { x: HL.mach[0], y: HL.mach[1], s: HL.mach[2], o: 1, blur: 0, bright: 1 };
S.ped = { o: 1, y: 0 };
// başlık
const htK = $('.ht-k .in'), hnS = $('.hn-s'), hnA = $('.hn-a'), hnB = $('.hn-b'), htSpec = $('.ht-spec');
gsap.set(htK, { yPercent: 115 }); gsap.set(hnS, { opacity: 0, y: 40, scale: .9 }); gsap.set(hnA, { opacity: 0 }); gsap.set(hnB, { opacity: 0 }); gsap.set(htSpec, { opacity: 0, y: 24 });
tl.to(htK, { yPercent: 0, duration: .6, ease: 'power4.out' }, T.title);
tl.to(hnS, { opacity: 1, y: 0, scale: 1, duration: .5, ease: 'expo.out' }, T.title + .06);
tl.fromTo(hnA, { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: .3, ease: 'expo.out' }, T.title + .16);
tl.to(hnA, { opacity: 0, filter: 'blur(10px)', scaleX: .7, duration: .22, ease: 'power2.in' }, T.title + .62);
tl.fromTo(hnB, { opacity: 0, scale: 1.35, filter: 'blur(12px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: .4, ease: 'expo.out' }, T.title + .72);
tl.to(htSpec, { opacity: 1, y: 0, duration: .5, ease: 'power3.out' }, T.title + .8);
S.spec = { g: 0, l: 0 };
tl.to(S.spec, { g: 1330, l: 160, duration: .7, ease: 'power2.out' }, T.title + .8);
tl.to('#hTitle', { opacity: 0, y: -40, duration: .35, ease: 'power2.in' }, T.notif - .2);

// damacana
const bFly = $('#mBottleFly'), bIn = $('#mBottleIn'), cavGlow = $('#mCavGlow'), fillShine = $('#mFillShine');
// led & kapak
const ledOff = $('#mLedOff'), ledGlow = $('#mLedGlow'), ledWash = $('#mLedWash'), door = $('#mDoor'), sheen = $('#mSheen');
const LED_STATES = [[T.led, 0], [T.led + .16, 1], [T.led + .3, 0], [T.led + .44, 1]]; // 0=kapalı 1=açık
S.door = { y: -102 };
tl.to(S.door, { y: 0, duration: .32, ease: 'power2.inOut' }, T.door);
tl.to(S.door, { y: -102, duration: .32, ease: 'power2.inOut' }, T.door + .58);

// callout'lar
const callSvg = $('#callSvg'), callouts = $('#callouts');
callSvg.setAttribute('viewBox', `0 0 ${W} ${H}`); callSvg.setAttribute('width', W); callSvg.setAttribute('height', H);
const CO = [
  { ic: 'i-light', b: 'LED Aydınlatma', st: 'led' },
  { ic: 'i-door', b: 'Dolum Kabini', st: 'door' },
  { ic: 'i-filter', b: '1330 GPD', s: 'Arıtma kapasitesi' },
  { ic: 'i-tank', b: '160 L', s: 'Depo kapasitesi' },
  { ic: 'i-card', b: 'Kartlı Ödeme', s: 'Ödeme ünitesi' },
];
const coT = [T.callouts, T.door, T.door + .3, T.door + .5, T.door + .7];
CO.forEach((c, i) => {
  const L = LY.callouts[i];
  const el = document.createElement('div'); el.className = 'glass callout';
  el.innerHTML = `<span class="ci"><svg><use href="#${c.ic}"/></svg></span><span><b>${c.b}${c.st ? `<span class="st" data-st="${c.st}">Açık</span>` : ''}</b>${c.s ? `<small>${c.s}</small>` : ''}</span>`;
  el.style.top = L.l[1] + 'px';
  if (L.side === 'L') el.style.left = L.l[0] + 'px'; else el.style.right = L.l[0] + 'px';
  callouts.appendChild(el);
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); dot.setAttribute('class', 'ad'); dot.setAttribute('r', 8);
  const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); ring.setAttribute('class', 'ar'); ring.setAttribute('r', 8);
  callSvg.append(path, ring, dot);
  c.el = el; c.path = path; c.dot = dot; c.ring = ring; c.L = L; c.t = coT[i];
  c.stEl = $('.st', el);
  gsap.set(el, { opacity: 0, x: L.side === 'L' ? -40 : 40 });
  tl.to(el, { opacity: 1, x: 0, duration: .4, ease: 'expo.out' }, c.t + .22);
  tl.to(el, { opacity: 0, x: L.side === 'L' ? -30 : 30, duration: .25, ease: 'power2.in' }, T.layout2 - .05 + i * .03);
});

// layout 2: makine sola kayar, sağda veri paneller
tl.to(S.m, { x: HL.mach2[0], y: HL.mach2[1], s: HL.mach2[2], duration: .7, ease: 'power3.inOut' }, T.layout2);
const panels = $('#panels');
const PN = [
  { t: 'Günlük dolum', html: `<div class="pv"><span data-c="240">0</span></div><div class="bars">${[.45, .62, .5, .78, .66, .9, .74, 1].map(h => `<i style="height:${h * 100}%"></i>`).join('')}</div>` },
  { t: 'Filtre ömrü', html: `<div class="pv"><span data-c="82">0</span><small>%</small></div><svg class="ring" viewBox="0 0 104 104"><circle class="rb" cx="52" cy="52" r="44"/><circle class="rf" cx="52" cy="52" r="44" stroke-dasharray="276.5" stroke-dashoffset="276.5"/></svg><div class="lvl" style="margin-top:22px;width:150px"><i data-w="82"></i></div>` },
  { t: 'Depo seviyesi', html: `<div class="pv"><span data-c="160">0</span><small>L</small></div><div class="lvl"><i data-w="100"></i></div>` },
];
PN.forEach((p, i) => {
  const el = document.createElement('div'); el.className = 'glass panel';
  el.innerHTML = `<div class="pt"><i class="live"></i>${p.t}</div>${p.html}`;
  set(el, { left: LY.panels[i][0] + 'px', top: LY.panels[i][1] + 'px', width: (W - LY.panels[i][0] - 40) + 'px' });
  panels.appendChild(el); p.el = el; p.t0 = T.layout2 + .3 + i * .16;
  gsap.set(el, { opacity: 0, x: 80 });
  tl.to(el, { opacity: 1, x: 0, duration: .55, ease: 'expo.out' }, p.t0);
  const cnt = $('[data-c]', el); const obj = { v: 0 };
  tl.to(obj, { v: +cnt.dataset.c, duration: .9, ease: 'power2.out', onUpdate: () => cnt.textContent = fmtN(obj.v) }, p.t0 + .1);
  $$('.bars i', el).forEach((b, j) => { gsap.set(b, { scaleY: 0 }); tl.to(b, { scaleY: 1, duration: .45, ease: 'back.out(1.6)' }, p.t0 + .15 + j * .04); });
  const rf = $('.rf', el); if (rf) tl.to(rf, { attr: { 'stroke-dashoffset': 276.5 * (1 - .82) }, duration: .9, ease: 'power2.out' }, p.t0 + .1);
  $$('.lvl i', el).forEach(b => tl.to(b, { width: b.dataset.w + '%', duration: .9, ease: 'power2.out' }, p.t0 + .15));
  tl.to(el, { opacity: 0, x: 80, duration: .3, ease: 'power2.in' }, (LY.panelsOutAtNotif ? T.notif - .15 : T.clear) + i * .04);
});
// bildirimler
const NT = [
  { c: '#22c55e', h: 'Günlük rapor', b: 'Bugün 240 dolum tamamlandı', s: 'Nokta 03 · ₺6.720 ciro' },
  { c: '#3cbcfc', h: 'Depo', b: 'Depo doldu · 160 L hazır', s: 'Arıtma tamamlandı' },
  { c: '#ff7a1a', h: 'Servis', b: 'Filtre bakımı planlandı', s: 'Nokta 05 · teknik ekip yolda' },
];
NT.forEach((n, i) => {
  const el = document.createElement('div'); el.className = 'notif';
  el.innerHTML = `<span class="ni"><svg><use href="#face"/></svg></span><span class="nb"><span class="nh"><span><i class="tagw" style="background:${n.c}"></i>SULOOK · ${n.h}</span><span>şimdi</span></span><b>${n.b}</b><small>${n.s}</small></span>`;
  set(el, { left: (W - 820) / 2 + 'px', top: LY.notifs[i] + 'px' });
  $('#notifs').appendChild(el);
  gsap.set(el, { opacity: 0, y: -60, scale: .94 });
  tl.to(el, { opacity: 1, y: 0, scale: 1, duration: .5, ease: 'back.out(1.4)' }, T.notif + i * .32);
  tl.to(el, { opacity: 0, y: -50, duration: .3, ease: 'power2.in' }, T.clear + .05 - i * .04);
});

// kampanya
tl.to(S.m, { x: HL.machBg[0], y: HL.machBg[1], s: HL.machBg[2], o: .32, blur: 5, duration: .7, ease: 'power3.inOut' }, T.clear);
tl.to(S.ped, { o: .35, duration: .7 }, T.clear);
const perks = $('#perks'), pkList = $('.pk-list', perks);
perks.style.top = LY.perks.top + 'px';
gsap.set($('.pk-eyebrow .in'), { yPercent: 115 });
tl.to($('.pk-eyebrow .in'), { yPercent: 0, duration: .6, ease: 'power4.out' }, T.perks - .3);
const PK = [
  ['i-truck', 'Ücretsiz', 'Nakliye'],
  ['i-tool', 'Ücretsiz', 'Kurulum'],
  ['i-filter', '1 Yıl Ücretsiz', 'Filtre Bakımı'],
  ['i-headset', '1 Yıl', 'Call Center Yardımı'],
  ['i-link', '1 Yıl Ücretsiz', 'Otis Bağlantı Hizmeti'],
];
const perkEls = PK.map(([ic, top, main], i) => {
  const el = document.createElement('div'); el.className = 'perk';
  el.innerHTML = `<span class="pi"><svg><use href="#${ic}"/></svg></span><span class="pt"><small>${top}</small>${main}</span><span class="pc"><svg><use href="#i-check"/></svg></span>`;
  pkList.appendChild(el);
  const t0 = T.perks + i * T.perkGap;
  gsap.set(el, { opacity: 0, x: -360, skewX: -14 });
  tl.to(el, { opacity: 1, x: 0, skewX: 0, duration: .5, ease: 'expo.out' }, t0);
  const pc = $('.pc', el); gsap.set(pc, { scale: 0, rotation: -90 });
  tl.to(pc, { scale: 1, rotation: 0, duration: .4, ease: 'back.out(3)' }, t0 + .18);
  const pi = $('.pi', el); tl.fromTo(pi, { scale: .5 }, { scale: 1, duration: .45, ease: 'back.out(3)' }, t0 + .05);
  return el;
});
pkList.style.gap = LY.perks.rowGap + 'px';
if (LY.perks.rowScale) gsap.set(pkList, { scale: LY.perks.rowScale, transformOrigin: '50% 0' });
tl.to(perks, { scale: LY.perks.scaleSmall, top: LY.perks.topSmall, duration: .55, ease: 'power3.inOut' }, T.price - .15);
tl.to(perks, { opacity: 0, y: -40, duration: .4, ease: 'power2.in' }, T.key - .1);

// fiyat
const P = LY.price;
const pKicker = $('#pKicker'), pOld = $('#pOld'), pNew = $('#pNew'), pSent = $('#pSent'), pTaksit = $('#pTaksit'), pStrike = $('#pStrike'), pTag = $('#pTag');
const centerAt = (el, y) => { el.style.top = (y - el.offsetHeight / 2) + 'px'; };
S.pr = { oldY: P.p.old, oldS: 1, oldO: 0, newY: P.p.new, newS: 1, taksitY: P.p.taksit };
tl.fromTo(pOld, { opacity: 0, scale: 1.7, filter: 'blur(18px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: .35, ease: 'expo.out' }, T.price);
gsap.set(pStrike, { scaleX: 0, rotation: -7 });
tl.to(pStrike, { scaleX: 1, duration: .2, ease: 'power4.in' }, T.strike);
tl.to(pOld, { opacity: .55, duration: .25 }, T.strike + .2);
tl.to(S.pr, { oldY: P.p.old - 30, oldS: .78, duration: .45, ease: 'power3.out' }, T.strike + .22);
tl.fromTo(pNew, { opacity: 0, scale: 2.6, filter: 'blur(24px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: .38, ease: 'expo.out' }, T.newPrice);
gsap.set(pTag, { scale: 0, rotation: -30 });
tl.to(pTag, { scale: 1, rotation: -7, duration: .45, ease: 'back.out(3)' }, T.newPrice + .28);
tl.fromTo(pTaksit, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power2.out' }, T.taksit);
tl.fromTo('#hFlash', { opacity: 0 }, { opacity: .55, duration: .05 }, T.newPrice);
tl.to('#hFlash', { opacity: 0, duration: .35, ease: 'power2.out' }, T.newPrice + .05);
// son kart düzeni
tl.to(S.pr, { oldY: P.e.old, oldS: P.e.oldS, newY: P.e.new, newS: P.e.newS, taksitY: P.e.taksit, duration: .8, ease: 'power3.inOut' }, T.key + .1);
tl.fromTo(pKicker, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .55, ease: 'expo.out' }, T.endTxt);
tl.fromTo(pSent, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .55, ease: 'expo.out' }, T.endTxt + .3);
tl.to(pTaksit, { scale: .9, duration: .6, ease: 'power3.inOut' }, T.key + .1);
// anahtar sahnesi
const keyScene = $('#keyScene');
tl.to(keyScene, { opacity: 1, duration: .55, ease: 'power2.inOut' }, T.key);
gsap.set(keyImg, { scale: LY.key.s, y: LY.key.top, x: 0 });
const mq = $('#marquee'), mqIn = $('.mq-in', mq);
mq.style.top = LY.marquee + 'px';
const mqItems = PK.map(([ic, top, main]) => `<span class="mq-it"><i><svg><use href="#i-check"/></svg></i>${top} ${main}</span>`).join('');
mqIn.innerHTML = mqItems + mqItems + mqItems;
tl.to(mq, { opacity: 1, duration: .5 }, T.endTxt + .55);
const endUrl = $('#endUrl'); endUrl.style.top = LY.url + 'px';
tl.fromTo(endUrl, { opacity: 0, y: 30, scale: .9 }, { opacity: 1, y: 0, scale: 1, duration: .55, ease: 'back.out(2)' }, T.endTxt + .8);

/* ------------------------------------------------------------------ prosedürel güncelleme */
const shakeHits = [[T.q_ne + .05, 22], [T.q_o + .05, 22], [T.q_q + .08, 26], [T.glitch[0], 14], [T.glitch[1], 16], [T.glitch[2], 18],
  [T.bottleIn, 10], [T.price + .03, 16], [T.strike + .18, 12], [T.newPrice + .04, 30]];
function shake(t) {
  let x = 0, y = 0, r = 0;
  for (const [h, a] of shakeHits) {
    const d = t - h; if (d < 0 || d > .4) continue;
    const env = a * Math.exp(-d * 11);
    x += env * Math.sin(d * 95 + h * 7); y += env * Math.cos(d * 83 + h * 3); r += env * .02 * Math.sin(d * 70);
  }
  return [x, y, r];
}
function glitchAmt(t) { let g = 0; for (const h of T.glitch) { const d = t - h; if (d >= 0 && d < .14) g = Math.max(g, 1 - d / .14); } for (const h of [T.q_ne, T.q_o, T.q_q]) { const d = t - h; if (d >= 0 && d < .07) g = Math.max(g, .6); } return g; }

let perdeIdx = -1, keyIdx = -1;
function frameSrc(el, kind, idx, cur) { if (idx === cur) return cur; el.src = `assets/seq/${kind}/${String(idx).padStart(4, '0')}.jpg`; return idx; }

function updateS1(t) {
  const on = t < T.irisEnd + .02; vis($('#s1'), on); if (!on) return;
  const src = .25 + t * 1.25;
  perdeIdx = frameSrc(perde, 'perde', clamp(Math.floor(src * 24) + 1, 1, 241), perdeIdx);
  const [sx, sy, sr] = shake(t);
  $('#s1cam').style.transform = `translate(${sx * .6}px,${sy * .6}px) scale(${1.08 + t * .035}) rotate(${-0.6 + t * .25 + sr}deg)`;
  $('#s1light').style.opacity = .5 + .5 * Math.sin(t * 5.3) * Math.sin(t * 2.1);
  // yazı
  const breath = 1 + t * .03 + .012 * Math.sin(t * 9);
  const g = glitchAmt(t);
  const fi = Math.floor(t * 30);
  const jx = g ? (hash(fi) - .5) * 40 * g : 0;
  $('.q-base', neoq).style.transform = `translate(${sx + jx}px,${sy}px) scale(${breath}) skewX(${g ? (hash(fi + 3) - .5) * 14 * g : 0}deg)`;
  $$('.q-glitch', neoq).forEach((c, i) => {
    if (!g) { c.style.opacity = 0; return; }
    $$('.w', c).forEach((w, j) => { w.style.opacity = qW[j].style.opacity === '' ? 1 : qW[j].style.opacity; });
    c.style.opacity = .85 * g;
    const off = (i ? -1 : 1) * (10 + 26 * g) + (hash(fi + i * 11) - .5) * 20;
    const a = hash(fi + 31 + i) * 70, b = a + 8 + hash(fi + 7 + i) * 30;
    c.style.clipPath = `inset(${a}% 0 ${100 - b}% 0)`;
    c.style.transform = `translate(${sx + off}px,${sy}px) scale(${breath})`;
  });
  // flaş
  let fl = 0; for (const h of [T.q_ne, T.q_o, T.q_q]) { const d = t - h; if (d >= 0 && d < .18) fl = Math.max(fl, .28 * (1 - d / .18)); }
  $('#s1flash').style.opacity = fl + (glitchAmt(t) > .8 ? .12 : 0);
}

function updateIris(t) {
  const light = $('#light'), iris = $('#iris');
  if (t < T.iris) { vis(light, false); iris.style.opacity = 0; return; }
  vis(light, true);
  if (t >= T.irisEnd) { light.style.clipPath = 'none'; iris.style.opacity = 0; return; }
  const r0 = wO.getBoundingClientRect();
  const cx = r0.left + r0.width / 2, cy = r0.top + r0.height * .58;
  const k = eIn(prog(t, T.iris, T.irisEnd));
  const R = 40 + k * Math.hypot(W, H) * 1.05;
  light.style.clipPath = `circle(${R}px at ${cx}px ${cy}px)`;
  const bw = 26 + R * .22;
  set(iris, { opacity: 1, left: (cx - R - bw) + 'px', top: (cy - R - bw) + 'px', width: 2 * R + 'px', height: 2 * R + 'px', borderWidth: bw + 'px' });
}

function updatePhone(t) {
  const p = S.ph;
  const fl = p.float;
  const ry = p.ry + fl * 3.5 * Math.sin(t * 1.4), rx = p.rx + fl * 1.6 * Math.sin(t * 1.05 + 1), fy = fl * 10 * Math.sin(t * 1.2);
  phoneWrap.style.transform = `translate(${p.x - 320}px,${p.y - 670 + fy}px) scale(${p.s})`;
  phone.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${p.rz}deg)`;
  // dalıştan sonra gövde ve gölgeyi gizle (ekran tüm sahneyi kaplar)
  const solo = t >= T.diveEnd;
  $('.ph-body').style.visibility = solo ? 'hidden' : '';
  $('.ph-shadow').style.visibility = solo ? 'hidden' : '';
  $('.ph-glare').style.opacity = 1 - prog(t, T.dive, T.diveEnd);
  $('#lbg').style.visibility = solo ? 'hidden' : '';
  $('#txt').style.visibility = solo ? 'hidden' : '';
  screen.style.borderRadius = solo ? '0' : '78px';
}

function updateMap(t) {
  const on = t >= T.iris && t < T.zoomEnd + .2; vis(appMap, on); if (!on) return;
  const m = S.map;
  mapCam.style.transform = `translate(${300 - m.fx * m.z}px,${600 - m.fy * m.z}px) scale(${m.z})`;
  mapCam.style.filter = m.blur > .1 ? `blur(${m.blur}px)` : 'none';
  // pinler
  for (const kk in PINS) {
    const p = PINS[kk];
    let sY = 1, sX = 1, yOff = 0, op = 1;
    if (p.born) {
      const d = t - p.born;
      if (d < 0) { op = 0; } else {
        const k1 = prog(d, 0, .5);
        yOff = -260 * (1 - E('bounce.out')(k1)); op = clamp(d / .12);
      }
      if (p.tag) { const dd = t - p.born - .35; p.tag.style.opacity = dd < 0 ? 0 : clamp(dd / .12) * (1 - prog(dd, .9, 1.15)); p.tag.style.transform = `translate(-50%,-100%) scale(${dd < 0 ? .5 : lerp(.5, 1, bOut(prog(dd, 0, .3)))})`; }
    }
    // gelir sıçraması
    for (const ev of POPS) if (ev.k === kk) {
      const d = t - ev.t;
      if (d >= 0 && d < .5) { sY *= 1 + .16 * Math.sin(d * 18) * Math.exp(-d * 7); sX *= 1 - .08 * Math.sin(d * 18) * Math.exp(-d * 7); }
    }
    if (kk === 'A' && t > T.tap - .05) { const d = t - T.tap; sY *= 1 + .15 * bOut(prog(d, 0, .25)); sX *= 1 + .15 * bOut(prog(d, 0, .25)); }
    p.pin.style.transform = `translateY(${yOff}px) scale(${sX},${sY})`;
    p.el.style.opacity = op;
    p.rings.forEach((r, i) => {
      const ph = ((t * .7 + i * .5 + (p.x % 7) * .13) % 1);
      r.style.transform = `scale(${.3 + ph * 1.1})`; r.style.opacity = (1 - ph) * .9 * (p.born ? clamp((t - p.born - .3) / .3) : 1);
    });
  }
  // coin + paket
  for (const ev of POPS) {
    const d = t - ev.t, p = ev.p;
    if (d < 0 || d > 1.2) { ev.coin.style.opacity = 0; ev.plus.style.opacity = 0; ev.pk.style.opacity = 0; continue; }
    const k1 = prog(d, 0, 1.0);
    const cy = p.y - 118 - 80 * p2o(k1);
    const sc = d < .18 ? bOut(d / .18) : 1;
    const flip = Math.cos(d * 14);
    set(ev.coin, { left: p.x + 'px', top: cy + 'px', opacity: 1 - prog(d, .75, 1.0), transform: `scale(${sc * Math.max(.15, Math.abs(flip))},${sc})` });
    set(ev.plus, { left: (p.x + 66) + 'px', top: (cy - 6) + 'px', opacity: clamp(d / .1) * (1 - prog(d, .8, 1.05)), transform: `translate(-50%,-50%) scale(${lerp(.6, 1, bOut(prog(d, 0, .25)))})` });
    const cv = CURVE[ev.k];
    const kp = prog(d, .08, .78);
    const [px, py] = qbez(cv[0], cv[1], HQ, E('power1.inOut')(kp));
    set(ev.pk, { left: px + 'px', top: py + 'px', opacity: kp > 0 && kp < 1 ? 1 : 0 });
  }
  // HQ nabzı
  let last = -9; for (const ev of POPS) if (t >= ev.t + .78) last = ev.t + .78;
  const dh = t - last;
  [hqRing, hqRing2].forEach((r, i) => { const dd = dh - i * .12; r.style.transform = `scale(${.4 + prog(dd, 0, .6) * 1.4})`; r.style.opacity = dd >= 0 && dd < .6 ? (1 - dd / .6) : 0; });
  // sayaçlar
  let dol = 240, ciro = 6720;
  for (const ev of POPS) if (t >= ev.t + .12) { dol += 1; ciro += ev.a; }
  $('#stDolum').textContent = fmtN(dol); $('#stCiro').textContent = fmtTL(ciro);
  const on2 = 5 + (t >= T.newPin1 + .3) + (t >= T.newPin2 + .3);
  $('#stOn').textContent = on2; $('#stOn2').textContent = on2; $('#nOnline').textContent = on2;
  // dokunma
  const d = t - T.tap;
  if (d < -.15 || d > .6) tap.style.opacity = 0;
  else {
    const sx = 300 + (PINS.A.x - m.fx) * m.z, sy = 600 + (PINS.A.y - 52 - m.fy) * m.z;
    set(tap, { opacity: clamp((d + .15) / .1) * (1 - prog(d, .4, .6)), left: sx + 'px', top: sy + 'px' });
    tapDot.style.transform = `scale(${d < 0 ? 1.4 - (d + .15) / .15 * .4 : d < .12 ? 1 - .2 * d / .12 : .8})`;
    tapRing.style.transform = `scale(${d < 0 ? 1 : 1 + prog(d, 0, .45) * 1.6})`; tapRing.style.opacity = d < 0 ? 0 : 1 - prog(d, 0, .45);
  }
}

function updateStreet(t) {
  const on = t >= T.street - .05 && t < T.dive + .7; vis(appStreet, on); if (!on) return;
  const s = S.st;
  const toScr = (x, y) => [300 + (x - s.fx) * s.z, 760 + (y - s.fy) * s.z];
  stCam.style.transform = `translate(${300 - s.fx * s.z}px,${760 - s.fy * s.z}px) scale(${s.z})`;
  stCam.style.filter = s.blur > .1 ? `blur(${s.blur}px)` : 'none';
  let lt = 840, ciro = 3820, lastAmt = 20, lastT = -9;
  PAYS.forEach((p, idx) => {
    const d = t - p.t;
    // nfc halkaları
    p.rings.forEach((r, i) => { const dd = d - i * .14; r.style.opacity = dd >= 0 && dd < .6 ? (1 - dd / .6) : 0; r.style.transform = `scale(${(.4 + prog(dd, 0, .6) * 1.6) / s.z})`; });
    // balon
    const bo = d < .15 ? 0 : clamp((d - .15) / .15) * (1 - prog(d, 1.5, 1.75));
    const bs = d < .15 ? .4 : lerp(.4, 1, bOut(prog(d, .15, .45)));
    set(p.b, { opacity: bo, transform: `translate(${p.shift}%,-100%) translateY(${-14 - 20 * p2o(prog(d, .15, 1.6))}px) scale(${bs / s.z})`, transformOrigin: `${-p.shift}% 100%` });
    // coinler balondan karta
    const [bx, by] = toScr(p.head[0], p.head[1] - 60);
    p.coins.forEach((c, i) => {
      const dd = d - .35 - i * .07;
      if (dd < 0 || dd > .55) { c.style.opacity = 0; return; }
      const kk = E('power2.in')(dd / .55);
      const [x, y] = qbez([bx + (i - 1.5) * 18, by], [lerp(bx, 440, .3) - 60, by - 260], [440, 235], kk);
      set(c, { opacity: 1, left: x + 'px', top: y + 'px', transform: `scale(${lerp(1, .6, kk) * Math.max(.2, Math.abs(Math.cos(dd * 16)))},${lerp(1, .6, kk)})` });
    });
    if (d >= .95) { lt += p.lt; ciro += p.amt; lastAmt = p.amt; lastT = p.t + .95; }
  });
  $('#icLitre').textContent = fmtN(lt); $('#icCiro').textContent = fmtTL(ciro);
  const dc = t - lastT;
  icChip.textContent = '↗ +₺' + lastAmt;
  icChip.style.transform = `scale(${dc >= 0 && dc < .4 ? 1 + .25 * Math.sin(dc / .4 * Math.PI) : 1})`;
  $('#icCiro').style.color = dc >= 0 && dc < .5 ? '#0a8a3a' : '';
  // sparkline
  const nPay = PAYS.filter(p => t >= p.t + .95).length;
  const pts = SPARK.slice(0, 10 + nPay);
  const draw = clamp((t - T.street) / .8);
  const wv = 520 / 11;
  let dd = '', fill = '';
  const nShow = Math.max(2, Math.ceil(pts.length * draw));
  for (let i = 0; i < nShow; i++) { const x = i * wv, y = pts[i] + 2 * Math.sin(t * 3 + i); dd += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }
  fill = dd + `L${((nShow - 1) * wv).toFixed(1)} 70 L0 70Z`;
  $('#sparkLine').setAttribute('d', dd); $('#sparkFill').setAttribute('d', fill);
  const lx = (nShow - 1) * wv, ly = pts[nShow - 1] + 2 * Math.sin(t * 3 + nShow - 1);
  $('#sparkDot').setAttribute('cx', lx); $('#sparkDot').setAttribute('cy', ly);
  // durum çubuğu rengi
  $('#statusBar').classList.toggle('dark', t >= T.device + .25);
  $('#homeInd').style.background = t >= T.device + .25 ? '#fff' : '#0b1b3a';
}

function updateHero(t) {
  const on = t >= T.device - .05; vis(appDevice, on); if (!on) return;
  // dalıştan sonra hero'yu doğrudan sahneye taşı (net raster için)
  const solo = t >= T.diveEnd;
  if (solo && heroWrap.parentNode !== stage) { stage.insertBefore(heroWrap, $('#iris')); heroWrap.style.transform = 'none'; }
  if (!solo && heroWrap.parentNode !== appDevice) { appDevice.insertBefore(heroWrap, $('#devChrome')); heroWrap.style.transform = `translate(0px, ${(1300 - H * k) / 2}px) scale(${k})`; }
  vis($('#light'), !solo && t >= T.iris);
  // arka plan tipografisi
  $('#hbgType').style.transform = `translate(${-80 + t * 18}px, ${t * 6}px) rotate(-24deg)`;
  // makine
  const m = S.m;
  const bob = Math.sin(t * 1.6) * 4;
  mach.style.transform = `translate(${m.x}px,${m.y + bob}px) scale(${m.s})`;
  mach.style.opacity = m.o; mach.style.filter = m.blur > .1 ? `blur(${m.blur}px)` : 'none';
  ped.style.opacity = S.ped.o;
  // parlama süpürmesi
  sheen.style.backgroundPosition = `${lerp(130, -30, prog(t, T.diveEnd - .2, T.diveEnd + 1.1))}% 0`;
  // spec sayaçları
  $('#gpd').textContent = Math.round(S.spec.g); $('#lt').textContent = Math.round(S.spec.l);
  // damacana uçuşu
  const db = t - T.bottle, durB = T.bottleIn - T.bottle;
  const inPos = [100, 564];
  if (db < 0) { bFly.style.opacity = 0; bIn.style.opacity = 0; }
  else if (db < durB) {
    const kb = E('power2.inOut')(db / durB);
    const [x, y] = qbez([-560, 360], [-260, 140], inPos, kb);
    const sc = lerp(2.5, 1, E('power2.in')(db / durB)), rot = lerp(-38, 0, E('power2.out')(db / durB));
    set(bFly, { opacity: clamp(db / .1), transform: `translate(${x}px,${y}px) rotate(${rot}deg) scale(${sc})`, filter: `blur(${lerp(6, 0, db / durB)}px) drop-shadow(0 30px 30px rgba(0,10,40,.45))` });
    bIn.style.opacity = 0;
  } else { bFly.style.opacity = 0; bIn.style.opacity = 1; }
  const dg = t - T.bottleIn;
  cavGlow.style.opacity = dg < 0 ? 0 : .9 * (1 - prog(dg, .9, 1.6)) * (.85 + .15 * Math.sin(dg * 20));
  fillShine.style.opacity = dg < 0 ? 0 : 1 - prog(dg, 1.0, 1.4);
  fillShine.style.backgroundPosition = `0 ${lerp(0, 100, prog(dg, 0, 1.2))}%`;
  // LED
  let led = 1;
  for (const [ts, v] of LED_STATES) if (t >= ts) led = v;
  ledOff.style.opacity = led ? 0 : 1;
  let lastOn = -9; for (const [ts, v] of LED_STATES) if (v && t >= ts) lastOn = ts;
  const dl = t - lastOn;
  ledGlow.style.opacity = led ? (t < T.led ? .5 : .75 + .25 * Math.exp(-dl * 3)) : 0;
  ledGlow.style.transform = `rotate(-12.2deg) scale(${1 + (led ? .3 * Math.exp(-dl * 5) : 0)})`;
  ledWash.style.opacity = led ? (t < T.led ? 0 : .55 * Math.exp(-dl * 1.6) + .15) : 0;
  // kapak
  door.style.transform = `translateY(${S.door.y}%)`;
  // callout çizgileri
  const mx = m.x, my = m.y + bob, ms = m.s;
  CO.forEach(c => {
    const d = t - c.t;
    const ax = mx + c.L.a[0] * ms, ay = my + c.L.a[1] * ms;
    const vis2 = t < T.layout2 + .15;
    const r = c.el.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    const lx = (c.L.side === 'L' ? r.right : r.left) - hr.left, ly = r.top + r.height / 2 - hr.top;
    const ex = lx + (c.L.side === 'L' ? 6 : -6);
    const midx = lerp(ax, ex, .45);
    const dstr = `M${ax.toFixed(1)} ${ay.toFixed(1)} L${midx.toFixed(1)} ${ly.toFixed(1)} L${ex.toFixed(1)} ${ly.toFixed(1)}`;
    c.path.setAttribute('d', dstr);
    const len = Math.hypot(midx - ax, ly - ay) + Math.abs(ex - midx);
    const kd = E('power3.out')(prog(d, .08, .4));
    const ko = 1 - prog(t, T.layout2 - .1, T.layout2 + .15);
    c.path.style.strokeDasharray = len; c.path.style.strokeDashoffset = len * (1 - kd);
    c.path.style.opacity = d < 0 ? 0 : ko;
    c.dot.setAttribute('cx', ax); c.dot.setAttribute('cy', ay); c.ring.setAttribute('cx', ax); c.ring.setAttribute('cy', ay);
    c.dot.style.transform = `scale(${d < 0 ? 0 : bOut(prog(d, 0, .2))})`; c.dot.style.transformOrigin = `${ax}px ${ay}px`; c.dot.style.opacity = vis2 ? ko : 0;
    const ph = ((Math.max(0, d)) * 1.2) % 1;
    c.ring.setAttribute('r', 8 + ph * 22); c.ring.style.opacity = d < 0 ? 0 : (1 - ph) * ko;
    if (c.stEl) {
      const isOn = c.st === 'led' ? !!led : S.door.y < -50;
      c.stEl.textContent = isOn ? 'Açık' : 'Kapalı';
      c.stEl.style.background = isOn ? 'rgba(34,197,94,.28)' : 'rgba(255,255,255,.16)';
      c.stEl.style.color = isOn ? '#b9f7cf' : 'rgba(255,255,255,.85)';
    }
  });
  // fiyat yerleşimi
  const pr = S.pr;
  centerAt(pOld, pr.oldY);
  centerAt(pNew, pr.newY);
  centerAt(pTaksit, pr.taksitY);
  centerAt(pKicker, P.e.kicker); centerAt(pSent, P.e.sent);
  // ölçek: GSAP'in pOld/pNew scale tween'leri ile çarpım
  pOld.firstElementChild.style.transform = `scale(${pr.oldS})`;
  pNew.firstElementChild.style.transform = `scale(${pr.newS})`;
  const nw = pNew.firstElementChild.offsetWidth * pr.newS, tw = pTag.offsetWidth;
  const tagL = Math.min(W / 2 + nw / 2 - tw * .55, W - 34 - tw);
  set(pTag, { left: tagL + 'px', top: (-44 + (1 - pr.newS) * 70) + 'px' });
  // shake (fiyat)
  const [sx, sy] = shake(t);
  hero.style.transform = t > T.bottle ? `translate(${sx * .5}px,${sy * .5}px)` : '';
  // anahtar videosu
  const dk = t - T.key;
  if (dk >= -.05) {
    keyIdx = frameSrc(keyImg, 'anahtar', clamp(Math.floor(Math.max(0, dk) * 30 * .88) + 70, 1, 250), keyIdx);
  }
  vis(keyScene, dk >= -.05);
  // marquee
  const mqw = mqIn.scrollWidth / 3;
  mqIn.style.transform = `translateX(${-((t - T.endTxt) * 70 % mqw) - 40}px)`;
}

function update(t) {
  updateS1(t); updateIris(t); updatePhone(t); updateMap(t); updateStreet(t); updateHero(t);
  $('#vign').style.opacity = t < T.iris ? 0 : 1;
}

/* ------------------------------------------------------------------ seek */
async function waitImgs() {
  const imgs = [perde, keyImg].filter(i => i.src && i.style.visibility !== 'hidden');
  await Promise.all(imgs.map(i => i.complete ? (i.decode ? i.decode().catch(() => { }) : 0) : new Promise(r => { i.onload = i.onerror = r; })));
}
window.seek = async (t) => { tl.seek(t, false); update(t); await waitImgs(); };
window.ready = (async () => {
  await document.fonts.ready;
  await Promise.all($$('img').filter(i => i.getAttribute('src')).map(i => i.decode().catch(() => { })));
  await window.seek(0);
  return true;
})();
})();
