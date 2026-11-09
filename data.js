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
  ['koshari', 'Koshari (est.)', 175, 5.5, 30, 3.5, [['small box', 350], ['large box', 550]], 'كشري'],
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
  ['tahini', 'Tahini', 595, 17, 21, 54, [['tbsp', 15]], 'طحينة'],
  ['peanut_butter', 'Peanut butter', 588, 25, 20, 50, [['tbsp', 16]], 'زبدة فول سوداني'],
  ['almonds', 'Almonds', 579, 21, 22, 50, [['handful', 28]], 'لوز'],
  ['walnuts', 'Walnuts', 654, 15, 14, 65, [['handful', 28]], 'عين جمل'],
  ['honey', 'Honey', 304, 0.3, 82, 0, [['tsp', 7]], 'عسل'],
  ['sugar', 'Sugar', 387, 0, 100, 0, [['tsp', 4]], 'سكر'],
  ['mayo', 'Mayonnaise', 680, 1, 0.6, 75, [['tbsp', 14]], 'مايونيز'],
  // drinks and treats
  ['coffee', 'Coffee, black', 2, 0.3, 0, 0, [['cup', 240]], 'قهوة'],
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
  ['basbousa', 'Basbousa (est.)', 350, 4, 55, 13, [['piece', 80]], 'بسبوسة']
];
import { DRINK_IDS } from './core.js';
export const FOODS = RAW.map(([id, name, k, p, c, f, units, ar]) => ({ id, name, per: { k, p, c, f }, units: units || [], ar: ar || '', src: 'lib', drink: DRINK_IDS.includes(id) }));
export const foodById = id => FOODS.find(f => f.id === id);
const it = (id, g) => { const f = foodById(id); return { fid: id, name: f.name, g, per: { ...f.per } }; };

/* your coach's plan (cooked weights) — edit it in Setup */
// The owner's coach plan lives in the owner's own (private) account data, not in this public code.
export const COACH_MEALS = [];

/* supplements with timing for morning-gym and night-gym days */
export const SLOTS = ['Pre-gym', 'Before Meal 1', 'With Meal 1', 'Post-gym', 'Before Meal 2', 'With Meal 2', 'Evening', 'Any time'];
export const DEFAULT_SUPPS = [];

export const CARDIO_MODES = ['Incline treadmill', 'Bike', 'Rower', 'Elliptical', 'Stair climber', 'Outdoor walk'];
