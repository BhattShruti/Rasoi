import axios from 'axios';
import type { GenerateRecipeRequest, GenerateRecipeResponse, ChatRequest, ChatResponse } from '../types/Api';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const apiClient = axios.create({
  baseURL,
  timeout: 120000, // 120 seconds to give Gemini ample execution buffer
  headers: {
    'Content-Type': 'application/json',
  },
});

export class ApiError extends Error {
  statusCode: number;
  requestId?: string;

  constructor(message: string, statusCode: number, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.requestId = requestId;
  }
}

// Attach response interceptor for unified exception parsing
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const data = error.response.data;
      const statusCode = error.response.status;
      const message = data?.message || 'An error occurred on the server.';
      const requestId = data?.request_id || error.response.headers['x-request-id'];
      return Promise.reject(new ApiError(message, statusCode, requestId));
    } else if (error.request) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return Promise.reject(new ApiError('Connection timed out. The server took too long to respond.', 504));
      }
      return Promise.reject(new ApiError('Network error. Please make sure the backend server is running and accessible.', 0));
    } else {
      return Promise.reject(new ApiError(error.message, 500));
    }
  }
);

export const recipeService = {
  generate: async (params: GenerateRecipeRequest): Promise<GenerateRecipeResponse> => {
    const response = await apiClient.post<GenerateRecipeResponse>('/recipes/generate', params);
    return response.data;
  },
};

export const chatService = {
  askChef: async (params: ChatRequest): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>('/chef/chat', params);
    return response.data;
  },
};

export default apiClient;
