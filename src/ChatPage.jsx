import { useState, useEffect, useRef, useCallback } from "react";

export const chatCss = `
.chat-wrap {
  display: flex; flex-direction: column; height: calc(100vh - 120px);
  max-width: 720px; margin: 0 auto;
}
.chat-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
}
.chat-title { font-family: var(--font-display); font-size: 24px; font-weight: 600; }
.online-badge {
  display: flex; align-items: center; gap: 6px;
  background: var(--sage-light); color: var(--sage);
  padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;
}
.online-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--sage); }
.chat-messages {
  flex: 1; overflow-y: auto; padding: 16px;
  background: var(--warm-white); border-radius: var(--radius);
  border: 1.5px solid var(--ink-10); margin-bottom: 12px;
  display: flex; flex-direction: column; gap: 12px;
}
.chat-msg { display: flex; gap: 10px; align-items: flex-start; }
.chat-msg.own { flex-direction: row-reverse; }
.chat-msg.own .msg-bubble {
  background: var(--terracotta); color: #fff; border-radius: 16px 4px 16px 16px;
}
.chat-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--terracotta-light); color: var(--terracotta);
  font-size: 12px; font-weight: 700; display: flex; align-items: center;
  justify-content: center; flex-shrink: 0;
}
.chat-msg.own .chat-avatar { background: var(--terracotta); color: #fff; }
.msg-content { max-width: 70%; }
.msg-name { font-size: 12px; font-weight: 600; color: var(--ink-60); margin-bottom: 3px; }
.chat-msg.own .msg-name { text-align: right; }
.msg-bubble {
  background: var(--ink-10); padding: 10px 14px;
  border-radius: 4px 16px 16px 16px; font-size: 15px; line-height: 1.5;
  word-break: break-word;
}
.msg-time { font-size: 11px; color: var(--ink-30); margin-top: 3px; }
.chat-msg.own .msg-time { text-align: right; }
.chat-input-row { display: flex; gap: 10px; }
.chat-input {
  flex: 1; padding: 12px 16px; border: 1.5px solid var(--ink-10);
  border-radius: var(--radius-sm); font-family: var(--font-body); font-size: 15px;
  color: var(--ink); outline: none; transition: border-color 0.15s;
  background: var(--warm-white);
}
.chat-input:focus { border-color: var(--terracotta); }
.chat-send-btn {
  padding: 12px 20px; background: var(--terracotta); color: #fff;
  border: none; border-radius: var(--radius-sm); cursor: pointer;
  font-family: var(--font-body); font-size: 15px; font-weight: 600;
  transition: opacity 0.15s; white-space: nowrap;
}
.chat-send-btn:hover { opacity: 0.85; }
.chat-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.chat-empty {
  flex: 1; display: flex; align-items: center; justify-content: center;
  color: var(--ink-60); font-size: 15px; text-align: center;
}
.chat-day-sep {
  text-align: center; font-size: 12px; color: var(--ink-30);
  padding: 4px 0; position: relative;
}
.chat-day-sep::before {
  content: ''; position: absolute; top: 50%; left: 0; right: 0;
  height: 1px; background: var(--ink-10);
}
.chat-day-sep span {
  background: var(--warm-white); padding: 0 12px; position: relative;
}
@media (max-width: 480px) {
  .chat-wrap { height: calc(100vh - 100px); }
  .chat-header { flex-direction: column; align-items: flex-start; gap: 8px; }
  .msg-content { max-width: 85%; }
  .chat-messages { padding: 12px; }
  .chat-send-btn { padding: 12px 14px; font-size: 14px; }
}
`;

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Сегодня";
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Вчера";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export function ChatPage({ currentUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [onlineCount, setOnlineCount] = useState(1);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const token = localStorage.getItem("access_token");
  const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/messages", { headers });
      if (res.ok) setMessages(await res.json());
    } catch {}
  }, []);

  const loadOnline = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/online", { headers });
      if (res.ok) { const data = await res.json(); setOnlineCount(data.length); }
    } catch {}
  }, []);

  useEffect(() => {
    loadMessages();
    loadOnline();
    const msgInterval = setInterval(loadMessages, 3000);  // polling каждые 3 сек
    const onlineInterval = setInterval(loadOnline, 30000); // онлайн каждые 30 сек
    return () => { clearInterval(msgInterval); clearInterval(onlineInterval); };
  }, [loadMessages, loadOnline]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST", headers,
        body: JSON.stringify({ content: input.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        setInput("");
      }
    } catch {}
    setSending(false);
  };

  // Группируем по дням
  let lastDate = null;

  return (
    <div className="chat-wrap">
      <div className="chat-header">
        <div className="chat-title">Общий чат</div>
        <div className="online-dot-wrap" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="online-badge">
            <div className="online-dot" />
            {onlineCount} онлайн
          </div>
          <span style={{ fontSize: 12, color: "var(--ink-60)" }}>
            Сообщения хранятся 36 часов
          </span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <div>
              <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
              <p>Пока нет сообщений. Начните общение!</p>
            </div>
          </div>
        )}

        {messages.map(msg => {
          const msgDate = formatDate(msg.created_at);
          const showDate = msgDate !== lastDate;
          lastDate = msgDate;
          const isOwn = msg.user_id === currentUser.id;

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="chat-day-sep"><span>{msgDate}</span></div>
              )}
              <div className={`chat-msg ${isOwn ? "own" : ""}`}>
                <div className="chat-avatar">
                  {(msg.username || "?")[0].toUpperCase()}
                </div>
                <div className="msg-content">
                  {!isOwn && <div className="msg-name">{msg.username}</div>}
                  <div className="msg-bubble">{msg.content}</div>
                  <div className="msg-time">{formatTime(msg.created_at)}</div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <input
          className="chat-input"
          placeholder="Написать сообщение..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          maxLength={1000}
        />
        <button className="chat-send-btn" onClick={send} disabled={!input.trim() || sending}>
          {sending ? "..." : "Отправить"}
        </button>
      </div>
    </div>
  );
}
