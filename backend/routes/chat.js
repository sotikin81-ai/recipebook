const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../db/pool");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ─── GET /api/chat/messages ───────────────────────────────────────────────────
// Получить последние 100 сообщений (только для авторизованных)
router.get("/messages", requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT cm.id, cm.content, cm.created_at,
              u.id as user_id, u.username, u.avatar_url
       FROM chat_messages cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.created_at > NOW() - INTERVAL '36 hours'
       ORDER BY cm.created_at ASC
       LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/chat/messages ──────────────────────────────────────────────────
// Отправить сообщение
router.post("/messages",
  requireAuth,
  [body("content").trim().isLength({ min: 1, max: 1000 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { rows } = await db.query(
        `INSERT INTO chat_messages (user_id, content)
         VALUES ($1, $2)
         RETURNING id, content, created_at`,
        [req.user.id, req.body.content]
      );

      const msg = rows[0];
      // Возвращаем с данными пользователя
      res.status(201).json({
        ...msg,
        user_id: req.user.id,
        username: req.user.username,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ─── DELETE /api/chat/messages/:id ───────────────────────────────────────────
// Удалить своё сообщение (или любое — для админа)
router.delete("/messages/:id", requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT user_id FROM chat_messages WHERE id=$1", [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Message not found" });

    if (rows[0].user_id !== req.user.id && req.user.role !== "admin")
      return res.status(403).json({ error: "Forbidden" });

    await db.query("DELETE FROM chat_messages WHERE id=$1", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/chat/online ─────────────────────────────────────────────────────
// Список онлайн пользователей (активных за последние 5 минут)
router.get("/online", requireAuth, async (req, res) => {
  try {
    // Обновляем last_seen для текущего пользователя
    await db.query(
      "UPDATE users SET last_seen=NOW() WHERE id=$1", [req.user.id]
    );
    const { rows } = await db.query(
      `SELECT id, username, avatar_url
       FROM users
       WHERE last_seen > NOW() - INTERVAL '5 minutes'
       ORDER BY username`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
