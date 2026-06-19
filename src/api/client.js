const API_BASE = 'http://127.0.0.1:8000';

function getToken() {
  return localStorage.getItem('cms_token');
}

function setToken(token) {
  localStorage.setItem('cms_token', token);
}

function clearToken() {
  localStorage.removeItem('cms_token');
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    window.location.reload();
    throw new Error('登入已過期，請重新登入');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: '發生未知錯誤' }));
    throw new Error(errorData.detail || '請求失敗');
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getGroups: () => request('/groups'),
  createGroup: (data) =>
    request('/groups', { method: 'POST', body: JSON.stringify(data) }),
  updateGroup: (slug, data) =>
    request(`/groups/${slug}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGroup: (slug) =>
    request(`/groups/${slug}`, { method: 'DELETE' }),

  getEvents: () => 
    request('/events'),
  createEvent: (data) =>
    request('/events', { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: (id, data) =>
    request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEvent: (id) =>
    request(`/events/${id}`, { method: 'DELETE' }),

  getMembers: (semester) =>
    request(semester ? `/members?semester=${semester}` : '/members'),
  createMember: (data) =>
    request('/members', { method: 'POST', body: JSON.stringify(data) }),
  updateMember: (semester, id, data) =>
    request(`/members/${semester}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMember: (semester, id) =>
    request(`/members/${semester}/${id}`, { method: 'DELETE' }),

  getShowcase: (group) =>
    request(group ? `/showcase?group=${group}` : '/showcase'),
  createShowcase: (data) =>
    request('/showcase', { method: 'POST', body: JSON.stringify(data) }),
  updateShowcase: (group, id, data) =>
    request(`/showcase/${group}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteShowcase: (group, id) =>
    request(`/showcase/${group}/${id}`, { method: 'DELETE' }),
};

export { getToken, setToken, clearToken };