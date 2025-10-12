// types/encadrementTypes.ts

export interface Group {
  id: string
  moyenne?: number
  // Add other group properties as needed
}

export interface Entreprise {
  id: string
  name: string
}

export interface User {
  id: string
  name: string
  // Add other user properties as needed
}

export interface Enseignant {
  id: string
  user: User
  // Add other enseignant properties as needed
}

export interface BaseTheme {
  id: string
  option: string
  intitule: string
  resume: string
  technologies_utilisees?: string
  besoins_materiels?: string
  type_sujet: 'classique' | 'innovant' | 'stage'
  groupe?: Group
  moyenne_group?: number
}

export interface PropositionTheme extends BaseTheme {
  type: 'proposition'
  isNeedingCoEncadrant: false
  status: 'accepted'
  id_group?: string
  entreprise_name?: string
}

export interface PFETheme extends BaseTheme {
  type: 'pfe'
  id_encadrant?: string
  id_co_encadrant?: string
  id_group?: string
  ordre?: number
  origine_proposition?: 'enseignant' | 'etudiant' | 'stage'
  encadrant_name?: string
  co_encadrant_name?: string
  entreprise_name?: string
  isNeedingCoEncadrant: boolean
  isRemovable?: boolean
  role?: 'encadrant' | 'co_encadrant'
  originalList?: 'current' | 'co'
  encadrant?: Enseignant
  coEncadrant?: Enseignant
  entreprise?: Entreprise
}

export type AvailableTheme = PropositionTheme | PFETheme

export interface EncadrementData {
  availableThemes: AvailableTheme[]
  pfesForCoEncadrement: PFETheme[]
  currentEncadrements: PFETheme[]
  coEncadrements: PFETheme[]
  enseignant: Enseignant
}

export interface EncadrementResponse {
  data: EncadrementData
}

export interface RankedEncadrementTheme {
  id: string
  type: 'proposition' | 'pfe'
}

export interface EncadrementChoicesData {
  ranked_themes: RankedEncadrementTheme[]
  removed_co_encadrements?: string[]
}

export interface EncadrementSubmitResponse {
  message: string
}

