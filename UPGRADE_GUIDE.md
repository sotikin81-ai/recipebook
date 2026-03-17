# РецептБук v2 — Инструкция по обновлению

## Что добавляем

1. Регистрация с подтверждением email
2. Восстановление пароля
3. Общий чат для пользователей (сообщения 36 часов)
4. Административная панель

---

## Шаг 1 — Обновить базу данных

Railway → Postgres → Database → вкладка Data → нажми кнопку редактора SQL
(или Connect → Query) → вставь содержимое файла `backend/db/schema_v2.sql` → Run

Потом установите себя администратором:
```sql
UPDATE users SET role='admin', email_verified=true
WHERE email='ВАШ_EMAIL@example.com';
```

---

## Шаг 2 — Добавить переменные в Railway

Railway → recipebook → Variables → добавить:

```
APP_URL = https://recipebook-production-4182.up.railway.app
```

Для email (выберите один вариант):

### Вариант А — Resend (рекомендуется, бесплатно 3000 писем/мес)
1. Зарегистрируйтесь на resend.com
2. Создайте API ключ
3. Добавьте в Railway:
```
RESEND_API_KEY = re_xxxxxxxxxxxxxxxx
EMAIL_FROM = РецептБук <noreply@resend.dev>
```

### Вариант Б — Gmail SMTP
1. Gmail → Настройки → Безопасность → Двухфакторная аутентификация
2. Создайте "Пароль приложения"
3. Добавьте в Railway:
```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = ваш@gmail.com
SMTP_PASS = пароль_приложения
EMAIL_FROM = РецептБук <ваш@gmail.com>
```

---

## Шаг 3 — Скопировать файлы в репозиторий

Из архива скопировать в папки репозитория:

```
recipe-v2/backend/routes/auth.js      → recipebook/backend/routes/auth.js
recipe-v2/backend/routes/chat.js      → recipebook/backend/routes/chat.js  (новый)
recipe-v2/backend/routes/admin.js     → recipebook/backend/routes/admin.js (новый)
recipe-v2/backend/services/email.js   → recipebook/backend/services/email.js (новая папка)
recipe-v2/backend/server.js           → recipebook/backend/server.js
recipe-v2/package.json                → recipebook/package.json
recipe-v2/backend/db/schema_v2.sql    → для справки (уже выполнили в шаге 1)

recipe-v2/src/AuthPages.jsx           → recipebook/src/AuthPages.jsx  (новый)
recipe-v2/src/ChatPage.jsx            → recipebook/src/ChatPage.jsx   (новый)
recipe-v2/src/AdminPage.jsx           → recipebook/src/AdminPage.jsx  (новый)
```

---

## Шаг 4 — Обновить App.jsx

В файле `src/App.jsx` нужно добавить:

1. Импорты вверху файла:
```js
import { RegisterPage, LoginPage, ForgotPasswordPage, ResetPasswordPage, authCss } from "./AuthPages";
import { ChatPage, chatCss } from "./ChatPage";
import { AdminPage, adminCss } from "./AdminPage";
```

2. В блок `<style>` добавить:
```js
{authCss}{chatCss}{adminCss}
```

3. В `useState` для page добавить варианты: "login", "register", "forgot", "reset", "chat", "admin"

4. В nav добавить кнопки Чат и Войти (если не авторизован)

5. В main добавить рендер новых страниц

---

## Шаг 5 — GitHub Desktop → Commit → Push

Railway автоматически пересоберёт проект за ~2 минуты.

---

## Как работает email в dev-режиме

Если RESEND_API_KEY и SMTP_HOST не заданы — письма выводятся в Deploy Logs Railway.
Ссылку для подтверждения можно скопировать оттуда.

---

## Первый вход после обновления

Старые пользователи (из мок-данных) не имеют email_verified=true.
Чтобы войти, нужно зарегистрироваться заново через новую форму.

Для себя (администратора) — выполните SQL из шага 1.
