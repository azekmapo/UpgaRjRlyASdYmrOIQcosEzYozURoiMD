/* eslint-disable @typescript-eslint/no-explicit-any */
export interface PropositionIndexResponse {
  success: boolean
  data: {
    existingProposition?: any // For etudiant role
    propositions?: any[] // For entreprise role
    total_count?: number // For pagination info
    isPeriodOver?: boolean // Add this new field
  }
  message?: string
}

export interface EtudiantPropositionData {
  intitule: string
  type_sujet: string
  option: string
  resume: string
  technologies: string
  besoins: string
}

export interface EntreprisePropositionData {
  intitule: string
  option: string
  resume: string
  technologies_utilisees?: string
  besoins_materiels?: string
}

export interface PropositionSubmitResponse {
  success: boolean
  message: string
  data?: any
  errors?: Record<string, string[]>
}

// Additional interfaces for better type safety
export interface EntrepriseProposition {
  id: string
  intitule: string
  option: "GL" | "RSD" | "SIC" | "IA"
  resume: string
  status: string
  technologies_utilisees?: string
  besoins_materiels?: string
  created_at: string
  updated_at: string
  entreprise_id: string
}

export interface PropositionDeleteResponse {
  success: boolean
  message: string
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}
