// Arabic translations for Lock In 90. Keys are the English UI text; numbers are written as {n} and filled in order.
// Used by the app (on screen) and the cloud job (notifications). No DOM access here.
export const AR = {
  // navigation + common
  "Today": "اليوم", "Train": "التمرين", "Progress": "التقدم", "Setup": "الإعدادات", "Sections": "الأقسام", "Quick add": "إضافة سريعة",
  "Close": "إغلاق", "Cancel": "إلغاء", "Save": "حفظ", "Add": "إضافة", "Back": "رجوع", "Done": "تم", "Remove": "حذف", "New": "جديد", "Next ›": "التالي ›", "‹ Previous": "‹ السابق",
  "On": "تشغيل", "Off": "إيقاف", "Optional": "اختياري", "optional": "اختياري", "or": "أو", "None": "لا شيء", "Now": "الآن", "Thanks": "شكرًا", "Synced": "متزامن", "Syncing": "جارٍ المزامنة",
  "Offline · saved on phone": "بدون إنترنت · محفوظ على الهاتف", "Loading…": "جارٍ التحميل…", "Loading your challenge…": "جارٍ تحميل تحديك…",
  "Streak": "السلسلة", "Streak, streak {n}": "السلسلة، {n}", "Streak at risk: finish today": "السلسلة في خطر: أكمل اليوم", "Streak at risk: finish today, streak {n}": "السلسلة في خطر: أكمل اليوم، السلسلة {n}", "Today is locked in": "اليوم مكتمل",
  "Day · attempt {n}": "اليوم · المحاولة {n}", "Day {n}": "اليوم {n}", "Day now": "اليوم الحالي", "{n}-day challenge": "تحدي {n} يومًا", "90-day challenge": "تحدي 90 يومًا",
  "Locked in": "مكتمل", "locked in": "مكتمل", "In progress": "قيد التنفيذ", "Missed": "فائت", "Not yet": "ليس بعد", "Not done": "لم يكتمل", "Not logged": "لم يُسجَّل", "Logged": "مسجَّل",
  "Monday": "الاثنين", "Tuesday": "الثلاثاء", "Wednesday": "الأربعاء", "Thursday": "الخميس", "Friday": "الجمعة", "Saturday": "السبت", "Sunday": "الأحد",
  "Mon": "اثن", "Tue": "ثلا", "Wed": "أرب", "Thu": "خمي", "Fri": "جمع", "Sat": "سبت", "Sun": "أحد",
  "kcal": "سعرة", "{n} kcal": "{n} سعرة", "g": "جم", "{n} g": "{n} جم", "min": "دقيقة", "{n} min": "{n} دقيقة", "{n} h": "{n} س", "{n} h {n}": "{n} س {n}", "{n} kg": "{n} كجم", "{n} L": "{n} لتر", "+ {n} L": "+ {n} لتر", "+ {n} ml": "+ {n} مل", "− {n} ml": "− {n} مل",
  "reps": "عدات", "sec": "ثانية", "Minutes": "الدقائق", "Time": "الوقت", "Date": "التاريخ", "Name": "الاسم", "Type": "النوع", "Note": "ملاحظة", "Data": "البيانات", "Challenge": "التحدي",
  "{n} / {n} L": "{n} / {n} لتر", "/ {n} L": "/ {n} لتر", "/ {n} g": "/ {n} جم", "/ {n} kcal": "/ {n} سعرة", "{n} kcal · {n} P": "{n} سعرة · {n} بروتين", "{n} g P": "{n} جم بروتين", "≈ {n} kcal": "≈ {n} سعرة", "{n} L to go": "متبقٍ {n} لتر",
  "{n} kcal · {n} g protein": "{n} سعرة · {n} جم بروتين", "{n} kcal · {n} g protein · {n} g carbs · {n} g fat": "{n} سعرة · {n} جم بروتين · {n} جم كربوهيدرات · {n} جم دهون",
  "Per {n} g: {n} kcal · {n} P · {n} C · {n} F": "لكل {n} جم: {n} سعرة · {n} بروتين · {n} كربوهيدرات · {n} دهون", "per {n} g": "لكل {n} جم",

  // sign-in + welcome
  "LOCK IN": "LOCK IN", "Sign in with Google": "الدخول بحساب Google", "Sign in": "تسجيل الدخول", "Create account": "إنشاء حساب", "Forgot password?": "نسيت كلمة المرور؟", "Email": "البريد الإلكتروني", "Password": "كلمة المرور",
  "Sign in once. After that the app works offline and syncs when you’re back online.": "سجّل الدخول مرة واحدة، بعدها يعمل التطبيق بدون إنترنت ويتزامن عند عودة الاتصال.",
  "or with email (works in every browser, best on iPhone)": "أو بالبريد الإلكتروني (يعمل في كل المتصفحات، الأفضل للآيفون)",
  "Start your {n} days": "ابدأ أيامك الـ{n}", "Start date": "تاريخ البدء", "Start Day {n}": "ابدأ اليوم {n}", "Day {n} starts now.": "اليوم {n} يبدأ الآن.", "Current weight (kg)": "الوزن الحالي (كجم)",
  "Every day needs every planned meal on plan, your water goal, that day’s training and your core supplements. Miss any of them and the counter goes back to Day {n}. You start with Breakfast, Lunch and Dinner. Add your own meal plan and supplements in Setup, or just log what you eat and the app counts the calories.": "كل يوم يحتاج كل الوجبات حسب الخطة، وهدف المياه، وتمرين اليوم، ومكملاتك الأساسية. لو فاتك أي منها يرجع العدّاد لليوم {n}. تبدأ بفطار وغدا وعشا. أضف خطتك ومكملاتك في الإعدادات، أو سجّل ما تأكله والتطبيق يحسب السعرات.",
  "Every day needs every planned meal on plan, your water goal, that day’s training and your core supplements. Miss any of them and the counter goes back to Day {n}. Your coach’s meal plan is already loaded; edit it in Setup.": "كل يوم يحتاج كل الوجبات حسب الخطة، وهدف المياه، وتمرين اليوم، ومكملاتك الأساسية. لو فاتك أي منها يرجع العدّاد لليوم {n}. خطة الكابتن محمّلة بالفعل؛ عدّلها في الإعدادات.",
  "Moving from the old app?": "قادم من التطبيق القديم؟", "Import a backup file": "استيراد ملف نسخة احتياطية", "instead.": "بدلًا من ذلك.",

  // banners
  "Never miss twice": "لا تفوّت مرتين", "Yesterday broke the chain and reset you to Day {n}. Today is non-negotiable.": "أمس انكسرت السلسلة ورجعت لليوم {n}. اليوم غير قابل للتفاوض.",
  "{n} hours left to lock in today": "باقي {n} ساعات لإكمال اليوم", "{n} hour left to lock in today": "باقي ساعة لإكمال اليوم", "Still missing:": "ما زال ناقصًا:",
  "Today can’t count right now": "اليوم لا يُحتسب حاليًا", "Something off-plan is logged. If it was a mistake, change it back.": "مسجَّل شيء خارج الخطة. لو كان خطأ، غيّره.",
  "Weekly review is ready": "مراجعة الأسبوع جاهزة", "Open it in Progress": "افتحها في التقدم", "90 days. Done.": "90 يومًا. تمّت.",
  "Milestone: Day {n}": "إنجاز: اليوم {n}", "Your Day {n} recap is ready": "ملخص اليوم {n} جاهز", "See it in Progress": "شاهده في التقدم",

  // home hero + up next
  "Meals": "الوجبات", "Water": "المياه", "Training": "التمرين", "Supplements": "المكملات", "of {n}": "من {n}",
  "{n} / {n} on plan": "{n} / {n} حسب الخطة", "Off-plan logged": "مسجَّل خارج الخطة", "Rest day": "يوم راحة", "None required": "غير مطلوب", "{n} / {n} core": "{n} / {n} أساسي",
  "Creatine, Omega {n}, Multivitamin, Powermax left": "متبقٍ: كرياتين، أوميجا {n}، ملتي فيتامين، باور ماكس",
  "Every meal on plan is a choice you make again.": "كل وجبة حسب الخطة هي اختيار تجدده.", "Finish today. Tomorrow is a separate problem.": "أكمل اليوم. بكرة مشكلة تانية.",
  "Up next": "التالي", "Ate it as planned": "أكلتها حسب الخطة", "Changed": "اتغيّرت", "(coming up)": "(قادمة)",
  "No foods planned for this meal yet. Log what you ate and the app works out the calories.": "لا توجد أطعمة في خطة هذه الوجبة. سجّل ما أكلته والتطبيق يحسب السعرات.",
  "Set up my plan": "إعداد خطتي", "Water: {n} L behind pace": "المياه: متأخر {n} لتر عن المعدل", "{n} of {n} L so far. Aim for about {n} L by now.": "{n} من {n} لتر حتى الآن. الهدف حوالي {n} لتر الآن.",
  "Mark done": "تم", "Played a sport instead?": "لعبت رياضة بدلًا منه؟", "Open Train": "افتح التمرين", "Your no-bar session. Log your sets in Train.": "تمرينك بدون عقلة. سجّل المجموعات في التمرين.",
  "Supplements: {n} left": "المكملات: متبقٍ {n}", "I took them": "أخذتها", "Locked in. This day counts.": "مكتمل. هذا اليوم محسوب.", "Share image": "مشاركة صورة", "+ Log a sport": "+ سجّل رياضة",
  "Make it yours": "اجعلها خاصتك", "Add your meal plan": "أضف خطة وجباتك", "Add your Ramadan meal plan": "أضف خطة وجبات رمضان", "I’ll log as I go": "سأسجّل أولًا بأول",
  "Put in your coach’s plan, or your own, in Setup → Meal plan, with the foods and grams for each meal. Then one tap logs a meal and your calorie and protein targets appear. No plan? Just log what you eat in each meal.": "أضف خطة الكابتن أو خطتك في الإعدادات ← خطة الوجبات، بالأطعمة والجرامات لكل وجبة. بعدها نقرة واحدة تسجّل الوجبة وتظهر أهداف السعرات والبروتين. مفيش خطة؟ سجّل اللي بتاكله في كل وجبة.",
  "Morning commitment": "التزام الصباح", "Day {n}. Commit to it.": "اليوم {n}. التزم به.", "I commit to Day {n}": "ألتزم باليوم {n}", "One tap: a promise to yourself that today gets done, all four pillars.": "نقرة واحدة: وعد لنفسك أن اليوم سيكتمل بكل أركانه الأربعة.",
  "Committed to Day {n}. Go get it.": "التزمت باليوم {n}. يلا بينا.", "committed {n}:{n}": "التزمت {n}:{n}", "Committed at {n}:{n}": "التزمت الساعة {n}:{n}",
  "Every box is checked. This day counts.": "كل المربعات مكتملة. هذا اليوم محسوب.", "Every box checked. This day counts.": "كل المربعات مكتملة. هذا اليوم محسوب.", "Milestone: Day {n} ": "إنجاز: اليوم {n}",
  "Evening view: what’s still missing is at the top.": "عرض المساء: الناقص في الأعلى.",

  // friends
  "Friends": "الأصدقاء", "{n} of {n} locked in today": "{n} من {n} أكملوا اليوم", "{n} of {n} locked in today · group chain {n}": "{n} من {n} أكملوا اليوم · سلسلة المجموعة {n}",
  "From your friends": "من أصدقائك", "⏰ Finish today, you’ve got this": "⏰ أكمل اليوم، تقدر", "👏 Keep going!": "👏 كمّل!", "🔥 Locked in, respect": "🔥 مكتمل، احترامي",
  "Make a group, send the code to your friends, and you all see each other’s day count, streak and whether today is locked in. Only those numbers are shared, never your food, weight or photos.": "أنشئ مجموعة وأرسل الكود لأصدقائك، وكلكم تشوفوا عدد الأيام والسلسلة وهل اليوم مكتمل. تُشارك هذه الأرقام فقط، وليس أكلك أو وزنك أو صورك.",
  "Your name on the board": "اسمك في اللوحة", "Create a group": "إنشاء مجموعة", "Friend’s group code": "كود مجموعة صديقك", "Join": "انضمام", "Invite friends": "دعوة الأصدقاء", "Leave group": "مغادرة المجموعة",
  "days in a row that": "أيام متتالية", "everyone": "الكل", "locked in · all of you are done today": "أكملوا · كلكم خلصتوا اليوم",
  "Day {n} · streak {n}": "اليوم {n} · السلسلة {n}", "Day {n} · streak {n} · attempt {n}": "اليوم {n} · السلسلة {n} · المحاولة {n}", "{n}/{n} today": "{n}/{n} اليوم", "90 days done": "أنهى 90 يومًا",
  "Already sent today.": "أُرسلت اليوم بالفعل.", "Sent 👏": "تم الإرسال 👏", "Nudge sent.": "تم إرسال التنبيه.",

  // meals
  "Calories": "السعرات", "Protein": "البروتين", "Carbs": "الكربوهيدرات", "Fat": "الدهون",
  "Log all meals as planned": "سجّل كل الوجبات حسب الخطة", "Log the other {n} as planned": "سجّل الـ{n} الباقيين حسب الخطة", "Log the last planned meal as planned": "سجّل آخر وجبة حسب الخطة",
  "Not today": "ليس اليوم", "Undo": "تراجع", "As planned": "حسب الخطة", "Off-plan": "خارج الخطة", "Log what I ate": "سجّل ما أكلته", "Copy a past meal": "انسخ وجبة سابقة", "Done editing": "انتهيت من التعديل",
  "Not part of today’s plan.": "ليست ضمن خطة اليوم.", "No plan set for this meal. Log what you ate.": "لا توجد خطة لهذه الوجبة. سجّل ما أكلته.", "Edit foods ({n})": "عدّل الأطعمة ({n})",
  "Note (optional)": "ملاحظة (اختياري)", "+ Add food": "+ إضافة طعام", "No foods yet.": "لا توجد أطعمة بعد.", "Extras outside your meals": "إضافات خارج الوجبات", "+ Log an extra (drink, snack, cheat)": "+ سجّل إضافة (مشروب، سناك، تشيت)",
  "counts as water": "تُحسب مياه", "off-plan": "خارج الخطة", "Meals logged as planned.": "تم تسجيل الوجبات حسب الخطة.", "Breakfast": "الفطار", "Lunch": "الغدا", "Dinner": "العشا", "Meal {n}": "الوجبة {n}",
  "Suhoor": "السحور", "Iftar": "الإفطار", "After Taraweeh": "بعد التراويح",

  // water
  "{n} glasses of {n} ml left": "متبقٍ {n} أكواب {n} مل", "Done for today": "خلصت النهارده", "Goal hit": "تحقق الهدف", "Includes {n} L from drinks you logged in meals and extras.": "يشمل {n} لتر من المشروبات المسجلة في الوجبات والإضافات.", "{n} of {n} litres": "{n} من {n} لتر",

  // training card
  "Gym session": "حصة الجيم", "Calisthenics session": "حصة كاليسثنكس", "Mobility + light skill work": "مرونة + مهارات خفيفة", "Rest day ": "يوم راحة",
  "Your PPLUL day. Tick it after you log it in Lyfta.": "يوم PPLUL. علّم عليه بعد تسجيله في Lyfta.", "Tick it once your gym workout is done.": "علّم عليه بعد ما تخلص تمرين الجيم.",
  "Log your sets in the Train tab": "سجّل مجموعاتك في تبويب التمرين", "30 to 40 minutes, low intensity": "30 إلى 40 دقيقة بشدة منخفضة", "No training required today": "لا يوجد تمرين مطلوب اليوم",
  "Gym time today": "وقت الجيم اليوم", "Gym time": "وقت الجيم", "Morning": "صباحًا", "Night": "ليلًا", "+ Played a sport? Log it": "+ لعبت رياضة؟ سجّلها", "+ Log another": "+ سجّل أخرى",
  "Today is set as “Gym session”. Finishing a session here also ticks today’s training.": "اليوم مضبوط على “حصة الجيم”. إنهاء حصة هنا يعلّم على تمرين اليوم أيضًا.",
  "Done · Strava": "تم · Strava", "from Strava": "من Strava",

  // supplements
  "Morning gym day timing.": "مواعيد يوم الجيم الصباحي.", "Night gym day: no fat burner within {n} hours of bed.": "يوم الجيم الليلي: لا حارق دهون قبل النوم بـ{n} ساعات.",
  "Pre-gym": "قبل الجيم", "Post-gym": "بعد الجيم", "Any time": "أي وقت", "Before Meal {n}": "قبل الوجبة {n}", "With Meal {n}": "مع الوجبة {n}", "Before bed": "قبل النوم",
  "Creatine": "كرياتين", "Omega {n}": "أوميجا {n}", "Multivitamin": "ملتي فيتامين", "Powermax": "باور ماكس", "L-Carnitine": "إل-كارنيتين", "Fat burner · cap {n}": "حارق دهون · كبسولة {n}", "Vitamin D": "فيتامين د", "Whey protein": "واي بروتين", "Magnesium": "ماغنسيوم",
  "No supplements set. If you take any, add them in Setup and pick which ones are required each day.": "لا توجد مكملات. لو بتاخد أي مكمل أضفه في الإعدادات واختر المطلوب يوميًا.", "Add in Setup": "أضف في الإعدادات",
  "Core supplements ticked.": "تم تعليم المكملات الأساسية.",

  // body & notes
  "Body & notes": "الجسم والملاحظات", "Morning weight (kg)": "وزن الصباح (كجم)", "Sleep last night": "نوم أمس", "Resting heart rate": "نبض الراحة", "bpm, on waking": "نبضة/دقيقة عند الاستيقاظ",
  "Note for today": "ملاحظة اليوم", "How it went, cravings, wins. Only you see this.": "كيف مر يومك، الرغبات، الإنجازات. أنت فقط تراها.", "Energy today": "الطاقة اليوم", "Energy {n} to {n}": "الطاقة {n} إلى {n}",

  // food sheet
  "Add food": "إضافة طعام", "Search foods (English or عربي)": "ابحث عن طعام (عربي أو English)", "Search online (USDA)": "بحث أونلاين (USDA)", "Scan barcode": "مسح الباركود", "New custom food": "طعام مخصص جديد", "New recipe": "وصفة جديدة",
  "Favourites": "المفضلة", "Recent": "الأخيرة", "All foods": "كل الأطعمة", "Library": "المكتبة", "USDA results": "نتائج USDA", "your food": "طعامك", "your recipe": "وصفتك", "★ favourite": "★ مفضل",
  "Add to favourites": "أضف للمفضلة", "Remove from favourites": "احذف من المفضلة", "Added to favourites": "أُضيف للمفضلة", "Removed from favourites": "حُذف من المفضلة",
  "Grams": "جرامات", "Millilitres": "ملليلتر", "It’s a drink: count it toward my water": "مشروب: احسبه ضمن المياه", "It’s a drink (counts toward water)": "مشروب (يُحسب مياه)", "Allowed by plan": "مسموح في الخطة", "Plan status": "حالة الخطة",
  "Save to my foods": "احفظ في أطعمتي", "Saved to your foods.": "حُفظ في أطعمتك.", "Nothing in the library. Try “Search online”.": "لا يوجد في المكتبة. جرّب “بحث أونلاين”.", "Searching…": "جارٍ البحث…",
  "Copy the “per {n} g” values from the label.": "انسخ قيم “لكل {n} جم” من الملصق.", "Protein (g)": "البروتين (جم)", "Carbs (g)": "الكربوهيدرات (جم)", "Fat (g)": "الدهون (جم)", "Serving name and grams (optional)": "اسم الحصة والجرامات (اختياري)", "Save and use": "احفظ واستخدم",
  "Point the camera at the barcode.": "وجّه الكاميرا للباركود.", "Look up": "بحث", "Barcode number": "رقم الباركود",
  "New recipe ": "وصفة جديدة", "Add every ingredient with the amount that went into the pot, then weigh the finished dish. You can then log any portion of it in grams.": "أضف كل مكوّن بالكمية اللي دخلت الحلة، ثم ازن الطبق النهائي. بعدها تقدر تسجل أي كمية منه بالجرام.",
  "Recipe name": "اسم الوصفة", "e.g. Mom’s molokhia": "مثلًا ملوخية ماما", "+ Add ingredient": "+ إضافة مكوّن", "No ingredients yet.": "لا توجد مكونات بعد.", "Finished dish weight (g)": "وزن الطبق النهائي (جم)", "Servings (optional)": "عدد الحصص (اختياري)", "weigh the pot": "ازن الحلة",
  "Save recipe": "احفظ الوصفة", "Back to recipe": "رجوع للوصفة", "Pick an ingredient for": "اختر مكوّنًا لـ", "Add to recipe": "أضف للوصفة", "Recipe saved to your foods.": "حُفظت الوصفة في أطعمتك.",
  "Copy a meal": "انسخ وجبة", "Meals you changed in the last {n} weeks. Tap one to use the same foods now; you can still edit the grams after.": "وجبات غيّرتها آخر {n} أسابيع. اضغط واحدة لاستخدام نفس الأطعمة؛ تقدر تعدّل الجرامات بعدها.",
  "No changed meals in the last {n} weeks yet. Once you log a meal as “Changed”, it shows up here.": "لا توجد وجبات متغيّرة آخر {n} أسابيع. أول ما تسجل وجبة “اتغيّرت” هتظهر هنا.",

  // sports
  "Log a sport": "سجّل رياضة", "How long": "المدة", "How hard": "الشدة", "Easy": "سهل", "Normal": "متوسط", "Hard": "قوي", "Intensity": "الشدة",
  "Relaxed, lots of breaks, you can chat easily.": "هادئ، راحات كثيرة، تقدر تتكلم بسهولة.", "A proper game: breathing hard at times.": "ماتش حقيقي: نفَسك يتقطع أحيانًا.", "Competitive, full pace, you can barely talk.": "تنافسي، بأقصى سرعة، بالكاد تتكلم.",
  "Average heart rate (optional, from your watch)": "متوسط النبض (اختياري، من ساعتك)", "Count this as today’s training": "احسبها تمرين اليوم", "Add your age in Setup to use heart rate. Until then it uses the sport and intensity.": "أضف عمرك في الإعدادات لاستخدام النبض. لحد ساعتها يُحسب حسب الرياضة والشدة.",
  "Football": "كرة القدم", "Padel": "بادل", "Tennis": "تنس", "Basketball": "كرة السلة", "Volleyball": "كرة الطائرة", "Squash": "اسكواش", "Badminton": "تنس الريشة", "Table tennis": "تنس الطاولة", "Handball": "كرة اليد", "Swimming": "سباحة", "Boxing / MMA": "ملاكمة / MMA", "Running": "جري", "Cycling": "دراجة", "Walking": "مشي", "Hiking": "هايكنج", "Other sport": "رياضة أخرى",
  "easy": "سهل", "normal": "متوسط", "hard": "قوي", "counts as training": "محسوبة تمرين", "Sport": "رياضة", "Food or drink": "طعام أو مشروب", "Weight": "الوزن", "Calisthenics": "كاليسثنكس", "Cardio": "كارديو",
  "30 min": "30 دقيقة", "45 min": "45 دقيقة", "1 h": "1 ساعة", "1 h 30": "1:30 ساعة", "2 h": "2 ساعة",

  // celebration
  "Day": "اليوم", "Locked in ": "مكتمل", "First week": "أول أسبوع", "Two weeks": "أسبوعان", "Habit set": "العادة ثبتت", "One month": "شهر", "Halfway": "نصف الطريق", "Two months": "شهران", "Day {n} ": "اليوم {n}", "Image saved. Post it from your gallery.": "حُفظت الصورة. انشرها من المعرض.",

  // train tab
  "Training type": "نوع التمرين", "Stamina": "التحمل", "No bar needed. Week {n} suggests Phase {n}. Move up when an exercise shows “Ready for the next step”.": "بدون عقلة. الأسبوع {n} يقترح المرحلة {n}. انتقل لما يظهر “جاهز للخطوة التالية”.",
  "Phase": "المرحلة", "Phase {n}": "المرحلة {n}", "Session done": "الحصة انتهت", "Set {n}": "مجموعة {n}", "+ set": "+ مجموعة", "Start hold timer": "ابدأ مؤقت الثبات", "Rest {n} s": "راحة {n} ث", "Form video": "فيديو الأداء",
  "No previous session yet": "لا توجد حصة سابقة", "Ready for the next step": "جاهز للخطوة التالية", "Finish session": "إنهاء الحصة", "Session marked done": "تم تعليم الحصة", "Session logged. Training is ticked for today.": "تم تسجيل الحصة وتعليم تمرين اليوم.",
  "Push-up": "ضغط", "Table row": "سحب تحت الترابيزة", "Chair dip": "غطس على الكرسي", "Hollow body hold": "ثبات الجسم المجوّف", "Plank": "بلانك", "Pike push-up": "ضغط بايك", "L-sit": "جلسة L", "Wall handstand": "وقوف على اليدين على الحائط", "Explosive table row": "سحب انفجاري تحت الترابيزة", "Freestanding handstand": "وقوف على اليدين حر", "Superman hold": "ثبات سوبرمان", "Bridge hold": "ثبات الجسر", "Planche lean": "ميل البلانش",
  "Chest · Triceps": "صدر · تراي", "Back · Biceps": "ظهر · باي", "Core": "البطن", "Shoulders": "الأكتاف", "Core · Hip flexors": "البطن · قابضات الورك", "Shoulders · Core": "الأكتاف · البطن", "Back · Power": "ظهر · قوة انفجارية", "Back · Core": "ظهر · بطن", "Shoulders · Chest": "أكتاف · صدر",
  "Top": "أعلى", "Bottom": "أسفل", "Hang": "تعلّق", "Chest to table": "الصدر للترابيزة", "Arms straight": "الذراعان مفرودتان", "Lowered": "نزول", "Hold": "ثبات", "Hold · face up": "ثبات · الوجه لأعلى", "Hold · face down": "ثبات · الوجه لأسفل", "Hips high": "الحوض عالي", "Head down": "الرأس لأسفل", "Lower slow": "انزل ببطء", "Pull fast": "اسحب بسرعة",
  "Push-up start": "بداية الضغط", "Push-up finish": "نهاية الضغط", "Table row start": "بداية السحب", "Table row finish": "نهاية السحب", "Chair dip start": "بداية الغطس", "Chair dip finish": "نهاية الغطس", "Pike push-up start": "بداية ضغط بايك", "Pike push-up finish": "نهاية ضغط بايك", "Explosive table row start": "بداية السحب الانفجاري", "Explosive table row finish": "نهاية السحب الانفجاري",
  "Body straight from head to heels. Lower until your chest is just above the floor. At {n}×{n} clean, move to diamond, then archer push-ups.": "الجسم مستقيم من الرأس للكعب. انزل حتى يقترب صدرك من الأرض. عند {n}×{n} نظيفة، انتقل لضغط الماسة ثم ضغط الرامي.",
  "Lie under a sturdy table, grip the edge, heels on the floor. Squeeze your shoulder blades and pull your chest up to the edge.": "استلقِ تحت ترابيزة متينة، امسك الحافة والكعبان على الأرض. اضغط لوحي الكتف واسحب صدرك للحافة.",
  "Hands on the front edge of a chair, legs out. Bend your elbows straight back until upper arms are level. Feet up on a second chair to progress.": "اليدان على حافة الكرسي والرجلان ممدودتان. اثنِ الكوعين للخلف حتى يستوي العضد. ارفع رجليك على كرسي آخر للتطور.",
  "On your back, press your lower back into the floor, lift shoulders and legs, arms overhead. Bend the knees if your back lifts.": "على ظهرك، اضغط أسفل ظهرك في الأرض، ارفع الكتفين والرجلين والذراعين فوق الرأس. اثنِ الركبتين لو ظهرك ارتفع.",
  "Forearms under shoulders, straight line from head to heels. Squeeze glutes so the hips don’t sag.": "الساعدان تحت الكتفين وخط مستقيم من الرأس للكعب. اشدّ المؤخرة حتى لا يهبط الحوض.",
  "Hips high in an upside-down V. Lower the top of your head toward the floor between your hands, then press back up.": "الحوض عالي على شكل V مقلوب. انزل بأعلى رأسك نحو الأرض بين يديك ثم ادفع لأعلى.",
  "Hands beside your hips, push the floor away and lift your body. Start with knees tucked, then one leg out, then both.": "اليدان بجانب الحوض، ادفع الأرض وارفع جسمك. ابدأ بالركبتين مضمومتين ثم رجل ممدودة ثم الاثنتين.",
  "Walk your feet up the wall, hands close to it. Arms locked, body straight, core tight. {n} to {n} sets.": "اطلع برجليك على الحائط واليدان قريبتان منه. الذراعان مفرودتان والجسم مستقيم والبطن مشدودة. {n} إلى {n} مجموعات.",
  "Same setup as the table row. Pull up as fast as you can, then take {n} seconds to lower.": "نفس وضع السحب تحت الترابيزة. اسحب بأسرع ما يمكن ثم انزل في {n} ثوانٍ.",
  "Kick up away from the wall. Balance with your fingers. Practice bailing out sideways first. {n} to {n} attempts.": "اقفز لأعلى بعيدًا عن الحائط. وازن بأصابعك. تدرّب على الخروج الجانبي أولًا. {n} إلى {n} محاولات.",
  "Face down, lift chest, arms and legs off the floor together. Squeeze glutes, keep your neck long.": "على بطنك، ارفع الصدر والذراعين والرجلين معًا. اشدّ المؤخرة وحافظ على رقبتك ممدودة.",
  "On your back, hands by your ears, feet flat. Push your hips up and straighten your arms as far as is comfortable.": "على ظهرك، اليدان بجانب الأذنين والقدمان على الأرض. ادفع الحوض لأعلى وافرد ذراعيك قدر الراحة.",
  "Push-up position with hands turned out. Lean your shoulders forward past your hands, arms locked. Progress to tuck planche.": "وضع الضغط واليدان للخارج. مِل بكتفيك للأمام بعد يديك والذراعان مفرودتان. تطور إلى تاك بلانش.",
  "Stamina · week {n}": "التحمل · الأسبوع {n}", "Bonus · never breaks the streak": "إضافي · لا يكسر السلسلة", "Base phase.": "مرحلة الأساس.", "Build phase.": "مرحلة البناء.", "Push phase.": "مرحلة الدفع.",
  "Conversational pace: you can talk in full sentences. Incline treadmill, bike, rower or elliptical after lifting.": "سرعة تسمح بالكلام بجمل كاملة. مشاية بميل أو عجلة أو تجديف أو إليبتكال بعد الحديد.",
  "Two easy sessions plus one interval session. Hard = you can only say a few words. Warm up {n} min first.": "حصتان سهلتان وحصة إنترفال. قوي = تقدر تقول كلمات قليلة فقط. سخّن {n} دقائق أولًا.",
  "Easy · {n}–{n} min": "سهل · {n}–{n} دقيقة", "Intervals · {n} × {n} min hard / {n} min easy": "إنترفال · {n} × {n} دقيقة قوي / {n} دقيقة سهل", "Session {n}": "الحصة {n}",
  "Stamina streak:": "سلسلة التحمل:", "full weeks": "أسابيع كاملة", "Days: Mon, Wed, Fri": "الأيام: اثن، أرب، جمع", "Log a session": "سجّل حصة", "Machine": "الجهاز", "Easy ": "سهل", "Intervals": "إنترفال", "{n}-min test": "اختبار {n} دقيقة", "Distance (km, for tests)": "المسافة (كم، للاختبارات)",
  "Save session for today": "احفظ الحصة لليوم", "Save session for yesterday": "احفظ الحصة لأمس", "Stamina progress": "تقدم التحمل", "Cardio minutes per week": "دقائق الكارديو أسبوعيًا", "Latest {n}-min test": "آخر اختبار {n} دقيقة",
  "Incline treadmill": "مشاية بميل", "Bike": "عجلة", "Rower": "تجديف", "Elliptical": "إليبتكال", "Stair climber": "سلالم", "Outdoor walk": "مشي بالخارج",

  // progress
  "Last {n} days": "آخر {n} أيام", "{n} / {n} locked in": "{n} / {n} مكتمل", "Nothing missed": "لا شيء فائت", "Most missed ({n} day)": "الأكثر فواتًا ({n} يوم)", "Most missed ({n} days)": "الأكثر فواتًا ({n} أيام)",
  "Avg protein": "متوسط البروتين", "Avg protein · plan {n} g": "متوسط البروتين · الخطة {n} جم", "Avg calories": "متوسط السعرات", "Avg calories · plan {n}": "متوسط السعرات · الخطة {n}", "Avg sleep": "متوسط النوم",
  "Weight trend ({n}-day avg)": "اتجاه الوزن (متوسط {n} أيام)", "Activity": "النشاط",
  "Sports and cardio, as moderate-effort minutes (hard minutes count double). The WHO recommends {n}–{n} a week on top of strength training.": "الرياضة والكارديو كدقائق مجهود متوسط (الدقائق القوية تُحسب مضاعفة). توصي منظمة الصحة العالمية بـ{n}–{n} دقيقة أسبوعيًا بجانب تمارين القوة.",
  "Send coach report (image)": "أرسل تقرير الكابتن (صورة)", "As text": "كنص", "Days locked in": "أيام مكتملة", "Best streak": "أفضل سلسلة", "Perfect weeks": "أسابيع كاملة",
  "The chain": "السلسلة", "Tap a day to see it": "اضغط على يوم لعرضه", "Milestones": "الإنجازات", "Attempts": "المحاولات", "Attempt {n}": "المحاولة {n}", "{n} days and counting": "{n} أيام ومستمر", "{n} day and counting": "{n} يوم ومستمر",
  "Since start": "منذ البداية", "This week": "هذا الأسبوع", "To goal": "للهدف", "Weight trend": "اتجاه الوزن",
  "Log your morning weight in Today, or a weekly check-in below. The trend appears after two weigh-ins.": "سجّل وزن الصباح في اليوم أو في المتابعة الأسبوعية بالأسفل. يظهر الاتجاه بعد وزنتين.",
  "Dots are single weigh-ins (green = a new lowest). The line is the {n}-day average, which is the number to trust.": "النقاط وزنات فردية (الأخضر = أقل وزن جديد). الخط هو متوسط {n} أيام، وهو الرقم الذي يُعتمد عليه.",
  "Goal {n} kg is below this chart; it appears once you’re within {n} kg. Dots are single weigh-ins (green = a new lowest). The line is the {n}-day average, which is the number to trust.": "الهدف {n} كجم أسفل الرسم؛ يظهر عندما تقترب {n} كجم. النقاط وزنات فردية (الأخضر = أقل وزن جديد). الخط هو متوسط {n} أيام، وهو الرقم الذي يُعتمد عليه.",
  "A pace projection appears after about two weeks of weigh-ins.": "يظهر توقع المعدل بعد حوالي أسبوعين من الوزن.",
  "That’s faster than about {n}% of your body weight per week, which usually costs muscle. Worth raising with your coach.": "ده أسرع من حوالي {n}% من وزنك أسبوعيًا، وغالبًا يكلفك عضل. يستحق تكلم الكابتن فيه.",
  "Real burn": "الحرق الحقيقي", "Estimate": "تقدير", "kcal a day": "سعرة يوميًا", "The first weeks include water weight, so this reads high at first and settles after week {n}.": "أول أسابيع فيها وزن مياه، فالرقم يبدأ عاليًا ويستقر بعد الأسبوع {n}.",
  "Calories per day. The orange bar is today. Average of logged days: {n} kcal.": "السعرات يوميًا. العمود البرتقالي هو اليوم. متوسط الأيام المسجلة: {n} سعرة.", "Calories per day. The orange bar is today.": "السعرات يوميًا. العمود البرتقالي هو اليوم.",
  "Insights": "ملاحظات ذكية", "Patterns from your own data appear after about {n} weeks. Log sleep and energy in Body & notes to unlock the sleep ones.": "تظهر الأنماط من بياناتك بعد حوالي {n} أسابيع. سجّل النوم والطاقة في الجسم والملاحظات لفتح ملاحظات النوم.",
  "No strong patterns yet. Keep logging sleep and energy; insights show up when the difference is real.": "لا توجد أنماط قوية بعد. استمر في تسجيل النوم والطاقة؛ الملاحظات تظهر لما يكون الفرق حقيقي.",
  "After {n}+ hours of sleep you lock in {n}% of days, vs {n}% after less.": "بعد {n}+ ساعات نوم تكمل {n}% من الأيام، مقابل {n}% بعد نوم أقل.",
  "Your energy averages {n}/{n} after {n}+ hours of sleep and {n}/{n} after less.": "متوسط طاقتك {n}/{n} بعد {n}+ ساعات نوم و{n}/{n} بعد نوم أقل.",
  "Days you tap “Commit”: {n}% locked in, vs {n}% when you skip it.": "الأيام اللي بتضغط فيها “ألتزم”: {n}% مكتملة، مقابل {n}% لما بتتخطاها.",
  "Water is what breaks most of your days ({n} of {n} missed days).": "المياه هي أكثر ما يكسر أيامك ({n} من {n} أيام فائتة).", "Meals is what breaks most of your days ({n} of {n} missed days).": "الوجبات هي أكثر ما يكسر أيامك ({n} من {n} أيام فائتة).",
  "Training is what breaks most of your days ({n} of {n} missed days).": "التمرين هو أكثر ما يكسر أيامك ({n} من {n} أيام فائتة).", "Supplements is what breaks most of your days ({n} of {n} missed days).": "المكملات هي أكثر ما يكسر أيامك ({n} من {n} أيام فائتة).",
  "You hit your protein target on {n} of {n} logged days.": "حققت هدف البروتين في {n} من {n} أيام مسجلة.",
  "Weekly check-in": "المتابعة الأسبوعية", "Same time, same light": "نفس الوقت ونفس الإضاءة", "Weight (kg)": "الوزن (كجم)", "Waist (cm)": "الوسط (سم)", "Chest (cm)": "الصدر (سم)", "Arm (cm)": "الذراع (سم)", "Hips (cm)": "الأرداف (سم)",
  "Progress photo": "صورة التقدم", "Take or choose a photo": "التقط أو اختر صورة", "Save check-in": "احفظ المتابعة", "Check-in saved.": "حُفظت المتابعة.", "Waist": "الوسط", "Chest": "الصدر", "Arm": "الذراع", "Hips": "الأرداف",
  "Add next week’s photo to unlock the before/after slider.": "أضف صورة الأسبوع القادم لفتح مقارنة قبل/بعد.", "{n} → {n} cm": "{n} ← {n} سم",
  "Day {n} recap": "ملخص اليوم {n}", "Share recap": "شارك الملخص", "Water drunk": "المياه المشروبة", "Training days · {n} min cardio": "أيام التمرين · {n} دقيقة كارديو",
  "Previous": "السابق", "Sports:": "الرياضة:", "Calisthenics:": "كاليسثنكس:", "Supplements:": "المكملات:", "Weight:": "الوزن:", "Sleep:": "النوم:", "Energy:": "الطاقة:", "none required": "غير مطلوب", "Not part of the plan": "ليست ضمن الخطة",

  // setup
  "Water goal": "هدف المياه", "Start weight (kg)": "وزن البداية (كجم)", "Goal weight (kg)": "الوزن المستهدف (كجم)", "Age (optional)": "العمر (اختياري)", "for heart-rate calories": "لحساب السعرات بالنبض",
  "Calorie formula": "معادلة السعرات", "Male": "ذكر", "Female": "أنثى", "Sex for calorie formula": "الجنس لمعادلة السعرات", "Usual gym time": "وقت الجيم المعتاد",
  "Meal plan": "خطة الوجبات", "Which plan": "أي خطة", "Normal days": "الأيام العادية", "Ramadan": "رمضان", "Meal name": "اسم الوجبة", "Move up": "لأعلى", "Move down": "لأسفل", "Delete meal": "احذف الوجبة", "Tap again to delete": "اضغط مرة أخرى للحذف", "+ Add a meal": "+ إضافة وجبة",
  "Your coach’s plan, in cooked weights. Add the foods and grams for each meal; the totals become your daily calorie and protein targets. When your coach changes it, edit it here: the change applies from today, and earlier days keep the plan they had.": "خطة الكابتن بأوزان مطبوخة. أضف الأطعمة والجرامات لكل وجبة؛ المجموع يصبح هدف السعرات والبروتين اليومي. لما الكابتن يغيّرها عدّلها هنا: التغيير يبدأ من اليوم والأيام السابقة تحتفظ بخطتها.",
  "Your meal plan (from your coach, or your own), in cooked weights. Add the foods and grams for each meal; the totals become your daily calorie and protein targets. When your coach changes it, edit it here: the change applies from today, and earlier days keep the plan they had.": "خطة وجباتك (من الكابتن أو خطتك) بأوزان مطبوخة. أضف الأطعمة والجرامات لكل وجبة؛ المجموع يصبح هدف السعرات والبروتين اليومي. لما تتغير عدّلها هنا: التغيير يبدأ من اليوم والأيام السابقة تحتفظ بخطتها.",
  "Weekly shopping list ({n} days of this plan)": "قائمة مشتريات الأسبوع ({n} أيام من الخطة)", "Meat is shown as raw weight to buy, rice and pasta as dry weight.": "اللحوم بالوزن النيء للشراء، والأرز والمكرونة بالوزن الجاف.",
  "Plan history ({n} versions)": "سجل الخطة ({n} نسخ)",
  "Ramadan mode": "وضع رمضان", "During Ramadan the app switches to your Ramadan meal plan (Suhoor, Iftar, after Taraweeh), paces water between iftar and fajr, and moves the water reminders to the evening. Expected dates: {n} Feb – {n} Mar {n} (astronomical estimate; change them once confirmed).": "في رمضان يتحول التطبيق لخطة وجبات رمضان (سحور، إفطار، بعد التراويح)، ويوزّع المياه بين الإفطار والفجر، وينقل تذكيرات المياه للمساء. التواريخ المتوقعة: {n} فبراير – {n} مارس {n} (تقدير فلكي؛ عدّلها بعد التأكيد).",
  "First day": "أول يوم", "Last day": "آخر يوم", "Iftar (Maghrib)": "الإفطار (المغرب)", "Fajr (fast starts)": "الفجر (بداية الصيام)", "Edit the Ramadan meal plan": "عدّل خطة وجبات رمضان",
  "Iftar moves from about {n}:{n} to {n}:{n} in Cairo over the month; update it weekly so the countdown and water pace stay right.": "موعد الإفطار يتحرك من حوالي {n}:{n} إلى {n}:{n} في القاهرة خلال الشهر؛ حدّثه أسبوعيًا ليظل العد التنازلي ومعدل المياه صحيحين.",
  "Ramadan mode on. Add your Ramadan meal plan below.": "وضع رمضان مفعّل. أضف خطة وجبات رمضان بالأسفل.", "Ramadan mode off.": "وضع رمضان متوقف.",
  "Ramadan · day {n}": "رمضان · اليوم {n}", "Iftar time. Ramadan Kareem": "موعد الإفطار. رمضان كريم", "Iftar in {n} h {n} min": "الإفطار بعد {n} س {n} د", "Suhoor: fast starts at {n}:{n}": "السحور: الصيام يبدأ {n}:{n}",
  "Fasting now. Water and meals start counting again at iftar.": "صائم الآن. المياه والوجبات تبدأ تُحسب عند الإفطار.",
  "Drinking window: spread your water from iftar to suhoor, about {n} ml every {n}–{n} minutes. Best gym time: {n}–{n} minutes before iftar (light) or {n}–{n} hours after it (heavy).": "نافذة الشرب: وزّع المياه من الإفطار للسحور، حوالي {n} مل كل {n}–{n} دقيقة. أفضل وقت للجيم: {n}–{n} دقيقة قبل الإفطار (خفيف) أو {n}–{n} ساعة بعده (ثقيل).",
  "Drinking window: spread your water from iftar to suhoor, about {n} ml every {n}–{n} minutes.": "نافذة الشرب: وزّع المياه من الإفطار للسحور، حوالي {n} مل كل {n}–{n} دقيقة.",
  "Set up Ramadan mode": "إعداد وضع رمضان", "Set it up": "اضبطه", "Switch to a Suhoor / Iftar meal plan and evening water reminders for the month, without breaking your streak.": "انتقل لخطة سحور/إفطار وتذكيرات مياه مسائية طوال الشهر، دون كسر سلسلتك.",
  "Weekly training": "التمرين الأسبوعي", "What counts as training each day. Tick gym days on Today after you log the workout in Lyfta.": "ما يُحسب تمرينًا كل يوم. علّم أيام الجيم في اليوم بعد تسجيل التمرين في Lyfta.",
  "Stamina track": "برنامج التحمل", "Bonus": "إضافي", "Show stamina reminders": "إظهار تذكيرات التحمل", "Cardio days (after lifting)": "أيام الكارديو (بعد الحديد)",
  "Core ones are required for the day to count. Timing changes with your gym time.": "الأساسية مطلوبة ليُحسب اليوم. المواعيد تتغير حسب وقت الجيم.", "Add a supplement": "أضف مكملًا", "Quick add": "إضافة سريعة",
  "+ Creatine": "+ كرياتين", "+ Omega {n}": "+ أوميجا {n}", "+ Multivitamin": "+ ملتي فيتامين", "+ Vitamin D": "+ فيتامين د", "+ Whey protein": "+ واي بروتين", "+ Magnesium": "+ ماغنسيوم", "Morning gym day": "يوم جيم صباحي", "Night gym day": "يوم جيم ليلي",
  "Reminders": "التذكيرات", "Your ntfy topic": "موضوع ntfy الخاص بك", "Subscribe to this exact name in the ntfy app. Treat it like a password. Leave it empty and no reminders are sent.": "اشترك بنفس الاسم بالضبط في تطبيق ntfy. تعامل معه ككلمة سر. لو تركته فارغًا لن تُرسل تذكيرات.",
  "Sent to the ntfy app on your phone. Each one checks your day first and stays quiet if there’s nothing to do. Times can run {n} to {n} minutes late.": "تُرسل لتطبيق ntfy على هاتفك. كل تذكير يراجع يومك أولًا ويسكت لو مفيش حاجة مطلوبة. قد تتأخر المواعيد {n} إلى {n} دقيقة.",
  "{n}:{n} · Plan for the day": "{n}:{n} · خطة اليوم", "Every {n} h, {n}:{n}–{n}:{n} · Water pace (only if behind)": "كل {n} س، {n}:{n}–{n}:{n} · معدل المياه (فقط لو متأخر)", "{n}:{n} · Fat burner cutoff (only if cap {n} taken)": "{n}:{n} · آخر موعد لحارق الدهون (فقط لو أخذت الكبسولة {n})",
  "{n}:{n} · Stamina session (stamina days, if not done)": "{n}:{n} · حصة التحمل (أيام التحمل، لو لم تتم)", "{n}:{n} · What’s still missing": "{n}:{n} · ما زال ناقصًا", "{n}:{n} · Last hour warning (only if incomplete)": "{n}:{n} · تحذير الساعة الأخيرة (فقط لو ناقص)",
  "{n} min after each meal time · Log reminder (off by default)": "{n} دقيقة بعد كل وجبة · تذكير بالتسجيل (متوقف افتراضيًا)",
  "Vibration on taps": "اهتزاز عند الضغط", "Vibration": "الاهتزاز", "Language": "اللغة", "Export backup": "تصدير نسخة احتياطية", "Import backup": "استيراد نسخة احتياطية", "Sign out": "تسجيل الخروج",
  "Restart challenge": "إعادة بدء التحدي", "Restart": "إعادة البدء", "Starts a fresh {n} days from today and clears the attempt history. Logged days stay saved.": "يبدأ {n} يومًا جديدة من اليوم ويمسح سجل المحاولات. الأيام المسجلة تبقى محفوظة.",
  "Your daily calorie and protein targets come from the meal plan automatically.": "أهداف السعرات والبروتين اليومية تأتي من خطة الوجبات تلقائيًا.", "Estimate ": "تقدير",
  "Resting heart rate · log it in Body & recovery": "نبض الراحة · سجّله في الجسم والملاحظات",
  // extra entries found by the coverage check
  "Water at {n} of {n} L": "المياه {n} من {n} لتر", "Log your {n} meals": "سجّل وجباتك الـ{n}", "{n} of {n} core": "{n} من {n} أساسي", "{n} of {n} core ·": "{n} من {n} أساسي ·", "{n} of {n} days locked in": "{n} من {n} أيام مكتملة",
  "{n}L": "{n} ل", "{n} × {n}–{n} s": "{n} × {n}–{n} ث", "{n} × {n}–{n}": "{n} × {n}–{n}", "{n} h ·": "{n} س ·", "{n}-day avg {n} kg": "متوسط {n} أيام {n} كجم", "Lowest": "الأقل",
  "Average heart rate (optional)": "متوسط النبض (اختياري)", "Evening": "المساء", "Started": "البداية", "W{n}": "أ{n}", "e.g. {n}": "مثلًا {n}", "e.g. bar = {n} or bottle = {n}": "مثلًا bar = {n} أو bottle = {n}",
  "waist {n}": "الوسط {n}", "chest {n}": "الصدر {n}", "arm {n}": "الذراع {n}", "hips {n}": "الأرداف {n}", "· {n} min": "· {n} دقيقة", "−{n} kg": "−{n} كجم", "-{n} kg": "-{n} كجم", "+{n} kg": "+{n} كجم",

  // toasts
  "Add a measurement or a photo first.": "أضف قياسًا أو صورة أولًا.", "Add at least one ingredient.": "أضف مكوّنًا واحدًا على الأقل.", "Backup saved to your downloads.": "حُفظت النسخة في التنزيلات.",
  "Barcode lookup needs internet.": "البحث بالباركود يحتاج إنترنت.", "Couldn’t read that file.": "تعذّرت قراءة الملف.", "Couldn’t read that photo. Try a JPG or PNG.": "تعذّرت قراءة الصورة. جرّب JPG أو PNG.",
  "Couldn’t save the check-in.": "تعذّر حفظ المتابعة.", "Couldn’t save the photo.": "تعذّر حفظ الصورة.", "Couldn’t share from here.": "تعذّرت المشاركة من هنا.", "Couldn’t share the recap.": "تعذّرت مشاركة الملخص.",
  "Creating a group needs internet.": "إنشاء مجموعة يحتاج إنترنت.", "Enter how many minutes you played.": "أدخل عدد الدقائق التي لعبتها.", "Enter the distance you covered in the {n} minutes.": "أدخل المسافة التي قطعتها في {n} دقيقة.",
  "Enter the finished dish weight.": "أدخل وزن الطبق النهائي.", "Enter the minutes.": "أدخل الدقائق.", "Enter your email and a password.": "أدخل بريدك وكلمة مرور.", "Fresh start. Day {n} is today.": "بداية جديدة. اليوم {n} هو اليوم.",
  "Friends board refused the update. The Firestore rules need publishing.": "لوحة الأصدقاء رفضت التحديث. يجب نشر قواعد Firestore.", "Give the food a name.": "اكتب اسم الطعام.", "Give the recipe a name.": "اكتب اسم الوصفة.",
  "Google sign-in doesn’t work in this browser. Use email sign-in below.": "الدخول بـGoogle لا يعمل في هذا المتصفح. استخدم البريد بالأسفل.", "Google sign-in failed. Try email sign-in below.": "فشل الدخول بـGoogle. جرّب البريد بالأسفل.",
  "Group codes are {n} letters and numbers.": "كود المجموعة {n} حروف وأرقام.", "Image saved. Send it from your gallery.": "حُفظت الصورة. أرسلها من المعرض.", "Invite copied. Paste it in WhatsApp.": "نُسخت الدعوة. الصقها في واتساب.",
  "Joined. Your friends can see you now.": "انضممت. أصدقاؤك يرونك الآن.", "Joining a group needs internet.": "الانضمام لمجموعة يحتاج إنترنت.", "New topic created. Subscribe to it in ntfy.": "تم إنشاء موضوع جديد. اشترك فيه في ntfy.",
  "No group with that code. Check it with your friend.": "لا توجد مجموعة بهذا الكود. راجعه مع صديقك.", "Online search needs internet. The built-in library works offline.": "البحث أونلاين يحتاج إنترنت. المكتبة المدمجة تعمل بدونه.",
  "Part of the import didn’t save.": "جزء من الاستيراد لم يُحفظ.", "Recap copied.": "نُسخ الملخص.", "Reset link sent. Check your email.": "أُرسل رابط إعادة التعيين. راجع بريدك.", "Session saved.": "حُفظت الحصة.",
  "Summary copied. Paste it into your chat with your coach.": "نُسخ الملخص. الصقه في محادثتك مع الكابتن.", "That file isn’t a Lock In 90 backup.": "هذا الملف ليس نسخة Lock In 90.", "That photo is too large even after shrinking. Try another.": "الصورة كبيرة حتى بعد التصغير. جرّب صورة أخرى.",
  "This address isn’t authorized in Firebase yet.": "هذا العنوان غير مصرح به في Firebase بعد.", "Type what you’re looking for first.": "اكتب ما تبحث عنه أولًا.", "Type your email above first.": "اكتب بريدك بالأعلى أولًا.", "You left the group.": "غادرت المجموعة.",
  "+{n} ml · {n} L today": "+{n} مل · {n} لتر اليوم", "+{n} L · {n} L today": "+{n} لتر · {n} لتر اليوم", "Imported {n} days.": "تم استيراد {n} أيام.", "Cheers need the updated Firestore rules (see the README).": "التشجيع يحتاج تحديث قواعد Firestore (راجع README).",
  "Couldn’t send that. Try again online.": "تعذّر الإرسال. حاول مع وجود إنترنت.", "The Firestore rules need publishing first (see the README).": "يجب نشر قواعد Firestore أولًا (راجع README).",
  "Delete": "حذف", "Check-in deleted.": "حُذفت المتابعة.", "Couldn’t delete the check-in.": "تعذّر حذف المتابعة.", "{n} g protein": "{n} جم بروتين", "{n} g carbs": "{n} جم كربوهيدرات", "{n} g fat": "{n} جم دهون", "last {n}": "آخر {n}", "e.g. {n}": "مثلًا {n}",

  // if-then, reflection, craving, focus, camera, body numbers, challenge, coach
  "If": "لو", "then": "إذن", "If…": "لو…", "Then I will…": "إذن سأقوم بـ…", "Which day": "أي يوم", "Any day": "أي يوم", "Save plan": "احفظ الخطة", "Ideas": "أفكار", "If-then plans": "خطط لو-إذن", "{n} saved": "{n} محفوظة",
  "Decide now what you’ll do in your riskiest moments. Plans tied to a weekday show up on Today that day; “any day” plans show in the craving tool.": "قرر الآن ماذا ستفعل في أخطر لحظاتك. الخطط المرتبطة بيوم تظهر في اليوم نفسه؛ وخطط “أي يوم” تظهر في أداة الرغبة.",
  "e.g. there’s koshari at family lunch": "مثلًا فيه كشري في عزومة العيلة", "e.g. eat my plan first and take one small plate": "مثلًا آكل خطتي الأول وآخد طبق صغير",
  "there’s a family lunch or an invitation": "فيه عزومة أو غدا عائلي", "I eat out with friends": "باكل برا مع أصحابي", "I get hungry late at night": "بجوع بالليل متأخر", "there are sweets at work or a birthday": "فيه حلويات في الشغل أو عيد ميلاد", "it’s a travel day": "يوم سفر", "I’m too tired to train": "تعبان ومش قادر أتمرن",
  "I eat my plan portion first, take one small plate and skip seconds": "آكل حصتي من الخطة الأول، وآخد طبق صغير ومفيش طبق تاني", "I order grilled protein with salad and drink water or zero soda": "أطلب بروتين مشوي مع سلطة وأشرب مياه أو صودا زيرو",
  "I drink 500 ml of water and have my planned snack, or wait 10 minutes": "أشرب 500 مل مياه وآكل السناك المخطط، أو أستنى 10 دقايق", "I say “no thanks, I’m on a challenge” and have tea or coffee": "أقول “لا شكرًا، أنا في تحدي” وأشرب شاي أو قهوة",
  "I pack my meals and supplements the night before": "أجهز وجباتي ومكملاتي من الليلة اللي قبلها", "I do the warm-up only; if I still want to stop after 10 minutes, I can": "أعمل الإحماء بس؛ ولو لسه عايز أوقف بعد 10 دقايق، أوقف",
  "Fill in both the “if” and the “then”.": "اكتب “لو” و“إذن” الاثنين.", "Plan saved.": "حُفظت الخطة.", "Plan saved. Edit it any time in Setup.": "حُفظت الخطة. عدّلها في أي وقت من الإعدادات.",
  "Yesterday didn’t count": "أمس لم يُحسب", "What got in the way?": "إيه اللي وقفك؟", "One tap. No judgement: it’s data for your next plan.": "نقرة واحدة. بدون لوم: دي بيانات لخطتك الجاية.", "Skip": "تخطي",
  "Social event": "مناسبة اجتماعية", "Travel": "سفر", "Hunger or cravings": "جوع أو رغبة", "No time": "مفيش وقت", "Forgot to log": "نسيت أسجل", "Low motivation": "حماس قليل", "Sick": "مريض", "Other": "أخرى",
  "Plan for next time": "خطة للمرة الجاية", "Save this if-then plan": "احفظ خطة لو-إذن دي", "No thanks": "لا شكرًا",
  "Craving": "رغبة", "🌊 Craving? Wait 10 minutes": "🌊 رغبة؟ استنى 10 دقايق", "Give it 10 minutes before you decide. Most cravings pass on their own.": "اديها 10 دقايق قبل ما تقرر. أغلب الرغبات بتعدي لوحدها.",
  "Sweets": "حلويات", "Fast food": "أكل سريع", "Salty snacks": "سناكس مالحة", "Bread or carbs": "عيش أو نشويات", "Soda or juice": "مشروبات غازية أو عصير", "Something else": "حاجة تانية", "How strong": "قوتها", "Strength": "القوة",
  "Start the 10-minute wait": "ابدأ انتظار الـ10 دقايق", "+ 500 ml water": "+ 500 مل مياه", "Your plans": "خططك", "It passed": "عدّت", "I’m going to eat it": "هاكلها", "10 minutes done. Is it still there?": "خلصت الـ10 دقايق. لسه موجودة؟", "I still want it": "لسه عايزها",
  "Drink a big glass of water first. Thirst often feels like hunger.": "اشرب كوباية مياه كبيرة الأول. العطش كتير بيبان زي الجوع.", "Breathe in for 4, out for 6. Do it five times.": "شهيق 4 وزفير 6. كررها 5 مرات.",
  "Notice where you feel the craving. Name it; don’t fight it.": "لاحظ فين حاسس بالرغبة. سمّيها؛ متحاربهاش.", "Cravings rise and fall like a wave. Most fade within 10 to 15 minutes.": "الرغبات بتطلع وتنزل زي الموجة. أغلبها بيختفي في 10 لـ15 دقيقة.",
  "Ask yourself: what would Day 90 me do right now?": "اسأل نفسك: أنا في اليوم 90 كنت هعمل إيه دلوقتي؟", "Craving beaten. That’s a real win.": "غلبت الرغبة. ده انتصار حقيقي.", "Okay. Log it honestly so the day stays accurate.": "تمام. سجّلها بصدق عشان اليوم يفضل دقيق.",
  "Pick one extra goal for this week": "اختر هدف إضافي للأسبوع ده", "Use this": "استخدم ده", "Choose another": "اختر غيره", "This week’s focus": "تركيز الأسبوع", "Weekly focus": "تركيز الأسبوع", "Focus set for this week.": "تم ضبط تركيز الأسبوع.",
  "One extra goal on top of your four pillars. It never breaks your streak.": "هدف إضافي فوق أركانك الأربعة. عمره ما يكسر السلسلة.",
  "Sleep 7+ hours on 5 nights": "نوم 7+ ساعات في 5 ليالي", "3 cardio or sport sessions": "3 حصص كارديو أو رياضة", "Tap Commit every morning": "اضغط ألتزم كل صباح", "Weigh in on 5 mornings": "اوزن نفسك 5 صباحات", "No off-plan food all week": "مفيش أكل خارج الخطة طول الأسبوع",
  "Hit your protein target on 5 days": "حقق هدف البروتين في 5 أيام", "Write a short note every evening": "اكتب ملاحظة قصيرة كل مساء", "Use the craving tool instead of giving in": "استخدم أداة الرغبة بدل ما تستسلم",
  "📷 Take with photo guide": "📷 صوّر بدليل الصورة", "Choose a photo": "اختر صورة", "Photo ready (camera). Tap Save check-in.": "الصورة جاهزة (كاميرا). اضغط احفظ المتابعة.",
  "Stand 2–3 m away, same spot and light every week": "قف على بعد 2–3 متر، نفس المكان والإضاءة كل أسبوع", "Switch camera": "تبديل الكاميرا", "Timer: {n} s": "المؤقت: {n} ث", "Timer: off": "المؤقت: متوقف", "Take photo": "التقط الصورة",
  "Photo taken. Tap Save check-in to keep it.": "تم التصوير. اضغط احفظ المتابعة للاحتفاظ بها.", "Camera permission was refused. Allow the camera for this app, or choose a photo instead.": "تم رفض إذن الكاميرا. اسمح للكاميرا أو اختر صورة بدلًا من ذلك.",
  "Neck (cm)": "الرقبة (سم)", "Neck": "الرقبة", "neck {n}": "الرقبة {n}", "Height (cm)": "الطول (سم)", "for body numbers": "لأرقام الجسم", "Sleep goal": "هدف النوم", "Bedtime": "وقت النوم", "Sleep last night · goal {n} h": "نوم أمس · الهدف {n} س",
  "Waist ÷ height": "الوسط ÷ الطول", "Body fat (estimate)": "نسبة الدهون (تقدير)", "Healthy (NICE)": "صحي (NICE)", "Increased health risk (NICE: take care)": "خطر صحي أعلى (NICE: انتبه)", "High health risk (NICE: take action)": "خطر صحي عالٍ (NICE: تصرّف)", "Below the healthy range": "أقل من المدى الصحي",
  "Under 0.5 means a waist below {n} cm": "أقل من 0.5 يعني وسط أقل من {n} سم", "Add your neck in a check-in": "أضف مقاس الرقبة في المتابعة", "≈ {n} kg fat · {n} kg lean": "≈ {n} كجم دهون · {n} كجم كتلة صافية",
  "Body fat uses the US Navy tape formula, usually within about 3–4% of a lab scan. Measure the same way every time.": "نسبة الدهون بمعادلة البحرية الأمريكية بشريط القياس، عادة في حدود 3–4% من فحص المعمل. قِس بنفس الطريقة كل مرة.",
  "Add your height in Setup (and neck in a check-in) to see your waist-to-height ratio and a body-fat estimate.": "أضف طولك في الإعدادات (والرقبة في المتابعة) لترى نسبة الوسط للطول وتقدير الدهون.",
  "Most days locked in": "أكثر أيام مكتملة", "Most water": "أكثر مياه", "Most active minutes": "أكثر دقائق نشاط", "Best average sleep": "أفضل متوسط نوم", "{n} days": "{n} أيام",
  "Coach link": "رابط الكابتن", "Sharing": "مشاركة", "Create coach link": "إنشاء رابط الكابتن", "Send to coach": "أرسل للكابتن", "Open": "افتح", "Include my daily notes": "ضمّن ملاحظاتي اليومية", "Stop sharing (the link stops working)": "إيقاف المشاركة (الرابط يتوقف)", "Tap again to stop sharing": "اضغط مرة أخرى لإيقاف المشاركة",
  "A private, read-only page for your coach: the last 14 days (meals vs plan, water, training, supplements, sleep, sports), your weight trend and measurements. It updates by itself. Anyone with the link can view it, so only send it to your coach.": "صفحة خاصة للقراءة فقط للكابتن: آخر 14 يوم (الوجبات مقابل الخطة، المياه، التمرين، المكملات، النوم، الرياضة)، واتجاه وزنك وقياساتك. بتتحدث لوحدها. أي حد معاه الرابط يقدر يشوفها، فابعته للكابتن بس.",
  "Coach link created.": "تم إنشاء رابط الكابتن.", "Coach link turned off.": "تم إيقاف رابط الكابتن.", "Link copied. Paste it to your coach.": "نُسخ الرابط. الصقه للكابتن.", "Copy the link above.": "انسخ الرابط بالأعلى.",
  "The coach link needs the updated Firestore rules (see the README).": "رابط الكابتن يحتاج تحديث قواعد Firestore (راجع README).", "{n} min before bedtime · Wind down (sleep goal)": "{n} دقيقة قبل النوم · استرخاء (هدف النوم)",
  "Avg sleep · goal met {n}/{n}": "متوسط النوم · تحقق الهدف {n}/{n}", "Wind down": "وقت الاسترخاء", "English": "English",
  "Lock In 90 · Coach view": "Lock In 90 · عرض الكابتن", "last 7 days": "آخر 7 أيام", "no plan targets": "لا توجد أهداف خطة", "Water goal hit": "تحقيق هدف المياه", "Training days": "أيام التمرين", "{n} rest days": "{n} أيام راحة", "Weight (7-day avg)": "الوزن (متوسط 7 أيام)",
  "{n} kg since start": "{n} كجم منذ البداية", "-{n} kg since start": "-{n} كجم منذ البداية", "+{n} kg since start": "+{n} كجم منذ البداية", "{n} nights logged": "{n} ليالي مسجلة", "Last 14 days": "آخر 14 يوم", "Notes": "ملاحظات", "Supps": "مكملات", "Sleep": "النوم", "Rest": "راحة",
  "Measurements": "القياسات", "Dots are weigh-ins; the line is the 7-day average.": "النقاط وزنات؛ الخط هو متوسط 7 أيام.", "Not enough weigh-ins yet.": "لا توجد وزنات كافية بعد.", "plan {n}": "الخطة {n}", "plan {n} g": "الخطة {n} جم", "goal {n} L": "الهدف {n} لتر",
  "Waist-to-height ratio: {n} (NICE: under {n} is healthy).": "نسبة الوسط للطول: {n} (NICE: أقل من {n} صحي).", "This link is missing its code. Ask for a new link.": "الرابط ناقص الكود. اطلب رابطًا جديدًا.", "This link isn’t active any more. Ask for a new one.": "الرابط لم يعد فعالًا. اطلب واحدًا جديدًا.",
  "Loading…": "جارٍ التحميل…", "Link not active": "الرابط غير فعال", "Couldn’t load right now. Check the connection and refresh.": "تعذّر التحميل الآن. تأكد من الاتصال وأعد التحميل.",
  "≈ {n} kg raw ({n} kg cooked)": "≈ {n} كجم نيء ({n} كجم مطبوخ)", "photo": "صورة", "Saved.": "تم الحفظ.",
};

// sentences that contain names or lists: [regex, Arabic builder]
const UNIT = { can: 'علبة', 'large bottle': 'زجاجة كبيرة', 'small bottle': 'زجاجة صغيرة', bottle: 'زجاجة', piece: 'قطعة', cup: 'كوب', tbsp: 'ملعقة كبيرة', tsp: 'ملعقة صغيرة', slice: 'شريحة', egg: 'بيضة', fruit: 'ثمرة', medium: 'متوسطة', loaf: 'رغيف', plate: 'طبق', bowl: 'طبق', handful: 'حفنة', scoop: 'سكوب', glass: 'كوب', sandwich: 'ساندوتش', serving: 'حصة', 'whole dish': 'الطبق كله', date: 'تمرة', portion: 'حصة', white: 'بياض', 'small box': 'علبة صغيرة', 'large box': 'علبة كبيرة', 'bar 40 g': 'لوح 40 جم', 'cup 105 g': 'كوب 105 جم', 'cup 170 g': 'كوب 170 جم' };
export const AR_PATTERNS = [

  [/^Your plan for (.+)$/, (m, t) => `خطتك ليوم ${t(m[1])}`], [/^Week (\d+) focus$/, m => `تركيز الأسبوع ${m[1]}`], [/^Suggested from your last 7 days:$/, () => 'مقترح من آخر 7 أيام:'],
  [/^This week’s challenge · (.+)$/, m => `تحدي الأسبوع · ${m[1]}`], [/^Line yourself up with your (.+) photo$/, m => `طابق وضعك مع صورة ${m[1]}`],
  [/^(.+) · Day (\d+) \/ 90$/, m => `${m[1]} · اليوم ${m[2]} / 90`], [/^Streak (\d+) · attempt (\d+) · started (.+?)( · updated (.+))?$/, m => `السلسلة ${m[1]} · المحاولة ${m[2]} · البداية ${m[3]}${m[5] ? ' · آخر تحديث ' + m[5] : ''}`],
  [/^Read-only view shared by (.+) from the Lock In 90 app\. It updates when they log\.$/, m => `عرض للقراءة فقط شاركه ${m[1]} من تطبيق Lock In 90. يتحدث عند التسجيل.`],
  [/^Your most common reason for a missed day: (.+) \((\d+) times\)\. Add an if-then plan for it in Setup\.$/, (m, t) => `أكثر سبب لفوات اليوم: ${t(m[1])} (${m[2]} مرات). أضف له خطة لو-إذن في الإعدادات.`],
  [/^You used the craving tool (\d+) times and it passed (\d+) times\.$/, m => `استخدمت أداة الرغبة ${m[1]} مرات وعدّت ${m[2]} مرات.`],
  [/^about (\d+) × (.+)$/, m => `حوالي ${m[1]} × ${UNIT[m[2]] || m[2]}`],

  [/^Group (\w+) created\. Tap Invite friends\.$/, m => `تم إنشاء المجموعة ${m[1]}. اضغط دعوة الأصدقاء.`], [/^Your group code is (\w+)$/, m => `كود مجموعتك ${m[1]}`],
  [/^(.+) added as a core supplement\. Tap “core” to make it optional\.$/, (m, t) => `أُضيف ${t(m[1])} كمكمل أساسي. اضغط “أساسي” لجعله اختياريًا.`],
  [/^(.+): finish today, you’ve got this$/, m => `${m[1]}: أكمل اليوم، تقدر`], [/^(.+) cheered you 👏$/, m => `${m[1]} شجّعك 👏`],

  [/^1 (.+?) · ([\d.]+) (ml|g)$/, m => `1 ${UNIT[m[1]] || m[1]} · ${m[2]} ${m[3] === 'ml' ? 'مل' : 'جم'}`],
  [/^(\d+) days? · broke (.+)$/, m => `${m[1]} يوم · انكسرت ${m[2]}`], [/^(.+) · attempt (\d+)$/, m => `${m[1]} · المحاولة ${m[2]}`],
  [/^Day (\d+), (.+)$/, m => `اليوم ${m[1]}، ${m[2]}`], [/^Day ([^\d].*)$/, m => `يوم ${m[1]}`], [/^Measurements since (.+)$/, m => `القياسات منذ ${m[1]}`],
  [/^App version (.+)$/, m => `إصدار التطبيق ${m[1]}`], [/^last time ([\d.]+) (g|ml)(.*)$/, m => `آخر مرة ${m[1]} ${m[2] === 'ml' ? 'مل' : 'جم'}${m[3]}`],
  [/^Plan: (.+?)( ·)?$/, (m, t) => `الخطة: ${t(m[1])}${m[2] ? ' ·' : ''}`],
  [/^Log (.+)$/, (m, t) => `سجّل ${t(m[1])}`],
  [/^Remove (.+)$/, (m, t) => `حذف ${t(m[1])}`],
  [/^Cheer (.+)$/, (m) => `شجّع ${m[1]}`], [/^Nudge (.+) to finish today$/, (m) => `نبّه ${m[1]} ليكمل اليوم`], [/^Send respect to (.+)$/, (m) => `أرسل تحية لـ${m[1]}`],
  [/^(.+) \(you\)$/, (m) => `${m[1]} (أنت)`], [/^Signed in as (.+)\.$/, (m) => `مسجّل الدخول باسم ${m[1]}.`],
  [/^Supplements: (.+)$/, (m, t) => `المكملات: ${t(m[1])}`], [/^(.+) left$/, (m, t) => `متبقٍ: ${t(m[1])}`],
  [/^Copied (.+) from (.+)$/, (m, t) => `تم نسخ ${t(m[1])} من ${m[2]}`], [/^Added (.+)$/, (m, t) => `أُضيف ${t(m[1])}`],
  [/^(.+) logged: (\d+) min, about (\d+) kcal$/, (m, t) => `تم تسجيل ${t(m[1])}: ${m[2]} دقيقة، حوالي ${m[3]} سعرة`],
  [/^New lowest weight: ([\d.]+) kg\. Down ([\d.]+) kg from your previous low\.$/, m => `أقل وزن جديد: ${m[1]} كجم. أقل بـ${m[2]} كجم من أقل وزن سابق.`],
  [/^New record on (.+): (.+) \(was (.+)\)$/, (m, t) => `رقم قياسي جديد في ${t(m[1])}: ${m[2]} (كان ${m[3]})`],
  [/^(.+)s are your hardest day: (\d+) of (\d+) locked in\. Plan them the night before\.$/, (m, t) => `أيام ${t(m[1])} هي الأصعب: ${m[2]} من ${m[3]} مكتملة. خطط لها من الليلة السابقة.`],
  [/^You eat about (\d+) kcal (more|less) on Fri\/Sat than on other days\.$/, m => `بتاكل حوالي ${m[1]} سعرة ${m[2] === 'more' ? 'أكثر' : 'أقل'} يومي الجمعة والسبت عن باقي الأيام.`],
  [/^You’re eating about ([\d,]+) kcal a day \((\d+) fully logged days\) and your weight trend is (down|up) ([\d.]+) kg a week, so your body burns roughly ([\d,]+) kcal a day: a (deficit|surplus) of about ([\d,]+) kcal a day\.$/,
    m => `بتاكل حوالي ${m[1]} سعرة يوميًا (${m[2]} أيام مسجلة بالكامل) ووزنك ${m[3] === 'down' ? 'ينزل' : 'يزيد'} ${m[4]} كجم أسبوعيًا، يعني جسمك يحرق تقريبًا ${m[5]} سعرة يوميًا: ${m[6] === 'deficit' ? 'عجز' : 'فائض'} حوالي ${m[7]} سعرة يوميًا.`],
  [/^Pace: ([-+]?[\d.]+) kg per week\.(.*)$/, (m, t) => `المعدل: ${m[1]} كجم أسبوعيًا.${m[2].replace(/At this pace you reach ([\d.]+) kg around ([^.]+)\./, 'بهذا المعدل توصل $1 كجم حوالي $2.').replace(/Projected weight on Day (\d+): about ([\d.]+) kg\./, 'الوزن المتوقع في اليوم $1: حوالي $2 كجم.')}`],
  [/^Works out how many calories you actually burn a day from your food logs and weight trend\. Unlocks after about 2 weeks: (.+)$/, m => `يحسب السعرات التي تحرقها فعلًا يوميًا من تسجيل الأكل واتجاه الوزن. يُفتح بعد حوالي أسبوعين: ${m[1].replace('fully logged days', 'أيام مسجلة بالكامل').replace('weigh-ins over', 'وزنات خلال').replace(' days.', ' أيام.')}`],
  [/^You sweat a lot in (\d+) minutes: drink about ([\d.]+) L on top of your usual water today\.$/, m => `بتعرق كتير في ${m[1]} دقيقة: اشرب حوالي ${m[2]} لتر زيادة عن مياهك المعتادة النهارده.`],
  [/^Sports today · (\d+) min · ≈ (\d+) kcal$/, m => `رياضة اليوم · ${m[1]} دقيقة · ≈ ${m[2]} سعرة`],
  [/^Activity · (.+)$/, (m, t) => `النشاط · ${m[1].replace(/sport sessions?/, 'حصص رياضة').replace(/(\d+) min/g, '$1 دقيقة').replace('kcal', 'سعرة')}`],
  [/^(.+): (\d+) min, (.+)$/, null]
];

const FOOD_AR = {};
export function addFoodNames(foods) { foods.forEach(f => { if (!f.ar) return; FOOD_AR[f.name] = f.ar; FOOD_AR[f.name.split(',')[0].trim()] = FOOD_AR[f.name.split(',')[0].trim()] || f.ar; FOOD_AR[f.name + ' grams'] = f.ar + ' بالجرام'; }); }

function lookup(core) {
  if (AR[core] != null) return AR[core];
  if (FOOD_AR[core] != null) return FOOD_AR[core];
  const nums = []; const t = core.replace(/\d+(?:[.,]\d+)?/g, m => { nums.push(m); return '{n}'; });
  if (nums.length && AR[t] != null) { let i = 0; return AR[t].replace(/\{n\}/g, () => nums[i++] ?? ''); }
  return null;
}
function list(s) { // "A, B, C" where every part is known (a trailing amount like "170 g" is kept)
  if (!s.includes(', ')) return null;
  const parts = s.split(', '), out = parts.map(p => { const x = p.trim(), m = x.match(/^(.+?) ([\d.]+) (g|ml)$/); return lookup(x) ?? (m && lookup(m[1]) != null ? `${lookup(m[1])} ${m[2]} ${m[3] === 'ml' ? 'مل' : 'جم'}` : null); });
  return out.every(x => x != null) ? out.join('، ') : null;
}
export function trText(core) {
  if (!core || !/[A-Za-z]/.test(core)) return null;
  const r = lookup(core); if (r != null) return r;
  const l = list(core); if (l != null) return l;
  const sub = s => lookup(s) ?? list(s) ?? trText(s) ?? s;
  for (const [re, fn] of AR_PATTERNS) { if (!fn) continue; const m = core.match(re); if (m) return fn(m, sub); }
  if (core.includes(' · ')) { const parts = core.split(' · '), out = parts.map(p => { const x = p.trim(); return x ? (lookup(x) ?? list(x) ?? (x.includes(' · ') ? null : trText(x)) ?? x) : p; }); if (out.some((x, i) => x !== parts[i].trim())) return out.join(' · '); }
  return null;
}
