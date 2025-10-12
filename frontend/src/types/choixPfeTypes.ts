// types/choixPFE.ts

export interface Theme {
  id: number
  titre: string
  description: string
  option: string
  type_sujet: 'classique' | 'innovant' | 'stage'
  // For teacher themes
  encadrant?: string
  co_encadrant?: string | null
  // For company themes  
  entreprise?: string
}

export interface RankedTheme {
  theme_id: number
  type_sujet: 'classique' | 'innovant' | 'stage'
  rank: number
}

export interface GroupInfo {
  id: number
  option: string
}

export interface ChoixPFEData {
  isPeriodActive: boolean
  hasGroup: boolean
  groupInfo?: GroupInfo
  availableThemes: Theme[]
  currentChoices: RankedTheme[] | null
  message?: string
}

export interface ChoixPFEResponse {
  success: boolean
  data: ChoixPFEData
  message?: string
}

export interface SubmitChoicesResponse {
  success: boolean
  message: string
  data?: {
    choices_count: number
  }
  errors?: Record<string, string[]>
}

export interface ApiError {
  success: false
  message: string
  errors?: Record<string, string[]>
}