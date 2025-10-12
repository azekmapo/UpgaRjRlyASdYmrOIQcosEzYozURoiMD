export type NotificationsType = {
  id?: string;
  sender_id: string;
  receiver_id: string;
  title: string;
  message: string;
  type: string;
  status: string;
  formatted_message?: string;
  created_at: string;
  updated_at: string;
  proposition_id?: number;
  group_id?: string;
  email_validation_id?: string;
  email_automation_id?: string;
  sender?: {
    id: string;
    name: string;
    email: string;
  };
  receiver?: {
    id: string;
    name: string;
    email: string;
  };
}

export type optionType = "GL" | "IA" | "SIC" | "RSD";

export type GroupType = {
  id?:string;
  id_etd1: string;
  id_etd2?: string;
  moyenne:number;
  option: optionType;
  created_at?: string;
  updated_at?: string;
}

export type Etudiants = {
  id_user: string;
  name: string;
  option?: optionType;
  moyenne: number;
}

export interface EtudiantWithOption extends Etudiants {
  option?: optionType;
}

export type EmailValidationType = {
  id: string;
  role: string;
  name: string;
  email: string;
  name2?: string;
  email2?: string;
  denomination?: string;
  intitule: string;
  status: 'accepted' | 'declined';
  remarques?: string;
  option: string;
  type: string;
  resumer: string;
  technologies: string;
  besoins_materiels: string;
  created_at: string;
  updated_at: string;
}

export interface EmailAutomationType {
  id: string;
  periode: string;
  date_debut: string;
  date_fin: string;
  template: string;
  email_objet: string;
  email_contenu: string;
  frequence: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}