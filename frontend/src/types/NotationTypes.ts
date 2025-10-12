// Base types for roles
export type Role = "encadrant" | "jury"

// Bareme data structure
export interface BaremeData {
  id?: string
  type_bareme: Role
  note_application: number
  note_expose_oral: number
  note_reponses_questions: number
  note_assiduite?: number
  note_manucrit?: number
  created_at?: string
  updated_at?: string
}

// PFE Project structure for evaluation
export interface PfeProject {
  id: string
  intitule: string
  etudiant: string
  encadrant: string
  date_soutenance: string
  status: string
}

// Combined evaluation data (bareme + projects)
export interface EvaluationData {
  bareme: BaremeData
  pfes: PfeProject[]
}

// Note submission data structure
export interface NoteSubmissionData {
  role: Role
  pfe_id: string
  note_application: number
  note_expose_orale: number
  note_reponses_questions: number
  note_assiduite?: number
  note_manucrit?: number
}

// Form data structure for React Hook Form
export interface NotationFormData {
  pfe_id: string
  note_application: number
  note_expose_oral: number
  note_reponses_questions: number
  note_assiduite?: number
  note_manucrit?: number
}

// Bareme form data structure
export interface BaremeFormData {
  note_application: number
  note_expose_oral: number
  note_reponses_questions: number
  note_assiduite?: number
  note_manucrit?: number
}

// API Response structure
export interface NotationApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string[]>
}

// Bareme creation/update payload
export interface BaremePayload {
  type_bareme: Role
  note_application: number
  note_expose_oral: number
  note_reponses_questions: number
  note_assiduite?: number
  note_manucrit?: number
}

// Note record structure (from database)
export interface NoteRecord {
  id: string
  id_pfe: string
  note_application: string // JSON string
  note_expose_orale: string // JSON string
  note_reponses_questions: string // JSON string
  note_assiduite: string // JSON string
  note_manuscrit: string // JSON string
  note_encadrant?: number
  note_president?: number
  note_examinateur?: number
  note_generale?: number
  created_at: string
  updated_at: string
}

// Individual note detail structure (parsed from JSON)
export interface NoteDetail {
  note: number
  id_enseignant: string
}

// Parsed note data structure
export interface ParsedNoteData {
  encadrant?: NoteDetail
  president?: NoteDetail
  examinateur?: NoteDetail
}

// Validation error structure
export interface ValidationError {
  field: string
  message: string
}

// Loading states
export interface NotationLoadingStates {
  isLoadingData: boolean
  isSubmitting: boolean
  isLoadingBareme: boolean
}

// Error states
export interface NotationErrorStates {
  validationErrors: string[]
  apiError: string
  formErrors: Record<string, string>
}

// Success states
export interface NotationSuccessStates {
  successMessage: string
  isSubmitted: boolean
}

// Component props
export interface NoteEnseignantProps {
  initialRole?: Role
  onSubmitSuccess?: (data: NoteSubmissionData) => void
  onError?: (error: string) => void
}

export interface BaremeAdminProps {
  initialRole?: Role
  onSaveSuccess?: (bareme: BaremeData) => void
  onError?: (error: string) => void
}

// Service method types
export interface NotationServiceMethods {
  getBaremeByRole: (role: Role) => Promise<NotationApiResponse<BaremeData>>
  saveBareme: (baremeData: BaremePayload) => Promise<NotationApiResponse<BaremeData>>
  getEvaluationData: (role: Role) => Promise<NotationApiResponse<EvaluationData>>
  submitNote: (noteData: NoteSubmissionData) => Promise<NotationApiResponse<NoteRecord>>
}

// Utility types
export type BaremeField = keyof Omit<BaremeData, "id" | "type_bareme" | "created_at" | "updated_at">
export type NoteField = keyof Omit<NotationFormData, "pfe_id">

// Constants
export const ROLE_OPTIONS = [
  { value: "encadrant" as const, label: "Encadrant" },
  { value: "jury" as const, label: "Président/Examinateur" },
] as const

export const BAREME_FIELDS = {
  encadrant: ["note_application", "note_expose_oral", "note_reponses_questions", "note_assiduite"] as const,
  jury: ["note_application", "note_expose_oral", "note_reponses_questions", "note_manucrit"] as const,
} as const

// Type guards
export const isEncadrantRole = (role: Role): role is "encadrant" => role === "encadrant"
export const isJuryRole = (role: Role): role is "jury" => role === "jury"

// Validation constants
export const VALIDATION_RULES = {
  MIN_NOTE: 0,
  MAX_NOTE: 20,
  MAX_TOTAL: 20,
  STEP: 0.25,
} as const
