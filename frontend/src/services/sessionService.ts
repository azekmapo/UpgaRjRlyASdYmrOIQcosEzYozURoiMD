import apiClient from "@/lib/api";
import * as XLSX from 'xlsx';

export interface Pfe {
    id: number;
    intitule: string;
    option: string;
    type_sujet: string;
    session: string;
  }
  
  export const sessionService = {
    getSessions: (): Promise<{ pfes: Pfe[], sessionStatus: boolean }> =>
      apiClient.get('/api/sessions'),
      
    getAdminSessions: (): Promise<{ pfes: Pfe[] }> =>
      apiClient.get('/api/sessions/admin'),
      
    updateSession: (pfe_id: number, session: string): Promise<{ success: boolean, message: string }> =>
      apiClient.post('/api/sessions/update', { pfe_id, session }),
      
    downloadExcel: async () => {
      try {
        // Get data
        let response: { pfes: Pfe[] };
        const cachedUserStr = sessionStorage.getItem('cached_user');
        const userRole = cachedUserStr ? JSON.parse(cachedUserStr).role : undefined;
        console.log('User role:', userRole);
        if (userRole === 'admin') {
          response = await apiClient.get<{ pfes: Pfe[] }>('/api/sessions/admin');
        } else {
          response = await apiClient.get<{ pfes: Pfe[], sessionStatus: boolean }>('/api/sessions');
        }
        
        const pfes = response.pfes || [];
        
        // Format data for Excel
        const excelData = pfes.map((pfe: Pfe) => ({
          "ID": pfe.id,
          "Intitulé": pfe.intitule,
          "Option": pfe.option,
          "Type": pfe.type_sujet,
          "Session": pfe.session
        }));
        
        // Set column widths
        const columnWidths = [
          { wch: 5 },   // ID
          { wch: 40 },  // Intitulé
          { wch: 15 },  // Option
          { wch: 15 },  // Type
          { wch: 15 },  // Session
        ];
        
        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        worksheet['!cols'] = columnWidths;
        
        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sessions PFE");
        
        // Generate Excel file
        XLSX.writeFile(workbook, "sessions_pfe.xlsx");
        
      } catch (error) {
        console.error('Error generating Excel file:', error);
        alert('Error generating Excel file. Please try again.');
      }
    }
  }
  