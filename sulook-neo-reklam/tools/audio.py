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
T = cues['T']; POPS = cues['POPS']
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

music, sfx = Bus(), Bus()

# ------------------------------------------------------------ MÜZİK
BPM = 120; beat = 60 / BPM
# intro: sub drone + gergin tik-tak
drone = (np.sin(2 * np.pi * 55 * tt(3.1)) * 0.35 + lp(saw(55, 3.1), 300) * 0.25) * np.minimum(1, tt(3.1) / 0.2)
music.add(fade(drone, 0.01, 0.3), 0, 0.55)
for i in range(12):
    music.add(hat(), i * beat / 2 + 0.25, 0.5 if i % 2 else 0.8, pan=0.3 if i % 2 else -0.3)
music.add(riser(0.75, 300, 3000), T['iris'] - 0.55, 0.7)
# intro nabzı: filtreli bas 8'likler + yumuşak kalp atışı kick
for i in range(int(T['iris'] / (beat / 2)) + 1):
    t0 = i * beat / 2
    music.add(lp(bassnote(43.65 * 2, beat / 2 * .85), 900) * 1.4, t0, 0.8)
    if i % 2 == 0: music.add(kick(0.3, 110, 40), t0, 0.55)


# ana groove (3.0 -> fiyat öncesi), F - Am - Dm - Bb
start = 3.0
CH = [(87.31, [349.2, 440.0, 523.3, 659.3]), (110.0, [440.0, 523.3, 659.3, 784.0]), (73.42, [293.7, 349.2, 440.0, 523.3]), (58.27, [233.1, 293.7, 349.2, 440.0])]
groove_end = T['price'] - 0.55
t = start; i = 0
while t < groove_end - 1e-6:
    bar = int(i // 4); chord = CH[bar % 4]
    music.add(kick(), t, 0.95)
    if i % 2 == 1: music.add(clap(), t, 0.6, pan=0.05)
    music.add(hat(), t + beat / 2, 0.55, pan=0.25)
    if i % 4 == 3: music.add(hat(open_=True), t + beat / 2, 0.35, pan=-0.2)
    # bas: offbeat 8'likler (sidechain hissi)
    music.add(bassnote(chord[0], beat / 2 * 0.9), t + beat / 2, 0.85)
    # pluck arpej 16'lık
    for s in range(4):
        n = chord[1][(i * 4 + s) % 4] * (2 if (i + s) % 7 == 0 else 1)
        music.add(pluck(n, 0.35), t + s * beat / 4, 0.32 if s % 2 == 0 else 0.22, pan=-0.35 if s % 2 else 0.35)
    if i % 4 == 0: music.add(pad([f / 2 for f in chord[1]], beat * 4), t, 0.45)
    t += beat; i += 1
# fiyat öncesi kopuş + riser
music.add(riser(1.0, 220, 4200), T['price'] - 1.0, 0.85)
music.add(pad([174.6, 220.0, 261.6], 1.2), T['price'] - 1.0, 0.35)
# fiyat sonrası: yarım tempo, anahtara kadar
t = T['newPrice']; j = 0
while t < T['key'] - 0.05:
    music.add(kick(), t, 0.8)
    if j % 2: music.add(clap(), t, 0.4)
    music.add(hat(), t + beat / 2, 0.4, pan=0.2)
    music.add(bassnote(87.31 if j < 2 else 73.42, beat * 0.9), t, 0.6)
    t += beat; j += 1
# final groove (hafif)
t = T['key'] + 0.5; j = 0
while t < T['end'] - 0.6:
    music.add(kick(), t, 0.6 if j % 2 == 0 else 0.0)
    music.add(hat(), t + beat / 2, 0.38, pan=0.2)
    if j % 2: music.add(clap(), t, 0.3)
    ch = CH[(j // 4) % 4]
    music.add(bassnote(ch[0], beat / 2 * 0.9), t + beat / 2, 0.6)
    t += beat; j += 1
# final: parlak pad + yavaş pluck, söner
music.add(pad([349.2, 440.0, 523.3, 659.3], T['end'] - T['key'] + 0.6), T['key'], 0.55)
music.add(pad([87.31 * 2, 130.8], T['end'] - T['key'] + 0.6), T['key'], 0.35)
for k, n in enumerate([523.3, 659.3, 784.0, 1046.5, 784.0, 659.3, 880.0, 1046.5]):
    music.add(pluck(n, 0.8, 3000), T['endTxt'] + k * beat / 2, 0.22, pan=-0.3 if k % 2 else 0.3)

# ------------------------------------------------------------ SFX
# sahne 1: kelime vuruşları
for k, key in enumerate(['q_ne', 'q_o', 'q_q']):
    sfx.add(impact(0.9, 0.7 + 0.15 * k), T[key], 0.75)
    sfx.add(whoosh(0.18, 2000, 9000, 0.7), T[key] - 0.12, 0.5)
for g in T['glitch']: sfx.add(glitch(), g, 0.55, pan=rng.uniform(-.4, .4))
sfx.add(whoosh(0.5, 300, 7000, 0.85), T['iris'] - 0.05, 1.0)
sfx.add(impact(1.4, 0.6), T['irisEnd'] - 0.05, 0.55)
# harita
for p in POPS:
    sfx.add(coin(0.3), p['t'], 0.8, pan=np.clip((p['t'] * 7 % 2) - 1, -.6, .6))
for key in ('newPin1', 'newPin2'):
    sfx.add(whoosh(0.25, 3000, 600, 0.6), T[key] - 0.05, 0.4); sfx.add(thud(330, 0.2, 0.5), T[key] + 0.2, 0.5)
sfx.add(blip(1500, 0.3), T['yonet'], 0.8)
for key in ('tg1', 'tg2', 'tg3'): sfx.add(whoosh(0.3, 600, 5000, 0.7), T[key] - 0.1, 0.35)
sfx.add(click(2000, 0.03, 0.5), T['tap'], 1.0); sfx.add(thud(220, 0.15, 0.4), T['tap'], 0.6)
sfx.add(whoosh(0.6, 200, 9000, 0.9), T['zoom'] - 0.05, 0.9)
# sokak: ödemeler
for key in ('pay1', 'pay2'):
    sfx.add(blip(1700, 0.25), T[key] + 0.12, 0.7)
    sfx.add(chaching(), T[key] + 0.2, 0.7)
    sfx.add(coin(0.25), T[key] + 0.9, 0.6)
# cihaz sayfası + dalış
sfx.add(whoosh(0.4, 500, 4000, 0.6), T['device'], 0.5)
sfx.add(whoosh(0.85, 150, 6000, 0.9), T['dive'] - 0.05, 1.0)
sfx.add(impact(1.6, 0.9), T['diveEnd'], 0.65)
sfx.add(blip(900, 0.3), T['title'] + 0.62, 0.6); sfx.add(ding(1568, 0.6, 0.25), T['title'] + 0.72, 0.7)
# damacana
sfx.add(whoosh(0.8, 250, 3500, 0.85), T['bottle'], 0.9)
sfx.add(thud(160, 0.4, 0.9), T['bottleIn'], 0.9); sfx.add(glug(1.1), T['bottleIn'] + 0.08, 0.8)
# LED aç/kapa
led = [(T['led'], 0), (T['led'] + .16, 1), (T['led'] + .3, 0), (T['led'] + .44, 1)]
for ts, on in led: sfx.add(click(2600 if on else 1300, 0.04, 0.45), ts, 0.8); sfx.add(lp(noise(0.08), 500) * env_exp(0.08, 30) * (0.5 if on else 0.2), ts, 0.6)
# kapak
sfx.add(slide(0.32), T['door'], 0.8); sfx.add(thud(260, 0.15, 0.4), T['door'] + 0.32, 0.6)
sfx.add(slide(0.32), T['door'] + 0.58, 0.8); sfx.add(click(1500, 0.03, 0.3), T['door'] + 0.9, 0.6)
# callout blip'leri
for k, ct in enumerate([T['callouts'], T['door'], T['door'] + .3, T['door'] + .5, T['door'] + .7]):
    sfx.add(blip(1100 + 140 * k, 0.22), ct + 0.08, 0.7, pan=-0.4 if k in (0, 1, 4) else 0.4)
sfx.add(whoosh(0.5, 400, 3000, 0.7), T['layout2'], 0.5)
for k in range(3): sfx.add(blip(1600 + 200 * k, 0.15), T['layout2'] + 0.3 + k * 0.16, 0.6, pan=0.4)
for k in range(3): sfx.add(notif_sound(), T['notif'] + k * 0.32, 0.55, pan=(k - 1) * 0.2)
# kampanya
sfx.add(whoosh(0.6, 3000, 300, 0.4), T['clear'], 0.6)
for k in range(5):
    t0 = T['perks'] + k * T['perkGap']
    sfx.add(whoosh(0.28, 700, 6000, 0.75), t0 - 0.12, 0.65, pan=-0.3)
    sfx.add(ding(1047 * 2 ** (k / 12 * 2), 0.45, 0.32), t0 + 0.18, 0.7)
    sfx.add(click(2400, 0.02, 0.3), t0 + 0.18, 0.6)
# fiyat
sfx.add(impact(1.3, 0.8), T['price'], 0.85)
sfx.add(swish(0.24), T['strike'] - 0.02, 1.0); sfx.add(thud(110, 0.3, 0.5), T['strike'] + 0.18, 0.7)
sfx.add(impact(2.4, 1.3), T['newPrice'], 1.0)
sfx.add(hp(noise(1.2), 5000) * env_exp(1.2, 4) * 0.12, T['newPrice'], 1.0)
sfx.add(blip(1900, 0.2), T['newPrice'] + 0.3, 0.7)
sfx.add(ding(1319, 1.2, 0.25), T['taksit'] + 0.1, 0.6); sfx.add(ding(1760, 1.2, 0.2), T['taksit'] + 0.25, 0.6)
# anahtar + final
sfx.add(whoosh(0.7, 200, 5000, 0.8), T['key'] - 0.1, 0.8)
sfx.add(jingle(1.4), T['key'] + 0.25, 0.9, pan=0.15)
sfx.add(jingle(1.2), T['key'] + 1.6, 0.5, pan=-0.15)
sfx.add(impact(2.2, 0.7), T['endTxt'], 0.6)
sfx.add(ding(2093, 1.5, 0.22), T['endTxt'] + 0.3, 0.6)
sfx.add(blip(1400, 0.2), T['endTxt'] + 0.8, 0.6)

# ------------------------------------------------------------ miks
m = reverb(music.b, 1.6, 3.5, 0.18)
s = reverb(sfx.b, 1.4, 4.0, 0.22)
# müzik yatağını SFX vuruşlarında hafifçe bastır (sidechain)
env = np.abs(s).max(1); env = lp(env, 8, 1); duck = 1 - np.clip(env * 0.8, 0, 0.45)
mix = m * duck[:, None] * 0.75 + s * 1.0
# final fade
fo = int(0.5 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.89
    wavfile.write(os.path.join(OUT, name), SR, (x * 32767).astype(np.int16))
save('music.wav', m); save('sfx.wav', s); save('mix.wav', mix)
print('ok', DUR)
