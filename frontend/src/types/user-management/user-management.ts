import type { EnseignantProfile } from "../global/enseignant";
import type { EntrepriseProfile } from "../global/entreprise";
import type { EtudiantProfile } from "../global/etudiant";

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
}

export interface AddEtudiantData {
  nom: string;
  email: string;
  option: string;
  moyenne: number;
}

export interface AddEtudiantResponse {
  success: boolean;
  message: string;
  data?: EtudiantProfile;
  errors?: Record<string, string[]>;
}

export interface AddEnseignantData {
  nom: string;
  email: string;
  grade: string;
  date_recrutement: string;
}

export interface AddEnseignantResponse {
  success: boolean;
  message: string;
  data?: EnseignantProfile;
  errors?: Record<string, string[]>;
}

export interface AddEntrepriseData {
  nom: string;
  email: string;
  denomination: string;
}

export interface AddEntrepriseResponse {
  success: boolean;
  message: string;
  data?: EntrepriseProfile;
  errors?: Record<string, string[]>;
}

export interface UpdateEtudiantData {
  id: string;
  nom: string;
  email: string;
  option: string;
  moyenne: number;
}

export interface UpdateEtudiantResponse {
  success: boolean;
  message: string;
  data?: EtudiantProfile;
  errors?: Record<string, string[]>;
}

export interface UpdateEnseignantData {
  id: string;
  nom: string;
  email: string;
  grade: string;
  date_recrutement: string;
}

export interface UpdateEnseignantResponse {
  success: boolean;
  message: string;
  data?: EnseignantProfile;
  errors?: Record<string, string[]>;
}

export interface UpdateEntrepriseData {
  id: string;
  nom: string;
  email: string;
  denomination: string;
}

export interface UpdateEntrepriseResponse {
  success: boolean;
  message: string;
  data?: EntrepriseProfile;
  errors?: Record<string, string[]>;
}

export interface ImportResponse {
    success: boolean;
    message: string;
}