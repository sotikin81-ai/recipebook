-- ═══════════════════════════════════════════════════════════════
-- РецептБук v2 — Дополнения к схеме БД
-- Выполнить в Railway → Postgres → Database → Query
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- Обновление таблицы users (добавляем новые поля)
-- ───────────────────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified          BOOLEAN     DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS password_reset_token    VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password_reset_expires  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS role                    VARCHAR(20)  DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS is_banned               BOOLEAN     DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_seen               TIMESTAMPTZ;

-- Первый зарегистрированный пользователь — администратор
-- (или установите вручную через SQL ниже)
-- UPDATE users SET role='admin', email_verified=true WHERE email='ваш@email.com';

-- ───────────────────────────────────────────────────────────────
-- Чат
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id    ON chat_messages(user_id);

-- ───────────────────────────────────────────────────────────────
-- Автоудаление старых сообщений чата (через pg_cron если доступен)
-- Если pg_cron недоступен — удаление происходит в коде сервера
-- ───────────────────────────────────────────────────────────────
-- SELECT cron.schedule('delete-old-chat', '0 */6 * * *',
--   $$DELETE FROM chat_messages WHERE created_at < NOW() - INTERVAL '36 hours'$$);

-- ───────────────────────────────────────────────────────────────
-- Проверка что всё создалось
-- ───────────────────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
