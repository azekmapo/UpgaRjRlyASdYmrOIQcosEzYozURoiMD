export interface EnseignantBasic {
 id: string;
 nom: string;
 is_responsable: boolean;
}

export interface ResponsableDataResponse {
 success: boolean;
 message?: string;
 data: {
   enseignants: EnseignantBasic[];
 };
 error?: string;
}

export interface UpdateResponsableRequest {
 option_nom: string;
 enseignant_id: string;
}

export interface UpdateResponsableResponse {
 success: boolean;
 message: string;
 data?: {
   option_nom: string;
   enseignant_id: string;
   enseignant_nom: string;
   ancien_responsable?: string;
 };
 error?: string;
}