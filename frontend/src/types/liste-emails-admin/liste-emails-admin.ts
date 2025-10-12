export interface AutomationEmail {
  id: string;
  periode: number | null;
  date_debut: string;
  date_fin: string;
  template: string;
  email_objet: string;
  email_contenu: string;
  frequence: string;
  description: string;
  status: 'en_attente' | 'en_cours' | 'termine';
}

export interface PlanificationEmail {
  id: number;
  automation_id: string;
  date_envoi_planifie: string;
  status: 'en_attente' | 'envoye' | 'echoue';
}

export interface Periode {
  id: number;
  titre: string;
  description: string;
  date_debut: string;
  date_fin: string;
}

export interface EmailListResponse {
  automation_emails: AutomationEmail[];
  emails_planifies: PlanificationEmail[];
  periodes: Periode[];
}

export interface DeleteAutomationResponse {
  success: boolean;
  message: string;
}

export interface TemplatesPeriode {
  id: number;
  numero_template: number;
  id_periode: number; // ← C'est la bonne propriété
  distinataires: string;
  objet: string;
  contenu: string;
  created_at: string;
  updated_at: string;
}

export interface EnvoiEmailsRequired {
  periodes: Periode[];
  templatesPeriodes: TemplatesPeriode[];
}

export interface EmailFormData {
  periode: number;
  frequence: number;
  template_selectionne: string;
  email_objet: string;
  email_contenu: string;
  destinataires?: string;
  date_debut?: string;
  date_fin?: string;
}

export interface AvailableTemplate {
  id: string;
  objet: string;
  contenu: string;
  nom: string;
  distinataires?: string;
}

export interface EmailAutomationUpdate {
  type: 'EMAIL_AUTOMATION_UPDATE';
  planification_id: number;
  automation_id: string;
  planification_status: 'en_attente' | 'envoye' | 'echoue';
}

export interface EmailAutomationStatusUpdate {
  type: 'EMAIL_AUTOMATION_STATUS_UPDATE';
  automation_id: string;
  automation_status: 'en_attente' | 'en_cours' | 'termine';
}