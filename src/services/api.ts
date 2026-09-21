/**
 * KiraEnterprise API Service
 * Connects frontend to Cloudflare Worker backend
 * Database: mykira (D1) - Real data from Cloudflare Workers
 */

const API_BASE_URL = 'https://kiraenterprisev5-6.mykira.workers.dev';

class ApiService {
  private token: string | null = null;

  constructor() {
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
      const error = await response.json().catch(() => ({ error: 'API request failed' }));
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  // Generic GET method
  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
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

  // Health Check
  async healthCheck() {
    return this.request<any>('/api/health');
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
    
    const query = params.toString();
    return this.request<any[]>(`/api/invoices${query ? '?' + query : ''}`);
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

  // Chart of Accounts
  async getAccounts() {
    return this.request<any[]>('/api/accounts');
  }

  // Journal & Ledger
  async getJournal(filters?: { from?: string; to?: string }) {
    const params = new URLSearchParams();
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    
    const query = params.toString();
    return this.request<any[]>(`/api/journal${query ? '?' + query : ''}`);
  }

  async getJournals(filters?: { company_id?: string }) {
    const params = new URLSearchParams();
    if (filters?.company_id) params.append('company_id', filters.company_id);
    
    const query = params.toString();
    return this.request<any[]>(`/api/journals${query ? '?' + query : ''}`);
  }

  async createJournalEntry(data: any) {
    return this.request<any>('/api/journal', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getLedger(accountCode: string) {
    return this.request<any>(`/api/ledger?account=${accountCode}`);
  }

  // Financial Reports
  async getTrialBalance(date?: string) {
    const params = date ? `?date=${date}` : '';
    return this.request<any>(`/api/trial-balance${params}`);
  }

  async getProfitLoss(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    
    const query = params.toString();
    return this.request<any>(`/api/profit-loss${query ? '?' + query : ''}`);
  }

  async getBalanceSheet(date?: string) {
    const params = date ? `?date=${date}` : '';
    return this.request<any>(`/api/balance-sheet${params}`);
  }

  // Transactions
  async getTransactions(companyId?: string, filters?: { type?: string; category?: string; date_from?: string; date_to?: string }) {
    const params = new URLSearchParams();
    if (companyId) params.append('company_id', companyId);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    
    const query = params.toString();
    return this.request<any[]>(`/api/transactions${query ? '?' + query : ''}`);
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

  // Zakat
  async calculateZakat(data: any) {
    return this.request<any>('/api/zakat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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

  // Admin Functions
  async executeAdminQuery(query: string) {
    return this.request<any>('/api/admin/query', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }

  async runMaintenanceTask(task: string) {
    return this.request<any>('/api/admin/maintenance', {
      method: 'POST',
      body: JSON.stringify({ task }),
    });
  }

  async exportDatabaseBackup() {
    return this.request<any>('/api/admin/backup');
  }
}

export const api = new ApiService();
export default api;
