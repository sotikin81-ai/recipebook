const express = require("express");
const multer = require("multer");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ─── Проверка наличия OpenAI ──────────────────────────────────────────────────
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");
  const { OpenAI } = require("openai");
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ─── POST /api/ai/analyze-photo ───────────────────────────────────────────────
// Принимает фото, возвращает список продуктов
router.post("/analyze-photo", requireAuth, upload.single("photo"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No photo uploaded" });

  try {
    const openai = getOpenAI();
    const base64 = req.file.buffer.toString("base64");
    const mediaType = req.file.mimetype;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 500,
      messages: [{
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mediaType};base64,${base64}` },
          },
          {
            type: "text",
            text: `Ты помощник для кулинарного приложения. Посмотри на фотографию и перечисли все видимые продукты и ингредиенты.
Отвечай ТОЛЬКО в формате JSON:
{
  "ingredients": ["продукт1", "продукт2", ...],
  "confidence": "high" | "medium" | "low"
}
Используй названия на русском языке. Перечисляй только то, что явно видно.`,
          },
        ],
      }],
    });

    const text = response.choices[0].message.content;
    // Убираем ```json обёртку если есть
    const clean = text.replace(/```json\n?|```/g, "").trim();
    const parsed = JSON.parse(clean);
    res.json(parsed);
  } catch (err) {
    if (err.message === "OPENAI_API_KEY not configured") {
      return res.status(503).json({ error: "AI service not configured" });
    }
    console.error("AI analyze-photo error:", err);
    res.status(500).json({ error: "Failed to analyze photo" });
  }
});

// ─── POST /api/ai/suggest-substitute ─────────────────────────────────────────
// Предлагает замену ингредиента
router.post("/suggest-substitute", async (req, res) => {
  const { ingredient, recipe_context } = req.body;
  if (!ingredient) return res.status(400).json({ error: "ingredient required" });

  try {
    const openai = getOpenAI();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `Ты кулинарный помощник. Мне нужна замена для ингредиента "${ingredient}" в рецепте${recipe_context ? ` "${recipe_context}"` : ""}.
Отвечай ТОЛЬКО в формате JSON:
{
  "substitutes": [
    { "name": "название замены", "ratio": "пропорция замены", "note": "короткая заметка" }
  ]
}
Дай 2-3 варианта замены на русском языке.`,
      }],
    });

    const text = response.choices[0].message.content;
    const clean = text.replace(/```json\n?|```/g, "").trim();
    res.json(JSON.parse(clean));
  } catch (err) {
    if (err.message === "OPENAI_API_KEY not configured") {
      return res.status(503).json({ error: "AI service not configured" });
    }
    console.error("AI suggest-substitute error:", err);
    res.status(500).json({ error: "Failed to get substitutes" });
  }
});

// ─── POST /api/ai/generate-recipe ────────────────────────────────────────────
// Генерирует рецепт из набора ингредиентов
router.post("/generate-recipe", requireAuth, async (req, res) => {
  const { ingredients = [], mood } = req.body;
  if (ingredients.length < 2) return res.status(400).json({ error: "Need at least 2 ingredients" });

  try {
    const openai = getOpenAI();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `Придумай рецепт блюда из следующих ингредиентов: ${ingredients.join(", ")}.${mood ? ` Настроение/occasion: ${mood}.` : ""}
Отвечай ТОЛЬКО в формате JSON:
{
  "title": "название рецепта",
  "description": "краткое описание",
  "category": "категория",
  "prep_time_min": число,
  "cook_time_min": число,
  "servings": число,
  "ingredients": [{"name": "...", "amount": число, "unit": "г/мл/шт/..."}],
  "steps": [{"step": 1, "instruction": "..."}]
}
Рецепт должен быть реалистичным и вкусным. Все поля на русском языке.`,
      }],
    });

    const text = response.choices[0].message.content;
    const clean = text.replace(/```json\n?|```/g, "").trim();
    res.json(JSON.parse(clean));
  } catch (err) {
    if (err.message === "OPENAI_API_KEY not configured") {
      return res.status(503).json({ error: "AI service not configured" });
    }
    console.error("AI generate-recipe error:", err);
    res.status(500).json({ error: "Failed to generate recipe" });
  }
});

module.exports = router;
