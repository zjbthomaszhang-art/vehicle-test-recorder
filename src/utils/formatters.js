/**
 * Formats a timestamp (ms, ISO string, or Date-like) to 'YYYY-MM-DD HH:mm:ss'.
 * Returns "--" if the value is null/undefined/invalid.
 * @param {number|string|null} ts
 * @returns {string}
 */
export function formatDateTime(ts) {
  if (!ts) return '--';
  const date = new Date(ts);
  if (isNaN(date.getTime())) return '--';
  const YYYY = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const DD = String(date.getDate()).padStart(2, '0');
  const HH = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}`;
}

/** Alias for formatDateTime — kept for readability at call sites. */
export const formatTime = formatDateTime;

/**
 * Creates a fresh, empty test result object for a single case.
 * @returns {{ startTime: null, carExecTime: null, appFeedbackTime: null, result: null, notes: string, media: Array }}
 */
export function createEmptyResult() {
  return {
    startTime: null,
    carExecTime: null,
    appFeedbackTime: null,
    result: null, // 'Pass' | 'Fail' | 'N/A'
    notes: '',
    media: [],
  };
}
/**
 * Resizes and compresses a dataURL image.
 * @param {string} dataUrl 
 * @param {number} maxWidth 
 * @param {number} quality 
 * @returns {Promise<string>}
 */
export async function compressImage(dataUrl, maxWidth = 800, quality = 0.4) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = img.width / img.height;
      const width = Math.min(img.width, maxWidth);
      const height = width / ratio;
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl); // Fallback to original
  });
}
