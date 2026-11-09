# Sam starts small: a 10-part OiDoit reel series

Ten 15-second vertical reels (1080×1920, 30 fps), one a day. Each one follows Sam, who has said "I'll start Monday" for a year, through one tiny first step. Every part opens with a hook and closes with a hook for the next part. The copy is in American English for a US audience.

Built with [HyperFrames](https://hyperframes.heygen.com). One template (`index.html`) holds the timing, the scenes and Sam. `days.js` holds each day's words and Sam's moves. Renders are in `renders/`.

## Every part, the same rhythm

| Time | Beat |
| --- | --- |
| 0–2.4 s | Opening hook |
| 2.5–6 s | The setup, in two captions |
| 6–10.4 s | Sam opens OiDoit: energy, one tiny step, "That counts." |
| 10.4–12.5 s | Sam does it, plus the payoff line |
| 12.5–15 s | Closing hook: "Up next · Part N" |

A progress bar at the top fills one segment per part, like Stories, so viewers always know where they are in the series.

## The ten parts, with posting captions

| Day | Opening hook | Tiny step | Closing hook | Caption to post |
| --- | --- | --- | --- | --- |
| 1 | Sam has said "I'll start Monday" 52 times. | Put your shoes on. That's the whole step. | Tomorrow, Sam loses to the front door. | Day 1 of 10. Sam's running shoes have been "new" since January. Today's goal is tiny on purpose. 👟 |
| 2 | Day 2. Sam is losing to a door. | Open the door. Stand outside for one minute. | Tomorrow, Sam picks a finish line. It's a stop sign. | The hardest part of a run? The front door. One minute outside still counts. |
| 3 | Day 3. Sam's finish line is a stop sign. | Walk to the stop sign and back. | Tomorrow, it pours. Sam almost quits. | Not a 5K. Not a marathon. Just the end of the block. 🛑 |
| 4 | Day 4. It's pouring. Sam wants to quit. | Stretch for two minutes, right where you are. | Tomorrow, something weird happens. Sam wants to go. | Missed a day? No catching up needed. No streak police here. 🌧️ |
| 5 | Day 5. Sam woke up before the alarm. Weird. | Go for a five-minute walk. Anywhere counts. | Tomorrow, Sam tries this on the scariest thing yet: the inbox. | Five minutes turned into twelve. That's how momentum sneaks up on you. ☀️ |
| 6 | Day 6. Sam has 1,284 unread emails. | Reply to the easiest email. Two lines, max. | Tomorrow, Sam gets cocky. Big mistake. | If tiny steps work for running, why not your inbox? 📥 |
| 7 | Day 7. Sam planned a 10-mile run. | Love the energy. Today: jog for two minutes. | Tomorrow, Sam's energy finally says "Good." | Big plans are fun. Small steps actually happen. |
| 8 | Day 8. For the first time, Sam taps "Good." | Do ten minutes of movement you actually enjoy. | Tomorrow, Sam finds the shoe box. | Some days you've got more in the tank. Ten minutes, and Sam forgot to check the time. 🏃 |
| 9 | Day 9. Sam found the shoe box. | A look back at 8 tiny steps | Tomorrow, the stop sign. And past it. | Bought January 2. First worn 9 days ago. No big leap, just tiny steps, stacked. 📦 |
| 10 | Day 10. Remember this stop sign? | Run to the stop sign. Then decide. | Sam didn't find motivation. Sam started small. | On day 3, the stop sign was the finish line. Today it's the starting line. The end. Or the start. 💚 |

Suggested hashtags: `#startsmall #procrastination #adhdtips #motivation #runningmotivation #habits #buildinpublic #oidoit`

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

- To render one part, for example part 4: `npx hyperframes render --variables '{"day":4}' -o renders/part-04.mp4`
- To change the copy, edit `days.js`. Text in `*asterisks*` gets the green italic accent.
- Sam's moves are `beats` in `days.js`: time, duration, pose and options such as `x`, `gait` (walk, run or jog), `mouth`, `shoes` and `prop`. The poses are defined in `index.html`.
- The shared theme music is made by `tools/theme.py` (`npm run theme`), timed to the template's cues.
