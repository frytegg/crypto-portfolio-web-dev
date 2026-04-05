// Petit wrapper fetch qui envoie le cookie JWT avec chaque requête
// et parse les réponses JSON.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export class ApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

async function request(method, path, { body, query } = {}) {
  const url = new URL(path.startsWith('http') ? path : `${BASE_URL}${path}`)

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    }
  }

  const init = {
    method,
    credentials: 'include',
    headers: {
      accept: 'application/json',
    },
  }

  if (body !== undefined) {
    init.headers['content-type'] = 'application/json'
    init.body = JSON.stringify(body)
  }

  let response
  try {
    response = await fetch(url, init)
  } catch (err) {
    throw new ApiError('Impossible de contacter le serveur', { status: 0, body: { cause: err.message } })
  }

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null)

  if (!response.ok) {
    const message = (payload && typeof payload === 'object' && payload.error)
      || (typeof payload === 'string' && payload)
      || `Requête ${method} ${path} échouée (${response.status})`
    throw new ApiError(message, { status: response.status, body: payload })
  }

  return payload
}

export const api = {
  get: (path, options) => request('GET', path, options),
  post: (path, body, options) => request('POST', path, { ...options, body }),
  put: (path, body, options) => request('PUT', path, { ...options, body }),
  delete: (path, options) => request('DELETE', path, options),
}

export default api
