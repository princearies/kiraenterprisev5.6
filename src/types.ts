export type UserRole = 'platform_admin' | 'accountant_owner' | 'accountant_staff' | 'client_owner' | 'client_staff' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company_id: string;
  avatar?: string;
}

export interface Company {
  id: string;
  name: string;
  registration_no: string;
  sst_no: string;
  tin: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  phone: string;
  email: string;
  financial_year_end: string;
  tax_rate: number;
  sst_rate: number;
  chart_of_accounts_template: string;
  created_at: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  amount: number;
  tax_amount: number;
  total: number;
}

export interface Invoice {
  id: string;
  company_id: string;
  invoice_no: string;
  customer_name: string;
  customer_tin: string;
  customer_address: string;
  customer_email: string;
  customer_phone: string;
  date: string;
  due_date: string;
  line_items: InvoiceLineItem[];
  subtotal: number;
  tax_amount: number;
  discount: number;
  grand_total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes: string;
  is_einvoice: boolean;
  einvoice_category: string;
  consolidated: boolean;
  created_by: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  company_id: string;
  date: string;
  description: string;
  category: string;
  account_code: string;
  debit: number;
  credit: number;
  reference: string;
  type: 'income' | 'expense' | 'asset' | 'liability' | 'equity';
  created_by: string;
  created_at: string;
}

export interface ChartOfAccount {
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  parent_code?: string;
}

export interface DashboardStats {
  total_invoices: number;
  total_revenue: number;
  outstanding_amount: number;
  paid_this_month: number;
  pending_invoices: number;
}
