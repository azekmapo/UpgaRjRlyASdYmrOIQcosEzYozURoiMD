import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { authService } from '../services/api'
import type { User, LoginCredentials } from '../types/auth'

interface AuthContextType {
  user: User | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
  refreshUser: () => Promise<void>
}

export type { AuthContextType }

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('auth_token')
      const cachedUser = sessionStorage.getItem('cached_user')
      
      console.log('[Auth Init] Token exists:', !!token, 'Cached user exists:', !!cachedUser)
      
      if (!token) {
        console.log('[Auth Init] No token found, setting loading to false')
        setLoading(false)
        setIsInitialized(true)
        return
      }

      // If we have cached user, use it immediately
      if (cachedUser) {
        try {
          const parsedUser = JSON.parse(cachedUser)
          console.log('[Auth Init] Using cached user:', parsedUser.email)
          setUser(parsedUser)
          setLoading(false)
          setIsInitialized(true)
          return
        } catch (e) {
          console.error('[Auth Init] Failed to parse cached user:', e)
          sessionStorage.removeItem('cached_user')
        }
      }

      // Validate token with backend
      try {
        console.log('[Auth Init] Validating token with backend...')
        const response = await authService.getUser()
        console.log('[Auth Init] Backend response:', response)
        
        if (response.success && response.user) {
          console.log('[Auth Init] Token valid, setting user:', response.user.email)
          setUser(response.user)
          sessionStorage.setItem('cached_user', JSON.stringify(response.user))
        } else {
          console.log('[Auth Init] Token invalid, clearing auth')
          localStorage.removeItem('auth_token')
          sessionStorage.removeItem('cached_user')
          setUser(null)
        }
      } catch (error) {
        console.error('[Auth Init] Token validation failed:', error)
        localStorage.removeItem('auth_token')
        sessionStorage.removeItem('cached_user')
        setUser(null)
      } finally {
        setLoading(false)
        setIsInitialized(true)
      }
    }

    initializeAuth()
  }, [])

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      console.log('[Refresh User] No token, skipping')
      return
    }

    try {
      console.log('[Refresh User] Fetching user data...')
      const response = await authService.getUser()
      if (response.success && response.user) {
        console.log('[Refresh User] User refreshed:', response.user.email)
        setUser(response.user)
        sessionStorage.setItem('cached_user', JSON.stringify(response.user))
      }
    } catch (error) {
      console.error('[Refresh User] Failed:', error)
    }
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    console.log('[Login] Starting login...')
    setLoading(true)
    
    try {
      const response = await authService.login(credentials)
      console.log('[Login] Response received:', { 
        success: response.success, 
        hasToken: !!response.token, 
        hasUser: !!response.user 
      })

      if (response.success && response.token && response.user) {
        console.log('[Login] Login successful, storing token and user')
        console.log('[Login] Token:', response.token)
        
        // Store token and user
        localStorage.setItem('auth_token', response.token)
        sessionStorage.setItem('cached_user', JSON.stringify(response.user))
        
        // Verify it was stored
        const storedToken = localStorage.getItem('auth_token')
        console.log('[Login] Token stored and verified:', !!storedToken, storedToken?.substring(0, 10) + '...')
        
        // Update state
        setUser(response.user)
        setLoading(false)
        
        console.log('[Login] State updated, user:', response.user.email)
        return
      } else {
        console.error('[Login] Invalid response:', response)
        setLoading(false)
        throw new Error(response.message || 'Login failed')
      }
    } catch (error) {
      console.error('[Login] Error:', error)
      setLoading(false)
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    console.log('[Logout] Logging out...')
    
    try {
      await authService.logout()
    } catch (error) {
      console.error('[Logout] Error:', error)
    } finally {
      localStorage.removeItem('auth_token')
      sessionStorage.removeItem('cached_user')
      setUser(null)
      console.log('[Logout] Cleared auth state')
    }
  }, [])

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    refreshUser
  }


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { AuthContext }
