const express = require("express");
const db = require("../db/pool");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ─── GET /api/users/:id ───────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT id, username, avatar_url, bio, created_at FROM users WHERE id=$1",
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "User not found" });

    const countRes = await db.query(
      "SELECT COUNT(*) FROM recipes WHERE user_id=$1",
      [req.params.id]
    );
    rows[0].recipes_count = parseInt(countRes.rows[0].count);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/users/me ────────────────────────────────────────────────────────
router.get("/me", requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT id, username, email, avatar_url, bio, created_at FROM users WHERE id=$1",
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── PUT /api/users/me ────────────────────────────────────────────────────────
router.put("/me", requireAuth, async (req, res) => {
  const { bio, avatar_url } = req.body;
  try {
    const { rows } = await db.query(
      "UPDATE users SET bio=$1, avatar_url=$2, updated_at=NOW() WHERE id=$3 RETURNING id, username, email, avatar_url, bio",
      [bio, avatar_url, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/users/:id/recipes ───────────────────────────────────────────────
router.get("/:id/recipes", async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const { rows } = await db.query(
      `SELECT r.id, r.title, r.category, r.cover_image_url, r.avg_rating, r.rating_count,
              r.prep_time_min, r.cook_time_min, r.base_servings, r.created_at
       FROM recipes r
       WHERE r.user_id=$1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.params.id, parseInt(limit), parseInt(offset)]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/users/me/favorites ─────────────────────────────────────────────
router.get("/me/favorites", requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT r.id, r.title, r.category, r.cover_image_url, r.avg_rating, r.rating_count,
              r.prep_time_min, r.cook_time_min, r.base_servings, r.created_at, f.saved_at
       FROM favorites f
       JOIN recipes r ON r.id=f.recipe_id
       WHERE f.user_id=$1
       ORDER BY f.saved_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
