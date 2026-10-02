"""SULOOK Neo reklamı — ses tasarımı (müzik yatağı + SFX), tamamen sentez.
Kullanım: python3 tools/audio.py tools/cues.json out_dir
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
DUR = T['end'] + 0.6
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
CH = [(87.31, [349.2, 440.0, 523.3, 659.3]), (110.0, [440.0, 523.3, 659.3, 784.0]), (73.42, [293.7, 349.2, 440.0, 523.3]), (58.27, [233.1, 293.7, 349.2, 440.0])]

# intro: sub drone + nabız + gergin hi-hat
drone = (np.sin(2 * np.pi * 55 * tt(2.9)) * 0.35 + lp(saw(55, 2.9), 300) * 0.25) * np.minimum(1, tt(2.9) / 0.2)
music.add(fade(drone, 0.01, 0.3), 0, 0.5)
for i in range(int(T['iris'] / (beat / 2)) + 1):
    t0 = i * beat / 2
    music.add(lp(bassnote(87.31, beat / 2 * .85), 900) * 1.3, t0, 0.75)
    if i % 2 == 0: music.add(kick(0.3, 110, 40), t0, 0.5)
    music.add(hat(), t0 + .125, .35, pan=.25 if i % 2 else -.25)
music.add(riser(0.7, 300, 3000), T['iris'] - 0.5, 0.6)

def groove(t0, t1, level=1.0, half=False):
    t = t0; i = 0
    while t < t1 - 1e-6:
        chord = CH[(i // 4) % 4]
        if not half or i % 2 == 0: music.add(kick(), t, .9 * level)
        if i % 2 == 1: music.add(clap(), t, .5 * level, pan=.05)
        music.add(hat(), t + beat / 2, .5 * level, pan=.25)
        if i % 4 == 3: music.add(hat(open_=True), t + beat / 2, .3 * level, pan=-.2)
        music.add(bassnote(chord[0], beat / 2 * .9), t + beat / 2, .8 * level)
        if not half:
            for s in range(4):
                n = chord[1][(i * 4 + s) % 4] * (2 if (i + s) % 7 == 0 else 1)
                music.add(pluck(n, .35), t + s * beat / 4, (.28 if s % 2 == 0 else .2) * level, pan=-.35 if s % 2 else .35)
        if i % 4 == 0: music.add(pad([f / 2 for f in chord[1]], beat * 4), t, .4 * level)
        t += beat; i += 1

groove(2.86, T['price'] - .5)
music.add(riser(1.0, 220, 4200), T['price'] - 1.0, .8)
music.add(pad([174.6, 220.0, 261.6], 1.2), T['price'] - 1.0, .3)
groove(T['newPrice'], T['keyDark'], .8, half=True)
# anahtar: karanlık geçiş, sonra sakin + parlak kapanış
music.add(pad([87.31, 130.8, 174.6], 2.6), T['keyDark'], .45)
groove(T['key'] + .25, T['keyShrink'] + .2, .55, half=True)
groove(T['keyShrink'] + .2, T['end'] - .5, .62)
music.add(pad([349.2, 440.0, 523.3, 659.3], T['end'] - T['keyShrink'] + .4), T['keyShrink'], .45)
for k, n in enumerate([523.3, 659.3, 784.0, 1046.5, 784.0, 659.3, 880.0, 1046.5]):
    music.add(pluck(n, .8, 3000), T['endTxt'] + k * beat / 2, .2, pan=-.3 if k % 2 else .3)

# ---------------------------------------------------------- SFX
for k, key in enumerate(['q_ne', 'q_o']):
    sfx.add(impact(.9, .7), T[key], .7); sfx.add(whoosh(.18, 2000, 9000, .7), T[key] - .12, .45)
sfx.add(whoosh(.4, 6000, 300, .75), T['q_q'] - .3, .8); sfx.add(impact(1.6, 1.15), T['q_q'] + .08, .95)
for g in T['glitch']: sfx.add(glitch(), g, .5, pan=rng.uniform(-.4, .4))
sfx.add(whoosh(.5, 300, 7000, .85), T['iris'] - .05, .95); sfx.add(impact(1.4, .55), T['irisEnd'] - .05, .5)
for key in ('tg1', 'tg2', 'tg3'): sfx.add(whoosh(.3, 600, 5000, .7), T[key] - .1, .3)
# harita: yumuşak sikke + paket varışları
FILLS = [3.0, 3.28, 3.58, 3.88, 4.16, 4.5, 4.78, 5.06, 5.48, 5.7, 5.86]
for i, f in enumerate(FILLS):
    sfx.add(soft_coin(.13, [1318.5, 1174.7, 1396.9][i % 3]), f, .9, pan=((i * 37) % 9 - 4) / 8)
for key in ('drop1', 'drop2'):
    sfx.add(whoosh(.25, 3000, 600, .6), T[key] - .05, .35); sfx.add(soft_pop(440, .4), T[key] + .35, .7)
for key in ('link1', 'link2'): sfx.add(shimmer(.8, .1), T[key], .6)
sfx.add(beep(1046.5, .1, .2), T['alert'] + .1, .7); sfx.add(beep(784, .14, .2), T['alert'] + .24, .7)
sfx.add(blip(1500, .25), T['yonet'], .7)
sfx.add(click(2000, .03, .45), T['tap'], 1.0); sfx.add(thud(220, .15, .35), T['tap'], .6)
sfx.add(whoosh(.6, 200, 9000, .9), T['zoom'] - .05, .85)
# sokak: temassız ödeme bip + yumuşak sikkeler
for pay, n in ((T['street'] + .40, 10), (T['street'] + 2.80, 4)):
    sfx.add(beep(1760, .08, .22), pay - .02, .8); sfx.add(beep(2349, .1, .18), pay + .09, .8)
    for i in range(n):
        if i % 2 == 0: sfx.add(soft_coin(.07, 1567.98 if i % 4 == 0 else 1318.5), pay + .05 + i * .06 + .8, .8, pan=.15)
sfx.add(slide(.3), T['street'] + .7, .4); sfx.add(slide(.25), T['street'] + 2.42, .4)
# cihaz + dalış + ürün
sfx.add(whoosh(.4, 500, 4000, .6), T['device'], .45)
sfx.add(whoosh(.8, 150, 6000, .9), T['dive'] - .05, .95); sfx.add(impact(1.6, .8), T['diveEnd'], .55)
sfx.add(shimmer(1.4, .14), T['title'], .7)
sfx.add(whoosh(.7, 250, 3500, .85), 11.72, .8); sfx.add(thud(160, .4, .8), T['neo50'] - .02, .8); sfx.add(glug(1.0), T['neo50'] + .05, .55)
for i, (ts, on) in enumerate([(T['led'], 0), (T['led'] + .15, 1), (T['led'] + .3, 0), (T['led'] + .45, 1)]):
    sfx.add(click(2400 if on else 1300, .035, .35), ts, .7)
sfx.add(slide(.3), T['door'], .7); sfx.add(thud(260, .15, .35), T['door'] + .3, .5)
sfx.add(slide(.3), T['door'] + .6, .7); sfx.add(click(1500, .03, .25), T['door'] + .9, .5)
for k, ct in enumerate(T['co']): sfx.add(blip(1100 + 140 * k, .2), ct + .08, .6, pan=-.4 if k in (0, 1, 4) else .4)
sfx.add(whoosh(.45, 300, 5000, .85), T['filterIn'], .7); sfx.add(water(1.1, .25), T['filterA'], .7)
sfx.add(whoosh(.4, 5000, 400, .4), T['filterOut'], .6)
for k in range(3): sfx.add(blip(1600 + 200 * k, .14), T['layout2'] + .3 + k * .15, .55, pan=.4)
for k in range(3): sfx.add(notif_sound(), T['notif'] + k * .26, .45, pan=(k - 1) * .2)
sfx.add(whoosh(.6, 3000, 300, .4), T['clear'], .5)
for k in range(5):
    t0 = T['perks'] + k * T['perkGap']
    sfx.add(whoosh(.28, 700, 6000, .75), t0 - .12, .55, pan=-.3)
    sfx.add(ding(1047 * 2 ** (k / 12 * 2), .45, .26), t0 + .16, .6); sfx.add(click(2400, .02, .25), t0 + .16, .5)
sfx.add(impact(1.3, .8), T['price'], .8)
sfx.add(swish(.24), T['strike'] - .02, .95); sfx.add(thud(110, .3, .5), T['strike'] + .18, .6)
sfx.add(impact(2.4, 1.25), T['newPrice'], 1.0); sfx.add(hp(noise(1.2), 5000) * env_exp(1.2, 4) * .1, T['newPrice'], 1.0)
sfx.add(blip(1900, .18), T['newPrice'] + .28, .6)
sfx.add(ding(1319, 1.2, .22), T['taksit'] + .1, .55); sfx.add(ding(1760, 1.2, .18), T['taksit'] + .25, .55)
# anahtar
sfx.add(whoosh(.5, 3000, 120, .3), T['keyDark'], .7); sfx.add(sub_boom(1.6, 40) * .6, T['key'], .6)
sfx.add(whoosh(.45, 200, 6000, .85), T['key'] + .02, .7)
sfx.add(jingle(1.4), T['key'] + .3, .8, pan=.15); sfx.add(jingle(1.2), T['key'] + 1.2, .45, pan=-.15)
sfx.add(whoosh(.8, 400, 3000, .7), T['keyShrink'], .45); sfx.add(jingle(1.0), T['keyShrink'] + .4, .35)
sfx.add(impact(2.2, .65), T['endTxt'], .55); sfx.add(shimmer(1.6, .12), T['endTxt'] + .85, .6)

m = reverb(music.b, 1.6, 3.5, .18)
s = reverb(sfx.b, 1.4, 4.0, .22)
env = np.abs(s).max(1); env = lp(env, 8, 1); duck = 1 - np.clip(env * .8, 0, .45)
mix = m * duck[:, None] * .72 + s
fo = int(.6 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * .89
    wavfile.write(os.path.join(OUT, name), SR, (x * 32767).astype(np.int16))
save('music.wav', m); save('sfx.wav', s); save('mix.wav', mix)
print('ok', DUR)
