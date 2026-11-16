import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const TOKEN_KEY = 'ecom_token'
const USER_KEY = 'ecom_user'

export const tokenStore = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (token) => sessionStorage.setItem(TOKEN_KEY, token),
  getUser: () => {
    try { return JSON.parse(sessionStorage.getItem(USER_KEY)) } catch { return null }
  },
  setUser: (user) => sessionStorage.setItem(USER_KEY, JSON.stringify(user)),
  clear: () => {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
  },
}

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Normalize errors: callers get { message, status, data }
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status
    const data = error.response?.data
    let message = 'Something went wrong. Please try again.'
    if (typeof data === 'string' && data) message = data
    else if (data?.error) message = data.error
    else if (data?.message) message = data.message
    else if (Array.isArray(data) && data[0]?.message) message = data[0].message
    else if (error.code === 'ECONNABORTED') message = 'Request timed out.'
    else if (!error.response) message = 'Cannot reach the server. Is the backend running?'

    // Expired/invalid token on an authenticated call -> clear session (caller handles redirect)
    if (status === 401 && tokenStore.get() && !error.config?.url?.includes('/api/auth/login')) {
      tokenStore.clear()
      window.dispatchEvent(new Event('auth:expired'))
    }
    return Promise.reject({ message, status, data, original: error })
  }
)

export default api
