import type { UserProfile } from "./user";

export interface EntrepriseProfile extends UserProfile {
  denomination: string;
}