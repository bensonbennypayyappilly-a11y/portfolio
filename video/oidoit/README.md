# OiDoit promo (20 s, 9:16)

A 20-second vertical promo for OiDoit, built with [HyperFrames](https://hyperframes.heygen.com): HTML, CSS and a paused GSAP timeline, rendered to MP4.

**Output:** `oidoit-promo.mp4` (1080×1920, 30 fps, H.264 + AAC). Made for Reels, Shorts, TikTok, Stories and LinkedIn or X video.

## The cut

| Time | Scene | On screen |
| --- | --- | --- |
| 0–3.7 s | The pile | Dark. "That thing you keep putting off?" while tasks thud into a pile |
| 3.7–6.9 s | Relief | Circular wipe to cream. "It's not you. Starting is just hard." |
| 6.6–14.7 s | The app | The phone walks through picking *Paperwork* at *Low* energy, a tiny first step with a 2-minute timer, then the win screen with confetti |
| 14.6–17.4 s | Why | Adapts to your energy · Tiny first steps · Zero shame |
| 17.1–20 s | End card | oidoit logo, "Start small. Follow through.", "Pre-launch · An execution companion" |

The soundtrack (`assets/soundtrack.wav`) is synthesised by `tools/soundtrack.py`. It is timed to every cue: a thud for each landing task, a whoosh on the wipe, UI taps, timer ticks, a win chime and a logo hit. It is mastered to about −14 LUFS.

## Work on it

```bash
npm install
```

```bash
npx hyperframes preview --background
```

```bash
npm run check
```

```bash
npm run render
```

- Timing lives in the GSAP calls in `index.html`. Each scene is a `.clip` with `data-start` and `data-duration`.
- Change copy right in the HTML. Text marked `data-split` animates word by word.
- After moving cue times, update the matching times in `tools/soundtrack.py` and run `npm run soundtrack`.
- Brand colours are the `:root` tokens: ink `#1d1f1c`, cream `#f8f5ef`, green `#5d7a66`, sage `#9aaa91`.
