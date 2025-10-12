import type { ForgotPasswordRequest, ForgotPasswordResponse } from '@/types/forgot-password/forgot-password'
import apiClient from '../lib/api'
import type { LoginCredentials, LoginResponse, User } from '../types/auth'
import type { ChoixPFEResponse, RankedTheme, SubmitChoicesResponse } from '../types/choixPfeTypes'
import type {
  EncadrementResponse,
  EncadrementChoicesData,
  EncadrementSubmitResponse
} from '../types/encadrementTypes'
import type { VerifyCodeRequest, VerifyCodeResponse } from '@/types/forgot-password/code-verification'
import type { ChangePasswordRequest, ChangePasswordResponse } from '@/types/forgot-password/change-password'
import type { ApiResponse, ChangePasswordProfileRequest, ChangePasswordProfileResponse } from '@/types/user-profiles/user-profiles'
import type { EtudiantProfile } from '@/types/global/etudiant'
import type { EnseignantProfile } from '@/types/global/enseignant'
import type { EntrepriseProfile } from '@/types/global/entreprise'
import type { UserProfile } from '@/types/global/user'
import type { DeleteAutomationResponse, EmailFormData, EmailListResponse, EnvoiEmailsRequired } from '@/types/liste-emails-admin/liste-emails-admin'
import type { CalendrierResponse } from '../types/calendrierTypes'
import type { AdminDashboardResponse } from '../types/adminDashTypes'
import type {
  PropositionIndexResponse,
  EtudiantPropositionData,
  EntreprisePropositionData,
  PropositionSubmitResponse,
  PropositionDeleteResponse
} from '../types/propositionTypes'
import type { AddEnseignantData, AddEnseignantResponse, AddEntrepriseData, AddEntrepriseResponse, AddEtudiantData, AddEtudiantResponse, ImportResponse, PaginatedResponse, UpdateEnseignantData, UpdateEnseignantResponse, UpdateEntrepriseData, UpdateEntrepriseResponse, UpdateEtudiantData, UpdateEtudiantResponse } from '@/types/user-management/user-management'
import type { AcceptEnseignantPayload, AcceptEntreprisePayload, AcceptEtudiantPayload, DeclineEnseignantPayload, DeclineEntreprisePayload, DeclineEtudiantPayload, PaginatedPropositions, PropositionEnseignant, PropositionEntreprise, PropositionEtudiant } from '@/types/validation-proposals/validation-proposals'
import type {
  SoutenanceResponse,
  CreateSoutenanceRequest,
  CreateSoutenanceResponse,
  UpdateSoutenanceRequest,
  UpdateTimeRequest,
  Soutenance
} from '../types/soutenanceTypes'

import type {
  JuryResponse,
  SubmitChoicesJuryResponse,
  RankedThemeJury
} from '@/types/juryTypes'
import type { ResponsableDataResponse, UpdateResponsableRequest, UpdateResponsableResponse } from '@/types/responsables/responsables'
import type {
  BaremeData,
  EvaluationData,
  NoteSubmissionData,
  NotationApiResponse,
  BaremePayload,
  Role,
} from "../types/NotationTypes"
import type { OptionListResponse } from '@/types/options'
import type { PeriodeResponse } from '@/types/periodes'
// import type {
//   ApiParams,
//   ApiResponse,
// } from '../types/api'

// await authService.login()

export const authService = {
  login: (credentials: LoginCredentials): Promise<LoginResponse> =>
    apiClient.post('/api/auth/login', credentials),

  logout: (): Promise<void> =>
    apiClient.post('/api/auth/logout'),

  refreshToken: (): Promise<{ token: string }> =>
    apiClient.post('/api/auth/refresh'),

  getUser: (): Promise<{ success: boolean; user: User }> =>
    apiClient.get('/api/auth/me'),
}

export const calendrierService = {
  getPeriodes: (): Promise<CalendrierResponse> =>
    apiClient.get('/api/calendrier'),
}

export const adminService = {
  getDashboardStats: (): Promise<AdminDashboardResponse> =>
    apiClient.get('/api/admin/dashboard'),
}

export const choixPFEService = {
  // Get student's PFE choice data
  getChoices: (): Promise<ChoixPFEResponse> =>
    apiClient.get('/api/choix-pfe'),

  // Submit/create new PFE choices
  submitChoices: (rankedThemes: RankedTheme[]): Promise<SubmitChoicesResponse> =>
    apiClient.post('/api/choix-pfe', { ranked_themes: rankedThemes }),

  // Update existing PFE choices
  updateChoices: (rankedThemes: RankedTheme[]): Promise<SubmitChoicesResponse> =>
    apiClient.put('/api/choix-pfe', { ranked_themes: rankedThemes }),

  // Delete PFE choices
  deleteChoices: (): Promise<{ success: boolean; message: string }> =>
    apiClient.delete('/api/choix-pfe'),
}

export const encadrementService = {
  // Get all encadrement data for teacher
  getEncadrementData: (): Promise<EncadrementResponse> =>
    apiClient.get('/api/encadrement'),

  // Submit encadrement choices
  submitChoices: (choicesData: EncadrementChoicesData): Promise<EncadrementSubmitResponse> =>
    apiClient.post('/api/encadrement/choices', choicesData),

  // Remove co-encadrant from a specific PFE
  removeCoEncadrant: (pfeId: string): Promise<{ message: string }> =>
    apiClient.delete(`/api/encadrement/co-encadrant/${pfeId}`),
}

export const propositionService = {
  // Get role-based proposition data (works for both etudiant and entreprise)
  getPropositions: (): Promise<PropositionIndexResponse> =>
    apiClient.get('/api/propositions'),

  // Submit student group proposition
  submitEtudiantProposition: (propositionData: EtudiantPropositionData): Promise<PropositionSubmitResponse> =>
    apiClient.post('/api/propositions/etudiant', propositionData),

  // Submit company proposition
  submitEntrepriseProposition: (propositionData: EntreprisePropositionData): Promise<PropositionSubmitResponse> =>
    apiClient.post('/api/propositions/entreprise', propositionData),

  updateEntrepriseProposition: (
    id: string,
    propositionData: EntreprisePropositionData,
  ): Promise<PropositionSubmitResponse> => apiClient.put(`/api/propositions/entreprise/${id}`, propositionData),

  // Delete company proposition
  deleteEntrepriseProposition: (id: string): Promise<PropositionDeleteResponse> =>
    apiClient.delete(`/api/propositions/entreprise/${id}`),
}

export const forgotPasswordService = {
  sendResetCode: (data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> =>
    apiClient.post('/api/auth/forgot-password', data),
  verifyCode: (data: VerifyCodeRequest): Promise<VerifyCodeResponse> =>
    apiClient.post('/api/auth/verify-code', data),
  changePassword: (data: ChangePasswordRequest): Promise<ChangePasswordResponse> =>
    apiClient.post('/api/auth/change-password', data),
}

export const profileService = {
  getProfileEtudiant: (): Promise<ApiResponse<EtudiantProfile>> =>
    apiClient.get('/api/etudiant/profile'),
  getProfileEnseignant: (): Promise<ApiResponse<EnseignantProfile>> =>
    apiClient.get('/api/enseignant/profile'),
  getProfileEntreprise: (): Promise<ApiResponse<EntrepriseProfile>> =>
    apiClient.get('/api/entreprise/profile'),
  getProfileAdmin: (): Promise<ApiResponse<UserProfile>> =>
    apiClient.get('/api/admin/profile'),
  changePassword: (data: ChangePasswordProfileRequest): Promise<ChangePasswordProfileResponse> =>
    apiClient.patch('/api/profile/change-password', data),
  
  uploadProfilePicture: async (file: File): Promise<ApiResponse<any>> => {
    console.log('[Upload] Starting upload with file:', file.name, file.size, 'bytes', file.type);
    
    const formData = new FormData();
    formData.append('profile_picture', file);
    
    console.log('[Upload] FormData created');
    
    // Don't set Content-Type manually - let browser add boundary automatically
    return apiClient.post('/api/profile/upload-picture', formData);
  },
}

export const emailService = {
  getListEmails: (): Promise<EmailListResponse> =>
    apiClient.get('/api/emails'),

  deleteAutomatisation: (automationId: string): Promise<DeleteAutomationResponse> =>
    apiClient.delete(`/api/suppAutomatisation/${automationId}`),

  getEnvoiEmails: (): Promise<EnvoiEmailsRequired> =>
    apiClient.get('/api/envoi-emails'),

  createAutomation: (data: EmailFormData): Promise<{ success: boolean; message: string }> =>
    apiClient.post('/api/envoiEmails', data),
};

export const userManagementService = {
  getEtudiants: (search = '', option = 'Tous', page = 1): Promise<PaginatedResponse<EtudiantProfile>> =>
    apiClient.get(`/api/utilisateurs?search=${encodeURIComponent(search)}&option=${encodeURIComponent(option)}&page=${page}`),

  getEnseignants: (): Promise<EnseignantProfile[]> =>
    apiClient.get('/api/utilisateurs/enseignants'),

  getEntreprises: (): Promise<EntrepriseProfile[]> =>
    apiClient.get('/api/utilisateurs/entreprises'),

  deleteUser: (userId: string): Promise<void> =>
    apiClient.delete(`/api/utilisateurs/${userId}`),

  addEtudiant: (data: AddEtudiantData): Promise<AddEtudiantResponse> =>
    apiClient.post('/api/addEtudiant', data),

  addEnseignant: (data: AddEnseignantData): Promise<AddEnseignantResponse> =>
    apiClient.post('/api/addEnseignant', data),

  addEntreprise: (data: AddEntrepriseData): Promise<AddEntrepriseResponse> =>
    apiClient.post('/api/addEntreprise', data),

  updateEtudiant: (data: UpdateEtudiantData): Promise<UpdateEtudiantResponse> =>
    apiClient.patch('/api/updateEtudiant', data),

  updateEnseignant: (data: UpdateEnseignantData): Promise<UpdateEnseignantResponse> =>
    apiClient.patch('/api/updateEnseignant', data),

  updateEntreprise: (data: UpdateEntrepriseData): Promise<UpdateEntrepriseResponse> =>
    apiClient.patch('/api/updateEntreprise', data),

  async importEtudiants(file: File): Promise<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return await apiClient.post<ImportResponse>('/api/import-etudiants', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async importEnseignants(file: File): Promise<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return await apiClient.post<ImportResponse>('/api/import-enseignants', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async importEntreprises(file: File): Promise<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return await apiClient.post<ImportResponse>('/api/import-entreprises', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
}


// export const userService = { 
export const soutenanceService = {
  // Get all soutenances with related data
  getSoutenances: (): Promise<SoutenanceResponse> =>
    apiClient.get('/api/soutenances'),

  // Create/schedule new soutenances
  createSoutenances: (data: CreateSoutenanceRequest): Promise<CreateSoutenanceResponse> =>
    apiClient.post('/api/soutenances', data),

  // Update a specific soutenance (full update with new date)
  updateSoutenance: (id: number, data: UpdateSoutenanceRequest): Promise<{ success: boolean; message: string; data: Soutenance }> =>
    apiClient.put(`/api/soutenances/${id}`, data),

  // Update only the time of a specific soutenance
  updateSoutenanceTime: (id: number, data: UpdateTimeRequest): Promise<{ success: boolean; message: string; data: Soutenance }> =>
    apiClient.patch(`/api/soutenances/${id}/time`, data),

  // Delete a specific soutenance
  deleteSoutenance: (id: number): Promise<{ success: boolean; message: string }> =>
    apiClient.delete(`/api/soutenances/${id}`),



}
// Add this to your existing services
export const notationService = {
  // Get bareme by role
  getBaremeByRole: (role: Role): Promise<NotationApiResponse<BaremeData>> => apiClient.get(`/api/bareme?role=${role}`),
    // Save/update bareme
  saveBareme: (baremeData: BaremePayload): Promise<NotationApiResponse<BaremeData>> =>
    apiClient.post("/api/bareme", baremeData),

  // Get evaluation data (bareme + pfes) for teacher
  getEvaluationData: (role: Role): Promise<NotationApiResponse<EvaluationData>> =>
    apiClient.get(`/api/evaluation/data?role=${role}`),

  // Get existing notes for a PFE
  getExistingNotes: (pfeId: string, role: Role): Promise<NotationApiResponse<any>> =>
    apiClient.get(`/api/evaluation/existing-notes?pfe_id=${pfeId}&role=${role}`),

  // Submit evaluation note
  submitNote: (noteData: NoteSubmissionData): Promise<NotationApiResponse<any>> =>
    apiClient.post("/api/evaluation/note", noteData),
}

export const validationPropositionsService = {
  getPropositionsEtudiants: (
    page: number = 1,
    status?: string,
    search?: string
  ): Promise<PaginatedPropositions<PropositionEtudiant>> => {
    const params = new URLSearchParams({
      page: page.toString()
    });

    if (status && status !== 'all') {
      params.append('status', status);
    }

    if (search && search.trim()) {
      params.append('search', search.trim());
    }

    return apiClient.get(`/api/propositions/etudiants?${params.toString()}`);
  },

  getPropositionsEnseignants: (
    page: number = 1,
    status?: string,
    search?: string
  ): Promise<PaginatedPropositions<PropositionEnseignant>> => {
    const params = new URLSearchParams({
      page: page.toString()
    });

    if (status && status !== 'all') {
      params.append('status', status);
    }

    if (search && search.trim()) {
      params.append('search', search.trim());
    }

    return apiClient.get(`/api/propositions/enseignants?${params.toString()}`);
  },

  getPropositionsEntreprises: (): Promise<PropositionEntreprise[]> => {
    return apiClient.get('/api/propositions/entreprises');
  },

  acceptPropositionEtudiant: (
  id: string,
  id_group: string,
  remarks?: string
): Promise<{ success: boolean; message: string }> => {
  const data: AcceptEtudiantPayload = { id, id_group };
  if (remarks) {
    data.remarks = remarks;
  }
  return apiClient.post('/api/propositions/etudiants/accept', data);
},

declinePropositionEtudiant: (
  id: string,
  id_group: string
): Promise<{ success: boolean; message: string }> => {
  const data: DeclineEtudiantPayload = { id, id_group };
  return apiClient.post('/api/propositions/etudiants/decline', data);
},

acceptPropositionEnseignant: (
  id: string,
  encadrant_id: string,
  co_encadrant_id?: string,
  remarks?: string
): Promise<{ success: boolean; message: string }> => {
  const data: AcceptEnseignantPayload = { id, encadrant_id };
  if (co_encadrant_id) {
    data.co_encadrant_id = co_encadrant_id;
  }
  if (remarks) {
    data.remarks = remarks;
  }
  return apiClient.post('/api/propositions/enseignants/accept', data);
},

declinePropositionEnseignant: (
  id: string,
  encadrant_id: string,
  co_encadrant_id?: string
): Promise<{ success: boolean; message: string }> => {
  const data: DeclineEnseignantPayload = { id, encadrant_id };
  if (co_encadrant_id) {
    data.co_encadrant_id = co_encadrant_id;
  }
  return apiClient.post('/api/propositions/enseignants/decline', data);
},

acceptPropositionEntreprise: (
  id: string,
  entreprise_id: string,
  remarks?: string
): Promise<{ success: boolean; message: string }> => {
  const data: AcceptEntreprisePayload = { id, entreprise_id };
  if (remarks) {
    data.remarks = remarks;
  }
  return apiClient.post('/api/propositions/entreprises/accept', data);
},

declinePropositionEntreprise: (
  id: string,
  entreprise_id: string
): Promise<{ success: boolean; message: string }> => {
  const data: DeclineEntreprisePayload = { id, entreprise_id };
  return apiClient.post('/api/propositions/entreprises/decline', data);
},
};

export const juryService = {
  // Get jury data including available themes and current choices
  getJuryData: (): Promise<JuryResponse> =>
    apiClient.get('/api/jury'),

  // Submit jury choices with ranked themes
  submitChoices: (rankedThemes: RankedThemeJury[]): Promise<SubmitChoicesJuryResponse> =>
    apiClient.post('/api/jury/submit-choices', {
      ranked_themes: rankedThemes
    }),
}

export const responsableService = {
  getEnseignantsForResponsable: (): Promise<ResponsableDataResponse> =>
    apiClient.get('/api/enseignants/responsable'),
  
  updateResponsable: (data: UpdateResponsableRequest): Promise<UpdateResponsableResponse> =>
    apiClient.patch('/api/enseignants/responsable', data),
};

export const optionService = {
  getOptions: (): Promise<OptionListResponse> =>
    apiClient.get('/api/options'),
};

export const periodeService = {
  updatePeriode: (id: number, data: { date_debut: string; date_fin: string }): Promise<{ success: boolean; message: string }> =>
    apiClient.put(`/api/periodes/${id}`, data),
  getPeriodeActive: (): Promise<PeriodeResponse> =>
    apiClient.get('/api/dashboard/periode-active'),
}

// export const userService = {
//   getUsers: (params?: ApiParams): Promise<ApiResponse<User[]>> =>
//     apiClient.get('/users', { params }),
//   getUser: (id: number): Promise<User> =>
//     apiClient.get(`/users/${id}`),
//   updateUser: (id: number, data: Partial<User>): Promise<User> =>
//     apiClient.put(`/users/${id}`, data),
//   deleteUser: (id: number): Promise<void> =>
//     apiClient.delete(`/users/${id}`),
//   updateProfile: (data: Partial<User>): Promise<User> =>
//     apiClient.put('/profile', data),
//   changePassword: (data: {
//     current_password: string
//     password: string
//     password_confirmation: string
//   }): Promise<{ message: string }> =>
//     apiClient.put('/profile/password', data),
//   uploadAvatar: (file: File, onProgress?: (progress: number) => void): Promise<{ url: string }> => {
//     const formData = new FormData()
//     formData.append('avatar', file)
//     return apiClient.upload('/profile/avatar', formData, onProgress)
//   },
// }


export default {
  auth: authService,
  choixPFE: choixPFEService,
  encadrement: encadrementService,
  forgotPassword: forgotPasswordService,
  profile: profileService,
  email: emailService,
  userManagement: userManagementService,
  soutenance: soutenanceService,
  notation: notationService, 
  periode: periodeService,
  // user: userService,
}