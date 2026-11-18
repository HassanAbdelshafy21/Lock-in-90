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
  temp: { avgC: 34.6, loc: "wrist", n, window },   // skin temperature: compare with your own baseline, not 37 °C
  steps: 8412,
  kcal: { active: 412, total: 2380 },
  exercise: [{ start: "18:05", min: 62, type: "strength_training", title: "Legs", src: "com.lyfta…" }],
  sources: ["com.kieslect.kstyle", "com.lyfta…"],
  missing: ["temp"]                         // allowed in Health Connect but no data that day (band not worn?)
}
```

- Synced when the app opens or comes back to the front (at most every 15 min): the last 3 days are re-read, because the band uploads late. The first connection reads about 30 days (Health Connect's limit before permission was given).
- A doc is rewritten only when its content changed.
- Deleting band data writes `{ deleted: true }` tombstones (no health data) so every device drops its copy.
- Not stored here: anything that needs several days, such as a recovery score. That is computed from a 7–14 day baseline by the briefing.
- Never copied into the friends board (`groups/…`) or the coach link (`shares/…`).
