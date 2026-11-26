# Lock In 90

A daily health tracker for food, water, training and supplements, with an optional 90-day challenge: turn on Lock In 90 and every day needs all four, or you're back to Day 1. It's a web app you install on your phone: it works offline, syncs through Firebase, and runs entirely on free tiers.

**Open the app:** https://hassanabdelshafy21.github.io/Lock-in-90/ (on Android: menu → Install app; on iPhone: Share → Add to Home Screen)

<p>
<img src="docs/screens/today.webp" width="200" alt="Today screen">
<img src="docs/screens/today_dark.webp" width="200" alt="Today screen, dark mode">
<img src="docs/screens/meals.webp" width="200" alt="Meals panel">
<img src="docs/screens/today_ar.webp" width="200" alt="Today screen in Arabic">
</p>

## Today

One screen for the day. A navy scoreboard shows four rings around the day number, one each for meals, water, training and supplements. Below it sit one "Up next" card with the single most useful thing to do now, and a short list of the rest. Tap any pillar for its details. Light and dark mode follow the phone, and the whole app also works in Arabic, right to left.

- **Two ways to use it:** a **daily tracker** (the default for new accounts) where you pick which goals make a full day, a bad day just shows lighter on the calendar, and nothing resets; or the **Lock In 90 challenge**. Switch any time in Me → Mode. In tracker mode without a meal plan, the food goal is logging what you eat, within an optional calorie target.
- **The challenge: train and stay on plan:** a missed workout or off-plan food resets the counter to Day 1. Eating less than the plan, water and supplements don't reset you (they still lock the day in). The day after a miss is flagged "Never miss twice."
- **Food:** your coach's meal plan or your own, one-tap "As planned", and calories and macros from a built-in library (Egyptian staples included, cooked weights). Drinks count toward water.
  - **Egyptian brands:** popular packaged products (Balance, Juhayna, Domty, Almarai, Lamar, Rich Bake, Abu Auf, Molto and more) checked against their labels, plus McDonald's Egypt from its published tables and Dunkin' cappuccino and latte (whole or skim milk, small to large). Anything else sold in Egypt can be searched on Open Food Facts, and entries whose calories don't add up are left out.
  - **Egyptian home and restaurant food:** about 50 dishes: mahshy (cabbage, vine leaves, mixed), mombar, fattah, macarona béchamel, bamya, mesa'a'a, rice with vermicelli, bessara, kebda, sogo', hamam mahshy and more; koshary by box size, foul and taameya sandwiches, liver and sogo' sandwiches, shawarma, fiteer and grills; sweets like konafa, qatayef and Om Ali; and drinks like sahlab, karkade and sugarcane juice. Search in Arabic, English or Franco ("wara2 3enab"), or by shop name ("Abou Tarek"). No Egyptian chain publishes nutrition, so dishes are worked out from typical recipes with USDA values for each ingredient and marked as estimates.
  - **Servings, not just grams:** pack, slice, cup, bar and so on, with a ½-step amount. The app remembers what you used last time.
  - **More nutrients:** sodium (and salt), sugar, saturated fat, fiber, potassium and calcium for each food and for the day, against WHO limits, with the foods that gave you the most sodium.
  - **Add from a label:** per 100 g or per serving, sodium or salt, your own servings, and a check that catches typos. You can photograph the nutrition table and the phone reads the numbers (on the phone itself, English and Arabic). Also barcode scan, USDA search and recipes.
  - **Drinks and cooking:** add milk, sugar, honey, creamer or sweetener to a coffee or tea, and the ghee, oil, butter or spray a food or meal was cooked with (with your own teaspoon size). Each is logged as one item. Cooking fat adds calories but never makes a meal off-plan.
  - **Weekly calorie budget (optional):** go over one day and the rest of your week's targets drop a little to pay it back, spread out or as soon as possible, never more than a set share of a day and never below a floor. Today's planned carb and fat portions shrink to match; protein never does.
  - **Daily list:** a "Daily" tab in Meals for the things you have most days (your coffee, your tea, a usual meal). One tap adds it, it shows when you had it and how many, and the first three sit as quick buttons on Today.
  - **Add a whole meal:** a burger, fries and a drink logged as one entry, as an extra or instead of a planned meal, allowed, off-plan or as your free cheat meal. Save it to your Daily list for one tap next time.
  - **Free cheat meal:** if your coach allows it, 1 or 2 a week (or 1 every 2 weeks), as one meal or a whole day. The day still counts, and the coach page marks it. A cheat meal never resets the challenge: if a recent day broke your streak only because of off-plan food, Today offers to count it as that week's free cheat meal and the streak comes back.
  - **Friends' foods:** share a food you added and everyone in your group can log it.
- **Your own week:** weeks start on the weekday you began (or Saturday, or any day you pick) for the weekly review, focus, muscle sets and cheat meal. The friends league stays Saturday to Friday.
- **Your day, your clock:** the new day starts at midnight by default, or at Fajr (worked out daily for 20 Egyptian cities) or a set time, so logging at 1 am still counts for the day you're in.
- **Habits:** a morning commitment, if-then plans for risky moments, a 3-tap reflection after a missed day, a 10-minute craving tool, a sleep goal with a bedtime reminder, and one weekly focus goal.
- **Fasting today:** a one-tap row on the Today screen for voluntary fasts. Nothing else changes (same meals, same plan, streak intact); the app works out iftar and fajr for Cairo, shows the iftar countdown and paces water between iftar and fajr.
- **Ramadan mode:** a Suhoor / Iftar / after-Taraweeh plan, water paced from iftar to fajr, and an iftar countdown.

## Train

<p>
<img src="docs/screens/gear.webp" width="200" alt="Choosing your home equipment">
<img src="docs/screens/train.webp" width="200" alt="Your training plan with the Gym / Home switch">
<img src="docs/screens/workout.webp" width="200" alt="Logging a workout with the rest timer">
<img src="docs/screens/exercise.webp" width="200" alt="Exercise page">
<img src="docs/screens/summary.webp" width="200" alt="Workout summary">
</p>

- **A plan built from your equipment:** setup asks where you train (gym, home, or both), then what you have at home: dumbbells, barbell, resistance bands, bench, pull-up bar, rack, kettlebell, dip bars, cables or machines, and how heavy your weights go. It then asks your goal, experience, days per week and session length.
  - Splits follow current evidence: full body A · B · C for 3 days, upper/lower for 4, upper/lower + push/pull/legs for 5, push/pull/legs twice for 6. Push/pull/legs once a week is still there if you want it.
  - Every muscle is trained at least twice a week with about 10 or more hard sets. An "Every muscle covered?" check shows weekly sets per muscle and adds sets where one is low.
  - Each exercise shows the equipment it needs and alternatives for the same muscle with your other equipment.
- **Home is programmed differently, not just with other exercises:** higher reps, exercises paired back to back to save time, a slower lowering on light weights, one leg or arm at a time when the dumbbells are light, and a "make it harder" step after a session where every set hit the top of the range. Gym-and-home plans get a Gym / Home switch that turns the day's workout into its home version.
- **Your plans, your way:** build a plan yourself from scratch, let the app build it from your equipment, start from a template (Full body A·B·C, Upper · Lower, Push · Pull · Legs, Arnold split, Bro split), or turn a workout you already did into a plan. Keep several plans under **My plans** and switch any time; your history isn't tied to a plan.
- **Every workout is editable:** ⋯ on any workout opens edit, preview, duplicate, move to another plan, make it next, or delete. Drag ≡ to reorder. The editor sets weight and rep range per set, warm-up, drop and to-failure sets, rest per exercise, a note that shows every time, supersets, and replace. A live count of weekly sets per muscle shows gaps while you build.
- **Start needs two taps,** so a workout never starts by accident.
- **Change it while you train:** a Replace button on each exercise searches all exercises (same muscle, recent, or everything) and shows your last weight on each. Choose "only this workout" or "also in my plan"; sets you already ticked stay as they were. Reorder, add and remove exercises mid-workout. At Finish, if you changed the workout's shape, you see the changes and choose to update the plan, keep it, or save a new workout. Finished workouts can be edited the same way.
- **Pick any workout:** the next one in your plan is suggested, but you can start any other, an empty workout, or a quick 30-minute version. Each shows whether its main muscles are fresh or were trained yesterday. Doing another workout doesn't skip the suggested one.
- **Band exercises with drawings:** 10 resistance-band exercises (rows, pulldown, face pull, chest press, curl, pushdown, overhead extension, Romanian deadlift, split squat) with step-by-step instructions and two-position drawings made for the app.
- **Fast logging:** the whole workout on one screen. Each set shows last time's numbers and today's target in grey; ticking a set fills in the target and starts the rest timer. The ⋯ menu on each exercise has swap, how-to, warm-up sets, rest time, a note, move, pair and remove. Swapping offers the same muscle with your equipment, for today or for the plan.
- **Logging details:**
  - Warm-up (W), drop (D) and to-failure (F) sets, an optional effort score (RPE), supersets, and a pinned note per exercise.
  - A warm-up and plate calculator.
- **Rest timer:** automatic by default (about 2 minutes for big lifts, 75 seconds for small ones), changeable per exercise or for all, with a small bar for −15 / +15 / Skip. On Android, the lock-screen notification has **Set done** and **Skip rest** buttons.
- **After the workout:** a summary compared with last time, records, the muscles you trained, what's next, and optional cardio after lifting.
- **Library:** 886 exercises covering machines, cables, barbell, dumbbells, kettlebells, bands, bodyweight and stretches. Search and filter by muscle or equipment. Each exercise page has a progress chart and records.
- **Import:** bring workout history over from Lyfta, Hevy or Strong (CSV export).
- **Sports and cardio:** log football, padel, tennis and more. Calories come from the 2024 Compendium of Physical Activities, or your average heart rate. A 12-week stamina plan is included.

## Calisthenics

<p>
<img src="docs/screens/cali.webp" width="200" alt="Calisthenics skill paths">
<img src="docs/screens/cali_path.webp" width="200" alt="One skill path, step by step">
</p>

- **Skill paths:** push, pull, dip, row, legs, hinge and core, each a ladder of steps from easy to hard (incline push-up to one-arm push-up, dead hang to one-arm pull-up negative, and so on). Add skill paths for handstand, L-sit, front lever, planche and muscle-up.
- **Placement test:** five minutes of max reps and holds places you on every path.
- **Sessions:** built from your current step on each path, in the order of the Reddit Bodyweight Fitness "Recommended Routine": skills first, then three strength pairs (pull + dip, legs + hinge, push + row), then core.
- **Level up:** hit the top of the range on every set and the next step unlocks; you choose to move up or stay. Steps with a photo in the library show it; the rest link to form videos.

## Progress, ranks and friends

<p>
<img src="docs/screens/progress.webp" width="200" alt="Weekly progress">
<img src="docs/screens/muscles.webp" width="200" alt="Muscle map">
<img src="docs/screens/rank.webp" width="200" alt="Strength ranks">
<img src="docs/screens/league.webp" width="200" alt="Weekly league with friends">
</p>

- **Week, Muscles, Body and Chain tabs:**
  - Week: the weekly review and a shareable coach report.
  - Muscles: a body map of sets per muscle against the 10–20 sets range, with recovery days.
  - Body: weight trend and measurements.
  - Chain (challenge) or Calendar (tracker): the 90-day chain, or a month shaded by goals hit, and the history of each day.
- **Monthly report:** a shareable image on the 1st of each month.
- **Strength rank:** seven ranks (Iron, Bronze, Silver, Gold, Platinum, Diamond, Legend), each with three steps, from your best estimated 1-rep max relative to bodyweight on main lifts, or reps for pull-ups, dips and push-ups. Your rank badge sits on Today, Train and Me. The ranks page lists every rank with what it takes at your bodyweight, and your friends' ranks. Warm-ups and sets over 12 reps don't count.
- **Friends:** create a group and share the 6-letter code.
  - **Weekly league:** points come from discipline, not raw strength, so a beginner can win. A locked-in day is +10, a workout +5, a record +3.
  - **Other boards:** a strength board that compares fairly across bodyweights (DOTS), a most-improved board, and the board with cheers and nudges.
  - **Privacy:** only these numbers are shared, never what you ate, your weight or photos (foods you add can be shared with the group if you choose). Anyone can hide themselves.
- **Coach link:** a private read-only page for your coach that updates by itself.
- **Start over your way:** a new attempt that keeps history, or clear exactly what you choose. Your group always stays, and friends can be told.

<p><img src="docs/screens/me.webp" width="200" alt="Me menu"></p>

_Screenshots use a demo account with made-up data._

## How it runs for free

- **Hosting:** GitHub Pages serves the app. A service worker caches it for offline use and updates it in the background.
- **Data:** Firebase Auth and Firestore on the free Spark plan. Each collection loads from the phone's cache and only fetches what changed, so about 60 people fit.
- **Reminders:** a scheduled job runs every 30 minutes and sends smart reminders as app notifications through Firebase Cloud Messaging (free), or through ntfy for anyone who hasn't turned those on.

## Privacy and security

- The repo is public, so nothing private lives in it: no keys, no personal plans, no emails. The Firebase web config and the push public key are designed to be public; access is controlled by `firestore.rules` (each person can only read and write their own data).
- Keys for the reminder job live only in encrypted GitHub Actions secrets, never in the code.
- The friends board shares only day count, streak, today's status, league points and rank; never what you ate, your weight or photos. A food you add is shared with your group only if you tick "Share with my group".

## Credits

- Exercises and photos: [free-exercise-db](https://github.com/yuhonas/free-exercise-db), public domain (`ex/LICENSE-free-exercise-db.md`). The band exercise drawings were made for Lock In 90.
- Training rules: ACSM 2026 resistance training position stand (each muscle at least twice a week, about 10+ weekly sets); Ramos-Campo 2024 and Pelland 2024 meta-analyses (split vs full body, counting indirect sets as half); Schoenfeld 2017 and Lasevicius 2022 (light loads work close to failure); Lopes 2019 (bands vs weights); Singer 2024 (rest periods).
- Food data: [Open Food Facts](https://world.openfoodfacts.org) (ODbL), [USDA FoodData Central](https://fdc.nal.usda.gov) (public domain), McDonald's Egypt published nutrition tables, Dunkin' nutrition guide (calories; the rest worked out from the milk). Label reading: [Tesseract.js](https://github.com/naptha/tesseract.js) (Apache 2.0), loaded only when you use it.
- Font: [Alexandria](https://fonts.google.com/specimen/Alexandria), SIL Open Font License (`fonts/OFL-Alexandria.txt`).
- Sports calories: 2024 Adult Compendium of Physical Activities. Body numbers: NICE 2022 waist-to-height bands and the US Navy body-fat formula.
