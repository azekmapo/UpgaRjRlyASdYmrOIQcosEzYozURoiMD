export interface ApiParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  [key: string]: unknown;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message?: string;
}


// Interface for ranked theme choice
export interface RankedTheme {
  theme_id: number;
  type_sujet: 'classique' | 'innovant' | 'stage';
  rank: number;
}

export interface Group {
  id: string; // UUID
  id_etd1: string; // UUID
  id_etd2?: string; // UUID (optional - can be null)
  moyenne: number; // decimal(4,2)
  option: 'GL' | 'IA' | 'SIC' | 'RSD';
  created_at?: string; // Laravel timestamps
  updated_at?: string; // Laravel timestamps
}

// Interface for ChoixPFE model
export interface ChoixPFE {
  id: string; // UUID
  id_group: string; // UUID
  ranked_themes: RankedTheme[]; // Array of ranked theme choices
  created_at?: string; // Laravel timestamps (optional if not always present)
  updated_at?: string; // Laravel timestamps (optional if not always present)
  group?: Group;
}