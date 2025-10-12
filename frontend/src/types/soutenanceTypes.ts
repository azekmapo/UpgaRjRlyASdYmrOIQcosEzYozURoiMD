/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Soutenance {
  id: number
  id_pfe: number
  id_salle: number
  date: string
  heure_debut: string
  heure_fin: string
  session: string
  pfe_title?: string
  room_name?: string
  students?: (string | null)[]
  jury_members?: {
    president: string | null
    examinateur: string | null
    encadrant: string | null
    co_encadrant: string | null
  }
  pfe?: any
  salle?: any
}

export interface SoutenanceResponse {
  success: boolean
  data: {
    soutenances: Soutenance[]
    salles: any[]
    startDate: string | null
  }
}

export interface CreateSoutenanceRequest {
  working_hours: {
    session: 1 | 2
    start_time: string
    end_time: string
    defense_duration: number
    break_duration: number
  }
  rooms: Array<{ name: string }>
}

export interface CreateSoutenanceResponse {
  success: boolean
  message: string
  created_count?: number
  unassigned_soutenances?: number[]
  no_pfe?: boolean
  pfe_count: number
  job_dispatched: string
}

export interface UpdateSoutenanceRequest {
  new_date: string
  working_hours: {
    start_time: string
    end_time: string
    defense_duration: number
    break_duration: number
  }
  rooms: Array<{ name: string }>
}

export interface UpdateTimeRequest {
  time: string
  working_hours: any
  rooms: Array<{ name: string }>
}