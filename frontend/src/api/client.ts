import axios from 'axios';
import type { ScreeningResponse, ScreeningOptions } from '../types/api';

const API_BASE_URL = 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const api = {
  /**
   * Submit resumes and job description for screening
   */
  async screenResumes(
    jobDescription: string,
    files: File[],
    options?: ScreeningOptions
  ): Promise<ScreeningResponse> {
    const formData = new FormData();
    formData.append('jobDescription', jobDescription);
    
    if (options) {
      formData.append('options', JSON.stringify(options));
    }
    
    files.forEach((file) => {
      formData.append('resumes', file);
    });

    const response = await apiClient.post<ScreeningResponse>('/screen', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Check backend health
   */
  async checkHealth() {
    const response = await apiClient.get('/health');
    return response.data;
  }
};
