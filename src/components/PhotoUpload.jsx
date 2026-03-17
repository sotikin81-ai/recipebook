import { useState, useRef } from "react";
import { compressImage, formatFileSize, IMAGE_LIMITS } from "../utils/imageUtils";

export const photoUploadCss = `
.photo-upload-area {
  border: 2px dashed var(--ink-30); border-radius: var(--radius);
  padding: 0; cursor: pointer; transition: all 0.2s; overflow: hidden;
  position: relative; background: var(--cream);
}
.photo-upload-area:hover { border-color: var(--terracotta); background: var(--terracotta-light); }
.photo-upload-area.has-photo { border-style: solid; border-color: var(--ink-10); }
.photo-upload-placeholder {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 8px; padding: 32px 20px; text-align: center;
}
.photo-upload-icon { font-size: 36px; }
.photo-upload-title { font-size: 15px; font-weight: 600; color: var(--ink); }
.photo-upload-hint { font-size: 13px; color: var(--ink-60); }
.photo-upload-limit {
  font-size: 12px; color: var(--ink-30);
  background: var(--ink-10); padding: 3px 10px; border-radius: 20px; margin-top: 4px;
}
.photo-preview { width: 100%; height: 220px; object-fit: cover; display: block; }
.photo-overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.6));
  padding: 12px 14px; display: flex; align-items: center; justify-content: space-between;
}
.photo-overlay-info { font-size: 12px; color: rgba(255,255,255,0.85); }
.photo-overlay-btn {
  background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4);
  color: #fff; padding: 4px 12px; border-radius: 20px; cursor: pointer;
  font-size: 12px; font-family: var(--font-body); transition: background 0.15s;
}
.photo-overlay-btn:hover { background: rgba(255,255,255,0.35); }
.photo-compress-status {
  display: flex; align-items: center; gap: 8px; margin-top: 8px;
  font-size: 13px; padding: 6px 12px; border-radius: var(--radius-sm);
}
.photo-compress-status.ok { background: var(--sage-light); color: var(--sage); }
.photo-compress-status.warn { background: var(--gold-light); color: var(--gold); }
.photo-compress-status.error { background: var(--terracotta-light); color: var(--terracotta); }
.photo-loading {
  display: flex; align-items: center; justify-content: center;
  gap: 10px; padding: 32px; color: var(--ink-60); font-size: 14px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.spinner {
  width: 20px; height: 20px; border: 2px solid var(--ink-10);
  border-top-color: var(--terracotta); border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
`;

export function PhotoUpload({ value, onChange, label = "Фото блюда" }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // {type, text}
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true);
    setStatus(null);
    try {
      const originalKB = Math.round(file.size / 1024);
      const result = await compressImage(file);

      setStatus({
        type: result.sizeKB <= IMAGE_LIMITS.maxSizeKB ? "ok" : "warn",
        text: `${result.width}×${result.height} пкс · ${formatFileSize(result.sizeKB)}` +
              (originalKB > result.sizeKB
                ? ` (сжато с ${formatFileSize(originalKB)})`
                : ""),
      });
      onChange(result.dataUrl);
    } catch (err) {
      setStatus({ type: "error", text: err.message || "Ошибка обработки фото" });
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <label className="form-label">{label}</label>

      <div
        className={`photo-upload-area ${value ? "has-photo" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
      >
        {loading ? (
          <div className="photo-loading">
            <div className="spinner" />
            Обработка фото...
          </div>
        ) : value ? (
          <>
            <img src={value} alt="Превью" className="photo-preview" />
            <div className="photo-overlay">
              <span className="photo-overlay-info">Нажмите чтобы заменить</span>
              <button
                className="photo-overlay-btn"
                onClick={e => { e.stopPropagation(); onChange(""); setStatus(null); }}
              >
                Удалить
              </button>
            </div>
          </>
        ) : (
          <div className="photo-upload-placeholder">
            <span className="photo-upload-icon">📷</span>
            <span className="photo-upload-title">Добавить фото</span>
            <span className="photo-upload-hint">
              Выберите из галереи или сделайте снимок
            </span>
            <span className="photo-upload-limit">
              Максимум {IMAGE_LIMITS.maxSizeKB} КБ · JPEG/PNG/HEIC
            </span>
          </div>
        )}
      </div>

      {status && (
        <div className={`photo-compress-status ${status.type}`}>
          {status.type === "ok" && "✅"}
          {status.type === "warn" && "⚠️"}
          {status.type === "error" && "❌"}
          {status.text}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={e => handleFile(e.target.files[0])}
      />
    </div>
  );
}
