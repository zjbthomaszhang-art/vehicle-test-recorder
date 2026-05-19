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

/** Returns 'HH:mm:ss' formatted time. */
export function formatTime(ts) {
  if (!ts) return '--:--:--';
  const date = new Date(ts);
  if (isNaN(date.getTime())) return '--:--:--';
  const HH = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${HH}:${mm}:${ss}`;
}

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
