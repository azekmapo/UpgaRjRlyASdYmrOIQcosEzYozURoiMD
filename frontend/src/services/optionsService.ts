import apiClient from '@/lib/api';
import type { 
  OptionsResponse, 
  OptionResponse, 
  CreateOptionData, 
  UpdateOptionData, 
  DeleteOptionResponse 
} from '@/types/options';

export const optionService = {
  // Get all options
  getOptions: (): Promise<OptionsResponse> =>
    apiClient.get('/api/options'),

  // Get single option by ID
  getOption: (id: string): Promise<OptionResponse> =>
    apiClient.get(`/api/options/${id}`),

  // Create new option (id_responsable will be null)
  createOption: (data: CreateOptionData): Promise<OptionResponse> =>
    apiClient.post('/api/options', data),

  // Update option name
  updateOption: (id: string, data: UpdateOptionData): Promise<OptionResponse> =>
    apiClient.put(`/api/options/${id}`, data),

  // Delete option
  deleteOption: (id: string): Promise<DeleteOptionResponse> =>
    apiClient.delete(`/api/options/${id}`),
};