try { require("dotenv").config(); } catch(e) {}
const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes   = require("./routes/auth");
const recipeRoutes = require("./routes/recipes");
const userRoutes   = require("./routes/users");
const matchRoutes  = require("./routes/match");
const aiRoutes     = require("./routes/ai");

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── API роуты ────────────────────────────────────────────────────────────────
app.use("/api/auth",    authRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/users",   userRoutes);
app.use("/api/match",   matchRoutes);
app.use("/api/ai",      aiRoutes);
app.get("/api/health",  (_req, res) => res.json({ status: "ok" }));

// ── Раздаём собранный фронтенд ───────────────────────────────────────────────
// После `npm run build` фронтенд оказывается в папке dist/
const DIST = path.join(__dirname, "..", "dist");
app.use(express.static(DIST));

// Все остальные URL → index.html (SPA-роутинг)
app.get("*", (_req, res) => {
  res.sendFile(path.join(DIST, "index.html"));
});

app.listen(PORT, () => {
  console.log(`🍳 РецептБук запущен на порту ${PORT}`);
});

module.exports = app;
