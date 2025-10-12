export interface PropositionEtudiant {
  id: string;
  id_group: string;
  option: string;
  intitule: string;
  type_sujet: string;
  resume: string;
  technologies_utilisees: string;
  besoins_materiels: string;
  status: 'pending' | 'accepted' | 'declined';
  group?: {
    id: string;
    student1?: {
      user?: {
        id: string;
        name: string;
        email: string;
      };
    };
    student2?: {
      user?: {
        id: string;
        name: string;
        email: string;
      };
    };
  };
}

export interface PropositionEnseignant {
  id: string;
  intitule: string;
  option: string;
  resume: string;
  technologies_utilisees: string;
  besoins_materiels: string;
  type_sujet: string;
  status: 'pending' | 'accepted' | 'declined';
  encadrant: {
    id: string;
    name: string;
    email: string;
  };
  co_encadrant?: {
    id: string;
    name: string;
    email: string;
  };
  encadrant_id: string;
  co_encadrant_id?: string;
}

export interface PropositionEntreprise {
  id: string;
  intitule: string;
  option: string;
  resume: string;
  technologies_utilisees: string;
  entreprise_id: string;
  status: 'pending' | 'accepted' | 'declined';
  entreprise: {
    id: string;
    name: string;
    email: string;
    entreprise: {
      denomination: string;
    };
  };
}

export interface PaginatedPropositions<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

export interface AcceptEtudiantPayload {
  id: string;
  id_group: string;
  remarks?: string;
}

export interface DeclineEtudiantPayload {
  id: string;
  id_group: string;
}

export interface AcceptEnseignantPayload {
  id: string;
  encadrant_id: string;
  co_encadrant_id?: string;
  remarks?: string;
}

export interface DeclineEnseignantPayload {
  id: string;
  encadrant_id: string;
  co_encadrant_id?: string;
}

export interface AcceptEntreprisePayload {
  id: string;
  entreprise_id: string;
  remarks?: string;
}

export interface DeclineEntreprisePayload {
  id: string;
  entreprise_id: string;
}