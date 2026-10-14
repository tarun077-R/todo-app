const TOKEN_KEY = 'todo_auth_token';

export function storageGet(key) {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}

export function storageSet(key, value) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
}

export function storageRemove(key) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

export function getToken() {
  return storageGet(TOKEN_KEY);
}

export function setToken(token) {
  storageSet(TOKEN_KEY, token);
}

export function clearAuth() {
  storageRemove(TOKEN_KEY);
}

const baseUrl = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, { method = 'GET', body, headers } = {}) {
  const token = getToken();
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : undefined,
      ...headers,
    },
  };

  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  const res = await fetch(`${baseUrl}${endpoint}`, config);

  if (res.status === 401) {
    clearAuth();
  }

  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

export async function authRegister(creds) {
  const { data } = await request('/auth/register', {
    method: 'POST',
    body: creds,
  });
  return data;
}

export async function authLogin(creds) {
  const { data } = await request('/auth/login', {
    method: 'POST',
    body: creds,
  });
  return data;
}

export async function authMe() {
  const { data } = await request('/auth/me');
  return data;
}

export async function taskCreate(payload) {
  const { data } = await request('/tasks', {
    method: 'POST',
    body: payload,
  });
  return data;
}

export async function taskList(params) {
  const qs = new URLSearchParams(params).toString();
  const { data } = await request(`/tasks?${qs}`);
  return data;
}

export async function taskGet(id) {
  const { data } = await request(`/tasks/${id}`);
  return data;
}

export async function taskUpdate(id, payload) {
  const { data } = await request(`/tasks/${id}`, {
    method: 'PATCH',
    body: payload,
  });
  return data;
}

export async function taskDelete(id) {
  const { status } = await request(`/tasks/${id}`, { method: 'DELETE' });
  return { status };
}

export async function taskComplete(id) {
  const { data } = await request(`/tasks/${id}/complete`, { method: 'PATCH' });
  return data;
}

export async function taskRestore(id) {
  const { data } = await request(`/tasks/${id}/restore`, { method: 'PATCH' });
  return data;
}

export async function taskSearch(q) {
  const { data } = await request(`/tasks/search?q=${encodeURIComponent(q)}`);
  return data;
}

export async function dashboard() {
  const { data } = await request('/tasks/dashboard');
  return data;
}
