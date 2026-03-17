const express = require("express");
const db = require("../db/pool");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ─── Middleware: только для администраторов ───────────────────────────────────
function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin")
    return res.status(403).json({ error: "Admin access required" });
  next();
}

router.use(requireAuth, requireAdmin);

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const [users, recipes, comments, chatMessages] = await Promise.all([
      db.query("SELECT COUNT(*) FROM users"),
      db.query("SELECT COUNT(*) FROM recipes"),
      db.query("SELECT COUNT(*) FROM comments"),
      db.query("SELECT COUNT(*) FROM chat_messages WHERE created_at > NOW() - INTERVAL '36 hours'"),
    ]);
    res.json({
      users: parseInt(users.rows[0].count),
      recipes: parseInt(recipes.rows[0].count),
      comments: parseInt(comments.rows[0].count),
      activeChats: parseInt(chatMessages.rows[0].count),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get("/users", async (req, res) => {
  try {
    const { search = "", limit = 50, offset = 0 } = req.query;
    const { rows } = await db.query(
      `SELECT id, username, email, role, email_verified, is_banned, created_at, last_seen,
              (SELECT COUNT(*) FROM recipes WHERE user_id=users.id) as recipes_count
       FROM users
       WHERE ($1 = '' OR username ILIKE $1 OR email ILIKE $1)
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [search ? `%${search}%` : "", parseInt(limit), parseInt(offset)]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── DELETE /api/admin/users/:id ─────────────────────────────────────────────
// Удалить пользователя и весь его контент
router.delete("/users/:id", async (req, res) => {
  if (req.params.id === req.user.id)
    return res.status(400).json({ error: "Нельзя удалить себя" });
  try {
    await db.query("DELETE FROM users WHERE id=$1", [req.params.id]);
    res.json({ message: "Пользователь удалён" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/admin/users/:id/ban ───────────────────────────────────────────
router.post("/users/:id/ban", async (req, res) => {
  try {
    const { rows } = await db.query(
      "UPDATE users SET is_banned=NOT is_banned WHERE id=$1 RETURNING is_banned",
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "User not found" });
    res.json({ banned: rows[0].is_banned });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/admin/users/:id/role ──────────────────────────────────────────
router.post("/users/:id/role", async (req, res) => {
  const { role } = req.body;
  if (!["user", "admin"].includes(role))
    return res.status(400).json({ error: "Invalid role" });
  try {
    await db.query("UPDATE users SET role=$1 WHERE id=$2", [role, req.params.id]);
    res.json({ message: "Роль обновлена" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/admin/chat ──────────────────────────────────────────────────────
// Вся переписка за последние 36 часов
router.get("/chat", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT cm.id, cm.content, cm.created_at,
              u.id as user_id, u.username, u.email
       FROM chat_messages cm
       JOIN users u ON u.id=cm.user_id
       ORDER BY cm.created_at DESC
       LIMIT 500`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── DELETE /api/admin/chat/:id ───────────────────────────────────────────────
router.delete("/chat/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM chat_messages WHERE id=$1", [req.params.id]);
    res.json({ message: "Сообщение удалено" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── DELETE /api/admin/recipes/:id ───────────────────────────────────────────
router.delete("/recipes/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM recipes WHERE id=$1", [req.params.id]);
    res.json({ message: "Рецепт удалён" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
