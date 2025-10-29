export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'etudiant' | 'enseignant' | 'entreprise'
  email_verified_at?: string
  profile_picture?: string
  is_responsable?: boolean
  is_jury_president?: boolean
  created_at: string
  updated_at: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  message: string
  token: string
  user: User
}

export interface AuthError {
  message: string
  errors?: Record<string, string[]>
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  status?: number
}

// Form validation types
export interface FormErrors {
  email?: string[]
  password?: string[]
  error?: string[]
  success?: string
  activeDialog?: boolean
}
