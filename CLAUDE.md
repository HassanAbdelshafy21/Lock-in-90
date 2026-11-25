# Lock In 90: project context for Claude Code

Hassan's 90-day fitness challenge PWA (vanilla JS, Firebase Auth + Firestore, Arabic/English via i18n.js).
Live site: https://hassanabdelshafy21.github.io/Lock-in-90/ (GitHub Pages, from `main`).
Branch `android-health` wraps the same app as an Android APK (Capacitor 8) and reads band data from Health Connect.
Working preferences: show designs and get approval before building; suggestions to the user are soft, never forced;
explain decisions in detail.

## Where things stand
- `main` = v35 (v34 plans/workout editing + one-tap fasting). `android-health` has main merged in as of v35; the reverse merge waits for the verified APK.
- `android-health` (head after the Capgo switch) = main + Capacitor shell + Health Connect bridge + Health band card in Me.
- The Android side has NEVER been compiled or run on a device. First real build is the next step (see below).

## Build the APK (Windows)
```
git checkout android-health && npm install && npm run android:init
cd android && gradlew signingReport   # copy the debug SHA1
```
Firebase console: add Android app, package `io.github.hassanabdelshafy21.lockin90`, paste SHA-1, THEN download
`google-services.json` into `android/app/` (git-ignored). Then `npm run android` (opens Android Studio, press Run).
Later updates: `git pull && npm run android`. On the phone: Me > Health band > Connect.

## Working in WSL (Hassan's setup)
- Keep the repo in the WSL filesystem (`~/Lock-in-90`), not `/mnt/c`: faster npm/gradle and no line-ending trouble.
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

## Next steps, in order
1. Build the APK, connect the band, report which chips show data. Unconfirmed: Kstyle writing HRV/sleep stages,
   Lyfta writing workouts to Health Connect. Fix any Gradle/Kotlin-free build errors (no custom native code remains).
2. Optional: show SpO2 and steps as numbers on the band card; native notifications for the APK.
3. Merge `android-health` into `main` once the APK is verified (website must keep working: health code is gated by `supported()`).
4. Morning briefing agent (step 3 of the plan), runs in GitHub Actions (free; Firebase Cloud Functions need Blaze).
   Plain-code recovery score from 14-day baseline of HRV, resting HR, sleep; Claude writes the briefing; saved to
   `users/{uid}/briefings/{date}`; shown on Today. Anthropic API key goes in GitHub secrets by the user, never in the
   APK or in chat. Needs from the user: briefing time.
5. Remote MCP server (Cloud Run): get_today, get_week_summary, log_note, with auth, added as a Claude custom connector.
   Notes go to `users/{uid}/notes/{id}`.

## Agent design rules (from the user)
Agents read daily summaries, never raw samples. Claude API calls never use a key inside the APK. Agents act on trends
against the user's own baseline, not single readings. Agents only advise; challenge reset rules stay in the app.
Hassan wears the band on the upper arm while lifting.
