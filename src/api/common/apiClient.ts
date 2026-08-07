import axios, { AxiosError } from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export class ApiClientError extends Error {
  status?: number;
  code?: string;
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

// Response interceptor to format responses and handle errors
apiClient.interceptors.response.use(
  (response) => {
    let data = response.data;
    // Unwrap double-encoded string responses if they occur
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {}
    }
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {}
    }
    response.data = data;
    return response;
  },
  async (error: AxiosError) => {
    const status = error.response?.status;
    const data = error.response?.data as any;
    const message = data?.error || data?.message || error.message || 'API request failed';
    return Promise.reject(new ApiClientError(message, status, data?.code));
  }
);
