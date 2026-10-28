const BASE = '/api/v1'
const ACCESS_KEY = 'snaptrace_access'
const REFRESH_KEY = 'snaptrace_refresh'

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS_KEY)
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY)
  },
  save({ access_token, refresh_token }) {
    localStorage.setItem(ACCESS_KEY, access_token)
    localStorage.setItem(REFRESH_KEY, refresh_token)
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

export class ApiError extends Error {
  constructor(status, detail) {
    super(typeof detail === 'string' ? detail : JSON.stringify(detail))
    this.status = status
    this.detail = detail
  }
}

async function toError(res) {
  let detail = `Request failed (${res.status})`
  try {
    const body = await res.json()
    if (body?.detail) detail = body.detail
  } catch {
    /* non-JSON error body */
  }
  return new ApiError(res.status, detail)
}

async function tryRefresh() {
  const refresh_token = tokenStore.refresh
  if (!refresh_token) return false
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token }),
  })
  if (!res.ok) return false
  tokenStore.save(await res.json())
  return true
}

async function request(path, { method = 'GET', body, formData, auth = true, retry = true } = {}) {
  const headers = {}
  if (auth && tokenStore.access) headers.Authorization = `Bearer ${tokenStore.access}`
  if (body) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: formData || (body ? JSON.stringify(body) : undefined),
  })

  if (res.status === 401 && auth && retry && (await tryRefresh())) {
    return request(path, { method, body, formData, auth, retry: false })
  }
  if (res.status === 401 && auth) tokenStore.clear()

  if (!res.ok) throw await toError(res)
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  get: (path, opts) => request(path, opts),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
  upload: (path, formData, opts) => request(path, { ...opts, method: 'POST', formData }),
}
