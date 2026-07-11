/* The Chef — recipes from what's in your fridge, fitted to the calories
   you have left today. Runs entirely on-device: a curated recipe base and
   an ingredient matcher that understands English and Spanish. */
'use strict';

const Chef = (() => {

  const PANTRY = ['oil', 'salt', 'spices', 'butter', 'garlic', 'lemon'];

  /* {n: name, i: ingredients, k: kcal, p/c/f: macros per serving,
     t: minutes, s: steps} */
  const RECIPES = [
    { n: 'Veggie omelet', i: ['egg', 'cheese', 'tomato', 'onion'], k: 320, p: 22, c: 8, f: 22, t: 10,
      s: ['Whisk 3 eggs, season well.', 'Soften diced onion and tomato in a hot pan.', 'Pour eggs, fold with cheese when almost set.'] },
    { n: 'Scrambled eggs & avocado toast', i: ['egg', 'avocado', 'bread'], k: 420, p: 20, c: 28, f: 26, t: 8,
      s: ['Toast the bread.', 'Scramble 2-3 eggs low and slow.', 'Smash avocado on toast, eggs on top, salt.'] },
    { n: 'Greek yogurt power bowl', i: ['greek yogurt', 'berries', 'honey', 'oats'], k: 340, p: 24, c: 45, f: 6, t: 3,
      s: ['Yogurt in a bowl.', 'Top with berries, a spoon of oats, thread of honey.'] },
    { n: 'Banana oat pancakes', i: ['banana', 'oats', 'egg'], k: 350, p: 14, c: 52, f: 9, t: 12,
      s: ['Blend 1 banana + 1 cup oats + 2 eggs.', 'Cook small pancakes 2 min per side.'] },
    { n: 'Protein oatmeal', i: ['oats', 'protein powder', 'banana', 'milk'], k: 420, p: 32, c: 55, f: 8, t: 6,
      s: ['Cook oats in milk.', 'Off heat, stir in protein powder.', 'Top with sliced banana.'] },
    { n: 'Overnight oats', i: ['oats', 'milk', 'peanut butter', 'banana'], k: 450, p: 18, c: 60, f: 15, t: 5,
      s: ['Jar: equal parts oats and milk, spoon of peanut butter.', 'Fridge overnight. Banana on top in the morning.'] },
    { n: 'Grilled chicken & rice bowl', i: ['chicken', 'rice', 'broccoli'], k: 550, p: 45, c: 55, f: 12, t: 20,
      s: ['Season and grill the chicken 6-7 min per side.', 'Steam broccoli.', 'Bowl: rice, sliced chicken, broccoli, salt and lemon.'] },
    { n: 'Chicken fajita skillet', i: ['chicken', 'pepper', 'onion', 'tortilla'], k: 520, p: 40, c: 45, f: 18, t: 18,
      s: ['Sear strips of chicken hard.', 'Add sliced pepper and onion, cook until charred at the edges.', 'Serve in warm tortillas.'] },
    { n: 'Chicken zoodle stir-fry', i: ['chicken', 'zucchini', 'garlic'], k: 380, p: 42, c: 10, f: 18, t: 15,
      s: ['Ribbon the zucchini with a peeler.', 'Stir-fry chicken with garlic, add zoodles for the last 2 min.'] },
    { n: 'Creamy chicken & mushrooms', i: ['chicken', 'mushroom', 'milk', 'cheese'], k: 470, p: 44, c: 9, f: 27, t: 20,
      s: ['Brown the chicken, set aside.', 'Cook mushrooms in the same pan.', 'Splash of milk + cheese to make the sauce; chicken back in.'] },
    { n: 'Chicken quesadilla', i: ['chicken', 'tortilla', 'cheese'], k: 540, p: 35, c: 40, f: 25, t: 10,
      s: ['Shredded chicken and cheese in the tortilla.', 'Toast in a dry pan until crisp both sides.'] },
    { n: 'Honey-garlic chicken & potatoes', i: ['chicken', 'potato', 'honey'], k: 560, p: 42, c: 60, f: 13, t: 25,
      s: ['Roast potato wedges (425°F, 20 min).', 'Pan-sear chicken; glaze with honey, garlic and a splash of water.'] },
    { n: 'Chicken & sweet potato plate', i: ['chicken', 'sweet potato', 'spinach'], k: 500, p: 44, c: 48, f: 10, t: 22,
      s: ['Roast sweet potato cubes.', 'Grill the chicken.', 'Wilt spinach in the pan juices. Plate it like you mean it.'] },
    { n: 'Chicken caesar-ish salad', i: ['chicken', 'lettuce', 'cheese', 'bread'], k: 430, p: 40, c: 12, f: 24, t: 12,
      s: ['Grill and slice the chicken.', 'Torn lettuce, shaved cheese, toasted bread cubes.', 'Dress with oil, lemon, salt.'] },
    { n: 'Chicken tortilla soup', i: ['chicken', 'tomato', 'onion', 'tortilla', 'beans'], k: 430, p: 35, c: 40, f: 14, t: 30,
      s: ['Simmer chicken with tomato, onion and beans 20 min.', 'Shred the chicken back in.', 'Top with crisped tortilla strips.'] },
    { n: 'Cauliflower fried rice', i: ['cauliflower', 'egg', 'chicken', 'carrot'], k: 350, p: 35, c: 14, f: 17, t: 15,
      s: ['Grate cauliflower to rice.', 'Stir-fry chicken and carrot; push aside, scramble the egg.', 'Cauliflower in, high heat 3 min.'] },
    { n: 'Beef & rice burrito bowl', i: ['ground beef', 'rice', 'beans', 'cheese'], k: 620, p: 38, c: 62, f: 22, t: 18,
      s: ['Brown the beef with spices.', 'Bowl: rice, beans, beef, cheese on top.'] },
    { n: 'Lettuce-wrap burgers', i: ['ground beef', 'lettuce', 'cheese', 'tomato'], k: 450, p: 32, c: 6, f: 32, t: 15,
      s: ['Form and sear two thin patties.', 'Wrap in crisp lettuce with cheese and tomato.'] },
    { n: 'Beef & veggie skillet', i: ['ground beef', 'zucchini', 'pepper', 'onion'], k: 430, p: 35, c: 14, f: 26, t: 15,
      s: ['Brown the beef, drain.', 'Add chopped veggies, cook hard 5 min. Season heavy.'] },
    { n: 'Steak & potatoes', i: ['steak', 'potato'], k: 640, p: 45, c: 45, f: 28, t: 20,
      s: ['Salt the steak early. Sear 3-4 min per side, rest 5.', 'Crisp cubed potatoes in the same pan.'] },
    { n: 'Beef chili', i: ['ground beef', 'beans', 'tomato', 'onion'], k: 520, p: 40, c: 38, f: 22, t: 35,
      s: ['Brown beef with onion.', 'Add tomato, beans, chili spices.', 'Simmer 25 min, lid off.'] },
    { n: 'Garlic butter salmon & broccoli', i: ['salmon', 'broccoli'], k: 520, p: 40, c: 10, f: 34, t: 18,
      s: ['Pan-sear salmon skin-side down 5 min.', 'Flip, add butter and garlic, spoon it over.', 'Steam broccoli alongside.'] },
    { n: 'Tuna salad bowl', i: ['tuna', 'lettuce', 'tomato', 'cucumber', 'avocado'], k: 380, p: 35, c: 10, f: 22, t: 8,
      s: ['Drain tuna.', 'Everything chopped into a bowl, oil + lemon + salt.'] },
    { n: 'Tuna melt', i: ['tuna', 'bread', 'cheese'], k: 450, p: 35, c: 30, f: 20, t: 10,
      s: ['Tuna on bread, cheese on tuna.', 'Broil or pan-toast until it pulls.'] },
    { n: 'Shrimp stir-fry', i: ['shrimp', 'rice', 'pepper'], k: 480, p: 34, c: 58, f: 9, t: 15,
      s: ['Blazing pan: shrimp 90 seconds per side with garlic.', 'Toss with peppers, serve over rice.'] },
    { n: 'Shrimp tacos', i: ['shrimp', 'tortilla', 'lettuce', 'avocado'], k: 460, p: 30, c: 44, f: 18, t: 15,
      s: ['Sear spiced shrimp.', 'Warm tortillas; build with lettuce and avocado.'] },
    { n: 'Baked white fish & veggies', i: ['fish', 'zucchini', 'tomato'], k: 350, p: 40, c: 10, f: 14, t: 20,
      s: ['Fish on a tray with sliced zucchini and tomato.', 'Oil, salt, 400°F for 15 min.'] },
    { n: 'Black bean tacos', i: ['beans', 'tortilla', 'cheese', 'tomato'], k: 480, p: 20, c: 62, f: 16, t: 12,
      s: ['Mash and heat the beans with spices.', 'Fill tortillas, top with cheese and tomato.'] },
    { n: 'Caprese pasta', i: ['pasta', 'tomato', 'mozzarella'], k: 520, p: 20, c: 70, f: 16, t: 15,
      s: ['Boil pasta.', 'Toss hot with chopped tomato, torn mozzarella, oil and salt.'] },
    { n: 'Veggie fried rice', i: ['rice', 'egg', 'carrot', 'onion'], k: 450, p: 14, c: 70, f: 12, t: 12,
      s: ['Day-old rice into a hot oiled pan.', 'Push aside, scramble eggs, fold in with diced veg.'] },
    { n: 'Quinoa power bowl', i: ['quinoa', 'avocado', 'beans', 'spinach'], k: 520, p: 18, c: 60, f: 22, t: 20,
      s: ['Cook quinoa.', 'Bowl with beans, spinach and avocado; lemon over everything.'] },
    { n: 'Zucchini al pomodoro', i: ['zucchini', 'tomato', 'cheese'], k: 260, p: 12, c: 18, f: 15, t: 15,
      s: ['Ribbon zucchini.', 'Quick tomato-garlic sauce, toss 2 min, finish with cheese.'] },
    { n: 'Loaded baked potato', i: ['potato', 'cheese', 'greek yogurt'], k: 480, p: 18, c: 55, f: 20, t: 30,
      s: ['Bake or microwave the potato until soft.', 'Split; cheese and a spoon of greek yogurt (better than sour cream).'] },
    { n: 'Grilled cheese & tomato', i: ['bread', 'cheese', 'tomato'], k: 480, p: 18, c: 44, f: 26, t: 10,
      s: ['Butter the outside, cheese and tomato inside.', 'Medium-low until deep golden.'] },
    { n: 'Turkey roll-ups', i: ['turkey', 'cheese', 'cucumber'], k: 260, p: 28, c: 6, f: 13, t: 5,
      s: ['Lay turkey slices flat, cheese and cucumber batons inside, roll.'] },
    { n: 'Egg salad lettuce cups', i: ['egg', 'lettuce', 'avocado'], k: 330, p: 16, c: 6, f: 27, t: 10,
      s: ['Boil 3 eggs, chop, mash with avocado and salt.', 'Spoon into lettuce leaves.'] },
    { n: 'Apple & peanut butter', i: ['apple', 'peanut butter'], k: 280, p: 8, c: 32, f: 16, t: 2,
      s: ['Slice the apple. Peanut butter for dipping. Done.'] },
    { n: 'Cottage cheese & berries', i: ['cottage cheese', 'berries'], k: 220, p: 24, c: 16, f: 6, t: 2,
      s: ['Bowl, berries on top, black pepper if you know.'] },
    { n: 'Protein shake plus', i: ['protein powder', 'milk', 'banana', 'peanut butter'], k: 420, p: 35, c: 35, f: 15, t: 3,
      s: ['Everything in the blender with ice. 30 seconds.'] },
    { n: 'Ham & egg breakfast tacos', i: ['egg', 'ham', 'tortilla', 'cheese'], k: 440, p: 28, c: 32, f: 22, t: 10,
      s: ['Scramble eggs with diced ham.', 'Fill warm tortillas, a little cheese to close.'] },
    { n: 'Bacon & egg plate', i: ['bacon', 'egg', 'avocado'], k: 460, p: 24, c: 6, f: 38, t: 12,
      s: ['Crisp the bacon; fry eggs in a little of the fat.', 'Avocado on the side. Zero carbs, zero apologies.'] },
  ];

  /* Spanish → canonical English */
  const SYNONYMS = {
    huevo: 'egg', huevos: 'egg', pollo: 'chicken', 'pechuga': 'chicken', arroz: 'rice',
    carne: 'ground beef', 'carne molida': 'ground beef', res: 'ground beef', bistec: 'steak', bisteck: 'steak',
    atun: 'tuna', 'atún': 'tuna', salmon: 'salmon', 'salmón': 'salmon',
    camaron: 'shrimp', camarones: 'shrimp', pescado: 'fish', tilapia: 'fish', mojarra: 'fish',
    lechuga: 'lettuce', tomate: 'tomato', jitomate: 'tomato', cebolla: 'onion', ajo: 'garlic',
    pimiento: 'pepper', morron: 'pepper', 'morrón': 'pepper', chile: 'pepper',
    aguacate: 'avocado', palta: 'avocado', queso: 'cheese', yogur: 'greek yogurt', yogurt: 'greek yogurt',
    avena: 'oats', platano: 'banana', 'plátano': 'banana', banana: 'banana', banano: 'banana',
    manzana: 'apple', fresa: 'berries', fresas: 'berries', moras: 'berries', frutos: 'berries',
    papa: 'potato', papas: 'potato', patata: 'potato', camote: 'sweet potato', batata: 'sweet potato',
    frijol: 'beans', frijoles: 'beans', porotos: 'beans', lenteja: 'beans', tortilla: 'tortilla', tortillas: 'tortilla',
    pan: 'bread', pasta: 'pasta', espagueti: 'pasta', fideos: 'pasta',
    calabacin: 'zucchini', 'calabacín': 'zucchini', calabacita: 'zucchini', calabaza: 'zucchini',
    champinon: 'mushroom', 'champiñon': 'mushroom', 'champiñones': 'mushroom', hongos: 'mushroom', setas: 'mushroom',
    leche: 'milk', 'crema de cacahuate': 'peanut butter', cacahuate: 'peanut butter', mani: 'peanut butter', 'maní': 'peanut butter',
    proteina: 'protein powder', 'proteína': 'protein powder', whey: 'protein powder',
    limon: 'lemon', 'limón': 'lemon', pepino: 'cucumber', zanahoria: 'carrot', elote: 'corn', maiz: 'corn', 'maíz': 'corn',
    pavo: 'turkey', jamon: 'ham', 'jamón': 'ham', tocino: 'bacon', tocineta: 'bacon',
    quinoa: 'quinoa', quinua: 'quinoa', miel: 'honey', mantequilla: 'butter',
    espinaca: 'spinach', espinacas: 'spinach', brocoli: 'broccoli', 'brócoli': 'broccoli',
    coliflor: 'cauliflower', requeson: 'cottage cheese', 'requesón': 'cottage cheese',
    pechugas: 'chicken', molida: 'ground beef', hamburguesa: 'ground beef',
  };

  function normalize(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .split(/[,;\n·]+/)
      .map(t => t.trim())
      .filter(Boolean)
      .map(t => {
        if (SYNONYMS[t]) return SYNONYMS[t];
        const sing = t.replace(/(es|s)$/, '');
        if (SYNONYMS[sing]) return SYNONYMS[sing];
        return sing || t;
      });
  }

  function hasIngredient(tokens, ing) {
    const target = ing.toLowerCase();
    return tokens.some(t =>
      t === target || target.includes(t) || t.includes(target)
    );
  }

  /* Returns scored recipes: {r, have, missing[], score} */
  function match(fridgeText, limit = 6) {
    const tokens = normalize(fridgeText);
    if (!tokens.length) return [];
    const out = [];
    for (const r of RECIPES) {
      const required = r.i.filter(i => !PANTRY.includes(i));
      const missing = required.filter(i => !hasIngredient(tokens, i));
      const have = required.length - missing.length;
      if (!required.length) continue;
      const score = have / required.length;
      if (score >= 0.5 && missing.length <= 2 && have >= 1) {
        out.push({ r, have, missing, score });
      }
    }
    out.sort((a, b) => b.score - a.score || a.missing.length - b.missing.length || b.r.p - a.r.p);
    return out.slice(0, limit);
  }

  return { match, normalize, RECIPES };
})();
