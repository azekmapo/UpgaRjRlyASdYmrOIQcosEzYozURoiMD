import apiClient from "@/lib/api";

export const periodeService = {
    getPeriodes: () => apiClient.get('/api/periods'),
    getCurrentPeriods: () => apiClient.get('/api/current-period'),
}; 