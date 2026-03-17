import { useState } from "react";

// ─── Общие стили ──────────────────────────────────────────────────────────────
export const authCss = `
.auth-wrap {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: var(--cream); padding: 24px;
}
.auth-card {
  background: var(--warm-white); border-radius: var(--radius);
  padding: 40px; width: 100%; max-width: 420px;
  box-shadow: var(--shadow-lg);
}
.auth-logo {
  font-family: var(--font-display); font-size: 26px; font-weight: 700;
  color: var(--terracotta); text-align: center; margin-bottom: 8px;
}
.auth-logo span { color: var(--ink); }
.auth-subtitle { text-align: center; color: var(--ink-60); font-size: 14px; margin-bottom: 32px; }
.auth-title { font-family: var(--font-display); font-size: 22px; font-weight: 600; margin-bottom: 24px; }
.auth-form-group { margin-bottom: 16px; }
.auth-label {
  display: block; font-size: 12px; font-weight: 600;
  color: var(--ink-60); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;
}
.auth-input {
  width: 100%; padding: 11px 14px; border: 1.5px solid var(--ink-10);
  border-radius: var(--radius-sm); font-family: var(--font-body); font-size: 15px;
  color: var(--ink); background: var(--cream); outline: none; transition: border-color 0.15s;
}
.auth-input:focus { border-color: var(--terracotta); }
.auth-input.error { border-color: #E24B4A; }
.auth-error { font-size: 13px; color: #A32D2D; margin-top: 4px; }
.auth-btn {
  width: 100%; padding: 13px; background: var(--terracotta); color: #fff;
  border: none; border-radius: var(--radius-sm); font-family: var(--font-body);
  font-size: 15px; font-weight: 600; cursor: pointer; transition: opacity 0.15s;
  margin-top: 8px;
}
.auth-btn:hover { opacity: 0.85; }
.auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.auth-link {
  text-align: center; margin-top: 20px; font-size: 14px; color: var(--ink-60);
}
.auth-link a { color: var(--terracotta); cursor: pointer; font-weight: 600; }
.auth-link a:hover { text-decoration: underline; }
.auth-success {
  background: #EAF3DE; color: #3B6D11; padding: 12px 16px;
  border-radius: var(--radius-sm); font-size: 14px; margin-bottom: 20px;
  border-left: 4px solid #639922;
}
.auth-alert {
  background: #FCEBEB; color: #A32D2D; padding: 12px 16px;
  border-radius: var(--radius-sm); font-size: 14px; margin-bottom: 20px;
  border-left: 4px solid #E24B4A;
}
.auth-warning {
  background: #FAEEDA; color: #633806; padding: 12px 16px;
  border-radius: var(--radius-sm); font-size: 14px; margin-bottom: 20px;
  border-left: 4px solid #EF9F27;
}
@media (max-width: 480px) {
  .auth-wrap { padding: 16px; align-items: flex-start; padding-top: 40px; }
  .auth-card { padding: 28px 20px; }
  .auth-logo { font-size: 22px; }
}
`;

// ─── Форма регистрации ────────────────────────────────────────────────────────
export function RegisterPage({ onLogin, onBack }) {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.errors?.[0]?.msg || "Ошибка");
      setSuccess(`Регистрация успешна! Проверьте почту ${form.email} — мы отправили письмо для подтверждения.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">Рецепт<span>бук</span></div>
        <div className="auth-subtitle">Семейная кулинарная книга</div>
        <div className="auth-title">Регистрация</div>

        {success ? (
          <>
            <div className="auth-success">✅ {success}</div>
            <div className="auth-link">
              <a onClick={onLogin}>Войти в аккаунт →</a>
            </div>
          </>
        ) : (
          <>
            {error && <div className="auth-alert">⚠️ {error}</div>}
            <div className="auth-form-group">
              <label className="auth-label">Имя пользователя</label>
              <input className="auth-input" name="username" placeholder="anna_cooks" value={form.username} onChange={handle} />
            </div>
            <div className="auth-form-group">
              <label className="auth-label">Email</label>
              <input className="auth-input" name="email" type="email" placeholder="anna@example.com" value={form.email} onChange={handle} />
            </div>
            <div className="auth-form-group">
              <label className="auth-label">Пароль</label>
              <input className="auth-input" name="password" type="password" placeholder="Минимум 6 символов" value={form.password} onChange={handle}
                onKeyDown={e => e.key === "Enter" && submit()} />
            </div>
            <button className="auth-btn" onClick={submit} disabled={loading}>
              {loading ? "Регистрация..." : "Зарегистрироваться"}
            </button>
            <div className="auth-link">
              Уже есть аккаунт? <a onClick={onLogin}>Войти</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Форма входа ──────────────────────────────────────────────────────────────
export function LoginPage({ onSuccess, onRegister, onForgot }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notVerified, setNotVerified] = useState(false);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async () => {
    setError(""); setNotVerified(false); setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "EMAIL_NOT_VERIFIED") { setNotVerified(true); throw new Error(data.error); }
        throw new Error(data.error || "Ошибка входа");
      }
      localStorage.setItem("access_token", data.accessToken);
      localStorage.setItem("refresh_token", data.refreshToken);
      onSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email }),
    });
    setError("Письмо отправлено повторно! Проверьте почту.");
    setNotVerified(false);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">Рецепт<span>бук</span></div>
        <div className="auth-subtitle">Семейная кулинарная книга</div>
        <div className="auth-title">Вход</div>

        {error && (
          <div className={notVerified ? "auth-warning" : "auth-alert"}>
            ⚠️ {error}
            {notVerified && (
              <div style={{ marginTop: 8 }}>
                <a onClick={resendVerification} style={{ color: "#854F0B", fontWeight: 600, cursor: "pointer" }}>
                  Отправить письмо повторно →
                </a>
              </div>
            )}
          </div>
        )}

        <div className="auth-form-group">
          <label className="auth-label">Email</label>
          <input className="auth-input" name="email" type="email" placeholder="anna@example.com" value={form.email} onChange={handle} />
        </div>
        <div className="auth-form-group">
          <label className="auth-label">Пароль</label>
          <input className="auth-input" name="password" type="password" placeholder="Ваш пароль" value={form.password} onChange={handle}
            onKeyDown={e => e.key === "Enter" && submit()} />
        </div>
        <div style={{ textAlign: "right", marginBottom: 12 }}>
          <a onClick={onForgot} style={{ fontSize: 13, color: "var(--terracotta)", cursor: "pointer" }}>
            Забыли пароль?
          </a>
        </div>
        <button className="auth-btn" onClick={submit} disabled={loading}>
          {loading ? "Вход..." : "Войти"}
        </button>
        <div className="auth-link">
          Нет аккаунта? <a onClick={onRegister}>Зарегистрироваться</a>
        </div>
      </div>
    </div>
  );
}

// ─── Восстановление пароля ────────────────────────────────────────────────────
export function ForgotPasswordPage({ onBack }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">Рецепт<span>бук</span></div>
        <div className="auth-title">Восстановление пароля</div>

        {sent ? (
          <>
            <div className="auth-success">
              ✅ Письмо отправлено! Проверьте почту {email} и перейдите по ссылке для сброса пароля.
            </div>
            <div className="auth-link"><a onClick={onBack}>← Вернуться к входу</a></div>
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, color: "var(--ink-60)", marginBottom: 24 }}>
              Введите email вашего аккаунта — мы пришлём ссылку для сброса пароля.
            </p>
            <div className="auth-form-group">
              <label className="auth-label">Email</label>
              <input className="auth-input" type="email" placeholder="anna@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submit()} />
            </div>
            <button className="auth-btn" onClick={submit} disabled={loading || !email}>
              {loading ? "Отправка..." : "Отправить ссылку"}
            </button>
            <div className="auth-link"><a onClick={onBack}>← Вернуться к входу</a></div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Сброс пароля ─────────────────────────────────────────────────────────────
export function ResetPasswordPage({ token, onSuccess }) {
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (form.password !== form.confirm) return setError("Пароли не совпадают");
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">Рецепт<span>бук</span></div>
        <div className="auth-title">Новый пароль</div>
        {done ? (
          <>
            <div className="auth-success">✅ Пароль успешно изменён!</div>
            <button className="auth-btn" onClick={onSuccess}>Войти</button>
          </>
        ) : (
          <>
            {error && <div className="auth-alert">⚠️ {error}</div>}
            <div className="auth-form-group">
              <label className="auth-label">Новый пароль</label>
              <input className="auth-input" type="password" placeholder="Минимум 6 символов"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div className="auth-form-group">
              <label className="auth-label">Повторите пароль</label>
              <input className="auth-input" type="password" placeholder="Повторите пароль"
                value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} />
            </div>
            <button className="auth-btn" onClick={submit} disabled={loading}>
              {loading ? "Сохранение..." : "Сохранить пароль"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
