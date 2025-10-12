export interface MyPeriode {
  id: number;
  titre: string;
  description: string;
  date_debut: string;
  date_fin: string;
  dashboard_title: string;
  dashboard_description: string;
  dashboard_button: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface DashboardContent {
  title: string;
  description: string;
  buttonName?: string;
  buttonUrl?: string;
}

export interface PeriodeResponse {
  success: boolean;
  data: MyPeriode;
  is_responsable?: boolean;
}