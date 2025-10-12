export interface Periode {
  id: number;
  titre: string;
  description: string;
  date_debut: string; // ISO date string
  date_fin: string;   // ISO date string
  created_at: string | null; // ISO timestamp string or null
  updated_at: string | null; // ISO timestamp string or null
}

export interface CalendrierResponse {
  success: boolean;
  periodes: Periode[];
}

export interface UpdatePeriodeRequest {
  date_debut: string;
  date_fin: string;
}

export interface UpdatePeriodeResponse {
  success: boolean;
  message: string;
  periode?: Periode;
}