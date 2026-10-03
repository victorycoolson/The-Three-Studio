"""SULOOK Neo reklamı V4 — 120 BPM kinetik kurgu için ses tasarımı (müzik yatağı + SFX), tamamen sentez.
Kullanım: python3 tools/audio_v4.py tools/cues.json out_dir
Çıktı: music.wav, sfx.wav, mix.wav (48 kHz stereo)
"""
import json, sys, os
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 48000
cues = json.load(open(sys.argv[1]))
OUT = sys.argv[2]
os.makedirs(OUT, exist_ok=True)
T = cues['T']
DUR = T['end'] + 0.05
N = int(DUR * SR)
rng = np.random.default_rng(7)

def tt(d): return np.arange(int(d * SR)) / SR
def env_exp(d, k): return np.exp(-tt(d) * k)
def bp(x, lo, hi, order=2): return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)
def hp(x, f, order=2): return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)
def lp(x, f, order=2): return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)
def noise(d): return rng.standard_normal(int(d * SR))
def fade(x, a=0.003, b=0.01):
    x = x.copy(); na, nb = int(a * SR), int(b * SR)
    if na: x[:na] *= np.linspace(0, 1, na)
    if nb: x[-nb:] *= np.linspace(1, 0, nb)
    return x

class Bus:
    def __init__(self): self.b = np.zeros((N, 2))
    def add(self, x, t, gain=1.0, pan=0.0):
        i = int(t * SR)
        if i >= N: return
        if x.ndim == 1:
            l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
            x = np.stack([x * l * 1.414, x * r * 1.414], 1)
        j = min(N, i + len(x)); x = x[:j - i]
        if i < 0: x = x[-i:]; i = 0
        self.b[i:i + len(x)] += x * gain

def reverb(x, d=1.8, decay=3.2, mix=0.25, pre=0.012):
    n = int(d * SR)
    ir = np.stack([rng.standard_normal(n), rng.standard_normal(n)], 1) * np.exp(-np.arange(n) / SR * decay)[:, None]
    ir[:, 0] = lp(ir[:, 0], 7000); ir[:, 1] = lp(ir[:, 1], 7000)
    ir /= np.sqrt((ir ** 2).sum(0))
    p = int(pre * SR)
    wet = np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1)
    wet = np.roll(wet, p, 0); wet[:p] = 0
    return x * (1 - mix) + wet * mix * 1.6

# ------------------------------------------------------------ enstrümanlar
def kick(d=0.45, f0=155, f1=44):
    t = tt(d); f = f1 + (f0 - f1) * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t * 7.5)
    click = hp(noise(0.006), 2500) * np.linspace(1, 0, int(0.006 * SR)) * 0.4
    x[:len(click)] += click
    return fade(np.tanh(x * 1.6) * 0.9, 0.0005)
def clap(d=0.35):
    x = bp(noise(d), 900, 5200) * env_exp(d, 22)
    for k in (0.011, 0.022):
        i = int(k * SR); m = len(x) - i
        x[i:] += (bp(rng.standard_normal(m), 900, 5200) * np.exp(-np.arange(m) / SR * 30)) * .6
    return fade(x * 0.55)
def hat(d=0.06, open_=False):
    d = 0.22 if open_ else d
    return fade(hp(noise(d), 7500, 4) * env_exp(d, 18 if open_ else 70) * 0.35)
def saw(f, d):
    t = tt(d); return 2 * ((t * f) % 1) - 1
def pluck(f, d=0.5, bright=4000):
    t = tt(d)
    x = sum(np.sin(2 * np.pi * f * h * t + h) / h ** 1.25 * np.exp(-t * (6 + h * 3)) for h in range(1, 7))
    return fade(lp(x, bright) * 0.45, 0.001, 0.05)
def bassnote(f, d):
    x = saw(f, d) * 0.6 + np.sin(2 * np.pi * f * tt(d)) * 0.8
    x = lp(x, 520, 2)
    a = np.minimum(1, tt(d) / 0.01) * np.minimum(1, (d - tt(d)) / 0.04)
    return x * a * 0.55
def pad(fs, d):
    x = sum(saw(f * (1 + dt), d) for f in fs for dt in (-0.004, 0.0, 0.005)) / (len(fs) * 3)
    x = lp(x, 1800, 2)
    a = np.minimum(1, tt(d) / 0.6) * np.minimum(1, (d - tt(d)) / 0.8)
    return x * a * 0.5
def sub_boom(d=1.6, f=48):
    t = tt(d); fr = f + 40 * np.exp(-t * 9)
    x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 2.4)
    return fade(np.tanh(x * 1.4))
def impact(d=1.8, big=1.0):
    x = sub_boom(d) * 0.9 * big
    n = lp(noise(d), 3200) * env_exp(d, 7) * 0.5 * big
    return fade(x + n)
def whoosh(d=0.5, f0=400, f1=4000, peak=0.6):
    t = tt(d); x = noise(d)
    out = np.zeros_like(x); seg = int(0.01 * SR)
    for i in range(0, len(x), seg):
        k = i / len(x); fc = f0 * (f1 / f0) ** k
        out[i:i + seg] = bp(x[max(0, i - 2000):i + seg], fc * 0.7, min(fc * 1.4, 20000))[-len(x[i:i + seg]):]
    a = np.where(t < d * peak, (t / (d * peak)) ** 2, np.exp(-(t - d * peak) * 10))
    return fade(out * a * 0.6)
def riser(d=1.2, f0=200, f1=2400):
    t = tt(d); f = f0 * (f1 / f0) ** (t / d)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    n = bp(noise(d), 1500, 9000) * 0.3
    a = (t / d) ** 2.2
    return fade(lp(tone + n * a, 9000) * a)
def ding(f=1975, d=0.9, g=0.5):
    t = tt(d)
    x = sum(np.sin(2 * np.pi * f * r * t) * np.exp(-t * dk) * a for r, dk, a in ((1, 5, 1), (2.76, 9, .45), (5.4, 16, .25), (8.9, 22, .12)))
    return fade(x * g, 0.0008)
def coin(g=0.35):
    return ding(2637, 0.45, g) + np.concatenate([np.zeros(int(0.06 * SR)), ding(3520, 0.39, g * 0.8)])
def chaching():
    x = np.zeros(int(0.9 * SR))
    for k, f in enumerate((1568, 2093, 2637)):
        y = ding(f, 0.7, 0.32); i = int(k * 0.055 * SR); x[i:i + len(y)] += y[:len(x) - i]
    sh = hp(noise(0.5), 6000) * env_exp(0.5, 9) * 0.15
    x[:len(sh)] += sh
    return x
def click(f=1900, d=0.03, g=0.4):
    t = tt(d); return fade(np.sin(2 * np.pi * f * t) * np.exp(-t * 160) * g + hp(noise(d), 3000) * np.exp(-t * 300) * g * .5, 0.0003, 0.003)
def blip(f=1300, g=0.25):
    t = tt(0.09); fr = f * (1 + 0.5 * np.minimum(1, t / 0.05))
    return fade(np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 35) * g)
def notif_sound():
    return np.concatenate([ding(1319, 0.16, .35)[:int(0.13 * SR)], ding(1760, 0.8, .35)])
def slide(d=0.32, down=True):
    t = tt(d); x = noise(d)
    y = bp(x, 300, 2600) * np.sin(np.pi * t / d) ** 1.5 * 0.35
    return fade(y)
def thud(f=150, d=0.35, g=0.8):
    t = tt(d); fr = f * (1 + 0.6 * np.exp(-t * 40))
    return fade(np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 14) * g + lp(noise(d), 900) * np.exp(-t * 40) * g * .4)
def glug(d=0.9):
    t = tt(d); x = np.zeros_like(t)
    for k in range(7):
        t0 = 0.06 + k * 0.11 + rng.uniform(-.02, .02); f = rng.uniform(380, 620)
        m = t >= t0; tl = t[m] - t0
        x[m] += np.sin(2 * np.pi * (f + 900 * tl) * tl) * np.exp(-tl * 28) * 0.25
    return fade(x + lp(noise(d), 1200) * 0.04 * np.sin(np.pi * t / d))
def glitch(d=0.14):
    t = tt(d); x = noise(d)
    x = np.round(x * 3) / 3
    x = x * (np.sin(2 * np.pi * 37 * t) > 0)
    tone = np.sign(np.sin(2 * np.pi * 220 * (1 + 3 * t) * t)) * 0.3
    return fade(bp(x * 0.5 + tone, 200, 8000) * 0.6)
def swish(d=0.22):
    return whoosh(d, 1200, 12000, 0.8) * 1.4
def jingle(d=1.4):
    x = np.zeros(int(d * SR))
    for k in range(9):
        t0 = rng.uniform(0, 0.55) ** 1.3; f = rng.uniform(2600, 6200)
        y = ding(f, 0.5, rng.uniform(.06, .14)); i = int(t0 * SR); x[i:i + len(y)] += y[:len(x) - i]
    return x


# ---------------------------------------------------------- V2 için yumuşak sesler
def soft_coin(g=0.16, f=1318.5):
    """Yumuşak sikke: düşük perde, yuvarlak, kısa; yüksek harmonikler kırpılmış."""
    t = tt(0.55)
    x = (np.sin(2 * np.pi * f * t) * np.exp(-t * 9) + .35 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t * 16)
         + .12 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 26))
    x = lp(x, 3200) * np.minimum(1, t / .004)
    return fade(x * g)
def soft_pop(f=520, g=.35):
    t = tt(.18); fr = f * (1 + 1.2 * np.exp(-t * 40))
    return fade(np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 22) * g)
def beep(f=1760, d=.09, g=.18):
    t = tt(d); return fade(lp(np.sin(2 * np.pi * f * t), 4000) * np.minimum(1, t / .005) * np.exp(-t * 8) * g, .002, .02)
def shimmer(d=1.2, g=.18):
    x = np.zeros(int(d * SR))
    for k, f in enumerate([1568, 2093, 2637, 3136]):
        y = ding(f, d - k * .08, g * (1 - k * .15)); i = int(k * .07 * SR); x[i:i + len(y)] += y[:len(x) - i]
    return lp(x, 6000)
def water(d=1.1, g=.22):
    t = tt(d); n = bp(noise(d), 300, 2400) * (.5 + .5 * np.sin(2 * np.pi * 7 * t) ** 2)
    x = n * np.sin(np.pi * t / d) ** .7 * .25
    for k in range(9):
        t0 = .05 + k * .11 + rng.uniform(-.03, .03); f = rng.uniform(420, 760); m = t >= t0; tl = t[m] - t0
        x[m] += np.sin(2 * np.pi * (f + 1200 * tl) * tl) * np.exp(-tl * 30) * .2
    return fade(x * g * 3)


music, sfx = Bus(), Bus()
BPM = 120; beat = 60 / BPM
# Fa majör çevresinde dört akor (V2/V3 ile aynı renk), daha sert sentez
CH = [(87.31, [349.2, 440.0, 523.3, 659.3]), (110.0, [440.0, 523.3, 659.3, 784.0]), (73.42, [293.7, 349.2, 440.0, 523.3]), (58.27, [233.1, 293.7, 349.2, 440.0])]

def stab(fs, d=.32, g=.5, bright=3800):
    """Akor vuruşu: kısa, parlak, hafif bozulmuş."""
    t = tt(d); x = sum(saw(f * (1 + dt), d) for f in fs for dt in (-.006, .006)) / (len(fs) * 2)
    x = lp(x, bright, 2) * np.exp(-t * 7) * np.minimum(1, t / .003)
    return fade(np.tanh(x * 2.2) * g, .001, .03)
def subdrop(d=1.2, f0=110, f1=38):
    t = tt(d); f = f1 + (f0 - f1) * np.exp(-t * 6)
    return fade(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2) * .9)
def tick(g=.18, f=4200):
    t = tt(.03); return fade(hp(noise(.03), 3000) * np.exp(-t * 220) * g + np.sin(2 * np.pi * f * t) * np.exp(-t * 300) * g * .5, .0003, .003)
def lock_click(g=.7):
    """Anahtar kilit sesi: iki metalik tık + gövde."""
    x = np.zeros(int(.35 * SR))
    for t0, f, a in ((0, 3100, 1), (.085, 2300, .8)):
        y = ding(f, .18, .25 * a); n = hp(noise(.02), 2500) * np.exp(-tt(.02) * 200) * .5 * a; y[:len(n)] += n
        i = int(t0 * SR); x[i:i + len(y)] += y[:len(x) - i]
    th = thud(320, .2, .5); x[int(.085 * SR):int(.085 * SR) + len(th)] += th[:len(x) - int(.085 * SR)]
    return x * g
def snare(d=.18, g=.5):
    t = tt(d); return fade((bp(noise(d), 1500, 7000) * np.exp(-t * 26) * .8 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * .5) * g)

def groove(t0, t1, level=1.0, half=False, arp=True, bass16=False):
    t = t0; i = 0
    while t < t1 - 1e-6:
        chord = CH[(i // 4) % 4]
        if not half or i % 2 == 0: music.add(kick(.4, 165, 42), t, 1.0 * level)
        if i % 2 == 1: music.add(clap(), t, .55 * level, pan=.05)
        for h in range(2): music.add(hat(), t + beat / 4 + h * beat / 2 - beat / 4 + beat / 4, .32 * level, pan=.25 if h else -.25)
        music.add(hat(), t + beat / 2, .5 * level, pan=.2)
        if i % 4 == 3: music.add(hat(open_=True), t + beat / 2, .3 * level, pan=-.2)
        if bass16:
            for q in range(4):
                if q: music.add(bassnote(chord[0] * (2 if q == 2 else 1), beat / 4 * .85), t + q * beat / 4, .75 * level)
        else:
            music.add(bassnote(chord[0], beat / 2 * .9), t + beat / 2, .85 * level)
        if arp:
            for s in range(4):
                n = chord[1][(i * 4 + s) % 4] * (2 if (i + s) % 5 == 0 else 1)
                music.add(pluck(n, .3, 5200), t + s * beat / 4, (.24 if s % 2 == 0 else .17) * level, pan=-.35 if s % 2 else .35)
        if i % 4 == 0: music.add(pad([f / 2 for f in chord[1]], beat * 4), t, .32 * level)
        t += beat; i += 1

# 0–4: kanca — gerilim, saat tikleri, perde altında yükselen nabız
music.add(fade(np.sin(2 * np.pi * 43.65 * tt(4.1)) * .5 * np.minimum(1, tt(4.1) / .3), .01, .2), 0, .6)
for i in range(16): music.add(tick(.16 if i % 2 else .22), i * beat / 2, .7, pan=.3 if i % 2 else -.3)
for i in range(4): music.add(kick(.35, 90, 38), i * beat * 2 if i < 2 else 2 + (i - 2) * beat * 2, .55)
for i in range(16):   # perde: 16'lık filtreli bas nabzı
    music.add(lp(bassnote(87.31, beat / 4 * .8), 300 + 120 * i), 2.0 + i * beat / 4, .6 + .02 * i)
for i in range(12):
    k = i / 12; music.add(snare(.12, .15 + .35 * k), 3.0 + (1 - (1 - k) ** 1.5) * 1.0 - .02, .6)
music.add(riser(1.6, 180, 5000), 2.4, .7)
# 4.0 DROP 1
groove(4.0, 12.5, 1.0)
# 12.5–14: kırılma (7/24) — saat tikleri + yükseliş
music.add(pad([174.6, 220.0, 261.6, 329.6], 1.6), 12.5, .5)
for i in range(12): music.add(tick(.2), 12.5 + i * beat / 4, .7, pan=np.sin(i) * .4)
music.add(riser(1.4, 220, 5200), 12.6, .7)
for i in range(8): music.add(snare(.1, .15 + .05 * i), 13.5 + i * beat / 8, .6)
# 14–29: makine + panel + kampanya
groove(14.0, 24.0, 1.0, bass16=True)
groove(24.0, 27.0, 1.0, arp=False, bass16=True)
groove(27.0, 29.0, .8)
# 29–32: "Peki tüm bunlar kaça?" → fiyat: davul çekilir, gerilim yükselir
music.add(pad([87.31, 130.8, 174.6], 3.0), 29.0, .5)
music.add(riser(T['accent'] - 29.9, 160, 5600), 29.9, .95)
for i in range(18):
    k = i / 18; t0 = T['accent'] - (1 - k) ** 1.7 * (T['accent'] - T['price'])
    music.add(snare(.12, .12 + .4 * k), t0, .7, pan=.1 if i % 2 else -.1)
# 32.0 ANA VURGU (anahtarın 35. karesi, yeni fiyat)
for f in (87.31, 174.6, 261.6, 349.2, 440.0, 523.3):
    music.add(pluck(f * 2, 1.6, 5600) * 1.2, T['accent'], .3)
music.add(stab([349.2, 440.0, 523.3, 698.5], .6, .55), T['accent'], 1.0)
music.add(pad([349.2, 440.0, 523.3, 659.3], 3.0), T['accent'], .5)
groove(T['accent'], 39.5, 1.0)
music.add(pad([349.2, 440.0, 523.3, 659.3], 39.9 - T['keyShrink']), T['keyShrink'], .35)
for k, n in enumerate([523.3, 659.3, 784.0, 1046.5, 784.0, 659.3, 880.0, 1046.5, 1174.7, 1046.5, 880.0, 784.0]):
    music.add(pluck(n, .8, 3000), T['endK'] + k * beat / 2, .2, pan=-.3 if k % 2 else .3)
music.add(stab([174.6, 349.2, 440.0, 523.3], 1.4, .45, 2600), 39.5, 1.0)

# ---------------------------------------------------------- SFX
sfx.add(lock_click(.8), .02, 1.0); sfx.add(jingle(1.0), .12, .5, pan=.2)
for k, ts in enumerate([T['sBu'], T['sNeyi'], T['sAciyor']]):
    sfx.add(impact(.9, .6 + .2 * k), ts, .75); sfx.add(stab([87.31 * 2 ** (k / 12 * 3), 174.6 * 2 ** (k / 12 * 3)], .3, .35, 1800), ts, .6)
sfx.add(whoosh(.35, 6000, 300, .7), T['perde'] - .2, .7)
for ts in (T['p1'], T['p2']): sfx.add(impact(.7, .55), ts, .6)
sfx.add(impact(1.2, .9), T['p3'], .8); sfx.add(whoosh(.5, 300, 8000, .9), T['reveal'] - .45, .9)
sfx.add(impact(2.2, 1.3), T['reveal'], 1.0); sfx.add(subdrop(1.4), T['reveal'], .8); sfx.add(shimmer(1.4, .14), T['reveal'] + .1, .6)
sfx.add(whoosh(.3, 600, 5000, .7), T['rSub'] - .08, .4)
# harita: bıçak geçişi, nokta düşüşleri, yumuşak sikkeler
sfx.add(swish(.3), T['map'] - .15, .9)
for i in range(7): sfx.add(soft_pop(420 + 40 * i, .4), T['map'] + .15 + i * .25 + .14, .7, pan=((i * 37) % 9 - 4) / 8)
for i, f in enumerate([7.0, 7.25, 7.5, 7.75, 8.0, 8.3, 8.55, 8.8, 9.05]):
    sfx.add(soft_coin(.13, [1318.5, 1174.7, 1396.9][i % 3]), f + .95, .8, pan=((i * 37) % 9 - 4) / 8)
sfx.add(impact(.8, .6), T['mT2'], .6)
sfx.add(whoosh(.6, 4000, 300, .6), T['pull'], .6)
for k in range(3): sfx.add(blip(1300 + 200 * k, .22), T['mT3'] + k * .25, .55)
sfx.add(click(2000, .03, .45), T['tap'], 1.0); sfx.add(thud(220, .15, .35), T['tap'], .6)
sfx.add(whoosh(.55, 200, 9000, .9), T['zoom'] - .05, .9)
# sokak (1,45× hız): ödemeler, sikkeler
for pay, n in ((T['street'] + .40 / 1.45, 10), (T['street'] + 2.80 / 1.45, 4)):
    sfx.add(beep(1760, .08, .22), pay - .02, .8); sfx.add(beep(2349, .1, .18), pay + .07, .8)
    for i in range(n):
        if i % 2 == 0: sfx.add(soft_coin(.07, 1567.98 if i % 4 == 0 else 1318.5), pay + (.05 + i * .06 + .8) / 1.45, .8, pan=.15)
sfx.add(impact(.8, .6), T['sT2'], .6)
# 7/24
sfx.add(impact(1.0, .7), T['c724'], .7); sfx.add(shimmer(1.2, .13), T['c724'] + .5, .6)
# makine montajı: her vuruşta etiket vuruşu
sfx.add(impact(2.0, 1.15), T['mach'], 1.0); sfx.add(subdrop(1.2), T['mach'], .7)
sfx.add(whoosh(.55, 250, 3500, .85), T['mach'] + .2, .7); sfx.add(thud(160, .4, .8), T['mach'] + .78, .8); sfx.add(glug(.9), T['mach'] + .85, .5)
for k, ts in enumerate([T['gpd'], T['depo'], T['kabin'], T['led'], T['kart']]):
    sfx.add(stab(CH[k % 4][1], .28, .42), ts, .8, pan=(-.2, .2)[k % 2]); sfx.add(swish(.18), ts - .09, .6)
for k in range(10): sfx.add(tick(.12, 3000 + 300 * k), T['gpd'] + k * .04, .5)
sfx.add(slide(.36), T['kabin'] + .05, .6); sfx.add(thud(260, .15, .35), T['kabin'] + .5, .5)
for ts, on in [(T['led'], 0), (T['led'] + .25, 1), (T['led'] + .5, 0), (T['led'] + .75, 1)]:
    sfx.add(click(2400 if on else 1300, .035, .45), ts, .8); sfx.add(thud(90 if not on else 140, .2, .3), ts, .5)
sfx.add(whoosh(.3, 3000, 900, .7), T['kart'] + .02, .5); sfx.add(beep(1760, .08, .22), T['kart'] + .3, .9); sfx.add(beep(2349, .1, .2), T['kart'] + .4, .9)
for k in range(3): sfx.add(blip(1600 + 200 * k, .16), T['dash'] + .5 + k * .5, .6, pan=.4)
for k in range(3): sfx.add(notif_sound(), T['notif'] + k * T['notifGap'], .5, pan=(k - 1) * .2)
sfx.add(whoosh(.45, 3000, 300, .5), T['dashOut'], .6)
# kampanya
sfx.add(swish(.3), T['offer'] - .15, .9); sfx.add(impact(1.2, .9), T['offer'], .85)
for k in range(5):
    t0 = T['perk0'] + k * T['perkGap']
    sfx.add(stab([f * 2 ** (k / 12 * 2) for f in (349.2, 440.0, 523.3)], .25, .38), t0, .7, pan=(-.25, .25)[k % 2])
    sfx.add(ding(1047 * 2 ** (k / 12 * 2), .4, .22), t0 + .16, .55); sfx.add(swish(.16), t0 - .07, .5)
for k in range(5): sfx.add(click(2400, .02, .25), T['recap'] + .17 + k * .1, .6); sfx.add(ding(1568 * 2 ** (k / 12 * 2), .3, .1), T['recap'] + .17 + k * .1, .5)
# soru → fiyat
sfx.add(swish(.3), T['ask'] - .15, .9)
for k, ts in enumerate([T['ask'], T['ask2']]): sfx.add(impact(.9, .7), ts, .75)
sfx.add(impact(1.6, 1.1), T['ask3'], .9); sfx.add(subdrop(1.0, 90, 36), T['ask3'], .7)
sfx.add(whoosh(.6, 200, 6000, .8), T['key'] - .05, .75); sfx.add(jingle(1.2), T['key'] + .3, .6, pan=.15)
sfx.add(impact(1.1, .8), T['price'], .85)
sfx.add(swish(.22), T['strike'] - .02, 1.0); sfx.add(thud(110, .3, .55), T['strike'] + .16, .6)
sfx.add(impact(2.8, 1.45), T['accent'], 1.0); sfx.add(subdrop(1.8, 120, 34), T['accent'], .9)
sfx.add(hp(noise(1.6), 4500) * env_exp(1.6, 3) * .16, T['accent'], 1.0); sfx.add(jingle(1.4), T['accent'] + .02, .7, pan=-.15)
sfx.add(blip(1900, .18), T['accent'] + .25, .6)
for ts in (T['tak1'], T['tak2']): sfx.add(impact(.7, .55), ts, .6); sfx.add(stab([523.3, 659.3, 784.0], .22, .3), ts, .6)
sfx.add(whoosh(.8, 400, 3000, .7), T['keyShrink'], .45)
sfx.add(shimmer(1.2, .12), T['endLogo'], .55); sfx.add(impact(1.2, .55), T['endK'], .5)
sfx.add(blip(1500, .18), T['endSent'], .45); sfx.add(blip(1900, .2), T['endUrl'], .55)
sfx.add(shimmer(1.6, .14), T['sting'], .65); sfx.add(impact(1.4, .6), T['sting'], .5)
sfx.add(lock_click(.7), 39.55, .9)

m = reverb(music.b, 1.5, 3.8, .16)
s = reverb(sfx.b, 1.3, 4.2, .2)
env = np.abs(s).max(1); env = lp(env, 8, 1); duck = 1 - np.clip(env * .8, 0, .45)
mix = m * duck[:, None] * .74 + s
fo = int(.45 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * .89
    wavfile.write(os.path.join(OUT, name), SR, (x * 32767).astype(np.int16))
save('music.wav', m); save('sfx.wav', s); save('mix.wav', mix)
print('ok', DUR)
