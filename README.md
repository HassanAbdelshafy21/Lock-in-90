# Lock In 90

A 90-day challenge tracker for food, water, training and supplements. Miss one and you're back to Day 1. It's a web app you install on your phone: it works offline, syncs through Firebase, and runs entirely on free tiers.

**Open the app:** https://hassanabdelshafy21.github.io/Lock-in-90/ (on Android: menu → Install app; on iPhone: Share → Add to Home Screen)

<p>
<img src="docs/screens/today.webp" width="200" alt="Today screen">
<img src="docs/screens/today_dark.webp" width="200" alt="Today screen, dark mode">
<img src="docs/screens/meals.webp" width="200" alt="Meals panel">
<img src="docs/screens/today_ar.webp" width="200" alt="Today screen in Arabic">
</p>

## Today

One screen for the day. A navy scoreboard shows four rings around the day number, one each for meals, water, training and supplements. Below it sit one "Up next" card with the single most useful thing to do now, and a short list of the rest. Tap any pillar for its details. Light and dark mode follow the phone, and the whole app also works in Arabic, right to left.

- **Every day needs all four:** every planned meal on plan, the water goal, that day's training and the core supplements. Miss one and the counter resets to Day 1. The day after a miss is flagged "Never miss twice."
- **Food:** your coach's meal plan or your own, one-tap "As planned", and calories and macros from a built-in library (Egyptian staples included, cooked weights). Also USDA search, barcode scan, custom foods and recipes. Drinks count toward water.
- **Habits:** a morning commitment, if-then plans for risky moments, a 3-tap reflection after a missed day, a 10-minute craving tool, a sleep goal with a bedtime reminder, and one weekly focus goal.
- **Ramadan mode:** a Suhoor / Iftar / after-Taraweeh plan, water paced from iftar to fajr, and an iftar countdown.

## Train

<p>
<img src="docs/screens/train.webp" width="200" alt="Your training plan">
<img src="docs/screens/workout.webp" width="200" alt="Logging a workout with the rest timer">
<img src="docs/screens/exercise.webp" width="200" alt="Exercise page">
<img src="docs/screens/summary.webp" width="200" alt="Workout summary">
</p>

- **A plan for anyone:** a short setup asks where you train (full gym, dumbbells, or no equipment), your goal, experience and days per week. It then builds a plan: full body, push/pull/legs, upper/lower, PPL + upper/lower, body-part split, or PPL ×2. You can edit any workout or build your own.
- **Guided logging:**
  - Start and end photos for each exercise, with last time's numbers pre-filled and a tip on when to add weight.
  - Warm-up (W), drop (D) and to-failure (F) sets, an optional effort score (RPE), supersets, and a pinned note per exercise.
  - A warm-up and plate calculator.
- **Rest timer:** sits next to the exercise name (0:30 by default, changeable per exercise or for all), with a small bar for −15 / +15 / Skip. On Android, the lock-screen notification has **Set done** and **Skip rest** buttons.
- **After the workout:** a summary compared with last time, records, and optional cardio after lifting.
- **Library:** 873 exercises covering machines, cables, barbell, dumbbells, kettlebells, bands, bodyweight and stretches. Search and filter by muscle or equipment. Each exercise page has a progress chart and records.
- **Import:** bring workout history over from Lyfta, Hevy or Strong (CSV export).
- **Sports and cardio:** log football, padel, tennis and more. Calories come from the 2024 Compendium of Physical Activities, or your average heart rate. A 12-week stamina plan is included.

## Progress, ranks and friends

<p>
<img src="docs/screens/progress.webp" width="200" alt="Weekly progress">
<img src="docs/screens/muscles.webp" width="200" alt="Muscle map">
<img src="docs/screens/rank.webp" width="200" alt="Strength rank">
<img src="docs/screens/league.webp" width="200" alt="Weekly league with friends">
</p>

- **Week, Muscles, Body and Chain tabs:**
  - Week: the weekly review and a shareable coach report.
  - Muscles: a body map of sets per muscle against the 10–20 sets range, with recovery days.
  - Body: weight trend and measurements.
  - Chain: the 90-day chain and the history of each day.
- **Monthly report:** a shareable image on the 1st of each month.
- **Strength rank:** seven tiers (Iron to Legend) from your best estimated 1-rep max relative to bodyweight on main lifts. Warm-ups and sets over 12 reps don't count.
- **Friends:** create a group and share the 6-letter code.
  - **Weekly league:** points come from discipline, not raw strength, so a beginner can win. A locked-in day is +10, a workout +5, a record +3.
  - **Other boards:** a strength board that compares fairly across bodyweights (DOTS), a most-improved board, and the board with cheers and nudges.
  - **Privacy:** only these numbers are shared, never food, weight or photos. Anyone can hide themselves.
- **Coach link:** a private read-only page for your coach that updates by itself.
- **Start over your way:** a new attempt that keeps history, or clear exactly what you choose. Your group always stays, and friends can be told.

<p><img src="docs/screens/me.webp" width="200" alt="Me menu"></p>

## How it runs for free

- **Hosting:** GitHub Pages serves the app. A service worker caches it for offline use and updates it in the background.
- **Data:** Firebase Auth and Firestore on the free Spark plan. Each collection loads from the phone's cache and only fetches what changed, so about 60 people fit.
- **Reminders:** a GitHub Actions job runs every 30 minutes and sends smart reminders as app notifications through Firebase Cloud Messaging (free). Anyone who hasn't turned those on gets them through ntfy instead. Strava sync is built in but switched off unless Strava secrets are added.

## Setup

1. **Firestore rules:** Firebase console → Firestore Database → Rules → paste `firestore.rules` → Publish. Re-publish whenever this file changes.
2. **Authorized domain:** Authentication → Settings → Authorized domains → add `hassanabdelshafy21.github.io`.
3. **GitHub Pages:** repo Settings → Pages → Deploy from a branch → `main` / `(root)`.
4. **Push key:** Project settings → Cloud Messaging → Web Push certificates → Generate key pair. The public key goes in `app.js` (`VAPID`). Make sure "Firebase Cloud Messaging API (V1)" is enabled.
5. **Secrets** (repo Settings → Secrets and variables → Actions → New repository secret):
   - `FIREBASE_SERVICE_ACCOUNT`: Firebase → Project settings → Service accounts → Generate new private key → paste the whole file.
   - `NTFY_TOPIC` (optional fallback): a long random name; subscribe to the same name in the ntfy app.
6. **Test reminders:** Actions → **tick** → Run workflow → tick "Send a test notification".

## Credits

- Exercises and photos: [free-exercise-db](https://github.com/yuhonas/free-exercise-db), public domain (`ex/LICENSE-free-exercise-db.md`).
- Font: [Alexandria](https://fonts.google.com/specimen/Alexandria), SIL Open Font License (`fonts/OFL-Alexandria.txt`).
- Sports calories: 2024 Adult Compendium of Physical Activities. Body numbers: NICE 2022 waist-to-height bands and the US Navy body-fat formula.
