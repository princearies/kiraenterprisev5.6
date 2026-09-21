import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User, Company, Invoice, Transaction, DashboardStats } from '../types';
import api from '../services/api';

interface AppState {
  user: User | null;
  companies: Company[];
  activeCompany: Company | null;
  invoices: Invoice[];
  transactions: Transaction[];
  accounts: any[];
  isAuthenticated: boolean;
  sidebarOpen: boolean;
  loading: boolean;
}

interface AppContextType extends AppState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setActiveCompany: (company: Company) => void;
  addInvoice: (invoice: Invoice) => Promise<void>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  addTransaction: (transaction: Transaction) => Promise<void>;
  toggleSidebar: () => void;
  getDashboardStats: () => DashboardStats;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    user: null,
    companies: [],
    activeCompany: null,
    invoices: [],
    transactions: [],
    accounts: [],
    isAuthenticated: false,
    sidebarOpen: false,
    loading: true,
  });

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('kira_token');
    const userData = localStorage.getItem('kira_user');
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setState(prev => ({ ...prev, user, isAuthenticated: true, loading: false }));
        // Load data after login
        loadData();
      } catch (e) {
        setState(prev => ({ ...prev, loading: false }));
      }
    } else {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const loadData = async () => {
    try {
      const [companies, invoices, accounts] = await Promise.all([
        api.getCompanies(),
        api.getInvoices(),
        api.get('/api/accounts'),
      ]);
      
      setState(prev => ({
        ...prev,
        companies,
        invoices,
        accounts,
        activeCompany: companies.length > 0 ? companies[0] : null,
      }));
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Try API login first
      try {
        const data = await api.login(email, password);
        setState(prev => ({
          ...prev,
          user: data.user,
          isAuthenticated: true,
          loading: false,
        }));
        await loadData();
        return;
      } catch (apiError) {
        // If API fails, use demo mode
        console.warn('API login failed, using demo mode:', apiError);
      }

      // Demo mode fallback
      const user: User = {
        id: 'user-001',
        name: 'Ahmad Razak',
        email: email,
        role: 'accountant_owner',
        company_id: 'comp-001',
      };
      
      localStorage.setItem('kira_token', 'demo-token');
      localStorage.setItem('kira_user', JSON.stringify(user));
      
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: true,
        loading: false,
      }));
      
      await loadData();
    } catch (error) {
      console.error('Login error:', error);
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const logout = useCallback(() => {
    api.logout();
    setState(prev => ({
      ...prev,
      user: null,
      isAuthenticated: false,
      companies: [],
      activeCompany: null,
      invoices: [],
      transactions: [],
      accounts: [],
    }));
  }, []);

  const setActiveCompany = useCallback((company: Company) => {
    setState(prev => ({ ...prev, activeCompany: company }));
  }, []);

  const addInvoice = async (invoice: Invoice) => {
    try {
      const result = await api.createInvoice(invoice);
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Failed to add invoice:', error);
      throw error;
    }
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    try {
      await api.updateInvoice(id, updates);
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Failed to update invoice:', error);
      throw error;
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      await api.deleteInvoice(id);
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      throw error;
    }
  };

  const addTransaction = async (transaction: Transaction) => {
    try {
      await api.createTransaction(transaction);
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Failed to add transaction:', error);
      throw error;
    }
  };

  const toggleSidebar = useCallback(() => {
    setState(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));
  }, []);

  const getDashboardStats = useCallback((): DashboardStats => {
    const companyInvoices = state.invoices.filter(i => i.company_id === state.activeCompany?.id);
    const companyTransactions = state.transactions.filter(t => t.company_id === state.activeCompany?.id);
    
    return {
      total_invoices: companyInvoices.length,
      total_revenue: companyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.credit, 0),
      outstanding_amount: companyInvoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((sum, i) => sum + i.grand_total, 0),
      paid_this_month: companyInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.grand_total, 0),
      pending_invoices: companyInvoices.filter(i => i.status === 'sent' || i.status === 'draft').length,
    };
  }, [state.invoices, state.transactions, state.activeCompany]);

  const refreshData = async () => {
    await loadData();
  };

  return (
    <AppContext.Provider value={{
      ...state,
      login,
      logout,
      setActiveCompany,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      addTransaction,
      toggleSidebar,
      getDashboardStats,
      refreshData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
