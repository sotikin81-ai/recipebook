const express = require("express");
const { body, query, param, validationResult } = require("express-validator");
const db = require("../db/pool");
const { requireAuth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────
function validationCheck(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return true; }
  return false;
}

// Полный объект рецепта с ингредиентами и шагами
async function getFullRecipe(id, currentUserId = null) {
  const { rows } = await db.query(
    `SELECT r.*,
       u.username, u.avatar_url,
       ${currentUserId ? "EXISTS(SELECT 1 FROM favorites WHERE user_id=$2 AND recipe_id=r.id) AS is_favorited," : "false AS is_favorited,"}
       ${currentUserId ? "EXISTS(SELECT 1 FROM ratings WHERE user_id=$2 AND recipe_id=r.id) AS is_rated" : "false AS is_rated"}
     FROM recipes r
     JOIN users u ON u.id = r.user_id
     WHERE r.id=$1`,
    currentUserId ? [id, currentUserId] : [id]
  );
  if (!rows[0]) return null;

  const recipe = rows[0];
  const [ingRows, stepRows, tagRows] = await Promise.all([
    db.query("SELECT * FROM ingredients WHERE recipe_id=$1 ORDER BY sort_order", [id]),
    db.query("SELECT * FROM steps WHERE recipe_id=$1 ORDER BY step_number", [id]),
    db.query("SELECT t.name FROM tags t JOIN recipe_tags rt ON rt.tag_id=t.id WHERE rt.recipe_id=$1", [id]),
  ]);
  recipe.ingredients = ingRows.rows;
  recipe.steps       = stepRows.rows;
  recipe.tags        = tagRows.rows.map(t => t.name);
  return recipe;
}

// ─── GET /api/recipes ─────────────────────────────────────────────────────────
router.get("/", optionalAuth, async (req, res) => {
  try {
    const {
      search = "", category = "", mood = "",
      limit = 20, offset = 0, sort = "newest",
    } = req.query;

    let conditions = ["1=1"];
    let params = [];
    let p = 1;

    if (search) {
      conditions.push(`(r.search_vector @@ plainto_tsquery('russian', $${p}) OR r.title ILIKE $${p+1})`);
      params.push(search, `%${search}%`);
      p += 2;
    }
    if (category) {
      conditions.push(`r.category = $${p++}`);
      params.push(category);
    }
    if (mood) {
      conditions.push(`EXISTS(SELECT 1 FROM recipe_moods rm JOIN mood_tags mt ON mt.id=rm.mood_id WHERE rm.recipe_id=r.id AND mt.name=$${p++})`);
      params.push(mood);
    }

    const orderMap = { newest: "r.created_at DESC", rating: "r.avg_rating DESC", popular: "r.rating_count DESC" };
    const order = orderMap[sort] || "r.created_at DESC";

    const sql = `
      SELECT r.id, r.title, r.description, r.category, r.prep_time_min, r.cook_time_min,
             r.base_servings, r.cover_image_url, r.avg_rating, r.rating_count, r.created_at,
             u.username, u.avatar_url
      FROM recipes r
      JOIN users u ON u.id = r.user_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY ${order}
      LIMIT $${p} OFFSET $${p+1}
    `;
    params.push(parseInt(limit), parseInt(offset));

    const { rows } = await db.query(sql, params);
    const countRes = await db.query(
      `SELECT COUNT(*) FROM recipes r WHERE ${conditions.join(" AND ")}`,
      params.slice(0, -2)
    );

    res.json({ recipes: rows, total: parseInt(countRes.rows[0].count), limit: parseInt(limit), offset: parseInt(offset) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/recipes/:id ─────────────────────────────────────────────────────
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const recipe = await getFullRecipe(req.params.id, req.user?.id);
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });
    res.json(recipe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/recipes ────────────────────────────────────────────────────────
router.post(
  "/",
  requireAuth,
  [
    body("title").trim().isLength({ min: 2, max: 200 }),
    body("base_servings").isInt({ min: 1 }),
    body("ingredients").isArray({ min: 1 }),
    body("steps").isArray({ min: 1 }),
  ],
  async (req, res) => {
    if (validationCheck(req, res)) return;
    const { title, description, category, prep_time_min, cook_time_min,
            base_servings, cover_image_url, ingredients, steps, tags = [] } = req.body;

    try {
      const recipe = await db.transaction(async (client) => {
        // Создаём рецепт
        const { rows } = await client.query(
          `INSERT INTO recipes (user_id, title, description, category, prep_time_min, cook_time_min, base_servings, cover_image_url)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
          [req.user.id, title, description, category, prep_time_min || 0, cook_time_min || 0, base_servings, cover_image_url]
        );
        const recipe = rows[0];

        // Ингредиенты
        for (let i = 0; i < ingredients.length; i++) {
          const { name, amount, unit } = ingredients[i];
          await client.query(
            "INSERT INTO ingredients (recipe_id, name, amount, unit, sort_order) VALUES ($1,$2,$3,$4,$5)",
            [recipe.id, name, amount, unit || "г", i]
          );
        }

        // Шаги
        for (let i = 0; i < steps.length; i++) {
          await client.query(
            "INSERT INTO steps (recipe_id, step_number, instruction) VALUES ($1,$2,$3)",
            [recipe.id, i + 1, steps[i].instruction || steps[i].text]
          );
        }

        // Теги
        for (const tagName of tags) {
          const tagRes = await client.query(
            "INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id",
            [tagName.toLowerCase()]
          );
          await client.query(
            "INSERT INTO recipe_tags (recipe_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
            [recipe.id, tagRes.rows[0].id]
          );
        }

        return recipe;
      });

      const full = await getFullRecipe(recipe.id, req.user.id);
      res.status(201).json(full);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ─── PUT /api/recipes/:id ─────────────────────────────────────────────────────
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query("SELECT user_id FROM recipes WHERE id=$1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "Not found" });
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });

    const { title, description, category, prep_time_min, cook_time_min,
            base_servings, cover_image_url, ingredients, steps, tags } = req.body;

    await db.transaction(async (client) => {
      await client.query(
        `UPDATE recipes SET title=$1, description=$2, category=$3, prep_time_min=$4, cook_time_min=$5,
         base_servings=$6, cover_image_url=$7, updated_at=NOW() WHERE id=$8`,
        [title, description, category, prep_time_min, cook_time_min, base_servings, cover_image_url, req.params.id]
      );

      if (ingredients) {
        await client.query("DELETE FROM ingredients WHERE recipe_id=$1", [req.params.id]);
        for (let i = 0; i < ingredients.length; i++) {
          const { name, amount, unit } = ingredients[i];
          await client.query(
            "INSERT INTO ingredients (recipe_id, name, amount, unit, sort_order) VALUES ($1,$2,$3,$4,$5)",
            [req.params.id, name, amount, unit || "г", i]
          );
        }
      }

      if (steps) {
        await client.query("DELETE FROM steps WHERE recipe_id=$1", [req.params.id]);
        for (let i = 0; i < steps.length; i++) {
          await client.query(
            "INSERT INTO steps (recipe_id, step_number, instruction) VALUES ($1,$2,$3)",
            [req.params.id, i + 1, steps[i].instruction || steps[i].text]
          );
        }
      }
    });

    const full = await getFullRecipe(req.params.id, req.user.id);
    res.json(full);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── DELETE /api/recipes/:id ──────────────────────────────────────────────────
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query("SELECT user_id FROM recipes WHERE id=$1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "Not found" });
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });
    await db.query("DELETE FROM recipes WHERE id=$1", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/recipes/:id/rate ───────────────────────────────────────────────
router.post("/:id/rate", requireAuth, [body("score").isInt({ min: 1, max: 5 })], async (req, res) => {
  if (validationCheck(req, res)) return;
  try {
    await db.query(
      `INSERT INTO ratings (user_id, recipe_id, score) VALUES ($1,$2,$3)
       ON CONFLICT (user_id, recipe_id) DO UPDATE SET score=$3`,
      [req.user.id, req.params.id, req.body.score]
    );
    const { rows } = await db.query("SELECT avg_rating, rating_count FROM recipes WHERE id=$1", [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/recipes/:id/favorite ──────────────────────────────────────────
router.post("/:id/favorite", requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT 1 FROM favorites WHERE user_id=$1 AND recipe_id=$2",
      [req.user.id, req.params.id]
    );
    if (rows.length > 0) {
      await db.query("DELETE FROM favorites WHERE user_id=$1 AND recipe_id=$2", [req.user.id, req.params.id]);
      res.json({ favorited: false });
    } else {
      await db.query("INSERT INTO favorites (user_id, recipe_id) VALUES ($1,$2)", [req.user.id, req.params.id]);
      res.json({ favorited: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/recipes/:id/comments ───────────────────────────────────────────
router.get("/:id/comments", async (req, res) => {
  const { rows } = await db.query(
    `SELECT c.*, u.username, u.avatar_url FROM comments c
     JOIN users u ON u.id=c.user_id
     WHERE c.recipe_id=$1 ORDER BY c.created_at DESC`,
    [req.params.id]
  );
  res.json(rows);
});

// ─── POST /api/recipes/:id/comments ──────────────────────────────────────────
router.post("/:id/comments", requireAuth, [body("content").trim().isLength({ min: 1, max: 2000 })], async (req, res) => {
  if (validationCheck(req, res)) return;
  try {
    const { rows } = await db.query(
      "INSERT INTO comments (user_id, recipe_id, content) VALUES ($1,$2,$3) RETURNING *",
      [req.user.id, req.params.id, req.body.content]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
