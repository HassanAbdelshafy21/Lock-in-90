# Couch to 5K as a cardio option (approved design, not built yet)

Design (5 phone screens, dark): https://claude.ai/artifact/CiosP5kXckj2hasBTZc74K
Screens: 1 Pick it · 2 After your gym workout · 3 Run timer · 4 Run done · 5 The 9 weeks.
Source: NHS Couch to 5K (https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/couch-to-5k-running-plan).

## What it is
An optional third choice for **Cardio after lifting** (today: `settings.train.cardio` = `{on, min, mode, kind}`, offered by
`cardioBlock()` in train.js when a workout is finished). Choices:
- **Stamina program** (current behaviour, stays the default),
- **NHS Couch to 5K** (new),
- **My own cardio** (pick machine + minutes each time).

Off by default. Choosing Couch to 5K replaces the finisher card after a gym workout with the next run. It never blocks
anything and never changes the challenge reset rule (a run does not replace the gym session).

## Data
- `settings.train.cardio.program`: `'stamina' | 'c25k' | 'own'` (missing = today's behaviour).
- `settings.train.c25k = { week: 1..9, run: 1..3, where: 'tm'|'out', gap: true, repeat: false, log: [{d, w, r, feel}] }`.
  Progress moves by **finished runs**, not calendar weeks: 3 runs finish a week, then week+1, run 1.
- A finished run is pushed to `day.stamina` like the cardio exercise does:
  `{ mode: 'Couch to 5K · W3 R2', min: <total minutes incl. warm-up/cool-down>, kind: 'easy', src: 'finisher', c25k: {w, r} }`
  so `cardioDone()` and the cardio score (train.js ~675) count it with no other change. Undo removes it and moves progress back.
- Ending early (End before the last part): ask "Count this run?" Yes = logs the minutes done and advances; No = logs the
  minutes as plain cardio and does NOT advance.

## The plan (every session: 5 min brisk walk first, 5 min walk after; "slow enough to talk")
Encode as a table in core.js, e.g. `C25K[week-1][run-1] = [['r',60],['w',90],...]` (seconds), warm-up/cool-down added in code.

| Week | Runs 1-3 |
|---|---|
| 1 | run 1:00 / walk 1:30 × 7, then run 1:00 (8 runs) |
| 2 | run 1:30 / walk 2:00 × 5, then run 1:30 |
| 3 | run 1:30, walk 1:30, run 3:00, walk 3:00, then once more |
| 4 | run 3, walk 1:30, run 5, walk 2:30, run 3, walk 1:30, run 5 |
| 5 | R1: run 5, walk 3, run 5, walk 3, run 5 · R2: run 8, walk 5, run 8 · R3: run 20 |
| 6 | R1: run 5, walk 3, run 8, walk 3, run 5 · R2: run 10, walk 3, run 10 · R3: run 25 |
| 7 | run 25 (all three) |
| 8 | run 28 |
| 9 | run 30 (about 5 km) |

Weeks 1-5 and the 30-minute finish were checked against NHS/university pages. **Re-check weeks 6-9 against the NHS page
before hard-coding** (from the standard plan, not yet confirmed from a source in this session).

## Screens (match the design canvas)
1. **Train › Cardio after lifting**: radio list (Stamina / Couch to 5K / My own). With Couch to 5K: Start at Week N (− / +),
   Where you run (Treadmill / Outside: copy only, no GPS), "A rest day between runs" toggle (on). Button "Start Couch to 5K at Week N".
2. **After a gym workout** (where `cardioBlock` shows today): sheet "Cardio after lifting · Couch to 5K / Week W · Run R of 3 /
   NN min · you run M min of it", coloured segment bar (run cyan, walk indigo, warm-up/cool-down grey), one-line description,
   buttons Start run / My own cardio / Not today.
   If `gap` is on and the last C25K run was yesterday: soft note "You ran yesterday… Your call." with
   "Easy cardio instead (20 min)" (primary) and "Run anyway". Never a block.
3. **Run timer** (full screen, like the live workout): RUN / WALK / WARM-UP WALK / COOL-DOWN WALK chip, big countdown,
   "Then walk 1:30", "Run 2 of 4", whole-session segment bar, elapsed "9:40 of 28:00", Back / Pause / Skip, End.
   Buzz at each switch (2 long = run, 1 short = walk). Keep screen on (existing keep-awake). Timer is driven by end
   timestamps, not by counting ticks, so it survives the WebView pausing.
   APK: reuse the workout foreground notification (WorkoutNotifPlugin / WorkoutService) to show the phase + countdown and
   to vibrate at each switch with the screen locked. Website: vibration + notification where the browser allows.
4. **Run done**: "Run done · Week W · Run R of 3", tiles (total min, running min, runs done), "Saved as NN min of cardio…",
   9-week mini grid (27 cells), "How did it feel?" Easy / About right / Too hard (stored in `log`; Too hard sets
   `repeat: true` so before the next week it offers "Repeat Week W?" — user chooses), next-run line, Done.
5. **The 9 weeks**: list of weeks with one-line summary, Done / "2 of 3" / upcoming; current week expanded (Run 1 done,
   Run 2 done, Run 3 next). Buttons Repeat this week, Change program. Reached from the Run done grid and from Train.

## Also
- Arabic for every new string (i18n.js), light theme via existing tokens.
- Bump APP_VERSION and sw.js cache version; README bullet; CLAUDE.md "Done in vNN".
- Tests (Playwright harness): pick program, prompt after finishing a workout, timer Skip/Back/Pause, finishing a run logs
  `day.stamina` + advances progress, Undo, rest-day note, week rollover after 3 runs, Arabic render.
