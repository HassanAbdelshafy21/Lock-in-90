# Lock In 90: project context for Claude Code

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
- Known gap in the APK: reminders and the lock-screen rest timer (browser notifications) do not work until native
  notifications are added.

## Tests (not in the repo; were run from /home/claude/work/tests, Playwright + node)
Unit: `TZ=Africa/Cairo node unit/health.test.mjs` (summarize). Browser: t38 (band card/sync/partial/delete with a
Capgo-API stub `hcstub.js`), t39 (Arabic), regressions t16/t20/t22. If rebuilding tests, fake `window.Capacitor.Plugins.Health`
(isAvailable, checkAuthorization, requestAuthorization, openHealthConnectSettings, queryAggregated, readSamples, queryWorkouts).

## Next steps, in order (plan approved 2026-11-25)
1. Safe-area fix (header under the status bar in the APK), Arabic for the Strava card and "How Recovery works",
   split-night sleep merge, hide never-sent band tiles, SpO2/steps numbers on the band card.
2. Native workout notification like Lyfta: current exercise/set, "Set done" starts a rest countdown in the
   notification (+30 s / Skip), vibrates at the end. Local Capacitor plugin (Kotlin foreground service).
3. Reminders in the APK: native FCM tokens, tick.mjs sends Android notifications to them.
4. Coach: morning briefing + evening review in tick.mjs via Claude Code headless with the user's subscription token
   (secret CLAUDE_CODE_OAUTH_TOKEN, from `claude setup-token`; never in the APK or chat). Small model, tools off, only
   when there is new data. Saved to `users/{uid}/briefings/{date}`, shown on Today, pushed.
5. Later: remote MCP connector (get_today, get_week_summary, log_note); release signing.

## Agent design rules (from the user)
Agents read daily summaries, never raw samples. Claude API calls never use a key inside the APK. Agents act on trends
against the user's own baseline, not single readings. Agents only advise; challenge reset rules stay in the app.
Hassan wears the band on the upper arm while lifting.
