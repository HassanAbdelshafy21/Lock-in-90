# Lock In 90

A personal 90-day challenge tracker that works offline and syncs through Firebase.

- **Required every day:** every planned meal on plan, water goal, that day's training, core supplements. Miss one and the counter resets to Day 1. The day after a miss is flagged "Never miss twice."
- **Food:** your coach's meal plan (editable, 3–5+ meals), one-tap "As planned", calories and macros from a built-in library (Egyptian staples included, cooked weights), USDA search, barcode scan, custom foods. Drinks logged in meals or extras (coffee, tea, zero cola, milk, juice) count toward the water goal.
- **Training:** calisthenics with drawn start/finish figures, hold and rest timers, personal bests; a 12-week stamina track that never affects the streak.
- **Friends board:** create a group, share the 6-character code, and everyone in it sees each other's day count, streak and today's status (nothing else is shared).
- **Progress:** weekly review, 90-day chain, milestones, weight with 7-day average, measurements, before/after photo slider.
- **Cloud job (GitHub Actions, every 30 min):** sends smart reminders to the ntfy app. (Strava sync is built in but switched off; it only runs if Strava secrets are added.)

## Setup

1. **Firestore rules:** Firebase console → Firestore Database → Rules → paste `firestore.rules` → Publish. Re-publish whenever this file changes (the friends board needs the `groups` rules).
2. **Authorized domain:** Authentication → Settings → Authorized domains → add `hassanabdelshafy21.github.io`.
3. **GitHub Pages:** repo Settings → Pages → Deploy from a branch → `main` / `(root)`.
4. **Secrets** (repo Settings → Secrets and variables → Actions → New repository secret):
   - `FIREBASE_SERVICE_ACCOUNT` — Firebase → Project settings → Service accounts → Generate new private key → paste the whole file.
   - `NTFY_TOPIC` — a long random name; subscribe to the same name in the ntfy app.
5. **Test reminders:** Actions → **tick** → Run workflow → tick "Send a test notification".

App: https://hassanabdelshafy21.github.io/Lock-in-90/
