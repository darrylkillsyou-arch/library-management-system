import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('libranest_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('libranest_token');
      localStorage.removeItem('libranest_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) => {
    const form = new URLSearchParams();
    form.append('username', email);
    form.append('password', password);
    return api.post('/api/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  me: () => api.get('/api/auth/me'),
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardApi = {
  get: () => api.get('/api/dashboard'),
  getAuditLogs: (limit = 50) => api.get(`/api/dashboard/audit?limit=${limit}`),
  getAllCopies: (q?: string, status?: string) => {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (status) params.append('status', status);
    return api.get(`/api/dashboard/copies?${params}`);
  },
};

// ─── Books ───────────────────────────────────────────────────────────────────
export const booksApi = {
  list: (params?: Record<string, unknown>) => api.get('/api/books', { params }),
  get: (id: number) => api.get(`/api/books/${id}`),
  create: (data: unknown) => api.post('/api/books', data),
  update: (id: number, data: unknown) => api.put(`/api/books/${id}`, data),
  getCopies: (bookId: number) => api.get(`/api/books/${bookId}/copies`),
  addCopy: (bookId: number, data: unknown) => api.post(`/api/books/${bookId}/copies`, data),
  updateCopy: (copyId: number, data: unknown) => api.put(`/api/books/copies/${copyId}`, data),
};

// ─── Authors ─────────────────────────────────────────────────────────────────
export const authorsApi = {
  list: (q?: string) => api.get('/api/authors', { params: q ? { q } : undefined }),
  create: (data: unknown) => api.post('/api/authors', data),
  update: (id: number, data: unknown) => api.put(`/api/authors/${id}`, data),
  delete: (id: number) => api.delete(`/api/authors/${id}`),
};

// ─── Categories ──────────────────────────────────────────────────────────────
export const categoriesApi = {
  list: (q?: string) => api.get('/api/categories', { params: q ? { q } : undefined }),
  create: (data: unknown) => api.post('/api/categories', data),
  update: (id: number, data: unknown) => api.put(`/api/categories/${id}`, data),
  delete: (id: number) => api.delete(`/api/categories/${id}`),
};

// ─── Members ─────────────────────────────────────────────────────────────────
export const membersApi = {
  list: (params?: Record<string, unknown>) => api.get('/api/members', { params }),
  get: (id: number) => api.get(`/api/members/${id}`),
  create: (data: unknown) => api.post('/api/members', data),
  update: (id: number, data: unknown) => api.put(`/api/members/${id}`, data),
};

// ─── Loans ───────────────────────────────────────────────────────────────────
export const loansApi = {
  list: (params?: Record<string, unknown>) => api.get('/api/loans', { params }),
  get: (id: number) => api.get(`/api/loans/${id}`),
  issue: (data: unknown) => api.post('/api/loans', data),
  returnBook: (loanId: number, data?: unknown) => api.post(`/api/loans/${loanId}/return`, data || {}),
};
