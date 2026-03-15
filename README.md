# 🍳 РецептБук

Веб-приложение для хранения и обмена домашними рецептами с умным калькулятором порций, поиском по ингредиентам и AI-функциями.

---

## Стек технологий

| Слой       | Технология                              |
|------------|-----------------------------------------|
| Frontend   | React 18 + Vite                         |
| Стили      | Vanilla CSS (CSS Variables)             |
| Backend    | Node.js + Express                       |
| База данных| PostgreSQL 15+                          |
| Кэш/Сессии | Redis                                   |
| AI         | OpenAI API (GPT-4o + Vision)            |
| Хранилище  | AWS S3 / Cloudinary (или локально)      |
| Деплой     | Railway / Render + Vercel               |

---

## Быстрый старт

### 1. База данных

```bash
# Создать БД
createdb recipedb

# Применить схему
psql recipedb -f backend/db/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Заполнить .env своими данными

npm install
npm run dev        # http://localhost:4000
```

### 3. Frontend

```bash
# В корне проекта
npm install
npm run dev        # http://localhost:5173
```

---

## Структура проекта

```
recipe-app/
├── src/                        # Frontend (React)
│   ├── App.jsx                 # Главный компонент, роутинг
│   ├── data/
│   │   └── mockData.js         # Мок-данные для разработки
│   ├── hooks/
│   │   ├── usePortions.js      # Калькулятор порций + smartRound
│   │   └── useIngredientMatch.js # Матчинг рецептов по ингредиентам
│   └── api/
│       └── client.js           # HTTP-клиент для API
│
├── backend/                    # Backend (Node.js + Express)
│   ├── server.js               # Точка входа
│   ├── db/
│   │   ├── pool.js             # PostgreSQL connection pool
│   │   └── schema.sql          # Миграция БД
│   ├── middleware/
│   │   └── auth.js             # JWT + bcrypt helpers
│   └── routes/
│       ├── auth.js             # /api/auth/*
│       ├── recipes.js          # /api/recipes/*
│       ├── users.js            # /api/users/*
│       ├── match.js            # /api/match
│       └── ai.js               # /api/ai/*
│
├── index.html
├── vite.config.js
└── package.json
```

---

## API Reference

### Авторизация
```
POST /api/auth/register    { username, email, password }
POST /api/auth/login       { email, password }
POST /api/auth/refresh     { refreshToken }
POST /api/auth/logout
```

### Рецепты
```
GET  /api/recipes           ?search=&category=&mood=&sort=newest|rating|popular&limit=&offset=
GET  /api/recipes/:id
POST /api/recipes           { title, description, category, prep_time_min, cook_time_min,
                              base_servings, cover_image_url, ingredients[], steps[], tags[] }
PUT  /api/recipes/:id
DEL  /api/recipes/:id
POST /api/recipes/:id/rate       { score: 1-5 }
POST /api/recipes/:id/favorite
GET  /api/recipes/:id/comments
POST /api/recipes/:id/comments   { content }
```

### Пользователи
```
GET  /api/users/me
PUT  /api/users/me          { bio, avatar_url }
GET  /api/users/:id
GET  /api/users/:id/recipes
GET  /api/users/me/favorites
```

### Матчинг ингредиентов
```
POST /api/match             { ingredients: ["яйца", "молоко", ...], limit? }
POST /api/match/shopping-list  { recipeIds[], userIngredients[] }
```

### AI (требует OPENAI_API_KEY)
```
POST /api/ai/analyze-photo       multipart/form-data, поле photo
POST /api/ai/suggest-substitute  { ingredient, recipe_context? }
POST /api/ai/generate-recipe     { ingredients[], mood? }
```

---

## Ключевые алгоритмы

### Умное округление (smartRound)

```js
// Результаты пересчёта выглядят естественно:
// 0.8 яйца  → 1 яйцо
// 137 г муки → 140 г
// 2.6 ч.л.  → 2.5 ч.л.
function smartRound(value, unit) {
  if (isCountable(unit)) return roundToFraction(value); // ½, ¾ ...
  if (value < 10)  return round(value, 0.5);
  if (value < 100) return round(value, 5);
  if (value < 500) return round(value, 10);
  return round(value, 50);
}
```

### Матчинг ингредиентов

Три режима совпадения:
- **✅ Полное** — не хватает 0 ингредиентов
- **🛒 Почти** — не хватает 1–2 ингредиентов → список покупок
- **✨ Импровизация** — не хватает 3+ → AI предлагает замену

Нечёткое сравнение: учитывает ё→е, окончания слов (первые 4 буквы).

---

## Переменные окружения (.env)

```
DATABASE_URL=postgresql://user:password@localhost:5432/recipedb
JWT_SECRET=your_secret_here
JWT_REFRESH_SECRET=another_secret_here
REDIS_URL=redis://localhost:6379
PORT=4000
NODE_ENV=development
OPENAI_API_KEY=sk-...        # опционально, для AI
AWS_ACCESS_KEY_ID=           # опционально, для S3
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=
```

---

## Деплой на Railway

```bash
# Backend
railway init
railway add postgresql
railway add redis
railway deploy --service backend

# Frontend (Vercel)
vercel --prod
```

---

## Дальнейшие улучшения

- [ ] Загрузка фото рецептов (Multer + S3/Cloudinary)
- [ ] Push-уведомления (Web Push API)
- [ ] Экспорт рецепта в PDF
- [ ] Мобильное приложение (React Native)
- [ ] Webhook для автопубликации в Telegram-канал
- [ ] Плагин для импорта рецептов с популярных сайтов
- [ ] Nutritional info через USDA API
