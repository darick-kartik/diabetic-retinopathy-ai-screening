import axios from 'axios'
import { API_BASE_URL, STORAGE_KEYS } from '@/config/app'

const baseURL = (API_BASE_URL || (import.meta.env.DEV ? '' : window.location.origin)).replace(/\/+$/, '')

export const apiClient = axios.create({
  baseURL,
  headers: { Accept: 'application/json' },
  timeout: 20_000,
})

apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(STORAGE_KEYS.apiToken)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const detail = error?.response?.data?.detail
    const devProxyUnavailable = import.meta.env.DEV && status === 500 && !error?.response?.data
    const message = typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail.map((item) => item.msg).filter(Boolean).join(' ')
        : error?.code === 'ECONNABORTED'
          ? 'The server took too long to respond. Try again.'
          : !error?.response || devProxyUnavailable
            ? 'Cannot connect to the RetinaCare server. Check that FastAPI is running and VITE_API_BASE_URL is correct.'
            : `The server returned an unexpected error (${status || 'unknown'}).`
    if (status === 401) {
      sessionStorage.removeItem(STORAGE_KEYS.apiToken)
      window.dispatchEvent(new CustomEvent('retinacare:session-expired'))
    }
    return Promise.reject(Object.assign(new Error(message), { status, original: error }))
  },
)

export const getFileUrl = (path) => `${baseURL}${path}`
export const getFile = (path, signal) => apiClient.get(path, { responseType: 'blob', signal }).then(({ data }) => data)
