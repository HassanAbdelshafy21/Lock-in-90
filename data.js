// Static content: exercises and their figures, food library, defaults.

export const YT = 'https://www.youtube.com/watch?v=';

/* side-view pictograms drawn from joint points: h head, s shoulder, e elbow, w hand, p hip, k knee, f foot, c optional torso curve */
export const POSE = {
  pushupA: { h: [22, 45], s: [30, 49], e: [30, 59.5], w: [30, 70], p: [65, 57], k: [83, 62], f: [101, 68] },
  pushupB: { h: [21, 59], s: [30, 63], e: [39, 65], w: [30, 70], p: [65, 66], k: [83, 67.5], f: [101, 69] },
  rowA: { h: [25, 47], s: [33, 44], e: [32, 33], w: [31, 22], p: [68, 56], k: [88, 62], f: [108, 69] },
  rowB: { h: [26, 32], s: [35, 29], e: [41, 22], w: [31, 22], p: [70, 47], k: [90, 58], f: [108, 69] },
  dipA: { h: [43, 17], s: [42, 26], e: [40, 36], w: [37, 46], p: [46, 48], k: [70, 56], f: [96, 69] },
  dipB: { h: [45, 30], s: [44, 38], e: [34, 36], w: [37, 46], p: [48, 60], k: [72, 63], f: [96, 69] },
  hollow: { h: [32, 57], s: [40, 62], e: [26, 55], w: [13, 51], p: [60, 68], k: [80, 64], f: [101, 57], face: 'up' },
  plank: { h: [22, 53], s: [30, 56], e: [30, 69], w: [43, 69], p: [65, 60], k: [83, 64], f: [101, 68] },
  pikeA: { h: [29, 53], s: [38, 50], e: [33, 60], w: [28, 70], p: [60, 26], k: [76, 48], f: [92, 69] },
  pikeB: { h: [27, 63], s: [36, 59], e: [42, 64], w: [28, 70], p: [58, 30], k: [75, 49], f: [92, 69] },
  lsit: { h: [40, 35], s: [38, 43], e: [36, 57], w: [36, 70], p: [44, 62], k: [66, 62], f: [88, 62] },
  wallhs: { h: [86, 62], s: [82, 50], e: [81, 60], w: [80, 70], p: [94, 28], k: [98, 16], f: [102, 5] },
  freehs: { h: [65, 58], s: [60, 50], e: [60, 60], w: [60, 70], p: [60, 28], k: [60, 16], f: [60, 4] },
  superman: { h: [30, 50], s: [40, 57], e: [26, 48], w: [13, 42], p: [60, 68], k: [80, 61], f: [100, 52], face: 'down' },
  bridge: { h: [27, 55], s: [35, 50], e: [32, 60], w: [30, 70], c: [48, 26], p: [64, 38], k: [82, 52], f: [88, 70] },
  planche: { h: [34, 48], s: [42, 51], e: [46, 60.5], w: [50, 70], p: [75, 58], k: [92, 63], f: [107, 68] }
};
const PROPS = {
  floor: '<line x1="3" y1="71.5" x2="117" y2="71.5"/>',
  table: '<line x1="5" y1="18" x2="76" y2="18" stroke-width="4"/><line x1="8" y1="18" x2="8" y2="71"/>',
  chair: '<line x1="16" y1="46.5" x2="39" y2="46.5" stroke-width="4"/><line x1="18" y1="46" x2="18" y2="71"/><line x1="36" y1="46" x2="36" y2="71"/><line x1="18" y1="46" x2="18" y2="24"/>',
  wall: '<line x1="105" y1="0" x2="105" y2="71" stroke-width="4"/>'
};
export function figSVG(q, props, label) {
  const L = (a, b) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`;
  const torso = q.c ? `<path d="M${q.s} Q${q.c} ${q.p}"/>` : L(q.s, q.p);
  const face = q.face ? `<circle cx="${q.h[0]}" cy="${q.h[1] + (q.face === 'up' ? -3.2 : 3.2)}" r="1.5" fill="var(--surface-2)"/>` : '';
  return `<svg viewBox="0 0 120 76" class="fig" role="img" aria-label="${label}"><g fill="none" stroke="var(--prop)" stroke-width="2.5" stroke-linecap="round">${props.map(p => PROPS[p]).join('')}</g><g fill="none" stroke="var(--ink)" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round">${L(q.p, q.k) + L(q.k, q.f) + torso + L(q.s, q.h) + L(q.s, q.e) + L(q.e, q.w)}</g><circle cx="${q.h[0]}" cy="${q.h[1]}" r="5.4" fill="var(--ink)"/>${face}<circle cx="${q.w[0]}" cy="${q.w[1]}" r="2.6" fill="var(--spark)"/><circle cx="${q.f[0]}" cy="${q.f[1]}" r="2.6" fill="var(--spark)"/></svg>`;
}

export const EX = [
  { id: 'pushup', ph: 1, name: 'Push-up', unit: 'reps', sets: 3, lo: 8, top: 15, tag: 'Chest · Triceps', yt: 'mECzqUIDWfU', fr: ['pushupA', 'pushupB'], pr: ['floor'], lb: ['Top', 'Bottom'], cue: 'Body straight from head to heels. Lower until your chest is just above the floor. At 3×15 clean, move to diamond, then archer push-ups.' },
  { id: 'tablerow', ph: 1, name: 'Table row', unit: 'reps', sets: 3, lo: 8, top: 12, tag: 'Back · Biceps', yt: 'jjSaYXeKiNk', fr: ['rowA', 'rowB'], pr: ['table', 'floor'], lb: ['Hang', 'Chest to table'], cue: 'Lie under a sturdy table, grip the edge, heels on the floor. Squeeze your shoulder blades and pull your chest up to the edge.' },
  { id: 'dip', ph: 1, name: 'Chair dip', unit: 'reps', sets: 3, lo: 6, top: 12, tag: 'Chest · Triceps', yt: 'oVIBgopGrRQ', fr: ['dipA', 'dipB'], pr: ['chair', 'floor'], lb: ['Arms straight', 'Lowered'], cue: 'Hands on the front edge of a chair, legs out. Bend your elbows straight back until upper arms are level. Feet up on a second chair to progress.' },
  { id: 'hollow', ph: 1, name: 'Hollow body hold', unit: 's', sets: 3, lo: 15, top: 30, tag: 'Core', yt: '0yPin8hSc8o', fr: ['hollow'], pr: ['floor'], lb: ['Hold · face up'], cue: 'On your back, press your lower back into the floor, lift shoulders and legs, arms overhead. Bend the knees if your back lifts.' },
  { id: 'plank', ph: 1, name: 'Plank', unit: 's', sets: 3, lo: 30, top: 45, tag: 'Core', yt: 'mwlp75MS6Rg', fr: ['plank'], pr: ['floor'], lb: ['Hold'], cue: 'Forearms under shoulders, straight line from head to heels. Squeeze glutes so the hips don’t sag.' },
  { id: 'pike', ph: 2, name: 'Pike push-up', unit: 'reps', sets: 3, lo: 6, top: 12, tag: 'Shoulders', yt: 'pHR5yG6xBps', fr: ['pikeA', 'pikeB'], pr: ['floor'], lb: ['Hips high', 'Head down'], cue: 'Hips high in an upside-down V. Lower the top of your head toward the floor between your hands, then press back up.' },
  { id: 'lsit', ph: 2, name: 'L-sit', unit: 's', sets: 3, lo: 10, top: 20, tag: 'Core · Hip flexors', yt: 'H_iZG5-L_KI', fr: ['lsit'], pr: ['floor'], lb: ['Hold'], cue: 'Hands beside your hips, push the floor away and lift your body. Start with knees tucked, then one leg out, then both.' },
  { id: 'wallhs', ph: 2, name: 'Wall handstand', unit: 's', sets: 3, lo: 15, top: 30, tag: 'Shoulders · Core', yt: 'DpnxhxxMjNs', fr: ['wallhs'], pr: ['wall', 'floor'], lb: ['Hold'], cue: 'Walk your feet up the wall, hands close to it. Arms locked, body straight, core tight. 3 to 5 sets.' },
  { id: 'exrow', ph: 2, name: 'Explosive table row', unit: 'reps', sets: 3, lo: 5, top: 8, tag: 'Back · Power', yt: 'Fl0UMfdEzsE', fr: ['rowA', 'rowB'], pr: ['table', 'floor'], lb: ['Lower slow', 'Pull fast'], cue: 'Same setup as the table row. Pull up as fast as you can, then take 3 seconds to lower.' },
  { id: 'freehs', ph: 3, name: 'Freestanding handstand', unit: 's', sets: 5, lo: 10, top: 20, tag: 'Shoulders · Core', yt: 'FUeY-ht_8aU', fr: ['freehs'], pr: ['floor'], lb: ['Hold'], cue: 'Kick up away from the wall. Balance with your fingers. Practice bailing out sideways first. 5 to 8 attempts.' },
  { id: 'superman', ph: 3, name: 'Superman hold', unit: 's', sets: 3, lo: 15, top: 30, tag: 'Back · Core', yt: 'LZoWdePF1NQ', fr: ['superman'], pr: ['floor'], lb: ['Hold · face down'], cue: 'Face down, lift chest, arms and legs off the floor together. Squeeze glutes, keep your neck long.' },
  { id: 'bridge', ph: 3, name: 'Bridge hold', unit: 's', sets: 3, lo: 10, top: 20, tag: 'Shoulders · Chest', yt: 'TrxZLshL0Ec', fr: ['bridge'], pr: ['floor'], lb: ['Hold'], cue: 'On your back, hands by your ears, feet flat. Push your hips up and straighten your arms as far as is comfortable.' },
  { id: 'planche', ph: 3, name: 'Planche lean', unit: 's', sets: 3, lo: 8, top: 15, tag: 'Shoulders · Core', yt: '3iTGUaMPrHs', fr: ['planche'], pr: ['floor'], lb: ['Hold'], cue: 'Push-up position with hands turned out. Lean your shoulders forward past your hands, arms locked. Progress to tuck planche.' }
];

export const LINES = [
  'Finish today. Tomorrow is a separate problem.',
  'Nobody is coming to do the reps for you.',
  'The plan only works on the days you follow it.',
  'Every meal on plan is a choice you make again.',
  'Water first. It is the easiest box on the list.',
  'You don’t need motivation. You need the boxes done by midnight.',
  'Fried food lasts ten minutes. A broken streak lasts all day.',
  'Boring days done right are what 90 days are made of.',
  'Log it honestly. A fake green square is worth nothing.',
  'You already know what to eat. Eat that.',
  'Average sessions still count. Skipped ones don’t.',
  'The streak is a record of promises kept.',
  'One missed day is a slip. Two is a pattern.',
  'Discipline is just doing the next box.',
  'Do the session first. Decide how you feel about it after.'
];

/* Food library. Values per 100 g, cooked or as eaten. [id, name, kcal, protein, carbs, fat, units?, arabic?]
   Items marked (est.) are typical home or street versions and vary a lot. */
const RAW = [
  // protein
  ['chicken_breast', 'Chicken breast, cooked', 165, 31, 0, 3.6, [['piece', 150]], 'صدور فراخ'],
  ['chicken_thigh', 'Chicken thigh, cooked, no skin', 209, 26, 0, 10.9, [], 'أوراك فراخ'],
  ['chicken_fried', 'Chicken, fried with breading (est.)', 290, 23, 10, 17, [['piece', 120]], 'فراخ مقلية'],
  ['beef_lean', 'Beef, lean, cooked', 250, 26, 0, 15, [], 'لحمة'],
  ['beef_mince', 'Minced beef, cooked', 254, 26, 0, 17, [], 'لحمة مفرومة'],
  ['kofta', 'Kofta, grilled (est.)', 260, 18, 5, 19, [['piece', 40]], 'كفتة'],
  ['liver', 'Beef liver, cooked', 175, 27, 5, 4.7, [], 'كبدة'],
  ['tuna_water', 'Tuna in water, drained', 116, 26, 0, 1, [['can', 120]], 'تونة'],
  ['tuna_oil', 'Tuna in oil, drained', 198, 29, 0, 8, [['can', 120]], 'تونة بالزيت'],
  ['salmon', 'Salmon, cooked', 208, 20, 0, 13, [], 'سلمون'],
  ['tilapia', 'Tilapia (bolti), grilled', 128, 26, 0, 2.7, [], 'بلطي'],
  ['shrimp', 'Shrimp, cooked', 99, 24, 0.2, 0.3, [], 'جمبري'],
  ['egg', 'Egg, whole, boiled', 143, 12.6, 0.7, 9.5, [['egg', 50]], 'بيض'],
  ['egg_fried', 'Egg, fried in oil', 196, 13.6, 0.8, 15, [['egg', 50]], 'بيض مقلي'],
  ['egg_white', 'Egg white', 52, 10.9, 0.7, 0.2, [['white', 33]], 'بياض بيض'],
  ['turkey', 'Turkey breast slices', 104, 17, 4, 2, [['slice', 20]], 'تيركي'],
  ['whey', 'Whey protein powder', 400, 80, 8, 6, [['scoop', 30]], 'واي بروتين'],
  // dairy
  ['yogurt_light', 'Yogurt, light / low-fat', 56, 5.7, 7.7, 0.2, [['cup 105 g', 105], ['cup 170 g', 170]], 'زبادي لايت'],
  ['yogurt_full', 'Yogurt, full fat', 61, 3.5, 4.7, 3.3, [['cup 105 g', 105]], 'زبادي'],
  ['greek_yogurt', 'Greek yogurt, 0%', 59, 10.2, 3.6, 0.4, [['cup 170 g', 170]], 'زبادي يوناني'],
  ['milk_skim', 'Milk, skimmed', 34, 3.4, 5, 0.1, [['cup', 240]], 'لبن خالي الدسم'],
  ['milk_full', 'Milk, full fat', 61, 3.2, 4.8, 3.3, [['cup', 240]], 'لبن'],
  ['cottage', 'Cottage cheese', 98, 11, 3.4, 4.3, [], 'جبنة قريش'],
  ['areesh', 'Areesh cheese (est.)', 98, 14, 3.5, 3, [], 'جبنة قريش بلدي'],
  ['domiati', 'White cheese, domiati (est.)', 260, 15, 2, 21, [], 'جبنة بيضا'],
  ['feta', 'Feta cheese', 264, 14, 4, 21, [], 'فيتا'],
  ['romy', 'Romy cheese (est.)', 380, 25, 1, 30, [], 'جبنة رومي'],
  ['labneh', 'Labneh', 160, 7, 4, 13, [['tbsp', 20]], 'لبنة'],
  // carbs
  ['rice_white', 'White rice, cooked', 130, 2.7, 28, 0.3, [['cup', 160]], 'رز'],
  ['rice_brown', 'Brown rice, cooked', 112, 2.6, 23, 0.9, [['cup', 160]], 'رز بني'],
  ['pasta', 'Pasta, cooked', 158, 5.8, 31, 0.9, [['cup', 140]], 'مكرونة'],
  ['baladi', 'Baladi bread (est.)', 260, 9, 52, 1.5, [['loaf', 90]], 'عيش بلدي'],
  ['toast', 'Toast bread, white', 265, 9, 49, 3.2, [['slice', 25]], 'توست'],
  ['toast_brown', 'Toast bread, brown', 250, 12, 43, 3.5, [['slice', 28]], 'توست بني'],
  ['oats', 'Oats, dry', 389, 16.9, 66, 6.9, [['tbsp', 10], ['cup', 80]], 'شوفان'],
  ['potato', 'Potato, boiled', 87, 1.9, 20, 0.1, [['medium', 170]], 'بطاطس'],
  ['sweet_potato', 'Sweet potato, baked', 90, 2, 21, 0.2, [['medium', 150]], 'بطاطا'],
  ['fries', 'French fries (est.)', 312, 3.4, 41, 15, [['portion', 120]], 'بطاطس محمرة'],
  ['lentils', 'Lentils, cooked', 116, 9, 20, 0.4, [['cup', 200]], 'عدس'],
  ['foul', 'Foul medames, plain', 110, 7.6, 19.6, 0.4, [['plate', 200]], 'فول'],
  ['foul_oil', 'Foul with oil (est.)', 160, 7.5, 19, 6, [['plate', 200]], 'فول بالزيت'],
  ['taameya', 'Ta’ameya / falafel (est.)', 333, 13.3, 31.8, 17.8, [['piece', 25]], 'طعمية'],
  ['koshari', 'Koshary', 175, 5.5, 30, 3.5, [['small box', 350], ['medium box', 500], ['large box', 700]], 'كشري'],
  ['chickpeas', 'Chickpeas, cooked', 164, 8.9, 27, 2.6, [], 'حمص'],
  ['hummus', 'Hummus', 166, 7.9, 14, 9.6, [['tbsp', 15]], 'حمص طحينة'],
  // vegetables
  ['salad', 'Green salad, no dressing', 20, 0.9, 4, 0.2, [['bowl', 150]], 'سلطة خضرا'],
  ['cucumber', 'Cucumber', 15, 0.7, 3.6, 0.1, [['medium', 120]], 'خيار'],
  ['tomato', 'Tomato', 18, 0.9, 3.9, 0.2, [['medium', 120]], 'طماطم'],
  ['lettuce', 'Lettuce', 15, 1.4, 2.9, 0.2, [], 'خس'],
  ['broccoli', 'Broccoli, cooked', 35, 2.4, 7.2, 0.4, [], 'بروكلي'],
  ['carrot', 'Carrot', 41, 0.9, 10, 0.2, [['medium', 60]], 'جزر'],
  ['green_beans', 'Green beans, cooked', 35, 1.9, 7.9, 0.3, [], 'فاصوليا خضرا'],
  ['zucchini', 'Zucchini, cooked', 17, 1.2, 3.1, 0.3, [], 'كوسة'],
  ['spinach', 'Spinach', 23, 2.9, 3.6, 0.4, [], 'سبانخ'],
  ['molokhia', 'Molokhia, home (est.)', 60, 3, 6, 3, [['bowl', 250]], 'ملوخية'],
  ['vegetable_stew', 'Vegetable stew, home (est.)', 80, 2, 8, 4.5, [['bowl', 250]], 'خضار مطبوخ'],
  // fruit
  ['fruit_avg', 'Fruit, medium (average)', 55, 0.7, 14, 0.2, [['fruit', 150]], 'فاكهة'],
  ['apple', 'Apple', 52, 0.3, 14, 0.2, [['medium', 180]], 'تفاح'],
  ['banana', 'Banana', 89, 1.1, 23, 0.3, [['medium', 120]], 'موز'],
  ['orange', 'Orange', 47, 0.9, 12, 0.1, [['medium', 150]], 'برتقال'],
  ['guava', 'Guava', 68, 2.6, 14, 1, [['medium', 100]], 'جوافة'],
  ['mango', 'Mango', 60, 0.8, 15, 0.4, [['medium', 250]], 'مانجا'],
  ['strawberry', 'Strawberries', 32, 0.7, 7.7, 0.3, [['cup', 150]], 'فراولة'],
  ['grapes', 'Grapes', 69, 0.7, 18, 0.2, [['cup', 150]], 'عنب'],
  ['watermelon', 'Watermelon', 30, 0.6, 7.6, 0.2, [['slice', 300]], 'بطيخ'],
  ['pomegranate', 'Pomegranate', 83, 1.7, 19, 1.2, [['medium', 250]], 'رمان'],
  ['kiwi', 'Kiwi', 61, 1.1, 15, 0.5, [['medium', 75]], 'كيوي'],
  ['pear', 'Pear', 57, 0.4, 15, 0.1, [['medium', 180]], 'كمثرى'],
  ['dates', 'Dates', 282, 2.5, 75, 0.4, [['date', 8]], 'بلح'],
  // fats, seeds, extras
  ['chia', 'Chia seeds', 486, 16.5, 42, 30.7, [['tsp', 5], ['tbsp', 12]], 'بذور الشيا'],
  ['cacao', 'Cacao powder, unsweetened', 228, 19.6, 57.9, 13.7, [['tsp', 2.5], ['tbsp', 7]], 'كاكاو'],
  ['olive_oil', 'Olive oil', 884, 0, 0, 100, [['tsp', 4.5], ['tbsp', 13.5]], 'زيت زيتون'],
  ['oil', 'Vegetable oil', 884, 0, 0, 100, [['tsp', 4.5], ['tbsp', 13.5]], 'زيت'],
  ['ghee', 'Ghee', 876, 0, 0, 99.5, [['tsp', 4.5], ['tbsp', 13]], 'سمنة'],
  ['butter', 'Butter', 717, 0.9, 0.1, 81, [['tsp', 5], ['tbsp', 14]], 'زبدة'],
  ['spray', 'Cooking spray (oil)', 792, 0, 20.7, 78.7, [['1-second spray', 0.75]], 'سبراي زيت للطبخ'],
  ['tahini', 'Tahini', 595, 17, 21, 54, [['tbsp', 15]], 'طحينة'],
  ['peanut_butter', 'Peanut butter', 588, 25, 20, 50, [['tbsp', 16]], 'زبدة فول سوداني'],
  ['almonds', 'Almonds', 579, 21, 22, 50, [['handful', 28]], 'لوز'],
  ['walnuts', 'Walnuts', 654, 15, 14, 65, [['handful', 28]], 'عين جمل'],
  ['honey', 'Honey', 304, 0.3, 82, 0, [['tsp', 7]], 'عسل'],
  ['sugar', 'Sugar', 387, 0, 100, 0, [['tsp', 4]], 'سكر'],
  ['mayo', 'Mayonnaise', 680, 1, 0.6, 75, [['tbsp', 14]], 'مايونيز'],
  // drinks and treats
  ['coffee', 'Coffee, black', 2, 0.3, 0, 0, [['cup', 240]], 'قهوة'],
  ['coffee_instant', 'Instant coffee (Nescafé), made with water', 2, 0.1, 0.3, 0, [['mug', 200], ['cup', 240]], 'نسكافيه قهوة سريعة التحضير'],
  ['creamer', 'Coffee creamer, powder', 545, 4.8, 55, 35.5, [['tsp', 2], ['sachet', 5]], 'كريمر مبيض قهوة'],
  ['sweetener', 'Sweetener (tablet or drops)', 0, 0, 0, 0, [['tablet', 0.1]], 'محلي صناعي'],
  ['cinnamon', 'Cinnamon, ground', 247, 4, 80.6, 1.2, [['tsp', 2.6]], 'قرفة'],
  ['coffee_milk', 'Coffee with milk, no sugar (est.)', 25, 1.4, 2.1, 1.1, [['cup', 240]], 'قهوة باللبن'],
  ['tea', 'Tea, no sugar', 1, 0, 0.3, 0, [['cup', 240]], 'شاي'],
  ['green_tea', 'Green tea, no sugar', 1, 0, 0.2, 0, [['cup', 240]], 'شاي أخضر'],
  ['cola', 'Cola', 42, 0, 10.6, 0, [['can', 330], ['large bottle', 1000]], 'كولا'],
  ['cola_zero', 'Cola zero / diet soda', 0.4, 0, 0, 0, [['can', 330], ['small bottle', 500], ['large bottle', 1000]], 'كولا زيرو دايت'],
  ['sparkling', 'Sparkling water', 0, 0, 0, 0, [['bottle', 330]], 'مياه فوارة صودا'],
  ['juice_orange', 'Orange juice', 45, 0.7, 10.4, 0.2, [['glass', 250]], 'عصير برتقال'],
  ['shawarma', 'Chicken shawarma sandwich (est.)', 215, 12, 22, 9, [['sandwich', 250]], 'شاورما'],
  ['burger', 'Beef burger sandwich (est.)', 250, 13, 26, 11, [['sandwich', 220]], 'برجر'],
  ['pizza', 'Pizza (est.)', 266, 11, 33, 10, [['slice', 110]], 'بيتزا'],
  ['hawawshi', 'Hawawshi (est.)', 290, 13, 24, 16, [['piece', 250]], 'حواوشي'],
  ['feteer', 'Feteer meshaltet (est.)', 420, 7, 40, 26, [['slice', 100]], 'فطير مشلتت'],
  ['chocolate', 'Milk chocolate', 535, 7.7, 59, 30, [['bar 40 g', 40]], 'شوكولاتة'],
  ['basbousa', 'Basbousa (est.)', 350, 4, 55, 13, [['piece', 80]], 'بسبوسة'],
  /* Egyptian dishes: worked out from typical recipes with USDA ingredient values (see EG below) */
  ["mahshy_cabbage", "Mahshy, cabbage", 112.4, 2.1, 18, 3.7, [["roll", 30], ["plate", 300]], "محشي كرنب"],
  ["mahshy_vine", "Mahshy, vine leaves", 144, 3, 22.9, 4.8, [["piece", 12], ["plate", 250]], "ورق عنب"],
  ["mahshy_mix", "Mahshy, mixed (zucchini, eggplant, pepper)", 99.8, 2, 16.2, 3.2, [["piece", 80], ["plate", 300]], "محشي مشكل"],
  ["mombar", "Mombar", 215.7, 4.5, 23.4, 11.4, [["piece", 25], ["plate", 250]], "ممبار"],
  ["hamam", "Hamam mahshy (stuffed pigeon)", 219.7, 13, 12.8, 13.3, [["pigeon", 300]], "حمام محشي"],
  ["fattah", "Fattah with meat", 159.6, 9, 19.7, 4.8, [["plate", 400]], "فتة باللحمة"],
  ["bechamel", "Macarona béchamel", 172.3, 7.3, 18.2, 7.7, [["piece", 200], ["plate", 300]], "مكرونة بشاميل"],
  ["bamya", "Bamya with meat", 85.9, 6.6, 5.8, 4.5, [["bowl", 250]], "بامية باللحمة"],
  ["moussaka", "Mesa’a’a (eggplant)", 176.6, 4, 7, 15.4, [["plate", 250]], "مسقعة"],
  ["roz_shareya", "Rice with vermicelli", 165.5, 3, 30.7, 3, [["cup", 160], ["plate", 250]], "أرز بالشعرية"],
  ["roz_meammar", "Roz me’ammar (baked rice)", 185.1, 3.6, 27, 6.7, [["piece", 200]], "أرز معمر"],
  ["bessara", "Bessara", 99.2, 5.1, 12.2, 3.8, [["plate", 200]], "بصارة"],
  ["ads", "Lentil soup", 64, 3.7, 10.6, 1, [["bowl", 300]], "شوربة عدس"],
  ["tagen_potato", "Potato tagen with meat", 113.3, 7, 11.3, 4.6, [["plate", 300]], "طاجن بطاطس باللحمة"],
  ["goulash", "Goulash with mince", 299.9, 10.9, 21.5, 18.6, [["piece", 150]], "جلاش باللحمة"],
  ["pane", "Chicken pané", 248.4, 20.9, 10.5, 13.1, [["piece", 120]], "فراخ بانيه"],
  ["fish_fried", "Fried fish (tilapia)", 244.4, 25.4, 6, 13.3, [["fish", 200]], "سمك بلطي مقلي"],
  ["kebda", "Kebda Iskandarani (liver)", 211.2, 22, 6.9, 10.4, [["plate", 200]], "كبدة إسكندراني"],
  ["sogo2", "Sogo’ (Egyptian sausage)", 276.9, 12.1, 4.3, 23.4, [["plate", 200]], "سجق"],
  ["shakshuka", "Shakshuka", 96.8, 5.4, 3.7, 6.8, [["plate", 250]], "شكشوكة"],
  ["pastirma_egg", "Eggs with pastirma", 203.1, 17.3, 0.8, 14.2, [["plate", 150]], "بيض بالبسطرمة"],
  ["tahina_salad", "Tahina salad", 210.3, 6.1, 9.8, 18.1, [["tbsp", 15], ["small dish", 60]], "سلطة طحينة"],
  ["torshi", "Torshi (pickles)", 18, 0.8, 3.5, 0.2, [["small dish", 50]], "طرشي"],
  ["foul_sand", "Foul sandwich", 200, 8.1, 32.2, 4.2, [["sandwich", 150]], "ساندوتش فول"],
  ["taameya_sand", "Taameya sandwich", 261.1, 9.8, 34.4, 9.8, [["sandwich", 165]], "ساندوتش طعمية"],
  ["kebda_sand", "Alexandrian liver sandwich", 234.7, 16.4, 23.7, 8.3, [["sandwich", 190]], "ساندوتش كبدة إسكندراني"],
  ["sogo2_sand", "Sogo’ sandwich", 272.5, 10.6, 23.2, 15.4, [["sandwich", 180]], "ساندوتش سجق"],
  ["shawarma_plate", "Chicken shawarma plate", 162.6, 14.2, 12.6, 6.2, [["plate", 430]], "طبق شاورما فراخ"],
  ["fiteer_cheese", "Fiteer with cheese", 345.7, 9.5, 31.1, 20.3, [["quarter", 125], ["whole medium", 500]], "فطير جبنة"],
  ["fiteer_meat", "Fiteer with meat", 324.4, 9.1, 30.1, 18.4, [["quarter", 125], ["whole medium", 500]], "فطير لحمة"],
  ["kebab", "Kebab, grilled", 235, 26, 0, 14.5, [["¼ kg", 250], ["piece", 30]], "كباب"],
  ["tarb", "Tarb", 330, 18, 1, 28.5, [["piece", 50], ["¼ kg", 250]], "طرب"],
  ["shish_tawook", "Shish tawook", 165, 26, 3, 5.5, [["skewer", 150], ["¼ kg", 250]], "شيش طاووك"],
  ["grilled_chicken", "Grilled half chicken (meat only)", 230, 27, 1, 13, [["half chicken", 300]], "نص فرخة مشوية"],
  ["konafa", "Konafa", 383.9, 3.9, 44.3, 22.3, [["piece", 120]], "كنافة"],
  ["qatayef", "Qatayef, fried with nuts", 402.1, 6.4, 51.5, 20.4, [["piece", 55]], "قطايف"],
  ["om_ali", "Om Ali", 300.6, 5.2, 26.4, 20.1, [["bowl", 250]], "أم علي"],
  ["roz_laban", "Roz bel laban (rice pudding)", 139.7, 3.6, 24.4, 3.1, [["cup", 200]], "أرز باللبن"],
  ["mahalabeya", "Mahalabeya", 130, 2.8, 23.6, 2.8, [["cup", 180]], "مهلبية"],
  ["lokma", "Lokmet el qady", 396.7, 4, 69.2, 11.9, [["piece", 12], ["5 pieces", 60]], "لقمة القاضي"],
  ["kahk", "Kahk", 576, 6.2, 49.9, 39.6, [["piece", 35]], "كحك"],
  ["sahlab", "Sahlab", 149.8, 3.8, 19.9, 6.5, [["cup", 250]], "سحلب"],
  ["karkade", "Karkade, sweetened", 34, 0, 8.5, 0, [["glass", 250]], "كركديه"],
  ["qasab", "Sugarcane juice", 70, 0.2, 17.5, 0, [["glass", 300]], "عصير قصب"],
  ["sobia", "Sobia", 90, 1, 16, 2.6, [["glass", 250]], "سوبيا"],
  ["tamr_hindi", "Tamr hindi", 52, 0.2, 13, 0.1, [["glass", 250]], "تمر هندي"]
];

/* More nutrients per 100 g: [sodium mg, sugars g, saturated fat g, fiber g, potassium mg, calcium mg].
   Plain foods follow USDA FoodData Central (SR Legacy) values, cooked without added salt.
   Items marked (est.) in the library are typical Egyptian home or street versions, salted as usually served. */
const MICRO = {
  mahshy_cabbage: [265.5, 1.9, 1.2, 1.4, 150.7, 24], mahshy_vine: [320.1, 2.1, 1.5, 2.7, 162.5, 77.8], mahshy_mix: [253, 2.3, 1, 1.5, 206.9, 17.3], mombar: [388.3, 1, 3.2, 0.8, 136.9, 17.9], hamam: [373, 0.3, 5, 2.9, 195.2, 15.9], fattah: [326.2, 0.8, 2.4, 1, 200.3, 13.4], bechamel: [191.9, 2.8, 3.6, 0.9, 175.3, 50.5], bamya: [301.8, 2, 1.8, 1.9, 315.1, 41.9], moussaka: [242.9, 3.9, 2.6, 2.7, 320.2, 17.8], roz_shareya: [215.8, 0.2, 1.3, 0.6, 49, 10.7], roz_meammar: [214.3, 2.1, 4.1, 0.4, 91.1, 56.3], bessara: [227.9, 1.5, 0.5, 4.9, 293.2, 47.8], ads: [258.4, 0.8, 0.5, 1.8, 143.4, 10.2], tagen_potato: [357.7, 1.6, 1.1, 1.6, 394.9, 12.7], goulash: [222.9, 1.3, 8.2, 0.9, 166.3, 30.3], pane: [445.3, 0.8, 2.1, 0.6, 304.4, 31], fish_fried: [632.4, 0, 2.2, 0.3, 393.7, 22.7], kebda: [483.3, 0.7, 2.1, 0.6, 399.9, 22.3], sogo2: [710.2, 2.2, 8.2, 0.7, 295.2, 18.7], shakshuka: [250.3, 2.2, 1.6, 1, 206.8, 29.7], pastirma_egg: [618, 0.3, 5.9, 0, 183.4, 48.2], tahina_salad: [427.9, 0.7, 2.5, 3.8, 184.4, 157.1], torshi: [1500, 1.5, 0, 1.5, 150, 30], foul_sand: [398, 1.4, 0.7, 5.4, 224, 28], taameya_sand: [403.8, 1.9, 1.4, 4.9, 337.8, 46.6], kebda_sand: [479.2, 1.9, 1.6, 1.5, 281.8, 32.2], sogo2_sand: [605, 2.8, 5, 1.6, 217, 30.8], shawarma_plate: [297.9, 1.1, 2, 0.8, 190.5, 28.1], fiteer_cheese: [275.9, 0.3, 12.3, 1.1, 62.4, 128.5], fiteer_meat: [258, 0.5, 10.4, 1.2, 132.3, 13.8], kebab: [420, 0, 6, 0, 300, 12], tarb: [450, 0, 12, 0, 250, 12], shish_tawook: [480, 1.5, 1.2, 0.3, 330, 15], grilled_chicken: [520, 0, 3.8, 0, 240, 15], konafa: [62.1, 25.3, 12.2, 0.9, 66.8, 22.7], qatayef: [1.8, 30.4, 2.3, 2.1, 167.6, 34.4], om_ali: [94.8, 13.1, 7.7, 1.3, 162.8, 79], roz_laban: [41, 16, 1.8, 0.1, 134.8, 108.7], mahalabeya: [38.1, 17.4, 1.6, 0.1, 115.3, 98.5], lokma: [1.3, 38.5, 1.6, 1.1, 42, 6.2], kahk: [2, 8.3, 23.6, 1.6, 76.1, 13.8], sahlab: [37.3, 12.8, 2.8, 0.7, 149.4, 102.3], karkade: [3, 8.5, 0, 0, 20, 5], qasab: [10, 17, 0, 0, 60, 10], sobia: [20, 13, 2.2, 0.2, 60, 30], tamr_hindi: [5, 12, 0, 0.5, 60, 7],
  chicken_breast: [74, 0, 1, 0, 256, 15], chicken_thigh: [95, 0, 2.7, 0, 269, 12], chicken_fried: [450, 0.3, 4.5, 0.5, 250, 25], beef_lean: [65, 0, 6, 0, 320, 18], beef_mince: [75, 0, 6.6, 0, 300, 20],
  kofta: [500, 0.5, 7, 0.5, 300, 25], liver: [79, 0, 1.6, 0, 351, 6], tuna_water: [247, 0, 0.2, 0, 237, 11], tuna_oil: [354, 0, 1.5, 0, 207, 13], salmon: [61, 0, 3.1, 0, 384, 15], tilapia: [56, 0, 0.9, 0, 380, 14],
  shrimp: [111, 0, 0.1, 0, 259, 70], egg: [124, 1.1, 3.3, 0, 126, 50], egg_fried: [207, 0.4, 4.3, 0, 152, 62], egg_white: [166, 0.7, 0, 0, 163, 7], turkey: [1000, 3, 0.6, 0, 350, 10], whey: [300, 5, 3, 0, 500, 450],
  yogurt_light: [70, 7, 0.1, 0, 234, 183], yogurt_full: [46, 4.7, 2.1, 0, 155, 121], greek_yogurt: [36, 3.2, 0.1, 0, 141, 110], milk_skim: [42, 5, 0.1, 0, 156, 122], milk_full: [43, 5, 1.9, 0, 132, 113],
  cottage: [364, 2.7, 1.7, 0, 104, 83], areesh: [400, 3, 1.9, 0, 100, 90], domiati: [1200, 1, 13, 0, 80, 350], feta: [1116, 4.1, 15, 0, 62, 493], romy: [1300, 0.5, 19, 0, 90, 800], labneh: [350, 3, 8, 0, 150, 120],
  rice_white: [1, 0.1, 0.1, 0.4, 35, 10], rice_brown: [5, 0.4, 0.2, 1.8, 86, 10], pasta: [1, 0.6, 0.2, 1.8, 44, 7], baladi: [470, 2, 0.3, 6, 200, 25], toast: [490, 5, 0.7, 2.7, 115, 150], toast_brown: [450, 4.4, 0.7, 6, 250, 160],
  oats: [2, 1, 1.2, 10, 429, 54], potato: [5, 0.9, 0, 1.8, 379, 8], sweet_potato: [36, 6.5, 0.1, 3.3, 475, 38], fries: [280, 0.3, 2.3, 3.8, 580, 15], lentils: [2, 1.8, 0.1, 7.9, 369, 19],
  foul: [300, 1, 0.1, 5.4, 250, 30], foul_oil: [350, 1, 0.9, 5, 240, 30], taameya: [450, 2, 2.5, 5, 500, 55], koshari: [350, 2, 0.5, 3.5, 180, 25], chickpeas: [7, 4.8, 0.3, 7.6, 291, 49], hummus: [379, 0.3, 1.4, 6, 228, 38],
  salad: [20, 2, 0, 1.8, 220, 25], cucumber: [2, 1.7, 0, 0.5, 147, 16], tomato: [5, 2.6, 0, 1.2, 237, 10], lettuce: [10, 1.2, 0, 1.3, 194, 33], broccoli: [41, 1.4, 0.1, 3.3, 293, 40], carrot: [69, 4.7, 0, 2.8, 320, 33],
  green_beans: [1, 1.5, 0.1, 3.2, 146, 44], zucchini: [3, 1.7, 0.1, 1, 264, 18], spinach: [79, 0.4, 0.1, 2.2, 558, 99], molokhia: [300, 1, 1.5, 2, 300, 120], vegetable_stew: [350, 3, 1, 2.5, 250, 30],
  fruit_avg: [1, 10, 0, 2, 180, 10], apple: [1, 10.4, 0, 2.4, 107, 6], banana: [1, 12.2, 0.1, 2.6, 358, 5], orange: [0, 9.4, 0, 2.4, 181, 40], guava: [2, 8.9, 0.3, 5.4, 417, 18], mango: [1, 13.7, 0.1, 1.6, 168, 11],
  strawberry: [1, 4.9, 0, 2, 153, 16], grapes: [2, 15.5, 0.1, 0.9, 191, 10], watermelon: [1, 6.2, 0, 0.4, 112, 7], pomegranate: [3, 13.7, 0.1, 4, 236, 10], kiwi: [3, 9, 0, 3, 312, 34], pear: [1, 9.8, 0, 3.1, 116, 9], dates: [2, 63, 0, 8, 656, 39],
  chia: [16, 0, 3.3, 34.4, 407, 631], cacao: [21, 1.8, 8.1, 37, 1524, 128], olive_oil: [2, 0, 13.8, 0, 1, 1], oil: [0, 0, 12, 0, 0, 0], ghee: [2, 0, 62, 0, 5, 4], butter: [11, 0.1, 51, 0, 24, 24],
  tahini: [115, 0.5, 7.5, 9.3, 414, 426], peanut_butter: [459, 9, 10, 6, 558, 49], almonds: [1, 4.4, 3.8, 12.5, 733, 269], walnuts: [2, 2.6, 6.1, 6.7, 441, 98], honey: [4, 82, 0, 0.2, 52, 6], sugar: [1, 100, 0, 0, 2, 1], mayo: [635, 0.6, 11.7, 0, 20, 8],
  coffee: [2, 0, 0, 0, 49, 2], coffee_instant: [4, 0, 0, 0, 30, 4], creamer: [181, 55, 32.5, 0, 812, 22], sweetener: [0, 0, 0, 0, 0, 0], cinnamon: [10, 2.2, 0.3, 53, 431, 1002], spray: [0, 0, 10, 0, 0, 0], coffee_milk: [15, 2, 0.7, 0, 80, 35], tea: [3, 0, 0, 0, 37, 0], green_tea: [1, 0, 0, 0, 8, 0], cola: [4, 10.6, 0, 0, 2, 2], cola_zero: [12, 0, 0, 0, 8, 3], sparkling: [2, 0, 0, 0, 0, 3], juice_orange: [1, 8.4, 0, 0.2, 200, 11],
  shawarma: [550, 2, 2.5, 1.5, 220, 40], burger: [500, 4, 4.5, 1.3, 220, 70], pizza: [600, 3.6, 4.5, 2.3, 180, 190], hawawshi: [550, 2, 6, 2, 220, 30], feteer: [300, 2, 13, 1.5, 80, 15], chocolate: [79, 52, 18.5, 3.4, 372, 189], basbousa: [150, 35, 6, 1, 80, 30]
};
export const MICRO_KEYS = ['na', 'sug', 'sat', 'fib', 'pot', 'ca'];
export const microsFrom = a => a ? Object.fromEntries(MICRO_KEYS.map((k, i) => [k, a[i]])) : {};
import { DRINK_IDS } from './core.js';
/* Egyptian food groups for the food filters: cat home | rest | sweet | drink, grp = restaurant section, kw = other spellings and shop names people search for */
export const EG = {"mahshy_cabbage": {"cat": "home", "kw": "mahshi mahshy mahshey koronb kromb cabbage rolls malfouf محشى ملفوف"}, "mahshy_vine": {"cat": "home", "kw": "mahshi mahshy wara2 3enab warak enab waraq enab grape leaves dolma محشي محشى"}, "mahshy_mix": {"cat": "home", "kw": "mahshi mahshy kousa kosa betengan filfil محشى كوسة باذنجان فلفل"}, "mombar": {"cat": "home", "kw": "mombar mumbar sausage rice mahshi محشي"}, "hamam": {"cat": "home", "kw": "hamam pigeon mahshi freekeh فريك"}, "fattah": {"cat": "home", "kw": "fatta fattah fatteh eid"}, "bechamel": {"cat": "home", "kw": "macarona macaroni bechamel bashamel pasta"}, "bamya": {"cat": "home", "kw": "bamya bamia okra"}, "moussaka": {"cat": "home", "kw": "mesa2a3a msa2a3a moussaka musakka eggplant betengan بتنجان"}, "roz_shareya": {"cat": "home", "kw": "roz rice shareya sha3reya vermicelli ruz رز"}, "roz_meammar": {"cat": "home", "kw": "roz meammar me3ammar rice baked رز"}, "bessara": {"cat": "home", "kw": "bessara besara fava"}, "ads": {"cat": "home", "kw": "ads 3ads lentil soup shorba"}, "tagen_potato": {"cat": "home", "kw": "tagen tajine batates potato meat"}, "goulash": {"cat": "home", "kw": "goulash gollash phyllo mince"}, "pane": {"cat": "home", "kw": "pane panee breaded chicken frakh"}, "fish_fried": {"cat": "home", "kw": "samak fish bolti tilapia fried"}, "kebda": {"cat": "home", "kw": "kebda kibda liver alexandrian eskandarani"}, "sogo2": {"cat": "home", "kw": "sogo2 sogo sujuk sausage"}, "shakshuka": {"cat": "home", "kw": "shakshuka eggs tomato"}, "pastirma_egg": {"cat": "home", "kw": "basterma pastirma bastorma eggs beid"}, "tahina_salad": {"cat": "home", "kw": "tahina tehina tahini salad"}, "torshi": {"cat": "home", "kw": "torshi mekhalel pickles مخلل"}, "koshari": {"cat": "rest", "grp": "Koshary shop", "kw": "koshary koshari kushari abou tarek abu tarek tahrir el tahrir zooba ابو طارق التحرير"}, "foul_sand": {"cat": "rest", "grp": "Foul and taameya", "kw": "foul ful sandwich gad zooba felfela جاد"}, "taameya_sand": {"cat": "rest", "grp": "Foul and taameya", "kw": "taameya ta3meya falafel sandwich gad zooba felfela جاد"}, "kebda_sand": {"cat": "rest", "grp": "Sandwich shops", "kw": "kebda kibda liver sandwich alexandrian gad"}, "sogo2_sand": {"cat": "rest", "grp": "Sandwich shops", "kw": "sogo2 sausage sandwich gad"}, "shawarma_plate": {"cat": "rest", "grp": "Sandwich shops", "kw": "shawarma shawerma plate fatta mo2men momen mo'men gad cook door مؤمن كوك دور"}, "fiteer_cheese": {"cat": "rest", "grp": "Fiteer", "kw": "fiteer feteer cheese gebna"}, "fiteer_meat": {"cat": "rest", "grp": "Fiteer", "kw": "fiteer feteer meat lahma"}, "kebab": {"cat": "rest", "grp": "Grills", "kw": "kebab kabab grill mashwyat sobhy kaber refaey abou shakra صبحي كابر الرفاعي ابو شقرة مشويات"}, "tarb": {"cat": "rest", "grp": "Grills", "kw": "tarb grill mashwyat مشويات"}, "shish_tawook": {"cat": "rest", "grp": "Grills", "kw": "shish tawook taouk chicken grill"}, "grilled_chicken": {"cat": "rest", "grp": "Grills", "kw": "frakh farkha grilled chicken half mashwy"}, "konafa": {"cat": "sweet", "kw": "konafa kunafa knafeh ramadan"}, "qatayef": {"cat": "sweet", "kw": "qatayef atayef katayef ramadan"}, "om_ali": {"cat": "sweet", "kw": "om ali umm ali"}, "roz_laban": {"cat": "sweet", "kw": "roz bel laban rice pudding"}, "mahalabeya": {"cat": "sweet", "kw": "mahalabeya mehalabeya muhallebi pudding"}, "lokma": {"cat": "sweet", "kw": "lokma loqmet el kady zalabya zalabia زلابية"}, "kahk": {"cat": "sweet", "kw": "kahk ka3k eid cookies"}, "sahlab": {"cat": "drink", "kw": "sahlab sahleb salep"}, "karkade": {"cat": "drink", "kw": "karkade karkadeh hibiscus"}, "qasab": {"cat": "drink", "kw": "qasab asab sugarcane juice"}, "sobia": {"cat": "drink", "kw": "sobia sobya ramadan"}, "tamr_hindi": {"cat": "drink", "kw": "tamr hindi tamarind ramadan"}, "foul": {"old": 1, "cat": "home", "kw": ""}, "foul_oil": {"old": 1, "cat": "home", "kw": ""}, "taameya": {"old": 1, "cat": "home", "kw": ""}, "molokhia": {"old": 1, "cat": "home", "kw": ""}, "vegetable_stew": {"old": 1, "cat": "home", "kw": ""}, "basbousa": {"old": 1, "cat": "sweet", "kw": ""}, "hawawshi": {"old": 1, "cat": "rest", "grp": "Sandwich shops", "kw": "hawawshi hawawshy gad"}, "shawarma": {"old": 1, "cat": "rest", "grp": "Sandwich shops", "kw": "shawarma shawerma sandwich mo2men momen mo'men gad cook door مؤمن كوك دور"}, "feteer": {"old": 1, "cat": "rest", "grp": "Fiteer", "kw": "fiteer feteer meshaltet"}, "kofta": {"old": 1, "cat": "rest", "grp": "Grills", "kw": "kofta grill mashwyat sobhy kaber refaey abou shakra صبحي كابر الرفاعي ابو شقرة مشويات"}};
const EG_NOTE = {"home": "Worked out from a typical Egyptian home recipe, using USDA values for each ingredient. Recipes vary: add extra ghee with Cooking fat.", "sweet": "Worked out from a typical Egyptian recipe, using USDA values for each ingredient. Recipes vary.", "drink": "Worked out from a typical Egyptian recipe, using USDA values for each ingredient. Recipes vary.", "rest": "Estimate for a typical portion. No Egyptian restaurant chain publishes its nutrition."};
export const FOODS = RAW.map(([id, name, k, p, c, f, units, ar]) => ({ id, name, per: { k, p, c, f, ...microsFrom(MICRO[id]) }, units: units || [], ar: ar || '', src: 'lib', drink: DRINK_IDS.includes(id), ...(EG[id] ? { cat: EG[id].cat, grp: EG[id].grp, kw: EG[id].kw, egOld: !!EG[id].old, ...(EG_NOTE[EG[id].cat] && !EG[id].old ? { note: EG_NOTE[EG[id].cat] } : {}) } : {}) }));
export const foodById = id => FOODS.find(f => f.id === id);
const it = (id, g) => { const f = foodById(id); return { fid: id, name: f.name, g, per: { ...f.per } }; };

/* your coach's plan (cooked weights) — edit it in Setup */
// The owner's coach plan lives in the owner's own (private) account data, not in this public code.
export const COACH_MEALS = [];

/* supplements with timing for morning-gym and night-gym days */
export const SLOTS = ['Pre-gym', 'Before Meal 1', 'With Meal 1', 'Post-gym', 'Before Meal 2', 'With Meal 2', 'Evening', 'Any time'];
export const DEFAULT_SUPPS = [];
// The owner's coach plan, encrypted. Only the owner's own signed-in account can unlock it.
export const COACH_ENC = 'G9pDdrxx9DZBK7w/.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';

export const CARDIO_MODES = ['Incline treadmill', 'Bike', 'Rower', 'Elliptical', 'Stair climber', 'Outdoor walk'];
