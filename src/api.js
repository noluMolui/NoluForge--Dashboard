const API_BASE = '/api'

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(payload.error || `HTTP ${res.status}`)
  }

  return res.json()
}

export const api = {
  health: () => apiFetch('/health'),

  projects: {
    list: () => apiFetch('/projects'),
    get: (id) => apiFetch(`/projects/${id}`),
    create: (data) => apiFetch('/projects', { method: 'POST', body: data }),
    update: (id, data) => apiFetch(`/projects/${id}`, { method: 'PATCH', body: data }),
    delete: (id) => apiFetch(`/projects/${id}`, { method: 'DELETE' }),
  },

  events: {
    list: (projectId) => apiFetch(`/projects/${projectId}/events`),
    add: (projectId, type, text) =>
      apiFetch(`/projects/${projectId}/events`, { method: 'POST', body: { type, text } }),
  },

  payments: {
    list: (projectId) => apiFetch(`/projects/${projectId}/payments`),
    record: (projectId, kind, amount, newAmountPaid, reference) =>
      apiFetch(`/projects/${projectId}/payments`, {
        method: 'POST',
        body: { kind, amount, newAmountPaid, reference },
      }),
  },

  outreach: {
    list: (projectId) => apiFetch(`/projects/${projectId}/outreach`),
    log: (projectId, note, method = 'phone') =>
      apiFetch(`/projects/${projectId}/outreach`, {
        method: 'POST',
        body: { note, method },
      }),
  },

  metrics: {
    get: () => apiFetch('/metrics'),
  },

  auth: {
    login: (email, password) =>
      apiFetch('/auth/login', { method: 'POST', body: { email, password } }),
    register: (email, password, name) =>
      apiFetch('/auth/register', { method: 'POST', body: { email, password, name } }),
  },
}
