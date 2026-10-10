const TOKEN_KEY = 'splitease_token';
const BASE = import.meta.env.VITE_API_URL || '/api';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable: session lasts until reload */
  }
};

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error('Cannot reach the server. Check that the API is running.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) {
      setToken(null);
      window.dispatchEvent(new Event('auth:expired'));
    }
    throw new Error(data.message || 'Something went wrong. Try again.');
  }
  return data;
}

export const api = {
  register: (b) => request('/auth/register', { method: 'POST', body: b }),
  login: (b) => request('/auth/login', { method: 'POST', body: b }),
  me: () => request('/auth/me'),
  saveUpi: (upiId) => request('/auth/me', { method: 'PATCH', body: { upiId } }),
  groups: () => request('/groups'),
  createGroup: (name) => request('/groups', { method: 'POST', body: { name } }),
  group: (id) => request(`/groups/${id}`),
  addMember: (id, email) => request(`/groups/${id}/members`, { method: 'POST', body: { email } }),
  expenses: (id) => request(`/groups/${id}/expenses`),
  parseExpense: (id, text) => request(`/groups/${id}/expenses/parse`, { method: 'POST', body: { text } }),
  createExpense: (id, body) => request(`/groups/${id}/expenses`, { method: 'POST', body }),
  deleteExpense: (id, expenseId) => request(`/groups/${id}/expenses/${expenseId}`, { method: 'DELETE' }),
  balances: (id) => request(`/groups/${id}/balances`),
  settle: (id, body) => request(`/groups/${id}/settlements`, { method: 'POST', body }),
};
