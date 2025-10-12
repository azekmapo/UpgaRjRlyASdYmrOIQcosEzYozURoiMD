import type { UserProfile } from "./user";

export interface EnseignantProfile extends UserProfile {
  grade: string;
  date_recrutement: string;
  is_responsable: boolean;
}