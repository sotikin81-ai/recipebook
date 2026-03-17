const express = require("express");
const { body, validationResult } = require("express-validator");
const crypto = require("crypto");
const db = require("../db/pool");
const {
  signAccessToken, signRefreshToken, verifyRefreshToken,
  hashToken, hashPassword, comparePassword, requireAuth,
} = require("../middleware/auth");
const { sendEmail } = require("../services/email");

const router = express.Router();

function check(req, res) {
  const e = validationResult(req);
  if (!e.isEmpty()) { res.status(400).json({ errors: e.array() }); return true; }
  return false;
}

// ─── Регистрация ──────────────────────────────────────────────────────────────
router.post("/register",
  [
    body("username").trim().isLength({ min: 3, max: 50 }).withMessage("Имя 3–50 символов"),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Пароль минимум 6 символов"),
  ],
  async (req, res) => {
    if (check(req, res)) return;
    const { username, email, password } = req.body;
    try {
      const exists = await db.query(
        "SELECT id FROM users WHERE email=$1 OR username=$2", [email, username]
      );
      if (exists.rows.length > 0)
        return res.status(409).json({ error: "Email или имя пользователя уже заняты" });

      const passwordHash = await hashPassword(password);
      const verifyToken = crypto.randomBytes(32).toString("hex");

      // Проверяем — первый ли это пользователь (становится админом)
      const countRes = await db.query("SELECT COUNT(*) FROM users");
      const isFirstUser = parseInt(countRes.rows[0].count) === 0;
      const role = isFirstUser || email === process.env.ADMIN_EMAIL ? "admin" : "user";

      const { rows } = await db.query(
        `INSERT INTO users (username, email, password_hash, email_verification_token,
         email_verification_expires, role)
         VALUES ($1,$2,$3,$4, NOW()+INTERVAL '24 hours',$5)
         RETURNING id, username, email, role`,
        [username, email, passwordHash, verifyToken, role]
      );
      const user = rows[0];

      const appUrl = process.env.APP_URL || "https://recipebook-production-4182.up.railway.app";
      const verifyUrl = `${appUrl}/api/auth/verify-email?token=${verifyToken}`;

      await sendEmail({
        to: email,
        subject: "Подтвердите email — РецептБук 🍳",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#C4623A">Добро пожаловать, ${username}!</h2>
            <p>Вы зарегистрировались на РецептБук. Нажмите кнопку для подтверждения почты:</p>
            <a href="${verifyUrl}"
               style="display:inline-block;background:#C4623A;color:#fff;padding:12px 28px;
                      border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
              Подтвердить email
            </a>
            <p style="color:#888;font-size:13px">Ссылка действительна 24 часа.</p>
          </div>
        `,
      });

      res.status(201).json({
        message: "Регистрация успешна! Проверьте почту.",
        userId: user.id,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ─── Подтверждение email ──────────────────────────────────────────────────────
router.get("/verify-email", async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: "Token required" });
  try {
    const { rows } = await db.query(
      `UPDATE users
       SET email_verified=true, email_verification_token=null, email_verification_expires=null
       WHERE email_verification_token=$1 AND email_verification_expires > NOW()
       RETURNING id, username, email, role`,
      [token]
    );
    if (rows.length === 0)
      return res.redirect(`${process.env.APP_URL || ""}/?error=invalid_token`);

    const user = rows[0];
    const accessToken = signAccessToken({ id: user.id, username: user.username, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });
    await db.query(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2, NOW()+INTERVAL '30 days')",
      [user.id, hashToken(refreshToken)]
    );

    const appUrl = process.env.APP_URL || "";
    res.redirect(`${appUrl}/?verified=true&access=${accessToken}&refresh=${refreshToken}`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Повторная отправка письма ────────────────────────────────────────────────
router.post("/resend-verification",
  [body("email").isEmail().normalizeEmail()],
  async (req, res) => {
    if (check(req, res)) return;
    res.json({ message: "Если аккаунт существует, письмо отправлено" });
    try {
      const { rows } = await db.query(
        "SELECT id, username, email_verified FROM users WHERE email=$1", [req.body.email]
      );
      if (!rows[0] || rows[0].email_verified) return;
      const verifyToken = crypto.randomBytes(32).toString("hex");
      await db.query(
        "UPDATE users SET email_verification_token=$1, email_verification_expires=NOW()+INTERVAL '24 hours' WHERE id=$2",
        [verifyToken, rows[0].id]
      );
      const appUrl = process.env.APP_URL || "";
      await sendEmail({
        to: req.body.email,
        subject: "Подтвердите email — РецептБук",
        html: `<a href="${appUrl}/api/auth/verify-email?token=${verifyToken}">Подтвердить email</a>`,
      });
    } catch (err) { console.error(err); }
  }
);

// ─── Вход ─────────────────────────────────────────────────────────────────────
router.post("/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  async (req, res) => {
    if (check(req, res)) return;
    const { email, password } = req.body;
    try {
      const { rows } = await db.query(
        "SELECT id, username, email, password_hash, email_verified, role, avatar_url, bio FROM users WHERE email=$1",
        [email]
      );
      const user = rows[0];
      if (!user) return res.status(401).json({ error: "Неверный email или пароль" });

      const valid = await comparePassword(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: "Неверный email или пароль" });

      if (!user.email_verified)
        return res.status(403).json({
          error: "Подтвердите email перед входом",
          code: "EMAIL_NOT_VERIFIED",
        });

      const { password_hash, ...safeUser } = user;
      const accessToken = signAccessToken({ id: user.id, username: user.username, email: user.email, role: user.role });
      const refreshToken = signRefreshToken({ id: user.id });
      await db.query(
        "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2, NOW()+INTERVAL '30 days')",
        [user.id, hashToken(refreshToken)]
      );
      res.json({ user: safeUser, accessToken, refreshToken });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ─── Забыл пароль ─────────────────────────────────────────────────────────────
router.post("/forgot-password",
  [body("email").isEmail().normalizeEmail()],
  async (req, res) => {
    if (check(req, res)) return;
    res.json({ message: "Если такой email зарегистрирован, письмо отправлено" });
    try {
      const { rows } = await db.query(
        "SELECT id, username FROM users WHERE email=$1 AND email_verified=true", [req.body.email]
      );
      if (!rows[0]) return;
      const resetToken = crypto.randomBytes(32).toString("hex");
      await db.query(
        "UPDATE users SET password_reset_token=$1, password_reset_expires=NOW()+INTERVAL '1 hour' WHERE id=$2",
        [resetToken, rows[0].id]
      );
      const appUrl = process.env.APP_URL || "";
      await sendEmail({
        to: req.body.email,
        subject: "Восстановление пароля — РецептБук",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#C4623A">Восстановление пароля</h2>
            <p>Нажмите кнопку для сброса пароля (ссылка действительна 1 час):</p>
            <a href="${appUrl}/reset-password?token=${resetToken}"
               style="display:inline-block;background:#C4623A;color:#fff;padding:12px 28px;
                      border-radius:8px;text-decoration:none;font-weight:600">
              Сбросить пароль
            </a>
            <p style="color:#888;font-size:13px">Если вы не запрашивали сброс — игнорируйте это письмо.</p>
          </div>
        `,
      });
    } catch (err) { console.error(err); }
  }
);

// ─── Сброс пароля ─────────────────────────────────────────────────────────────
router.post("/reset-password",
  [body("token").notEmpty(), body("password").isLength({ min: 6 })],
  async (req, res) => {
    if (check(req, res)) return;
    try {
      const { rows } = await db.query(
        "SELECT id FROM users WHERE password_reset_token=$1 AND password_reset_expires > NOW()",
        [req.body.token]
      );
      if (rows.length === 0)
        return res.status(400).json({ error: "Ссылка недействительна или истекла" });

      const passwordHash = await hashPassword(req.body.password);
      await db.query(
        "UPDATE users SET password_hash=$1, password_reset_token=null, password_reset_expires=null WHERE id=$2",
        [passwordHash, rows[0].id]
      );
      await db.query("DELETE FROM refresh_tokens WHERE user_id=$1", [rows[0].id]);
      res.json({ message: "Пароль успешно изменён" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ─── Обновление токена ────────────────────────────────────────────────────────
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "refreshToken required" });
  try {
    const payload = verifyRefreshToken(refreshToken);
    const { rows } = await db.query(
      "SELECT id FROM refresh_tokens WHERE token_hash=$1 AND expires_at > NOW()",
      [hashToken(refreshToken)]
    );
    if (rows.length === 0) return res.status(401).json({ error: "Token revoked" });
    const userRow = await db.query(
      "SELECT id, username, email, role FROM users WHERE id=$1", [payload.id]
    );
    const user = userRow.rows[0];
    if (!user) return res.status(401).json({ error: "User not found" });
    const newAccessToken = signAccessToken({ id: user.id, username: user.username, email: user.email, role: user.role });
    res.json({ accessToken: newAccessToken });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// ─── Выход ────────────────────────────────────────────────────────────────────
router.post("/logout", requireAuth, async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await db.query("DELETE FROM refresh_tokens WHERE token_hash=$1", [hashToken(refreshToken)]).catch(() => {});
  }
  res.json({ message: "Logged out" });
});

module.exports = router;
