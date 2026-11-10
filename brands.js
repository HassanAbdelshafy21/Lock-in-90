/* Egyptian brand products and chain-restaurant items.
   Packaged products: values per 100 g from the pack label as recorded on Open Food Facts (barcode in `code`),
   kept only when calories agree with protein, carbs and fat. `chk` marks products whose label data was complete
   and consistent. Where a label left out sodium or other nutrients, `like` points at a similar basic food whose
   values are used instead and shown as estimates.
   Restaurant items: McDonald's Egypt published nutrition tables (mcdonalds.eg), per sandwich or portion. */

// [id, name, brand, arabic, barcode, kcal, protein, carbs, fat, more nutrients {na, sug, sat, fib, pot, ca} | null, units, like, checked, drink]
const P = [
  // snacks
  ['bal_puffs_corn', 'Balance Protein Puffs, Sweet Corn', 'Balance', 'بالانس بروتين بافس ذرة حلوة', '6222035235309', 363, 19.5, 48.6, 12.1, { na: 450, sug: 0, sat: 5.3, fib: 0 }, [['pack', 77]], null, 1],
  ['bal_puffs_heat', 'Balance Protein Puffs, Sweet Heat', 'Balance', 'بالانس بروتين بافس سويت هيت', '9222445235309', 400, 21.4, 53.5, 13.3, { na: 499, sug: 0, sat: 5.8, fib: 0 }, [['pack', 70]], null, 1],
  ['bal_crackers', 'Balance Protein Crackers', 'Balance', 'بالانس بروتين كراكرز', '6222035206095', 400, 21.9, 68.4, 4.3, { fib: 1.2 }, [['pack', 70]], null, 0],
  ['bal_crackers_sc', 'Balance Protein Crackers, Sour Cream', 'Balance', 'بالانس بروتين كراكرز ساور كريم', '6222035210115', 400, 21.9, 68.4, 4.3, { fib: 1.2 }, [['pack', 70]], null, 0],
  ['bal_ricechips', 'Balance Rice Chips', 'Balance', 'بالانس رايس شيبس', '6222035241447', 378, 10.8, 76.5, 3.1, null, [['pack', 70]], null, 0],
  ['halo_ricecake', 'Halo Organic Rice Cake, Quinoa & Chia', 'Halo', 'هالو كيك أرز كينوا وشيا', '6224002146809', 385, 7.1, 81.4, 2.9, { na: 1, fib: 2.9 }, [['cake', 7]], null, 0],
  ['tiger_chips', 'Tiger Chips', 'Tiger', 'تايجر شيبس', '6222035232421', 530, 7.7, 55.3, 31.1, { sug: 3.5, sat: 14.3, fib: 0.3 }, [], null, 0],
  ['cheetos_puffs', 'Cheetos Puffs, Dangerously Cheesy', 'Cheetos', 'شيتوس بافس', '6221031490354', 540, 6, 53, 30, { na: 1030, sug: 7, sat: 15, fib: 2 }, [], null, 1],
  ['chipsy_forno', 'Chipsy Forno, Tomatoes & Herbs', 'Chipsy', 'شيبسي فورنو طماطم وأعشاب', '6221031005398', 430, 6, 70, 12, { na: 540, sug: 7, sat: 5 }, [], null, 0],
  ['bakerolz', 'Bake Rolz Wheat Snacks', 'Edita', 'بيك رولز', '6223000499344', 407, 8.4, 61, 15, { sug: 0, sat: 2 }, [], null, 0],
  ['molto_xl_choc', 'Molto XL Chocolate Croissant', 'Edita', 'مولتو اكس لارج شوكولاتة', '6223000490617', 467, 8, 49, 27, { na: 159, sug: 18, sat: 14, fib: 1.5 }, [['croissant', 36]], null, 1],
  ['aa_protein_bar', 'Abu Auf Protein Bar, Coffee & Chocolate', 'Abu Auf', 'أبو عوف بروتين بار قهوة وشوكولاتة', '6223006312388', 371, 28.6, 45.7, 10, { na: 200, sug: 11.4, sat: 1.4, fib: 2.9 }, [['bar', 70]], null, 1],
  ['aa_granola', 'Abu Auf Granola with Nuts', 'Abu Auf', 'أبو عوف جرانولا بالمكسرات', '6223006313002', 429, 10.7, 64.3, 16.1, { sug: 21.4, sat: 10.7, fib: 10.7 }, [['serving', 28]], null, 0],
  // dairy
  ['juh_greek0', 'Juhayna Greek Yogurt 0.2% fat', 'Juhayna', 'جهينة زبادي يوناني 0.2%', '6222014352065', 50, 8.3, 3.6, 0.2, null, [['cup', 180]], 'greek_yogurt', 0],
  ['juh_greek_peach', 'Juhayna Greek Yogurt, Peach', 'Juhayna', 'جهينة زبادي يوناني خوخ', '6222014353130', 91, 6.7, 12.8, 1.5, { ca: 91 }, [['cup', 180]], 'greek_yogurt', 0],
  ['juh_yog_light', 'Juhayna Light Yogurt', 'Juhayna', 'جهينة زبادي لايت', '6222014300035', 47, 3.2, 5, 1.5, null, [['cup', 180]], 'yogurt_light', 0],
  ['juh_milk_full', 'Juhayna Full Cream Milk', 'Juhayna', 'جهينة لبن كامل الدسم', '6223000350065', 57, 3, 4.5, 3, { ca: 115 }, [['glass', 240], ['bottle 1 L', 1000]], 'milk_full', 0, 1],
  ['juh_milk_skim', 'Juhayna Skimmed Milk', 'Juhayna', 'جهينة لبن خالي الدسم', '6223000350089', 34, 3, 4.5, 0.5, null, [['glass', 240], ['bottle 1 L', 1000]], 'milk_skim', 0, 1],
  ['juh_labneh', 'Juhayna Turkish Labneh', 'Juhayna', 'جهينة لبنة تركي', '6222014301476', 198, 5.2, 4, 18, null, [['tbsp', 20]], 'labneh', 0],
  ['juh_zabado', 'Juhayna Zabado Drinkable Yogurt', 'Juhayna', 'جهينة زبادو', '6222014351396', 74, 2.7, 12.5, 1.5, null, [['bottle', 440]], 'yogurt_full', 0],
  ['lamar_skim', 'Lamar 0% Fat Milk', 'Lamar', 'لمار لبن 0% دسم', '6224008637615', 32, 3.1, 4.8, 0, { sug: 4.8, sat: 0 }, [['glass', 240], ['bottle 1 L', 1000]], 'milk_skim', 0, 1],
  ['almarai_milk', 'Almarai Low Fat Milk 1.5%', 'Almarai', 'المراعي لبن 1.5%', '6223001874317', 43, 2.8, 4.7, 1.5, { ca: 97 }, [['glass', 240], ['bottle 1 L', 1000]], 'milk_skim', 0, 1],
  ['domty_mozz_light', 'Domty Mozzarella Light', 'Domty', 'دومتي موتزاريلا لايت', '6223000753798', 189, 22, 5, 9, null, [['slice', 20]], null, 0],
  ['domty_dcream', 'Domty Double Cream White Cheese', 'Domty', 'دومتي جبنة بيضاء دبل كريم', '6223000750797', 270, 6.5, 6, 24, { sat: 13 }, [['tbsp', 20]], 'domiati', 0],
  ['domty_feta', 'Domty Premium Feta', 'Domty', 'دومتي فيتا بريميوم', '6223000757215', 234, 7, 6.5, 20, null, [['tbsp', 20]], 'domiati', 0],
  // bread
  ['rb_highfiber', 'Rich Bake High Fiber Toast', 'Rich Bake', 'ريتش بيك توست عالي الألياف', '6223003192037', 221, 12.6, 45.2, 2, { na: 550, sug: 0, sat: 0.7, fib: 7.2 }, [['slice', 25]], null, 1],
  ['rb_brown', 'Rich Bake Brown Whole Wheat Toast', 'Rich Bake', 'ريتش بيك توست بني', '6223000430026', 267, 11, 49, 3, { na: 360, sug: 3, sat: 1, fib: 4 }, [['slice', 20]], null, 1],
  ['rb_sugarfree', 'Rich Bake Whole Wheat Sugar-Free Toast', 'Rich Bake', 'ريتش بيك توست بدون سكر', '6223003192020', 217, 12.4, 46.5, 0.9, { na: 500, sug: 0, sat: 0.4, fib: 6.7 }, [['slice', 30]], null, 1],
  ['rb_oat', 'Rich Bake Oat Toast', 'Rich Bake', 'ريتش بيك توست شوفان', '6223000430194', 260, 12.8, 44.8, 3.6, { sug: 4, sat: 1.2, fib: 2.4 }, [['slice', 25]], 'toast_brown', 0],
  ['rb_bran_tortilla', 'Rich Bake Bran Tortilla', 'Rich Bake', 'ريتش بيك تورتيلا ردة', '6223000432167', 277, 7.8, 58.9, 1.1, { na: 530, sug: 2.2, sat: 0, fib: 4.4 }, [['tortilla', 90]], null, 1],
  ['rb_arabic', 'Rich Bake Arabic Bread', 'Rich Bake', 'ريتش بيك عيش شامي', '6223000434109', 273, 9, 57, 1, null, [], 'baladi', 0],
  // protein, ready to eat
  ['dolphin_tuna', 'Dolphin Tuna', 'Dolphin', 'تونة دولفين', '6224000529048', 170, 26, 0, 7, { sat: 2 }, [['can', 150]], 'tuna_oil', 0],
  ['atyab_hot_fillet', 'Atyab Hot Grilled Chicken Fillet', 'Atyab', 'أطياب فيليه فراخ مشوي حار', '6224007892565', 190, 15, 10, 10, { fib: 2.5 }, [], 'chicken_fried', 0],
];

// McDonald's Egypt, per item: [id, name, arabic, unit, grams, kcal, protein, carbs, fat, sodium mg, sugars, sat fat, fiber]
const MC = [
  ['mc_bigmac', 'Big Mac', 'بيج ماك', 'sandwich', 234, 604, 31, 52, 30, 476, 9, 10.4, 2],
  ['mc_bigtasty', 'Big Tasty', 'بيج تيستي', 'sandwich', 337, 854, 47, 53, 50, 589, 8, 14.7, 3],
  ['mc_mcroyale', 'McRoyale', 'ماك رويال', 'sandwich', 303, 786, 41, 51, 46, 649, 9, 15.8, 3],
  ['mc_quarter', 'Quarter Pounder', 'كوارتر باوندر', 'sandwich', 206, 533, 31, 46, 25, 577, 8, 9.6, 3],
  ['mc_mcdouble', 'McDouble', 'ماك دبل', 'sandwich', 166, 448, 26, 36, 22, 430, 6, 8.6, 2],
  ['mc_cheese', 'Cheeseburger', 'تشيز برجر', 'sandwich', 122, 340, 18, 34, 14, 355, 6, 4.9, 1],
  ['mc_beef', 'Beefburger', 'بيف برجر', 'sandwich', 108, 286, 17, 33, 10, 352, 6, 5.1, 2],
  ['mc_littletasty', 'Little Tasty', 'ليتل تيستي', 'sandwich', 183, 467, 26, 31, 26, 336, 5, 9.2, 2],
  ['mc_kofta', 'Kofta Burger', 'كفتة برجر', 'sandwich', 169, 378, 19, 31, 20, 341, 5, 7.3, 2],
  ['mc_mcchicken', 'McChicken', 'ماك تشيكن', 'sandwich', 197, 511, 19, 49, 26, 433, 6, 7.2, 3],
  ['mc_chickenmac', 'Chicken Mac', 'تشيكن ماك', 'sandwich', 242, 656, 25.6, 61.8, 37.1, 1183, 5.8, 6.8, 3.4],
  ['mc_macdo', 'Chicken MACDO', 'تشيكن ماكدو', 'sandwich', 126, 350, 13.1, 37.3, 16.4, 577, 5.7, 3.4, 1.3],
  ['mc_fillet', 'Chicken Fillet', 'تشيكن فيليه', 'sandwich', 228, 469, 21.1, 56.8, 17.4, 967, 10.5, 5.5, 2.4],
  ['mc_spicyfillet', 'Spicy Chicken Fillet', 'سبايسي تشيكن فيليه', 'sandwich', 197, 448, 20.4, 57, 15.3, 998, 7.4, 5.5, 2.2],
  ['mc_grandpremier', 'Grand Chicken Premier', 'جراند تشيكن بريمير', 'sandwich', 312, 855, 47.1, 69.4, 44.1, 1245, 5.6, 6.5, 5.6],
  ['mc_grandspicy', 'Grand Chicken Spicy', 'جراند تشيكن سبايسي', 'sandwich', 285, 799, 39.3, 71.8, 40.9, 1218, 5.1, 5.3, 5.2],
  ['mc_bigtastychicken', 'Big Tasty Chicken', 'بيج تيستي تشيكن', 'sandwich', 334, 867, 46.4, 70.5, 44.2, 1500, 6.8, 5.5, 5.2],
  ['mc_fof', 'Filet-O-Fish', 'فيليه أو فيش', 'sandwich', 152, 392, 18.6, 40.7, 17, 619, 5.8, 1.9, 0.9],
  ['mc_nuggets6', 'McNuggets (6 pieces)', 'ماك ناجتس 6 قطع', 'box of 6', 114, 268, 17, 13, 16, 570, 1, 6.6, 2],
  ['mc_falafel', 'McFalafel Wrap', 'ماك فلافل', 'wrap', 168, 358, 10, 54, 11, 730, 3, 3.3, 2],
  ['mc_eggmuffin', 'Egg McMuffin', 'إيج ماك مافن', 'sandwich', 132, 274, 18, 24, 12, null, 2, 0.5, 2],
  ['mc_chickenmuffin', 'Chicken McMuffin', 'تشيكن ماك مافن', 'sandwich', 125, 356, 16, 30, 20, null, 2, 4.4, 3],
  ['mc_hashbrown', 'Hash Browns', 'هاش براون', 'piece', 57, 117, 1, 12, 7, 285, 0, 0.5, 1],
];
const r1 = v => Math.round(v * 10) / 10;
const MICRO_KEYS = ['na', 'sug', 'sat', 'fib', 'pot', 'ca'];
export const BRANDS = [
  ...P.map(([id, name, brand, ar, code, k, p, c, f, mi, units, like, chk, drink]) => ({ id, name, brand, ar, code, per: { k, p, c, f, ...(mi || {}) }, units, like: like || null, chk: !!chk, drink: !!drink, src: 'brand', eg: true })),
  ...MC.map(([id, name, ar, unit, g, k, p, c, f, na, sug, sat, fib]) => {
    const x = v => v == null ? undefined : r1(v / g * 100);
    const per = { k: x(k), p: x(p), c: x(c), f: x(f), na: x(na), sug: x(sug), sat: x(sat), fib: x(fib) };
    MICRO_KEYS.forEach(m => per[m] === undefined && delete per[m]);
    // McFries sizes share one entry below
    return { id, name: `McDonald's ${name}`, brand: "McDonald's", ar: `ماكدونالدز ${ar}`, per, units: [[unit, g]], src: 'brand', chk: true, eg: true, rest: true };
  }),
  { id: 'mc_fries', name: "McDonald's McFries", brand: "McDonald's", ar: 'ماكدونالدز ماك فرايز بطاطس', per: { k: 317, p: 4.2, c: 41.8, f: 14.6, na: 62, sug: 0, sat: 6.8, fib: 2.4 }, units: [['regular', 165], ['small', 116], ['medium', 233], ['large', 274]], src: 'brand', chk: true, eg: true, rest: true },
];
export const BRAND_BY_CODE = Object.fromEntries(BRANDS.filter(b => b.code).map(b => [b.code, b]));
