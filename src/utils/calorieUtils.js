// База калорийности популярных продуктов (ккал на 100г/мл/шт)
// Источник: таблицы ВОЗ и Роспотребнадзора
// Формат: "название": { kcal, protein, fat, carbs }
// protein/fat/carbs — граммы на 100г продукта

export const CALORIES_DB = {
  // ─── Мука, крупы, макароны ────────────────────────────────────────────────
  "мука":                { kcal: 334, protein: 10.3, fat: 1.1,  carbs: 68.9 },
  "мука пшеничная":      { kcal: 334, protein: 10.3, fat: 1.1,  carbs: 68.9 },
  "крахмал":             { kcal: 343, protein: 0.1,  fat: 0.0,  carbs: 85.0 },
  "манка":               { kcal: 333, protein: 10.3, fat: 1.0,  carbs: 70.6 },
  "овсянка":             { kcal: 352, protein: 12.3, fat: 6.1,  carbs: 59.5 },
  "рис":                 { kcal: 344, protein: 6.7,  fat: 0.7,  carbs: 78.9 },
  "гречка":              { kcal: 343, protein: 12.6, fat: 3.3,  carbs: 62.1 },
  "макароны":            { kcal: 338, protein: 10.4, fat: 1.1,  carbs: 69.7 },
  "паста":               { kcal: 338, protein: 10.4, fat: 1.1,  carbs: 69.7 },
  "спагетти":            { kcal: 338, protein: 10.4, fat: 1.1,  carbs: 69.7 },
  "хлеб":                { kcal: 242, protein: 7.7,  fat: 1.4,  carbs: 48.8 },
  "хлеб белый":          { kcal: 242, protein: 7.7,  fat: 1.4,  carbs: 48.8 },
  "батон":               { kcal: 262, protein: 7.9,  fat: 2.9,  carbs: 52.7 },
  "разрыхлитель":        { kcal: 53,  protein: 0.0,  fat: 0.0,  carbs: 13.0 },

  // ─── Молочные продукты ────────────────────────────────────────────────────
  "молоко":              { kcal: 52,  protein: 2.9,  fat: 3.2,  carbs: 4.7  },
  "молоко 3.2%":         { kcal: 59,  protein: 2.9,  fat: 3.2,  carbs: 4.7  },
  "сливки":              { kcal: 206, protein: 2.8,  fat: 20.0, carbs: 3.7  },
  "кефир":               { kcal: 51,  protein: 2.8,  fat: 3.2,  carbs: 4.1  },
  "сметана":             { kcal: 206, protein: 2.8,  fat: 20.0, carbs: 3.2  },
  "творог":              { kcal: 101, protein: 16.5, fat: 1.8,  carbs: 1.3  },
  "творог 5%":           { kcal: 121, protein: 17.2, fat: 5.0,  carbs: 1.8  },
  "масло сливочное":     { kcal: 748, protein: 0.8,  fat: 82.5, carbs: 0.8  },
  "сливочное масло":     { kcal: 748, protein: 0.8,  fat: 82.5, carbs: 0.8  },
  "масло растительное":  { kcal: 884, protein: 0.0,  fat: 99.9, carbs: 0.0  },
  "растительное масло":  { kcal: 884, protein: 0.0,  fat: 99.9, carbs: 0.0  },
  "оливковое масло":     { kcal: 884, protein: 0.0,  fat: 99.9, carbs: 0.0  },
  "сыр":                 { kcal: 364, protein: 23.5, fat: 29.5, carbs: 0.0  },
  "сыр твёрдый":         { kcal: 364, protein: 23.5, fat: 29.5, carbs: 0.0  },
  "сыр фета":            { kcal: 264, protein: 14.2, fat: 21.3, carbs: 4.1  },
  "пармезан":            { kcal: 431, protein: 38.5, fat: 29.7, carbs: 0.0  },
  "пекорино":            { kcal: 387, protein: 25.5, fat: 31.0, carbs: 0.0  },
  "моцарелла":           { kcal: 280, protein: 18.0, fat: 22.0, carbs: 2.2  },
  "йогурт":              { kcal: 66,  protein: 5.0,  fat: 3.2,  carbs: 3.5  },

  // ─── Яйца ─────────────────────────────────────────────────────────────────
  "яйца":                { kcal: 157, protein: 12.7, fat: 11.5, carbs: 0.7, perUnit: 60 },
  "яйцо":                { kcal: 157, protein: 12.7, fat: 11.5, carbs: 0.7, perUnit: 60 },
  "желток":              { kcal: 352, protein: 16.2, fat: 31.9, carbs: 1.0, perUnit: 20 },
  "желтки":              { kcal: 352, protein: 16.2, fat: 31.9, carbs: 1.0, perUnit: 20 },
  "белок":               { kcal: 44,  protein: 11.1, fat: 0.2,  carbs: 0.7, perUnit: 35 },

  // ─── Мясо и птица ─────────────────────────────────────────────────────────
  "курица":              { kcal: 165, protein: 31.0, fat: 3.6,  carbs: 0.0  },
  "куриное филе":        { kcal: 113, protein: 23.6, fat: 1.9,  carbs: 0.0  },
  "куриные бёдра":       { kcal: 185, protein: 19.0, fat: 11.2, carbs: 0.0  },
  "куриная грудка":      { kcal: 113, protein: 23.6, fat: 1.9,  carbs: 0.0  },
  "говядина":            { kcal: 187, protein: 18.9, fat: 12.4, carbs: 0.0  },
  "свинина":             { kcal: 316, protein: 14.6, fat: 28.3, carbs: 0.0  },
  "фарш":                { kcal: 212, protein: 15.2, fat: 16.8, carbs: 0.0  },
  "фарш говяжий":        { kcal: 212, protein: 15.2, fat: 16.8, carbs: 0.0  },
  "бекон":               { kcal: 417, protein: 12.6, fat: 41.0, carbs: 0.0  },
  "гуанчале":            { kcal: 655, protein: 11.0, fat: 68.0, carbs: 0.0  },
  "колбаса":             { kcal: 300, protein: 12.0, fat: 26.0, carbs: 1.8  },
  "сосиски":             { kcal: 266, protein: 11.4, fat: 24.1, carbs: 1.6  },

  // ─── Рыба и морепродукты ──────────────────────────────────────────────────
  "рыба":                { kcal: 105, protein: 20.0, fat: 2.5,  carbs: 0.0  },
  "лосось":              { kcal: 208, protein: 20.4, fat: 13.4, carbs: 0.0  },
  "тунец":               { kcal: 144, protein: 23.3, fat: 4.9,  carbs: 0.0  },
  "креветки":            { kcal: 82,  protein: 18.9, fat: 0.5,  carbs: 0.0  },

  // ─── Овощи ────────────────────────────────────────────────────────────────
  "картофель":           { kcal: 80,  protein: 2.0,  fat: 0.4,  carbs: 18.1 },
  "морковь":             { kcal: 35,  protein: 1.3,  fat: 0.1,  carbs: 6.9  },
  "лук":                 { kcal: 41,  protein: 1.4,  fat: 0.2,  carbs: 8.2  },
  "лук красный":         { kcal: 42,  protein: 1.6,  fat: 0.2,  carbs: 9.3  },
  "помидоры":            { kcal: 20,  protein: 1.1,  fat: 0.2,  carbs: 3.7  },
  "томаты":              { kcal: 20,  protein: 1.1,  fat: 0.2,  carbs: 3.7  },
  "огурцы":              { kcal: 15,  protein: 0.8,  fat: 0.1,  carbs: 2.5  },
  "капуста":             { kcal: 28,  protein: 1.8,  fat: 0.1,  carbs: 4.7  },
  "болгарский перец":    { kcal: 27,  protein: 1.3,  fat: 0.1,  carbs: 5.3  },
  "перец":               { kcal: 27,  protein: 1.3,  fat: 0.1,  carbs: 5.3  },
  "баклажан":            { kcal: 25,  protein: 1.2,  fat: 0.1,  carbs: 4.5  },
  "кабачок":             { kcal: 24,  protein: 1.5,  fat: 0.3,  carbs: 2.8  },
  "чеснок":              { kcal: 149, protein: 6.5,  fat: 0.5,  carbs: 29.9 },
  "зелень":              { kcal: 22,  protein: 2.0,  fat: 0.4,  carbs: 2.0  },
  "шпинат":              { kcal: 23,  protein: 2.9,  fat: 0.4,  carbs: 2.3  },
  "грибы":               { kcal: 27,  protein: 3.1,  fat: 0.3,  carbs: 3.4  },
  "шампиньоны":          { kcal: 27,  protein: 3.1,  fat: 0.3,  carbs: 3.4  },
  "маслины":             { kcal: 115, protein: 0.8,  fat: 10.7, carbs: 5.8  },

  // ─── Фрукты ───────────────────────────────────────────────────────────────
  "яблоки":              { kcal: 47,  protein: 0.4,  fat: 0.4,  carbs: 9.8  },
  "бананы":              { kcal: 89,  protein: 1.1,  fat: 0.3,  carbs: 21.8 },
  "лимон":               { kcal: 34,  protein: 1.3,  fat: 0.3,  carbs: 3.0  },

  // ─── Сахар, специи, соусы ─────────────────────────────────────────────────
  "сахар":               { kcal: 399, protein: 0.0,  fat: 0.0,  carbs: 99.7 },
  "мёд":                 { kcal: 329, protein: 0.8,  fat: 0.0,  carbs: 81.5 },
  "соль":                { kcal: 0,   protein: 0.0,  fat: 0.0,  carbs: 0.0  },
  "перец чёрный":        { kcal: 255, protein: 10.4, fat: 3.3,  carbs: 38.7 },
  "уксус":               { kcal: 11,  protein: 0.0,  fat: 0.0,  carbs: 3.0  },
  "томатная паста":      { kcal: 82,  protein: 4.8,  fat: 0.5,  carbs: 15.9 },
  "майонез":             { kcal: 680, protein: 2.8,  fat: 74.7, carbs: 2.6  },
  "кетчуп":              { kcal: 112, protein: 1.8,  fat: 0.1,  carbs: 26.0 },
  "соевый соус":         { kcal: 58,  protein: 10.5, fat: 0.1,  carbs: 5.6  },
  "какао":               { kcal: 228, protein: 24.3, fat: 15.0, carbs: 3.1  },
  "шоколад":             { kcal: 544, protein: 4.3,  fat: 31.7, carbs: 62.2 },

  // ─── Бобовые, орехи ───────────────────────────────────────────────────────
  "фасоль":              { kcal: 123, protein: 8.4,  fat: 0.5,  carbs: 21.5 },
  "нут":                 { kcal: 364, protein: 19.0, fat: 6.0,  carbs: 60.7 },
  "чечевица":            { kcal: 116, protein: 9.0,  fat: 0.6,  carbs: 20.1 },
  "орехи":               { kcal: 654, protein: 15.2, fat: 61.3, carbs: 11.1 },
  "грецкие орехи":       { kcal: 654, protein: 15.2, fat: 61.3, carbs: 11.1 },
};

// Нормализация строки для поиска
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^а-яa-z0-9 ]/g, "")
    .trim();
}

// Поиск калорийности по названию ингредиента
export function findCalories(name) {
  if (!name) return null;
  const n = normalize(name);

  // Точное совпадение
  for (const [key, val] of Object.entries(CALORIES_DB)) {
    if (normalize(key) === n) return { key, ...val };
  }

  // Частичное совпадение — ищем ключ внутри названия или наоборот
  for (const [key, val] of Object.entries(CALORIES_DB)) {
    const k = normalize(key);
    if (n.includes(k) || k.includes(n)) return { key, ...val };
  }

  // Совпадение по первым 4 символам
  if (n.length >= 4) {
    for (const [key, val] of Object.entries(CALORIES_DB)) {
      const k = normalize(key);
      if (k.length >= 4 && k.slice(0, 4) === n.slice(0, 4)) return { key, ...val };
    }
  }

  return null;
}

/**
 * Рассчитать калории для одного ингредиента
 * @param {string} name — название
 * @param {number} amount — количество
 * @param {string} unit — единица измерения
 * @returns {{ kcal, protein, fat, carbs } | null}
 */
export function calcIngredientCalories(name, amount, unit) {
  const data = findCalories(name);
  if (!data || !amount) return null;

  const u = (unit || "").toLowerCase();
  let grams = 0;

  if (["г", "гр", "g"].includes(u)) {
    grams = parseFloat(amount);
  } else if (["кг", "kg"].includes(u)) {
    grams = parseFloat(amount) * 1000;
  } else if (["мл", "ml"].includes(u)) {
    // Приближение: для жидкостей 1мл ≈ 1г (для масла ~0.9, для молока ~1.03)
    grams = parseFloat(amount);
  } else if (["л", "l"].includes(u)) {
    grams = parseFloat(amount) * 1000;
  } else if (["шт", "штук", "шт.", "pcs"].includes(u) || u === "") {
    // Штучные продукты — используем perUnit если есть, иначе среднее
    const perUnit = data.perUnit || 100;
    grams = parseFloat(amount) * perUnit;
  } else if (["ч.л.", "ч.л", "чл"].includes(u)) {
    grams = parseFloat(amount) * 5;
  } else if (["ст.л.", "ст.л", "стл"].includes(u)) {
    grams = parseFloat(amount) * 15;
  } else if (["стак.", "стак", "стакан"].includes(u)) {
    grams = parseFloat(amount) * 240;
  } else {
    // Неизвестная единица — пробуем как граммы
    grams = parseFloat(amount) || 0;
  }

  if (!grams) return null;

  const factor = grams / 100;
  return {
    kcal:    Math.round(data.kcal    * factor),
    protein: Math.round(data.protein * factor * 10) / 10,
    fat:     Math.round(data.fat     * factor * 10) / 10,
    carbs:   Math.round(data.carbs   * factor * 10) / 10,
    found:   true,
    key:     data.key,
    grams,
  };
}

/**
 * Суммарные КБЖУ для списка ингредиентов
 */
export function calcTotalCalories(ingredients) {
  let total = { kcal: 0, protein: 0, fat: 0, carbs: 0, covered: 0 };
  for (const ing of ingredients) {
    const c = calcIngredientCalories(ing.name, ing.scaledAmount ?? ing.amount, ing.unit);
    if (c) {
      total.kcal    += c.kcal;
      total.protein += c.protein;
      total.fat     += c.fat;
      total.carbs   += c.carbs;
      total.covered++;
    }
  }
  total.kcal    = Math.round(total.kcal);
  total.protein = Math.round(total.protein * 10) / 10;
  total.fat     = Math.round(total.fat     * 10) / 10;
  total.carbs   = Math.round(total.carbs   * 10) / 10;
  total.total   = ingredients.length;
  return total;
}
