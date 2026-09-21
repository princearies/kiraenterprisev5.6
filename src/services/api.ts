/**
 * KiraEnterprise API Service
 * Connects frontend to Cloudflare Worker backend
 */

const API_BASE_URL = 'https://kiraenterprisev5-6.mykira.workers.dev';

class ApiService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage
    this.token = localStorage.getItem('kira_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  // Authentication
  async login(email: string, password: string) {
    const data = await this.request<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    this.token = data.token;
    localStorage.setItem('kira_token', data.token);
    localStorage.setItem('kira_user', JSON.stringify(data.user));
    
    return data;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('kira_token');
    localStorage.removeItem('kira_user');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getUser() {
    const userStr = localStorage.getItem('kira_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Companies
  async getCompanies() {
    return this.request<any[]>('/api/companies');
  }

  async getCompany(id: string) {
    return this.request<any>(`/api/companies/${id}`);
  }

  async createCompany(data: any) {
    return this.request<any>('/api/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCompany(id: string, data: any) {
    return this.request<any>(`/api/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Invoices
  async getInvoices(companyId?: string, filters?: { status?: string; date_from?: string; date_to?: string }) {
    const params = new URLSearchParams();
    if (companyId) params.append('company_id', companyId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    
    return this.request<any[]>(`/api/invoices?${params.toString()}`);
  }

  async getInvoice(id: string, companyId?: string) {
    const params = companyId ? `?company_id=${companyId}` : '';
    return this.request<any>(`/api/invoices/${id}${params}`);
  }

  async createInvoice(data: any) {
    return this.request<any>('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInvoice(id: string, data: any) {
    return this.request<any>(`/api/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInvoice(id: string, companyId?: string) {
    const params = companyId ? `?company_id=${companyId}` : '';
    return this.request<any>(`/api/invoices/${id}${params}`, {
      method: 'DELETE',
    });
  }

  // Transactions
  async getTransactions(companyId?: string, filters?: { type?: string; category?: string; date_from?: string; date_to?: string }) {
    const params = new URLSearchParams();
    if (companyId) params.append('company_id', companyId);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    
    return this.request<any[]>(`/api/transactions?${params.toString()}`);
  }

  async createTransaction(data: any) {
    return this.request<any>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // e-Invoice
  async getEInvoiceData(companyId?: string) {
    const params = companyId ? `?company_id=${companyId}` : '';
    return this.request<any>(`/api/einvoice${params}`);
  }

  // Documents
  async getDocuments(companyId?: string) {
    const params = companyId ? `?company_id=${companyId}` : '';
    return this.request<any[]>(`/api/documents${params}`);
  }

  async uploadDocument(data: any) {
    return this.request<any>('/api/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Settings
  async getSettings(companyId?: string) {
    const params = companyId ? `?company_id=${companyId}` : '';
    return this.request<any>(`/api/settings${params}`);
  }

  async updateSettings(data: any, companyId?: string) {
    const params = companyId ? `?company_id=${companyId}` : '';
    return this.request<any>(`/api/settings${params}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Health Check
  async healthCheck() {
    return this.request<any>('/api/health');
  }
}

export const api = new ApiService();
export default api;
