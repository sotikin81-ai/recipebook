import { useState, useEffect } from "react";

export const adminCss = `
.admin-wrap { max-width: 960px; margin: 0 auto; }
.admin-header {
  display: flex; align-items: center; gap: 12px; margin-bottom: 32px;
}
.admin-badge {
  background: var(--terracotta); color: #fff; padding: 4px 12px;
  border-radius: 20px; font-size: 12px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 1px;
}
.admin-title { font-family: var(--font-display); font-size: 28px; font-weight: 700; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
@media (max-width: 680px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
.stat-card {
  background: var(--warm-white); border-radius: var(--radius);
  padding: 20px; text-align: center; box-shadow: var(--shadow);
}
.stat-num { font-family: var(--font-display); font-size: 32px; font-weight: 700; color: var(--terracotta); }
.stat-lbl { font-size: 13px; color: var(--ink-60); margin-top: 4px; }
.admin-tabs { display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 2px solid var(--ink-10); padding-bottom: 0; }
.admin-tab {
  padding: 10px 20px; border: none; background: none; cursor: pointer;
  font-family: var(--font-body); font-size: 14px; font-weight: 500;
  color: var(--ink-60); border-bottom: 2px solid transparent; margin-bottom: -2px;
  transition: all 0.15s;
}
.admin-tab.active { color: var(--terracotta); border-bottom-color: var(--terracotta); }
.admin-search {
  width: 100%; padding: 10px 14px; border: 1.5px solid var(--ink-10);
  border-radius: var(--radius-sm); font-family: var(--font-body); font-size: 14px;
  color: var(--ink); background: var(--warm-white); outline: none; margin-bottom: 16px;
  transition: border-color 0.15s;
}
.admin-search:focus { border-color: var(--terracotta); }
.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th {
  text-align: left; padding: 10px 14px; font-size: 12px; font-weight: 600;
  color: var(--ink-60); text-transform: uppercase; letter-spacing: 0.5px;
  border-bottom: 2px solid var(--ink-10);
}
.admin-table td {
  padding: 12px 14px; border-bottom: 1px solid var(--ink-10); font-size: 14px;
  vertical-align: middle;
}
.admin-table tr:hover td { background: var(--cream); }
.role-badge {
  padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;
  text-transform: uppercase;
}
.role-badge.admin { background: var(--terracotta-light); color: var(--terracotta); }
.role-badge.user { background: var(--ink-10); color: var(--ink-60); }
.verified-badge { font-size: 16px; }
.btn-danger {
  background: none; border: 1.5px solid #E24B4A; color: #A32D2D;
  padding: 4px 10px; border-radius: var(--radius-sm); cursor: pointer;
  font-size: 12px; font-family: var(--font-body); transition: all 0.15s;
}
.btn-danger:hover { background: #FCEBEB; }
.btn-ban {
  background: none; border: 1.5px solid var(--gold); color: var(--gold);
  padding: 4px 10px; border-radius: var(--radius-sm); cursor: pointer;
  font-size: 12px; font-family: var(--font-body); transition: all 0.15s;
}
.btn-ban:hover { background: var(--gold-light); }
.chat-admin-msg {
  padding: 10px 14px; border-bottom: 1px solid var(--ink-10);
  display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
}
.chat-admin-msg:hover { background: var(--cream); }
.msg-meta { font-size: 12px; color: var(--ink-60); margin-top: 4px; }
@media (max-width: 480px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .stat-num { font-size: 24px; }
  .admin-table { font-size: 12px; }
  .admin-table th, .admin-table td { padding: 8px 8px; }
  .admin-tabs { overflow-x: auto; }
}
`;

export function AdminPage({ currentUser }) {
  const [tab, setTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [chatMsgs, setChatMsgs] = useState([]);
  const [search, setSearch] = useState("");

  const token = localStorage.getItem("access_token");
  const h = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };

  useEffect(() => {
    fetch("/api/admin/stats", { headers: h }).then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === "users")
      fetch(`/api/admin/users?search=${search}`, { headers: h }).then(r => r.json()).then(setUsers).catch(() => {});
    if (tab === "chat")
      fetch("/api/admin/chat", { headers: h }).then(r => r.json()).then(setChatMsgs).catch(() => {});
  }, [tab, search]);

  const deleteUser = async (id, name) => {
    if (!confirm(`Удалить пользователя ${name} и все его рецепты?`)) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE", headers: h });
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const toggleBan = async (id) => {
    const res = await fetch(`/api/admin/users/${id}/ban`, { method: "POST", headers: h });
    const data = await res.json();
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_banned: data.banned } : u));
  };

  const deleteChatMsg = async (id) => {
    await fetch(`/api/admin/chat/${id}`, { method: "DELETE", headers: h });
    setChatMsgs(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <span className="admin-badge">Admin</span>
        <span className="admin-title">Панель администратора</span>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-num">{stats.users}</div><div className="stat-lbl">Пользователей</div></div>
          <div className="stat-card"><div className="stat-num">{stats.recipes}</div><div className="stat-lbl">Рецептов</div></div>
          <div className="stat-card"><div className="stat-num">{stats.comments}</div><div className="stat-lbl">Комментариев</div></div>
          <div className="stat-card"><div className="stat-num">{stats.activeChats}</div><div className="stat-lbl">Сообщений в чате</div></div>
        </div>
      )}

      <div className="admin-tabs">
        {[["stats", "Статистика"], ["users", "Пользователи"], ["chat", "Чат"]].map(([id, label]) => (
          <button key={id} className={`admin-tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <>
          <input className="admin-search" placeholder="Поиск по имени или email..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <table className="admin-table">
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Подтверждён</th>
                <th>Рецептов</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ opacity: u.is_banned ? 0.5 : 1 }}>
                  <td><strong>{u.username}</strong></td>
                  <td style={{ color: "var(--ink-60)" }}>{u.email}</td>
                  <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                  <td><span className="verified-badge">{u.email_verified ? "✅" : "⏳"}</span></td>
                  <td>{u.recipes_count}</td>
                  <td style={{ display: "flex", gap: 6 }}>
                    {u.id !== currentUser.id && (
                      <>
                        <button className="btn-ban" onClick={() => toggleBan(u.id)}>
                          {u.is_banned ? "Разбан" : "Бан"}
                        </button>
                        <button className="btn-danger" onClick={() => deleteUser(u.id, u.username)}>
                          Удалить
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {tab === "chat" && (
        <div>
          {chatMsgs.map(m => (
            <div key={m.id} className="chat-admin-msg">
              <div style={{ flex: 1 }}>
                <strong>{m.username}</strong>
                <span style={{ fontSize: 12, color: "var(--ink-60)", marginLeft: 8 }}>{m.email}</span>
                <div style={{ marginTop: 4 }}>{m.content}</div>
                <div className="msg-meta">{new Date(m.created_at).toLocaleString("ru-RU")}</div>
              </div>
              <button className="btn-danger" onClick={() => deleteChatMsg(m.id)}>Удалить</button>
            </div>
          ))}
          {chatMsgs.length === 0 && (
            <p style={{ color: "var(--ink-60)", textAlign: "center", padding: 40 }}>Чат пуст</p>
          )}
        </div>
      )}
    </div>
  );
}
