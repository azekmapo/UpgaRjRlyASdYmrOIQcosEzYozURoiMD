// types/jury.ts

export interface Theme {
  id: string
  intitule: string
  type_sujet: string
  resume: string
  option: string
  technologies_utilisees: string
  besoins_materiels: string
  encadrant: string | null
  co_encadrant: string | null
  entreprise: string | null
  groupe: {
    etudiant1: string | null
    etudiant2: string | null
    moyenne?: number | null // Optional field for average
  } | null
}

export interface RankedThemeJury extends Theme {
  rank: number
}

export interface JuryData {
  available_themes: Theme[]
  current_choices: RankedThemeJury[] | null
}

export interface JuryResponse {
  success: boolean
  data: JuryData
  message?: string
}

export interface SubmitChoicesRequest {
  ranked_themes: Array<{
    id: string
    intitule: string
    type_sujet: string
    rank: number
  }>
}

export interface SubmitChoicesJuryResponse {
  success: boolean
  message: string
  error?: string
}

export interface ValidationError {
  success: false
  message: string
  errors: Record<string, string[]>
}

// Union type for all possible API responses
export type JuryApiResponse = JuryResponse | SubmitChoicesJuryResponse | ValidationError

// VoeuxJury model interface (matching your PHP model)
export interface VoeuxJury {
  id: string
  id_enseignant: string
  ranked_themes: RankedThemeJury[]
  created_at: string
  updated_at: string
}

// Enseignant relation interface
export interface Enseignant {
  id: string
  // Add other enseignant properties as needed
}

// Error handling types
export interface ApiError {
  success: false
  message: string
  error?: string
  errors?: Record<string, string[]>
}