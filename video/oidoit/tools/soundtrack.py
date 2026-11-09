"""Synthesise the 20 s OiDoit soundtrack, timed to the composition's cues.

Usage: python3 tools/soundtrack.py assets/soundtrack.wav
Needs numpy. Every cue time below matches a moment in index.html.
"""
import sys, wave
import numpy as np

SR, DUR = 48000, 20.0
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)
mtof = lambda m: 440.0 * 2 ** ((m - 69) / 12)


def add(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N: return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))


def t_(d): return np.arange(int(d * SR)) / SR


def env(d, a, r):
    t = t_(d); e = np.ones_like(t)
    e = np.minimum(e, t / max(a, 1e-4)); e = np.minimum(e, (d - t) / max(r, 1e-4))
    return np.clip(e, 0, 1)


def lowpass(x, cut):
    a = np.exp(-2 * np.pi * cut / SR); y = np.zeros_like(x); s = 0.0
    for i in range(len(x)): s = (1 - a) * x[i] + a * s; y[i] = s
    return y


def pad(notes, d, a=0.6, r=0.8):
    t = t_(d); s = np.zeros_like(t)
    for m in notes:
        f = mtof(m)
        for det in (-0.12, 0.12):
            ff = f * 2 ** (det / 12)
            s += np.sin(2 * np.pi * ff * t) + 0.18 * np.sin(4 * np.pi * ff * t)
    return s * env(d, a, r) / (len(notes) * 2)


def pluck(m, d=0.6, bright=0.35):
    t = t_(d); f = mtof(m)
    return (np.sin(2 * np.pi * f * t) + bright * np.sin(4 * np.pi * f * t) * np.exp(-t * 18)) * np.exp(-t * 7) * env(d, 0.003, 0.05)


def bell(m, d=1.6):
    t = t_(d); f = mtof(m)
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 3) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)) * env(d, 0.002, 0.1)


def thud(f0=95, f1=48, d=0.28):
    t = t_(d); ph = 2 * np.pi * np.cumsum(f1 + (f0 - f1) * np.exp(-t * 30)) / SR
    return np.sin(ph) * np.exp(-t * 14)


def click(f=2200, d=0.05):
    t = t_(d)
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 120) + 0.5 * rng.standard_normal(len(t)) * np.exp(-t * 400))


def hat(d=0.06):
    n = rng.standard_normal(int(d * SR)); n = n - lowpass(n, 6000)
    return n * np.exp(-t_(d) * 70)


# ---- Scene 1 (0 to 3.72): low, uneasy drone; a thud as each task lands ----
d = 4.2; t = t_(d)
drone = (np.sin(2 * np.pi * 55 * t) + 0.6 * np.sin(2 * np.pi * 82.4 * t) + 0.35 * np.sin(2 * np.pi * 130.8 * t * (1 + 0.002 * np.sin(t * 5))))
add(drone * env(d, 1.6, 0.5) * (0.4 + 0.6 * t / d), 0.0, 0.22)
for i in range(11):
    land = 1.05 + i * 0.19 + 0.42
    add(thud(), land, 0.5 + i * 0.03, pan=(-0.4 if i % 2 else 0.4))
    add(click(900, 0.03), land, 0.06)

# ---- Wipe whoosh (3.5 to 4.4) ----
d = 1.0; n = rng.standard_normal(int(d * SR)); tt = t_(d)
w = lowpass(n, 2500) * np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 2
add(w, 3.45, 0.55, pan=-0.2); add(lowpass(rng.standard_normal(int(d * SR)), 1800) * np.sin(np.pi * tt / d) ** 2, 3.47, 0.45, pan=0.2)

# ---- Warm section: 120 bpm from 4.3, F / C/E / Am / G ----
start, beat = 4.3, 0.5
prog = [(41, [57, 60, 64, 69]), (40, [55, 60, 64, 67]), (45, [57, 60, 64, 67]), (43, [55, 59, 62, 67]),
        (41, [57, 60, 64, 69]), (40, [55, 60, 64, 67]), (45, [57, 60, 64, 67])]
for b, (bass, chord) in enumerate(prog):
    at = start + b * 2.0
    dur = min(2.4, 17.15 - at + 0.3)
    add(pad(chord, dur, 0.4, 0.6), at, 0.16)
    add(pad([bass], dur, 0.05, 0.4), at, 0.22)
    arp = [chord[0] + 12, chord[1] + 12, chord[2] + 12, chord[3] + 12, chord[2] + 12, chord[1] + 12, chord[3] + 12, chord[2] + 12]
    for k, m in enumerate(arp):
        tk = at + k * 0.25
        if tk >= 17.1 or 14.15 <= tk < 14.65: continue
        add(pluck(m), tk, 0.11 if k % 2 == 0 else 0.08, pan=(-0.35 if k % 2 else 0.35))

for k in range(40):  # kick on 1 and 3, hats on the off-beats, break at the scene change
    tb = start + 2.0 + k * beat
    if tb >= 17.1 or 14.15 <= tb < 14.65: continue
    if k % 2 == 0: add(thud(70, 42, 0.3), tb, 0.32)
    if tb >= 8.3: add(hat(), tb + 0.25, 0.05, pan=0.25)

# ---- UI taps, timer ticks, win chime, confetti sparkle ----
for tap in (7.45, 8.1, 8.75, 9.8, 11.5):
    add(click(2400), tap, 0.22); add(click(1200, 0.04), tap + 0.004, 0.1)
for k in range(15):
    add(click(3200, 0.02), 9.95 + k * 0.083, 0.05, pan=0.1)
for k, m in enumerate([84, 88, 91, 96]):
    add(bell(m), 11.9 + k * 0.07, 0.12, pan=(-0.3 + 0.2 * k))
for k in range(7):
    add(bell(96 + int(rng.integers(0, 8)), 0.5), 12.0 + rng.random() * 0.9, 0.03, pan=rng.uniform(-0.8, 0.8))

# ---- Features (dot pops) and end card ----
for i, m in enumerate([79, 81, 84]):
    add(pluck(m, 0.8, 0.6), 14.9 + i * 0.4, 0.16)
add(thud(80, 36, 1.2), 17.15, 0.55)
add(pad([41, 53, 57, 60, 64, 67, 69], 2.85, 0.08, 1.6), 17.15, 0.3)
for k, m in enumerate([72, 76, 79, 84]):
    add(bell(m, 2.6), 17.15 + k * 0.09, 0.09, pan=(-0.3 + 0.2 * k))
add(click(1600, 0.06), 18.4, 0.15)  # closing line lands; add(pluck(84, 1.2, 0.5), 18.4, 0.08)

# ---- Space: a couple of soft echoes, then glue and normalise ----
for dly, g in ((0.137, 0.22), (0.291, 0.12)):
    s = int(dly * SR)
    L[s:] += R[:-s] * g; R[s:] += L[:-s] * g * 0.9
mix = np.stack([L, R], 1)
mix = np.tanh(mix * 1.4) / np.tanh(1.4)
fade = np.ones(N); fl = int(0.6 * SR); fade[-fl:] = np.linspace(1, 0, fl) ** 1.5
mix *= fade[:, None]
mix *= 0.89 / np.max(np.abs(mix))

out = sys.argv[1] if len(sys.argv) > 1 else "assets/soundtrack.wav"
with wave.open(out, "wb") as wf:
    wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR)
    wf.writeframes((mix * 32767).astype("<i2").tobytes())
print("wrote", out)
