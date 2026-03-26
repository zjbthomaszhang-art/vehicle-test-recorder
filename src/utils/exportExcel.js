import { API_BASE } from '../constants.js';

/**
 * Export a multi-sheet Excel report by POSTing data to the server.
 * The server generates the file and responds with Content-Disposition headers
 * that guarantee the correct filename on all browsers.
 */
export async function exportExcelReport({ cases, caseResults, bugs, vehicle }) {
  const res = await fetch(`${API_BASE}/export/excel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cases, caseResults, bugs, vehicle }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  // Read filename from Content-Disposition if present, fallback otherwise
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^;"'\r\n]+)/i);
  const safeModel = (vehicle.vehicleModel || 'Report').replace(/[^a-z0-9]/gi, '_');
  const fallback = `VehicleTest_${safeModel}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const filename = match ? decodeURIComponent(match[1]) : fallback;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
