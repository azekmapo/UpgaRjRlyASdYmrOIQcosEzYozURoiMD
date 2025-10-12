// types/admin/dashboard.ts

export interface UserStats {
  etudiants: number
  enseignants: number
  entreprises: number
}

export interface DistributionData {
  name: string
  value: number
}

export interface OptionsData {
  name: string
  etudiants: number
  pfe: number
}

export interface Periode {
  id: string | number
  titre: string
  description: string
  date_debut: string
  date_fin: string
}

export interface AdminDashboardData {
  statsData: UserStats
  userDistData: DistributionData[]
  pfeTypesData: DistributionData[]
  pfeStatusData: DistributionData[]
  optionsData: OptionsData[]
  periodes: Periode[]
}

export interface AdminDashboardResponse {
  success: boolean
  data: AdminDashboardData
}