import { API_BASE } from '../constants.js';

/**
 * Upload a photo file to the server.
 * Returns the URL string on success (e.g. "/uploads/env_xxx.jpg"), or null on failure.
 */
export async function uploadPhoto(file) {
  const form = new FormData();
  form.append('photo', file);
  try {
    const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    const data = await res.json();
    return data.url; // e.g. "/uploads/env_abc123.jpg"
  } catch (err) {
    console.error('Photo upload error:', err);
    return null;
  }
}

/**
 * Delete a photo from the server by its URL path.
 */
export async function deletePhoto(url) {
  const filename = url.split('/').pop();
  try {
    await fetch(`${API_BASE}/upload?file=${encodeURIComponent(filename)}`, { method: 'DELETE' });
  } catch (err) {
    console.error('Photo delete error:', err);
  }
}
