"""Synthesise the 15 s series theme shared by all ten parts.

Usage: python3 tools/theme.py assets/theme.wav   (needs numpy)
Cue times match the template timeline in index.html (identical for every part).
"""
import sys, wave
import numpy as np

SR, DUR = 48000, 15.0
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(11)
mtof = lambda m: 440.0 * 2 ** ((m - 69) / 12)
t_ = lambda d: np.arange(int(d * SR)) / SR


def add(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N: return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan)); R[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))


def env(d, a, r):
    t = t_(d); return np.clip(np.minimum(np.minimum(1, t / max(a, 1e-4)), (d - t) / max(r, 1e-4)), 0, 1)


def lowpass(x, cut):
    a = np.exp(-2 * np.pi * cut / SR); y = np.zeros_like(x); s = 0.0
    for i in range(len(x)): s = (1 - a) * x[i] + a * s; y[i] = s
    return y


def pad(notes, d, a=0.5, r=0.8):
    t = t_(d); s = np.zeros_like(t)
    for m in notes:
        for det in (-0.1, 0.1):
            f = mtof(m) * 2 ** (det / 12); s += np.sin(2 * np.pi * f * t) + 0.18 * np.sin(4 * np.pi * f * t)
    return s * env(d, a, r) / (len(notes) * 2)


def pluck(m, d=0.55, bright=0.4):
    t = t_(d); f = mtof(m)
    return (np.sin(2 * np.pi * f * t) + bright * np.sin(4 * np.pi * f * t) * np.exp(-t * 18)) * np.exp(-t * 7) * env(d, 0.003, 0.05)


def bell(m, d=1.4):
    t = t_(d); f = mtof(m)
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 3) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)) * env(d, 0.002, 0.1)


def thud(f0=90, f1=45, d=0.3):
    t = t_(d); ph = 2 * np.pi * np.cumsum(f1 + (f0 - f1) * np.exp(-t * 30)) / SR
    return np.sin(ph) * np.exp(-t * 13)


def click(f=2400, d=0.05):
    t = t_(d); return np.sin(2 * np.pi * f * t) * np.exp(-t * 120) + 0.5 * rng.standard_normal(len(t)) * np.exp(-t * 400)


def hat(d=0.06):
    n = rng.standard_normal(int(d * SR)); return (n - lowpass(n, 6000)) * np.exp(-t_(d) * 70)


def swell(d, at, gain, rise=True):
    n = lowpass(rng.standard_normal(int(d * SR)), 2600); x = np.linspace(0, 1, len(n))
    add(n * (x ** 2 if rise else np.sin(np.pi * x) ** 2), at, gain)


# Hook (0 to 2.4): an impact and a bright stab to stop the scroll
add(thud(110, 40, 0.5), 0.0, 0.6); add(pad([60, 64, 67, 72], 1.2, 0.01, 0.9), 0.0, 0.22)
add(bell(84, 1.0), 0.02, 0.07)

# Groove: 120 bpm, F / C/E / Am / G / F / C, two seconds a chord
prog = [(41, [57, 60, 64, 69]), (40, [55, 60, 64, 67]), (45, [57, 60, 64, 67]), (43, [55, 59, 62, 67]), (41, [57, 60, 64, 69]), (40, [55, 60, 64, 67])]
for b, (bass, chord) in enumerate(prog):
    at = 0.4 + b * 2.0
    if at >= 12.4: break
    dur = min(2.3, 12.55 - at)
    add(pad(chord, dur, 0.35, 0.5), at, 0.14); add(pad([bass], dur, 0.05, 0.4), at, 0.2)
    arp = [c + 12 for c in (chord[0], chord[1], chord[2], chord[3], chord[2], chord[1], chord[3], chord[2])]
    for k, m in enumerate(arp):
        tk = at + k * 0.25
        if tk < 12.3: add(pluck(m), tk, 0.1 if k % 2 == 0 else 0.07, pan=(-0.35 if k % 2 else 0.35))
for k in range(24):
    tb = 2.4 + k * 0.5
    if tb >= 12.3: break
    if k % 2 == 0: add(thud(70, 42, 0.3), tb, 0.3)
    if tb >= 6.2: add(hat(), tb + 0.25, 0.05, pan=0.25)

# App moment: card whoosh, two taps, the "that counts" chime; payoff sparkle
swell(0.5, 5.95, 0.25, rise=False)
for tap in (7.0, 9.0):
    add(click(2400), tap, 0.22); add(click(1200, 0.04), tap + 0.004, 0.1)
for k, m in enumerate([84, 88, 91, 96]):
    add(bell(m), 9.15 + k * 0.07, 0.11, pan=(-0.3 + 0.2 * k))
add(pluck(79, 0.8, 0.6), 10.45, 0.14)

# End hook: riser into a hit, then the recurring "to be continued" motif
swell(0.45, 12.1, 0.35)
add(thud(80, 36, 1.2), 12.55, 0.55); add(pad([41, 53, 57, 60, 64, 67], 2.45, 0.08, 1.2), 12.55, 0.26)
for k, m in enumerate([72, 76, 79, 81]):
    add(bell(m, 1.8), 12.75 + k * 0.16, 0.1, pan=(-0.3 + 0.2 * k))

for dly, g in ((0.137, 0.22), (0.291, 0.12)):
    s = int(dly * SR); L[s:] += R[:-s] * g; R[s:] += L[:-s] * g * 0.9
mix = np.tanh(np.stack([L, R], 1) * 1.4) / np.tanh(1.4)
fl = int(0.4 * SR); mix[-fl:] *= (np.linspace(1, 0, fl) ** 1.5)[:, None]
mix *= 0.89 / np.max(np.abs(mix))
out = sys.argv[1] if len(sys.argv) > 1 else "assets/theme.wav"
with wave.open(out, "wb") as wf:
    wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes((mix * 32767).astype("<i2").tobytes())
print("wrote", out)
