import apiClient from "@/lib/api";

export const propositionService = {
    // Get all propositions
    getPropositions: () =>
      apiClient.get('/api/propositions'),
    
    // Get all enseignants
    getAllEnseignants: () =>
      apiClient.get('/api/propositions/enseignantss'),
    
    // ==================== ENSEIGNANT PROPOSITIONS ====================
    
    // Get teacher's propositions
    getEnseignantPropositions: (page: number, limit: number) =>
      apiClient.get(`/api/propositions/enseignant?page=${page}&limit=${limit}`),
    
    // Submit new teacher proposition
    submitEnseignantProposition: (data: {
      intitule: string;
      type_sujet: string;
      option: string;
      resume: string;
      technologies_utilisees?: string;
      besoins_materiels?: string;
      co_encadrant_id?: string;
    }) => {
        const transformedData = {
        intitule: data.intitule,
        type_sujet: data.type_sujet,
        option: data.option,
        resume: data.resume,
        technologies_utilisees: data.technologies_utilisees || '',
        besoins_materiels: data.besoins_materiels || '',
        co_encadrant_id: data.co_encadrant_id || '',
        status: 'pending'
      };
      
      console.log("Sending transformed data:", transformedData);
      return apiClient.post('/api/propositions/enseignant', transformedData);
    },

    // Update teacher proposition
    updateEnseignantProposition: (id: string | number, data: {
      intitule: string;
      type_sujet: string;
      option: string;
      resume: string;
      technologies_utilisees?: string;
      besoins_materiels?: string;
      co_encadrant_id?: string;
    }) => {
      const transformedData = {
        intitule: data.intitule,
        type_sujet: data.type_sujet,
        option: data.option,
        resume: data.resume,
        technologies_utilisees: data.technologies_utilisees || '',
        besoins_materiels: data.besoins_materiels || '',
        co_encadrant_id: data.co_encadrant_id || '',
      };
      
      console.log("Updating proposition with data:", transformedData);
      return apiClient.put(`/api/propositions/enseignant/${id}`, transformedData);
    },

    // Delete teacher proposition
    deleteEnseignantProposition: (id: string | number) =>
      apiClient.delete(`/api/propositions/enseignant/${id}`),

    // ==================== ETUDIANT PROPOSITIONS ====================

    // Submit new student proposition
    submitEtudiantProposition: (data: {
      intitule: string;
      type_sujet: string;
      option: string;
      resume: string;
      technologies?: string;
      besoins?: string;
    }) => {
      const transformedData = {
        intitule: data.intitule,
        type_sujet: data.type_sujet,
        option: data.option,
        resume: data.resume,
        technologies: data.technologies || '',
        besoins: data.besoins || '',
      };
      
      console.log("Sending student proposition data:", transformedData);
      return apiClient.post('/api/propositions/etudiant', transformedData);
    },

    // Update student proposition
    updateEtudiantProposition: (id: string | number, data: {
      intitule: string;
      type_sujet: string;
      option: string;
      resume: string;
      technologies_utilisees?: string;
      besoins_materiels?: string;
    }) => {
      const transformedData = {
        intitule: data.intitule,
        type_sujet: data.type_sujet,
        option: data.option,
        resume: data.resume,
        technologies_utilisees: data.technologies_utilisees || '',
        besoins_materiels: data.besoins_materiels || '',
      };
      
      console.log("Updating student proposition with data:", transformedData);
      return apiClient.put(`/api/propositions/etudiant/${id}`, transformedData);
    },

    // Delete student proposition
    deleteEtudiantProposition: (id: string | number) =>
      apiClient.delete(`/api/propositions/etudiant/${id}`),

    // ==================== ENTREPRISE PROPOSITIONS ====================

    // Submit new company proposition
    submitEntrepriseProposition: (data: {
      intitule: string;
      type_sujet: string;
      option: string;
      resume: string;
    }) => {
      const transformedData = {
        intitule: data.intitule,
        type_sujet: data.type_sujet,
        option: data.option,
        resume: data.resume,
      };
      
      console.log("Sending company proposition data:", transformedData);
      return apiClient.post('/api/propositions/entreprise', transformedData);
    },

    // Update company proposition
    updateEntrepriseProposition: (id: string | number, data: {
      intitule: string;
      option: string;
      resume: string;
      technologies_utilisees?: string;
      besoins_materiels?: string;
    }) => {
      const transformedData = {
        intitule: data.intitule,
        option: data.option,
        resume: data.resume,
        technologies_utilisees: data.technologies_utilisees || '',
        besoins_materiels: data.besoins_materiels || '',
      };
      
      console.log("Updating company proposition with data:", transformedData);
      return apiClient.put(`/api/propositions/entreprise/${id}`, transformedData);
    },

    // Delete company proposition
    deleteEntrepriseProposition: (id: string | number) =>
      apiClient.delete(`/api/propositions/entreprise/${id}`),
}

export default propositionService;