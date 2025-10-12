import type { UserProfile } from "./user";

export interface EtudiantProfile extends UserProfile {
  option: string;
  moyenne: number;
}