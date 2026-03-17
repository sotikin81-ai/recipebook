// Утилита сжатия изображений перед сохранением
// Ограничивает размер до maxSizeKB и разрешение до maxWidth/maxHeight

export const IMAGE_LIMITS = {
  maxSizeKB: 300,      // максимум 300 КБ
  maxWidth: 1200,      // максимум 1200px по ширине
  maxHeight: 900,      // максимум 900px по высоте
  quality: 0.82,       // качество JPEG (0–1)
};

/**
 * Сжимает изображение и возвращает base64 строку
 * @param {File} file — файл из <input type="file">
 * @param {Object} opts — опциональные настройки
 * @returns {Promise<{dataUrl: string, sizeKB: number, width: number, height: number}>}
 */
export function compressImage(file, opts = {}) {
  const { maxSizeKB, maxWidth, maxHeight, quality } = { ...IMAGE_LIMITS, ...opts };

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      return reject(new Error("Файл не является изображением"));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Ошибка чтения файла"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Ошибка загрузки изображения"));
      img.onload = () => {
        // Вычисляем новые размеры с сохранением пропорций
        let { width, height } = img;
        const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);

        const canvas = document.createElement("canvas");
        canvas.width  = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Начинаем с заданного качества и снижаем если файл всё ещё большой
        let q = quality;
        let dataUrl = canvas.toDataURL("image/jpeg", q);
        let sizeKB = Math.round(dataUrl.length * 0.75 / 1024);

        // Итеративно снижаем качество пока файл не влезет в лимит
        while (sizeKB > maxSizeKB && q > 0.3) {
          q = Math.max(q - 0.1, 0.3);
          dataUrl = canvas.toDataURL("image/jpeg", q);
          sizeKB  = Math.round(dataUrl.length * 0.75 / 1024);
        }

        resolve({ dataUrl, sizeKB, width, height, quality: q });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Форматирует размер файла для отображения пользователю
 */
export function formatFileSize(sizeKB) {
  if (sizeKB < 1024) return `${sizeKB} КБ`;
  return `${(sizeKB / 1024).toFixed(1)} МБ`;
}
