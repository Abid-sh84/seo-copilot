import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30s for audit calls
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Token Cache ───────────────────────────────────────────────────────────────
// Fetch a backend-compatible JWT from our own Next.js API route (server reads
// the NextAuth session cookie and returns a signed JWT the backend can verify).
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getBackendToken(): Promise<string | null> {
  const now = Date.now();
  // Re-use cached token if it still has >60s of life
  if (cachedToken && now < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  try {
    const res = await fetch('/api/auth/token', { credentials: 'include' });
    if (!res.ok) {
      cachedToken = null;
      tokenExpiresAt = 0;
      return null;
    }
    const { token } = await res.json();
    cachedToken = token;
    // Tokens are issued for 1h; cache for 55 minutes
    tokenExpiresAt = now + 55 * 60 * 1000;
    return token;
  } catch {
    return null;
  }
}

// ── Request Interceptor ───────────────────────────────────────────────────────
// Attach the backend JWT to every outgoing request
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getBackendToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ──────────────────────────────────────────────────────
// On 401 clear the cached token and redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      cachedToken = null;
      tokenExpiresAt = 0;
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
