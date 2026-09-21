import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, Company, Invoice, Transaction, InvoiceLineItem, DashboardStats } from '../types';

interface AppState {
  user: User | null;
  companies: Company[];
  activeCompany: Company | null;
  invoices: Invoice[];
  transactions: Transaction[];
  isAuthenticated: boolean;
  sidebarOpen: boolean;
}

interface AppContextType extends AppState {
  login: (email: string, password: string) => void;
  logout: () => void;
  setActiveCompany: (company: Company) => void;
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  addTransaction: (transaction: Transaction) => void;
  toggleSidebar: () => void;
  getDashboardStats: () => DashboardStats;
}

const AppContext = createContext<AppContextType | null>(null);

const DEMO_COMPANIES: Company[] = [
  {
    id: 'comp-001',
    name: 'Sabah Maju Enterprise',
    registration_no: 'SA1234567-X',
    sst_no: 'B16-1906-32000045',
    tin: 'C 1234567890',
    address: 'Lot 12, Block B, KK Times Square',
    city: 'Kota Kinabalu',
    state: 'Sabah',
    postcode: '88100',
    phone: '+6088-123456',
    email: 'info@sabahmaju.my',
    financial_year_end: '2025-12-31',
    tax_rate: 24,
    sst_rate: 6,
    chart_of_accounts_template: 'standard_malaysia',
    created_at: '2024-01-15',
  },
  {
    id: 'comp-002',
    name: 'Borneo Digital Solutions',
    registration_no: 'SA7654321-A',
    sst_no: 'W10-2001-32000123',
    tin: 'EI 0987654321',
    address: 'No. 5, Jalan Lintas',
    city: 'Kota Kinabalu',
    state: 'Sabah',
    postcode: '88350',
    phone: '+6088-765432',
    email: 'admin@borneodigital.my',
    financial_year_end: '2025-06-30',
    tax_rate: 17,
    sst_rate: 8,
    chart_of_accounts_template: 'tech_services',
    created_at: '2024-03-20',
  },
];

const DEMO_INVOICES: Invoice[] = [
  {
    id: 'inv-001',
    company_id: 'comp-001',
    invoice_no: 'INV-2025-001',
    customer_name: 'ABC Trading Sdn Bhd',
    customer_tin: 'C 9876543210',
    customer_address: 'No. 10, Jalan Gaya, 88000 Kota Kinabalu',
    customer_email: 'purchase@abctrading.my',
    customer_phone: '+6088-999888',
    date: '2025-01-15',
    due_date: '2025-02-15',
    line_items: [
      { id: 'li-1', description: 'Web Development Services', quantity: 1, unit_price: 5000, tax_rate: 6, amount: 5000, tax_amount: 300, total: 5300 },
      { id: 'li-2', description: 'Domain & Hosting (Annual)', quantity: 1, unit_price: 450, tax_rate: 6, amount: 450, tax_amount: 27, total: 477 },
    ],
    subtotal: 5450,
    tax_amount: 327,
    discount: 0,
    grand_total: 5777,
    status: 'paid',
    notes: 'Thank you for your business!',
    is_einvoice: true,
    einvoice_category: '01001',
    consolidated: false,
    created_by: 'user-001',
    created_at: '2025-01-15',
  },
  {
    id: 'inv-002',
    company_id: 'comp-001',
    invoice_no: 'INV-2025-002',
    customer_name: 'XYZ Enterprise',
    customer_tin: 'C 1122334455',
    customer_address: 'Block C, Suria Sabah, 88000 KK',
    customer_email: 'accounts@xyzenterprise.my',
    customer_phone: '+6088-555444',
    date: '2025-01-20',
    due_date: '2025-02-20',
    line_items: [
      { id: 'li-3', description: 'Mobile App Development', quantity: 1, unit_price: 12000, tax_rate: 6, amount: 12000, tax_amount: 720, total: 12720 },
    ],
    subtotal: 12000,
    tax_amount: 720,
    discount: 500,
    grand_total: 12940,
    status: 'sent',
    notes: 'Phase 1 delivery',
    is_einvoice: true,
    einvoice_category: '01001',
    consolidated: false,
    created_by: 'user-001',
    created_at: '2025-01-20',
  },
  {
    id: 'inv-003',
    company_id: 'comp-002',
    invoice_no: 'BD-2025-001',
    customer_name: 'Government of Sabah',
    customer_tin: 'C 5566778899',
    customer_address: 'Wisma Sabah, 88604 Kota Kinabalu',
    customer_email: 'ict@sabah.gov.my',
    customer_phone: '+6088-333222',
    date: '2025-01-10',
    due_date: '2025-03-10',
    line_items: [
      { id: 'li-4', description: 'Cloud Infrastructure Setup', quantity: 1, unit_price: 8500, tax_rate: 6, amount: 8500, tax_amount: 510, total: 9010 },
      { id: 'li-5', description: 'Security Audit & Penetration Testing', quantity: 1, unit_price: 3500, tax_rate: 6, amount: 3500, tax_amount: 210, total: 3710 },
      { id: 'li-6', description: 'Staff Training (5 pax)', quantity: 5, unit_price: 800, tax_rate: 6, amount: 4000, tax_amount: 240, total: 4240 },
    ],
    subtotal: 16000,
    tax_amount: 960,
    discount: 0,
    grand_total: 16960,
    status: 'overdue',
    notes: 'Government project - Phase 1',
    is_einvoice: true,
    einvoice_category: '02001',
    consolidated: false,
    created_by: 'user-001',
    created_at: '2025-01-10',
  },
];

const DEMO_TRANSACTIONS: Transaction[] = [
  { id: 'txn-001', company_id: 'comp-001', date: '2025-01-15', description: 'Invoice INV-2025-001 Payment', category: 'Sales Revenue', account_code: '4000', debit: 0, credit: 5450, reference: 'INV-2025-001', type: 'income', created_by: 'user-001', created_at: '2025-01-15' },
  { id: 'txn-002', company_id: 'comp-001', date: '2025-01-15', description: 'SST Payable', category: 'Tax Payable', account_code: '2200', debit: 0, credit: 327, reference: 'INV-2025-001', type: 'liability', created_by: 'user-001', created_at: '2025-01-15' },
  { id: 'txn-003', company_id: 'comp-001', date: '2025-01-10', description: 'Office Rent - January', category: 'Rental Expense', account_code: '5100', debit: 2500, credit: 0, reference: 'RENT-JAN', type: 'expense', created_by: 'user-001', created_at: '2025-01-10' },
  { id: 'txn-004', company_id: 'comp-001', date: '2025-01-05', description: 'Internet & Utilities', category: 'Utilities', account_code: '5200', debit: 350, credit: 0, reference: 'UTIL-JAN', type: 'expense', created_by: 'user-001', created_at: '2025-01-05' },
  { id: 'txn-005', company_id: 'comp-002', date: '2025-01-12', description: 'Software License Revenue', category: 'Service Revenue', account_code: '4100', debit: 0, credit: 3200, reference: 'LIC-001', type: 'income', created_by: 'user-001', created_at: '2025-01-12' },
  { id: 'txn-006', company_id: 'comp-002', date: '2025-01-08', description: 'Cloud Server Costs', category: 'Hosting Expense', account_code: '5300', debit: 1800, credit: 0, reference: 'AWS-JAN', type: 'expense', created_by: 'user-001', created_at: '2025-01-08' },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    user: null,
    companies: DEMO_COMPANIES,
    activeCompany: DEMO_COMPANIES[0],
    invoices: DEMO_INVOICES,
    transactions: DEMO_TRANSACTIONS,
    isAuthenticated: false,
    sidebarOpen: false,
  });

  const login = useCallback((email: string, _password: string) => {
    const user: User = {
      id: 'user-001',
      name: 'Ahmad Razak',
      email: email,
      role: 'accountant_owner',
      company_id: 'comp-001',
    };
    setState(prev => ({ ...prev, user, isAuthenticated: true }));
  }, []);

  const logout = useCallback(() => {
    setState(prev => ({ ...prev, user: null, isAuthenticated: false }));
  }, []);

  const setActiveCompany = useCallback((company: Company) => {
    setState(prev => ({ ...prev, activeCompany: company }));
  }, []);

  const addInvoice = useCallback((invoice: Invoice) => {
    setState(prev => ({ ...prev, invoices: [...prev.invoices, invoice] }));
  }, []);

  const updateInvoice = useCallback((id: string, updates: Partial<Invoice>) => {
    setState(prev => ({
      ...prev,
      invoices: prev.invoices.map(inv => inv.id === id ? { ...inv, ...updates } : inv),
    }));
  }, []);

  const deleteInvoice = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      invoices: prev.invoices.filter(inv => inv.id !== id),
    }));
  }, []);

  const addTransaction = useCallback((transaction: Transaction) => {
    setState(prev => ({ ...prev, transactions: [...prev.transactions, transaction] }));
  }, []);

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
