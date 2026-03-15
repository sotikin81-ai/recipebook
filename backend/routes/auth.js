const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../db/pool");
const {
  signAccessToken, signRefreshToken, verifyRefreshToken,
  hashToken, hashPassword, comparePassword, requireAuth,
} = require("../middleware/auth");

const router = express.Router();

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post(
  "/register",
  [
    body("username").trim().isLength({ min: 3, max: 50 }).withMessage("Username 3-50 символов"),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Пароль минимум 6 символов"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, email, password } = req.body;

    try {
      // Проверяем уникальность
      const exists = await db.query(
        "SELECT id FROM users WHERE email=$1 OR username=$2",
        [email, username]
      );
      if (exists.rows.length > 0) {
        return res.status(409).json({ error: "Email или имя пользователя уже заняты" });
      }

      const passwordHash = await hashPassword(password);
      const { rows } = await db.query(
        "INSERT INTO users (username, email, password_hash) VALUES ($1,$2,$3) RETURNING id, username, email, created_at",
        [username, email, passwordHash]
      );
      const user = rows[0];

      const accessToken  = signAccessToken({ id: user.id, username: user.username, email: user.email });
      const refreshToken = signRefreshToken({ id: user.id });
      await db.query(
        "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2, NOW() + INTERVAL '30 days')",
        [user.id, hashToken(refreshToken)]
      );

      res.status(201).json({ user, accessToken, refreshToken });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      const { rows } = await db.query(
        "SELECT id, username, email, password_hash, avatar_url, bio FROM users WHERE email=$1",
        [email]
      );
      const user = rows[0];
      if (!user) return res.status(401).json({ error: "Неверный email или пароль" });

      const valid = await comparePassword(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: "Неверный email или пароль" });

      const { password_hash, ...safeUser } = user;
      const accessToken  = signAccessToken({ id: user.id, username: user.username, email: user.email });
      const refreshToken = signRefreshToken({ id: user.id });

      await db.query(
        "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2, NOW() + INTERVAL '30 days')",
        [user.id, hashToken(refreshToken)]
      );

      res.json({ user: safeUser, accessToken, refreshToken });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "refreshToken required" });

  try {
    const payload = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);
    const { rows } = await db.query(
      "SELECT id FROM refresh_tokens WHERE token_hash=$1 AND expires_at > NOW()",
      [tokenHash]
    );
    if (rows.length === 0) return res.status(401).json({ error: "Token revoked or expired" });

    const userRow = await db.query("SELECT id, username, email FROM users WHERE id=$1", [payload.id]);
    const user = userRow.rows[0];
    if (!user) return res.status(401).json({ error: "User not found" });

    const newAccessToken = signAccessToken({ id: user.id, username: user.username, email: user.email });
    res.json({ accessToken: newAccessToken });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post("/logout", requireAuth, async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await db.query("DELETE FROM refresh_tokens WHERE token_hash=$1", [hashToken(refreshToken)]).catch(() => {});
  }
  res.json({ message: "Logged out" });
});

module.exports = router;
