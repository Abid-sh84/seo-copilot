import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30s for audit calls
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request (set by auth context)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('seo_copilot_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('seo_copilot_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── API Functions ─────────────────────────────────────────────────────────────

export async function runAudit(url: string) {
  const response = await apiClient.post('/api/audit', { url });
  return response.data;
}

export async function getAudits(page = 1, limit = 10) {
  const response = await apiClient.get('/api/audits', { params: { page, limit } });
  return response.data;
}

export async function getAudit(id: string) {
  const response = await apiClient.get(`/api/audits/${id}`);
  return response.data;
}

export async function deleteAudit(id: string) {
  const response = await apiClient.delete(`/api/audits/${id}`);
  return response.data;
}

export async function healthCheck() {
  const response = await apiClient.get('/api/health');
  return response.data;
}

// ── Blog API Functions ────────────────────────────────────────────────────────

export async function generateBlog(keyword: string, tone?: string, targetAudience?: string) {
  const response = await apiClient.post('/api/blog/generate', { keyword, tone, targetAudience });
  return response.data;
}

export async function getBlogs(page = 1, limit = 10) {
  const response = await apiClient.get('/api/blog', { params: { page, limit } });
  return response.data;
}

export async function getBlog(id: string) {
  const response = await apiClient.get(`/api/blog/${id}`);
  return response.data;
}

export async function deleteBlog(id: string) {
  const response = await apiClient.delete(`/api/blog/${id}`);
  return response.data;
}
