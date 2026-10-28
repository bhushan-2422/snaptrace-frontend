import { api, tokenStore } from './client'

// ---- auth ----
export const register = (payload) => api.post('/auth/register', payload, { auth: false })
export const login = async (payload) => {
  const data = await api.post('/auth/login', payload, { auth: false })
  tokenStore.save(data)
  return data
}
export const refresh = () => api.post('/auth/refresh', null, { auth: false })
export const logout = async () => {
  try {
    await api.post('/auth/logout', null)
  } finally {
    tokenStore.clear()
  }
}
export const me = () => api.get('/auth/me')

// ---- user ----
export const getProfile = () => api.get('/users/me')
export const updateProfile = (payload) => api.patch('/users/me', payload)

// ---- events ----
export const listEvents = ({ limit = 50, offset = 0 } = {}) =>
  api.get(`/events?limit=${limit}&offset=${offset}`)
export const createEvent = (payload) => api.post('/events', payload)
export const getEvent = (id) => api.get(`/events/${id}`)
export const updateEvent = (id, payload) => api.patch(`/events/${id}`, payload)
export const deleteEvent = (id) => api.del(`/events/${id}`)
export const eventStatus = (id) => api.get(`/events/${id}/status`)
export const joinEvent = (id) => api.post(`/events/${id}/join`)
export const leaveEvent = (id) => api.post(`/events/${id}/leave`)

// ---- images ----
export const uploadImages = (eventId, files) => {
  const fd = new FormData()
  for (const f of files) fd.append('files', f)
  return api.upload(`/events/${eventId}/images`, fd)
}
export const listImages = (eventId, { status, limit = 100, offset = 0 } = {}) => {
  const qs = new URLSearchParams({ limit, offset })
  if (status) qs.set('status', status)
  return api.get(`/events/${eventId}/images?${qs}`)
}
export const getImage = (id) => api.get(`/images/${id}`)
export const imageFaces = (id) => api.get(`/images/${id}/faces`)
export const deleteImage = (id) => api.del(`/images/${id}`)

// Download needs the Authorization header, so fetch as a blob and hand
// the browser a temporary object URL.
export const downloadImage = async (image) => {
  const res = await fetch(`/api/v1/images/${image.id}/download`, {
    headers: { Authorization: `Bearer ${tokenStore.access}` },
  })
  if (!res.ok) throw new Error(`Download failed (${res.status})`)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = image.original_filename || 'photo'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// ---- search ----
export const searchEvent = (eventId, selfieFile, { threshold, topK } = {}) => {
  const fd = new FormData()
  fd.append('selfie', selfieFile)
  const qs = new URLSearchParams()
  if (threshold != null) qs.set('threshold', threshold)
  if (topK != null) qs.set('top_k', topK)
  const suffix = qs.toString() ? `?${qs}` : ''
  return api.upload(`/events/${eventId}/search${suffix}`, fd)
}

// ---- meta ----
// /health is mounted at the server root, not under /api/v1.
export const health = () => fetch('/health').then((r) => r.json())
