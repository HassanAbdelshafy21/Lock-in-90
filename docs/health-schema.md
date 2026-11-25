# Daily health summary (`users/{uid}/health/{date}`)

Written only by the phone (Android app, Health Connect sync). Read by the app, and later by the morning briefing and the Claude connector.
One doc per local date. The app's own day (`users/{uid}/days/{date}`) stays separate, because the app overwrites that doc whole.

```js
{
  date: "2026-11-17", v: 1, tz: "Africa/Cairo", syncedAt: 1763371200000, u: <server time>,
  sleep: {                                  // the main sleep that ended this morning; null if none
    start: "2026-11-16T23:48", end: "2026-11-17T07:02",
    inBedMin: 434, awakeMin: 33, asleepMin: 401,
    stages: { deepMin: 72, lightMin: 228, remMin: 101 },   // null when the band gives no stages
    naps: [{ start: "15:10", min: 25 }],    // sessions under 3 h that start 10:00–20:00
    src: "com.kieslect.kstyle"
  },
  hrv:  { rmssd: 42, n: 31, window: "sleep" | "day", src },   // mean RMSSD in the sleep window, else the whole day
  rhr:  { bpm: 57, src },                   // the day's last resting-HR record
  hr:   { avg: 76, min: 52, max: 148 },     // Health Connect daily aggregate (de-duplicated across apps)
  spo2: { avg: 96.8, min: 92, n, window },
  temp: { avgC: 34.6, loc: "unknown", n, window },   // skin temperature (the plugin gives no sensor location, so loc is "unknown"): compare with your own baseline, not 37 °C
  steps: 8412,
  kcal: { active: 412, total: 2380 },
  dist: 6120,                               // metres (Health Connect daily total), null if none
  floors: 7,
  resp: { avg: 15, n, window, src },        // breathing rate per minute, sleep window first
  vo2:  { v: 41.2, src },                   // the day's last VO2 max record
  bp:   { sys: 124, dia: 79, n, src },      // the day's average
  weight: { kg: 101, src },                 // only what another app saved in Health Connect; the app's own weight log stays in days/
  // spo2 and temp also carry src. Fields added after v1 are additive: older docs simply lack them.
  exercise: [{ start: "18:05", min: 62, type: "strength_training", title: "Legs", src: "com.lyfta…" }],
  sources: ["com.kieslect.kstyle", "com.lyfta…"],
  missing: ["temp"]                         // allowed in Health Connect but no data that day (band not worn?)
}
```

- Synced when the app opens or comes back to the front (at most every 15 min): the last 3 days are re-read, because the band uploads late. The first connection reads about 30 days (Health Connect's limit before permission was given).
- A doc is rewritten only when its content changed.
- Deleting band data writes `{ deleted: true }` tombstones (no health data) so every device drops its copy.
- Not stored here: anything that needs several days, such as the recovery score. `core.js` `recovery(health, date, sleepGoalH)` computes it on the fly
  (HRV 45%, resting HR 25%, sleep vs goal 30%, against the previous 14 days; needs 4 earlier days; a night under 80% of the goal caps it at 66).
  The Band screen and the coach use the same function.
- Band apps' own scores (body battery, body load, stress, sleep score) never reach Health Connect, so they can't be here.
- Never copied into the friends board (`groups/…`) or the coach link (`shares/…`).
