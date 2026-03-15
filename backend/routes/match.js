const express = require("express");
const db = require("../db/pool");

const router = express.Router();

// ─── Нормализация строки ──────────────────────────────────────────────────────
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^а-яa-z0-9 ]/g, "")
    .trim();
}

function ingredientsMatch(recipeName, userIngredient) {
  const rn = normalize(recipeName);
  const un = normalize(userIngredient);
  if (rn === un) return true;
  if (rn.includes(un) || un.includes(rn)) return true;
  if (rn.length > 4 && un.length > 4 && rn.slice(0, 4) === un.slice(0, 4)) return true;
  return false;
}

// ─── POST /api/match ──────────────────────────────────────────────────────────
// Body: { ingredients: ["яйца", "молоко", "мука"], limit?: 10 }
router.post("/", async (req, res) => {
  const { ingredients = [], limit = 20 } = req.body;
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: "ingredients array required" });
  }

  try {
    // Загружаем все рецепты с ингредиентами
    const { rows: recipes } = await db.query(
      `SELECT r.id, r.title, r.category, r.cover_image_url, r.avg_rating, r.prep_time_min, r.cook_time_min,
              r.base_servings, u.username
       FROM recipes r
       JOIN users u ON u.id=r.user_id
       ORDER BY r.avg_rating DESC
       LIMIT 200`
    );

    const { rows: allIngredients } = await db.query(
      "SELECT recipe_id, name FROM ingredients WHERE recipe_id = ANY($1)",
      [recipes.map(r => r.id)]
    );

    // Группируем ингредиенты по рецепту
    const ingredientsByRecipe = {};
    for (const ing of allIngredients) {
      if (!ingredientsByRecipe[ing.recipe_id]) ingredientsByRecipe[ing.recipe_id] = [];
      ingredientsByRecipe[ing.recipe_id].push(ing.name);
    }

    // Матчинг
    const results = recipes.map(recipe => {
      const required = ingredientsByRecipe[recipe.id] || [];
      const matched = required.filter(name => ingredients.some(u => ingredientsMatch(name, u)));
      const missing = required.filter(name => !ingredients.some(u => ingredientsMatch(name, u)));
      const score = required.length > 0 ? matched.length / required.length : 0;
      const mode = missing.length === 0 ? "full" : missing.length <= 2 ? "almost" : "improvise";
      return { recipe, matched, missing, score: Math.round(score * 100) / 100, mode };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, parseInt(limit));

    res.json({
      results,
      stats: {
        full: results.filter(r => r.mode === "full").length,
        almost: results.filter(r => r.mode === "almost").length,
        improvise: results.filter(r => r.mode === "improvise").length,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/match/shopping-list ───────────────────────────────────────────
// Список покупок для выбранных "почти готовых" рецептов
router.post("/shopping-list", async (req, res) => {
  const { recipeIds = [], userIngredients = [] } = req.body;
  if (recipeIds.length === 0) return res.json({ items: [] });

  try {
    const { rows } = await db.query(
      "SELECT recipe_id, name, amount, unit FROM ingredients WHERE recipe_id = ANY($1)",
      [recipeIds]
    );

    const missing = rows.filter(ing =>
      !userIngredients.some(u => ingredientsMatch(ing.name, u))
    );

    // Дедупликация по имени (суммируем)
    const deduped = {};
    for (const ing of missing) {
      const key = normalize(ing.name);
      if (!deduped[key]) deduped[key] = { name: ing.name, amount: 0, unit: ing.unit };
      if (deduped[key].unit === ing.unit) deduped[key].amount += parseFloat(ing.amount);
    }

    res.json({ items: Object.values(deduped) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
