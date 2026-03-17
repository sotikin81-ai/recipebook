require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const path     = require("path");
const helmet   = require("helmet");
const rateLimit = require("express-rate-limit");
const db       = require("./db/pool");

const authRoutes   = require("./routes/auth");
const recipeRoutes = require("./routes/recipes");
const userRoutes   = require("./routes/users");
const matchRoutes  = require("./routes/match");
const aiRoutes     = require("./routes/ai");
const chatRoutes   = require("./routes/chat");
const adminRoutes  = require("./routes/admin");

const app  = express();
const PORT = process.env.PORT || 8080;

// ─── Безопасность ─────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // отключаем для SPA
  crossOriginEmbedderPolicy: false,
}));

// ─── Rate limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 200,
  message: { error: "Слишком много запросов, попробуйте позже" },
});

// Строже для auth эндпоинтов
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Слишком много попыток входа, подождите 15 минут" },
});

app.use(limiter);
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── API роуты ────────────────────────────────────────────────────────────────
app.use("/api/auth",    authLimiter, authRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/users",   userRoutes);
app.use("/api/match",   matchRoutes);
app.use("/api/ai",      aiRoutes);
app.use("/api/chat",    chatRoutes);
app.use("/api/admin",   adminRoutes);

app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

// ─── Фронтенд ─────────────────────────────────────────────────────────────────
const DIST = path.join(__dirname, "..", "dist");
app.use(express.static(DIST));
app.get("*", (_req, res) => res.sendFile(path.join(DIST, "index.html")));

// ─── Автоудаление старых сообщений чата ──────────────────────────────────────
async function cleanupOldChatMessages() {
  try {
    const result = await db.query(
      "DELETE FROM chat_messages WHERE created_at < NOW() - INTERVAL '36 hours'"
    );
    if (result.rowCount > 0)
      console.log(`🧹 Удалено ${result.rowCount} старых сообщений чата`);
  } catch (err) {
    console.error("Chat cleanup error:", err.message);
  }
}

// Запускаем при старте и каждые 6 часов
cleanupOldChatMessages();
setInterval(cleanupOldChatMessages, 6 * 60 * 60 * 1000);

// ─── Запуск ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🍳 РецептБук запущен на порту ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`   App URL: ${process.env.APP_URL || `http://localhost:${PORT}`}`);
});

module.exports = app;
