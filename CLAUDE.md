# Locked In (formerly Lock In 90): project context for Claude Code

Hassan's 90-day fitness challenge PWA (vanilla JS, Firebase Auth + Firestore, Arabic/English via i18n.js).
Live site: https://hassanabdelshafy21.github.io/Lock-in-90/ (GitHub Pages, from `main`).
Branch `android-health` wraps the same app as an Android APK (Capacitor 8) and reads band data from Health Connect.
Working preferences: show designs and get approval before building; suggestions to the user are soft, never forced;
explain decisions in detail.

## Where things stand
- v37: APK verified on Hassan's phone (sign-in, Health Connect, Kieslect data). `android-health` merged into `main`;
  keep working on `main` (health/native code is gated by `NATIVE` / `HC.supported()`, the website is unaffected).
- Band screen (Me > Health band > See all band data): recovery score (`core.js` `recovery`), sleep stages, tiles vs 7-day
  average, workouts, 7-day chart, "What your band sends". Kieslect sends sleep+stages, HRV, RHR, HR, SpO2, steps, kcal;
  no skin temperature. Its own scores (body battery, stress…) never reach Health Connect.
- Strava posting (v37): the phone writes ready-made posts to `users/{uid}/stravaOut/{key}`; `tick.mjs` `stravaPost` posts
  them (needs `activity:write`, reconnect via strava-connect; the app shows the link), skips time overlaps, never
  re-imports its own posts. Lyfta is no longer used: Lock In 90 is the only workout logger.
- APK: Android back closes layers then goes to Today then minimises (`@capacitor/app`); padlock launch screen held
  until the first real draw (`@capacitor/splash-screen`); icons generated into `native/res/` and copied by patch-android.

## Build the APK (Windows)
```
git checkout android-health && npm install && npm run android:init
cd android && gradlew signingReport   # copy the debug SHA1
```
Firebase console: add Android app, package `io.github.hassanabdelshafy21.lockin90`, paste SHA-1, THEN download
`google-services.json` into `android/app/` (git-ignored). Then `npm run android` (opens Android Studio, press Run).
Later updates: `git pull && npm run android`. On the phone: Me > Health band > Connect.

## Working in WSL (Hassan's setup)
- Keep the repo in the WSL filesystem (`~/Lockin90/Lock-in-90`), not `/mnt/c`: faster npm/gradle and no line-ending trouble.
- Toolchain installed without sudo: Node in `~/.local/node`, JDK 21 in `~/.local/jdk21`, SDK in `~/Android/Sdk`;
  `~/.lockin-env.sh` (sourced by .profile/.bashrc) puts them first on PATH (Windows npm leaks in via /mnt/c otherwise).
  `yes | sdkmanager --licenses` exits 141 (SIGPIPE) but works.
- Build: `node native/build-www.mjs && npx cap sync android && node native/patch-android.mjs && cd android && ./gradlew assembleDebug`.
  No adb on Windows: copy the APK to the phone and tap it (installs over the old one, keeps data).
- `npm run android` ends with `cap open android` (opens Android Studio), which does nothing useful in WSL. Use instead:
  `node native/build-www.mjs && npx cap sync android && cd android && ./gradlew assembleDebug`
  APK: `android/app/build/outputs/apk/debug/app-debug.apk`.
- Needs in WSL: Node 22+, JDK 21, Android SDK command-line tools (`ANDROID_HOME`, accept licenses, `platforms;android-36`,
  `build-tools`). Versions per Capacitor 8 docs; check them if Gradle complains.
- The debug SHA-1 belongs to the keystore of whoever builds: WSL's `~/.android/debug.keystore` differs from Windows
  Android Studio's. Register the SHA-1 from the machine that builds (`./gradlew signingReport`) and keep building there,
  or add both SHA-1s in Firebase.
- WSL cannot see USB phones. Install with Windows adb: `adb.exe install -r app-debug.apk` (copy the APK to a Windows path
  first, e.g. `/mnt/c/Users/<you>/Downloads/`), or use wireless debugging, or just copy the APK to the phone.

## Fasting today (v35, on main)
A single row at the top of the Today list: tap it when fasting (`settings.fastDays[date] = true`), tap again to undo. Nothing else
about the day changes (same meals, same plan, streak intact). `core.js`: `fastingDay`, `isFasting`, `prayerTimes(date)`
(NOAA solar equations for Cairo: fajr 19.5 deg, Maghrib = sunset + 1 min; checked against published EGAS timetables, within ~2 min,
never early), used by the countdown row and by `waterPace` (water window iftar -> fajr). Ramadan mode keeps its own manual times and
wins when both apply. `scripts/tick.mjs` shifts water reminders to the evening on fasting days. Cairo is hard-coded: another city
needs a location setting.

## Cardio in workouts (v36, on main)
Add exercise > Cardio chip lists the 14 library cardio exercises. A cardio exercise is a minutes card (`e.cd = {min}`), not kg x reps; Done pushes `{mode, min, kind:'easy', src:'finisher', ex}` to `day.stamina` (counts for the cardio score), Undo removes it. Cardio is excluded from set counts, volume, `structOf` (plan diff). Not available in the routine editor yet (toast explains).

## Architecture decisions
- Capacitor, files bundled in the APK (`native/build-www.mjs` copies app files to `www/` and vendors Firebase into
  `www/vendor/firebase`; `--cdn` skips that). `www/` and `android/` are git-ignored (generated).
- No service worker when `NATIVE` (files are local; it would serve stale copies).
- Google blocks WebView sign-in: native sign-in via `@capacitor-firebase/authentication` (`skipNativeAuth`), then
  `signInWithCredential` in web code.
- `native/patch-android.mjs`: minSdk 26, `rgcfaIncludeGoogle`, extra Health Connect read permissions the Capgo plugin
  lacks (body temperature, total calories, exercise, history) and the `<queries>` entry. Safe to re-run.
- Health plugin: `@capgo/capacitor-health` (^8.7.0), read-only. ALL plugin-specific code is `read()/status()/connect()`
  in `health.js`; it returns a fixed raw shape and `summarize()` builds daily docs. Swapping plugins = rewriting those.
- `privacy.html` is also copied to `www/privacypolicy.html`: Capgo shows it from Health Connect's permission dialog.
  If the permission dialog does not appear on a device, check the plugin's manifest/privacy wiring first.
- Health data: `users/{uid}/health/{date}` (schema v1, `docs/health-schema.md`), written only by the phone, kept apart
  from `days/{date}` because the app overwrites that doc whole. Existing Firestore rule (`users/{uid}/**`) already covers it.
  Sleep belongs to the wake-up date; naps are <3 h starting 10:00-20:00; HRV/SpO2/temp use the sleep window.
  Temperature `loc` is always "unknown" with Capgo. The recovery score is NOT stored: the agent computes it from a
  7-14 day baseline.
- Sync: first connect reads 30 days; each app open/resume re-reads the last 3 days (max every 15 min); a day is
  rewritten only if content changed. Delete = two-tap, writes tombstones `{deleted:true}`.

## Tests (not in the repo; were run from /home/claude/work/tests, Playwright + node)
Unit: `TZ=Africa/Cairo node unit/health.test.mjs` (summarize). Browser: t38 (band card/sync/partial/delete with a
Capgo-API stub `hcstub.js`), t39 (Arabic), regressions t16/t20/t22. If rebuilding tests, fake `window.Capacitor.Plugins.Health`
(isAvailable, checkAuthorization, requestAuthorization, openHealthConnectSettings, queryAggregated, readSamples, queryWorkouts).

## Done in v38 (2026-11-25)
- Workout notification (APK): `native/android/` WorkoutService (foreground service, type specialUse), WorkoutActionReceiver
  (buttons work while the WebView is paused; taps queue in SharedPreferences when the app is dead), WorkoutNotifPlugin
  (show/clear/ask/ping + "action" events). patch-android copies them, registers the plugin in MainActivity, adds the
  manifest entries. train.js `showWo` routes to it when native; `restAfter()` tells it the coming rest so "Set done"
  starts the countdown instantly; JS later syncs the exact end (`notifAction(id|at)`).
- Reminders in the APK: `@capacitor-firebase/messaging`, tokens in `settings.push.android`; tick.mjs `fcm()` sends Android
  notifications (channel "reminders", icon ic_stat_notify). Test button uses the local `ping`.
- Coach: `scripts/coach.mjs` (called by tick.mjs). Morning 05:00–13:00 once the band synced; evening 30 min after a
  workout or from 21:30 if anything was logged. Claude Code headless, pinned version, `--model sonnet --tools ""`,
  empty cwd/HOME, only the token in env. Saved to `users/{uid}/briefings/{date}` {morning|evening: {head,text,at,rec}},
  Today shows the latest ("Coach" card), pushed like reminders. Switches: Me > Reminders (coachAm/coachPm).
  Needs the user's GitHub secret CLAUDE_CODE_OAUTH_TOKEN; without it the coach silently does nothing.
- Split nights (a part ending after 18:00 counts toward the next morning), band card second row (recovery, steps,
  oxygen), never-sent tiles hidden, Arabic for Strava/coach/recovery explainer, keep-screen-on during workouts.

## Done in v39 (2026-11-25)
- Renamed to **Locked In** (user-facing text only; app id, repo, Firebase, URLs unchanged). Logo "R6": black ring + bolt
  on neon lime (#A3E635, ink #0B0F14). All icons come from `native/make-icons.mjs` (needs sharp; run from a folder that
  has it). Android launch screen = lime disc on black; `#boot` in index.html draws the same disc so Android hands
  over at once and it pulses until the first real draw (`splashDone`).
- Sheets/panels: overscroll contained, page locked behind (CSS :has).
- Me: Strava card always visible with the next step (keys → connect → connected/posting); Coach card (status, setup,
  history). tick writes `meta/jobs` (stravaKeys, stravaCid, coachToken) and coach writes `meta/coach` (ok/err).
  Strava posting is on by default (settings.strava.post === false turns it off).
- Today: "Turn on notifications" card in the APK until on or dismissed (settings.nag.push). Step goal (band.stepGoal).
- privacy.html now describes the coach (summaries sent to Claude).

## Done in v40 (2026-11-25)
- GitHub's scheduler runs tick.yml 6-12 h apart instead of every 30 min. Fix: an outside timer (cron-job.org) calls
  workflow_dispatch every 30 min with a fine-grained token (Actions read/write on this repo only); steps in `docs/timer.md`.
  The schedule stays as a backup; double runs are safe (reminder sent-log, stravaOut status, briefing exists check,
  concurrency group). The app warns in Me (Strava card, or Coach card if Strava isn't connected) when `meta/jobs.at`
  is 75+ min old, linking to docs/timer.md.

## Done in v41 (2026-11-25): redesign
- Approved design: claude.ai artifact "Locked In Redesign" (private canvas). Logo A6 "Big beat" (dumbbell whose bar is a
  heartbeat, lime-to-cyan spike, white plates, on #0B0F14); `native/make-icons.mjs` draws every icon from it, including
  `native/res/drawable/ic_stat_notify.xml`.
- Tokens (styles.css top): brand = logo cyan #22D3EE (`--brand`, text shade `--brand-ink`), goal colours food orange
  (`--food`), water indigo (`--water`), training cyan, supplements pink (`--supp`). Light and dark: `html[data-theme]`
  forces one, otherwise `prefers-color-scheme`. `settings.theme` 'auto'|'dark'|'light' (You > Appearance), mirrored in
  localStorage `lk-theme` (index.html sets data-theme before first paint). `applyTheme()` also sets Android status-bar
  icon colour via WorkoutNotifPlugin `bars({light})`. New v3 component styles are appended at the end of styles.css.
- Tabs: Today · Train · Food · Body · You (`VIEWS`), plus the floating Log button `#fab` (Today, Food, Body; opens the
  quick sheet). Old Progress split: Journey (`#journey`, from Today's "Day N" / chain; tabs chain|week|friends via
  `S.jtab`), Body (`bodyViewHTML`: band if on, weight, today's note, check-in, photos), Food (`foodHTML`: meals/daily,
  water, supplements, fasting, nutrients, calories), Train tab "Progress" (`S.trainTab='prog'`, muscles + rank).
  `progressParts(R)` builds the parts. `viewOf()` maps old `#progress`/`#me` links. `data-act="panel"` now goes to the
  screen (`goPanel`), the bottom panels are no longer opened.
- Today: header (date, Day N of 90, chain, You), day bar, day card (`ring4` four-goal ring, "N to go", hours left,
  band strip only when a band is connected), goal rows with direct actions (`goalsHTML`: log, +250, Start, Took them),
  Up next, coach card (only when on), notes, list.
- Optional extras (off by default): band (`settings.band.on`), coach (`settings.aiCoach`; tick's coach() returns early
  unless true; without a band the morning briefing comes at 07:30 instead of after band data), Strava, coach link.
  You groups: Your plan / Optional extras / App.
- Preview harness (not in the repo): scratchpad `harness/` serves the repo with Firebase stubbed by in-memory data
  (`fs.js`, options ?theme ?band ?coach ?lang=ar ?tracker) and screenshots with headless Edge (`shots.sh`).

## Done in v42 (2026-11-25): simpler Food
- Approved design: "Food v2" row on the redesign canvas. `mealsHTML` now = `foodSumHTML` (kcal left ring, protein bar,
  carbs/fat) + one row per meal (`.mrow2`) with one ✓ (`data-act="meal" data-v="plan"`, tap again to undo). Tapping the
  meal opens `openMealOpts(id)` (sheet scope 'mopts'): as planned, something different (swap → inline editor `.medit`),
  same as before (openCopy), free cheat meal (or turn it on), off-plan, not today (skip). Choices go through `mopt`,
  which closes the sheet and re-dispatches the existing `meal` action. `gramsField()` adds − / + (`gstep`) to every
  food editor (5 g steps, 10 g from 100 g, 50 ml for drinks).

## Next steps
1. Hassan: install the v42 APK (then switch on Coach in You > Optional extras if wanted).
   Earlier: install the v38 APK, turn on notifications (Me > Reminders), try a workout with the screen locked, allow
   Strava posting once, add the CLAUDE_CODE_OAUTH_TOKEN secret. Fix whatever the real phone shows.
2. Later: remote MCP connector (get_today, get_week_summary, log_note); release signing so updates install in place.

## Agent design rules (from the user)
Agents read daily summaries, never raw samples. Claude API calls never use a key inside the APK. Agents act on trends
against the user's own baseline, not single readings. Agents only advise; challenge reset rules stay in the app.
Hassan wears the band on the upper arm while lifting.
