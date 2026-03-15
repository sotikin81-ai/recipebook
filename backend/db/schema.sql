-- ═══════════════════════════════════════════════════════════════
-- РецептБук — схема базы данных
-- Запустить: psql $DATABASE_URL -f db/schema.sql
-- ═══════════════════════════════════════════════════════════════

-- Расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- для полнотекстового поиска

-- ───────────────────────────────────────────────────────────────
-- Пользователи
-- ───────────────────────────────────────────────────────────────
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username     VARCHAR(50)  NOT NULL UNIQUE,
  email        VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url   TEXT,
  bio          TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- Рецепты
-- ───────────────────────────────────────────────────────────────
CREATE TABLE recipes (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title          VARCHAR(200) NOT NULL,
  description    TEXT,
  category       VARCHAR(50),
  prep_time_min  INT DEFAULT 0,
  cook_time_min  INT DEFAULT 0,
  base_servings  INT DEFAULT 2,
  cover_image_url TEXT,
  avg_rating     NUMERIC(3,2) DEFAULT 0,
  rating_count   INT DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Полнотекстовый поиск
  search_vector  TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('russian', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) STORED
);

CREATE INDEX idx_recipes_user_id     ON recipes(user_id);
CREATE INDEX idx_recipes_category    ON recipes(category);
CREATE INDEX idx_recipes_created_at  ON recipes(created_at DESC);
CREATE INDEX idx_recipes_search      ON recipes USING GIN(search_vector);
CREATE INDEX idx_recipes_title_trgm  ON recipes USING GIN(title gin_trgm_ops);

-- ───────────────────────────────────────────────────────────────
-- Ингредиенты
-- ───────────────────────────────────────────────────────────────
CREATE TABLE ingredients (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id  UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name       VARCHAR(200) NOT NULL,
  amount     NUMERIC(10,3) NOT NULL,
  unit       VARCHAR(30) NOT NULL DEFAULT 'г',
  sort_order INT DEFAULT 0
);

CREATE INDEX idx_ingredients_recipe_id ON ingredients(recipe_id);
CREATE INDEX idx_ingredients_name_trgm ON ingredients USING GIN(name gin_trgm_ops);

-- ───────────────────────────────────────────────────────────────
-- Шаги приготовления
-- ───────────────────────────────────────────────────────────────
CREATE TABLE steps (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id   UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  instruction TEXT NOT NULL,
  image_url   TEXT
);

CREATE INDEX idx_steps_recipe_id ON steps(recipe_id);

-- ───────────────────────────────────────────────────────────────
-- Теги
-- ───────────────────────────────────────────────────────────────
CREATE TABLE tags (
  id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE recipe_tags (
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  tag_id    UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);

-- ───────────────────────────────────────────────────────────────
-- Настроение / Mood
-- ───────────────────────────────────────────────────────────────
CREATE TABLE mood_tags (
  id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  emoji VARCHAR(10)
);

CREATE TABLE recipe_moods (
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  mood_id   UUID NOT NULL REFERENCES mood_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, mood_id)
);

-- ───────────────────────────────────────────────────────────────
-- Избранное
-- ───────────────────────────────────────────────────────────────
CREATE TABLE favorites (
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  saved_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, recipe_id)
);

-- ───────────────────────────────────────────────────────────────
-- Оценки
-- ───────────────────────────────────────────────────────────────
CREATE TABLE ratings (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  score     SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, recipe_id)
);

CREATE INDEX idx_ratings_recipe_id ON ratings(recipe_id);

-- Автоматически пересчитываем средний рейтинг рецепта
CREATE OR REPLACE FUNCTION update_recipe_rating() RETURNS TRIGGER AS $$
BEGIN
  UPDATE recipes SET
    avg_rating   = (SELECT AVG(score)::NUMERIC(3,2) FROM ratings WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)),
    rating_count = (SELECT COUNT(*) FROM ratings WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id))
  WHERE id = COALESCE(NEW.recipe_id, OLD.recipe_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_rating
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_recipe_rating();

-- ───────────────────────────────────────────────────────────────
-- Комментарии
-- ───────────────────────────────────────────────────────────────
CREATE TABLE comments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id  UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_recipe_id ON comments(recipe_id);

-- ───────────────────────────────────────────────────────────────
-- Refresh tokens
-- ───────────────────────────────────────────────────────────────
CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- ───────────────────────────────────────────────────────────────
-- Начальные данные (mood теги)
-- ───────────────────────────────────────────────────────────────
INSERT INTO mood_tags (name, emoji) VALUES
  ('ленивый', '😴'),
  ('быстро', '⚡'),
  ('фитнес', '💪'),
  ('к пиву', '🍺'),
  ('свидание', '🍷'),
  ('семья', '👨‍👩‍👧'),
  ('ночной перекус', '🌙');
