import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// Create simple axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Request interceptor - just add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add CSRF token if available
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    if (csrfToken) {
      config.headers = config.headers || {}
      config.headers['X-CSRF-TOKEN'] = csrfToken
    }

    // CRITICAL: Remove Content-Type for FormData to let browser set it with boundary
    if (config.data instanceof FormData) {
      console.log('[Interceptor] Detected FormData, removing Content-Type header');
      delete config.headers['Content-Type'];
    }

    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Only redirect to login for 401 errors on critical auth endpoints
    // Ignore 401 on non-critical endpoints to prevent logout loops
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      
      // Don't redirect if it's the login endpoint itself
      if (url.includes('/auth/login')) {
        return Promise.reject(error)
      }
      
      // Only clear auth and redirect for critical endpoints
      // Non-critical endpoints (notifications, etc.) should just fail silently
      const isCriticalEndpoint = url.includes('/auth/me') || 
                                 url.includes('/auth/user') ||
                                 url.includes('/auth/refresh')
      
      if (isCriticalEndpoint) {
        console.warn('[API] 401 on critical endpoint, clearing auth:', url)
        localStorage.removeItem('auth_token')
        sessionStorage.removeItem('cached_user')
        window.dispatchEvent(new CustomEvent('auth-error'))
        window.location.href = '/login'
      } else {
        console.warn('[API] 401 on non-critical endpoint, ignoring:', url)
      }
    }
    
    return Promise.reject(error)
  }
)

// Simple error class
export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>
  response?: AxiosResponse

  constructor(message: string, status: number, errors?: Record<string, string[]>, response?: AxiosResponse) {
    super(message)
    this.status = status
    this.errors = errors
    this.response = response
    this.name = 'ApiError'
  }
}

// Simple API client
export const apiClient = {
  baseURL: API_BASE_URL,
  
  async get<T = unknown>(url: string, config?: Record<string, unknown>): Promise<T> {
    try {
      const response = await api.get<T>(url, config)
      return response.data
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  },

  async post<T = unknown>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<T> {
    try {
      const response = await api.post<T>(url, data, config)
      return response.data
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  },

  async put<T = unknown>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<T> {
    try {
      const response = await api.put<T>(url, data, config)
      return response.data
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  },

  async patch<T = unknown>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<T> {
    try {
      const response = await api.patch<T>(url, data, config)
      return response.data
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  },

  async delete<T = unknown>(url: string, config?: Record<string, unknown>): Promise<T> {
    try {
      const response = await api.delete<T>(url, config)
      return response.data
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  },

  async upload<T = unknown>(
    url: string, 
    formData: FormData, 
    onProgress?: (progress: number) => void
  ): Promise<T> {
    try {
      const response = await api.post<T>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(progress)
          }
        },
      })
      return response.data
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  },

  handleError(error: AxiosError): ApiError {
    const response = error.response
    const data = response?.data as Record<string, unknown>

    let message = 'An unexpected error occurred'
    let errors: Record<string, string[]> | undefined

    if (response) {
      message = (data?.message as string) || (data?.error as string) || `HTTP ${response.status}: ${response.statusText}`
      errors = data?.errors as Record<string, string[]>
    } else if (error.request) {
      message = 'Network error: Please check your internet connection'
    } else {
      message = error.message || 'Request failed'
    }

    return new ApiError(
      message,
      response?.status || 0,
      errors,
      response
    )
  },
}

export default apiClient
