/** Shared Spring Boot HTTP client. Uses Vite's /api proxy in development. */
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'needit_access_token';

export const tokenStore = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: token => sessionStorage.setItem(TOKEN_KEY, token),
  clear: () => sessionStorage.removeItem(TOKEN_KEY)
};

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export async function request(path, { method = 'GET', body, headers = {}, signal, auth = true } = {}) {
  const token = auth ? tokenStore.get() : null;
  const isForm = body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(!isForm && body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    signal,
    credentials: 'same-origin'
  });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) throw new ApiError(response.status, data);
  return data;
}
