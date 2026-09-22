-- KiraEnterprise v5.6 - D1 Schema Migration
-- Based on Worker's initDatabase() function in src/index.js
-- Database: mykira (Cloudflare D1 - SQLite)

-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT,
  name TEXT,
  role TEXT DEFAULT 'client_staff',
  company_id TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT
);

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT,
  registration_no TEXT,
  tin TEXT,
  brn_ic TEXT,
  msic_code TEXT,
  address TEXT,
  city TEXT,
  state TEXT DEFAULT 'Sabah',
  postcode TEXT,
  phone TEXT,
  email TEXT,
  financial_year_end TEXT,
  tax_rate REAL DEFAULT 24,
  sst_rate REAL DEFAULT 6,
  director_name TEXT,
  accountant_name TEXT,
  is_active INTEGER DEFAULT 1
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  company_id TEXT,
  invoice_no TEXT,
  customer_name TEXT,
  customer_tin TEXT,
  customer_brn_ic TEXT,
  customer_msic TEXT,
  customer_address TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  date TEXT,
  due_date TEXT,
  subtotal REAL,
  tax_amount REAL,
  discount REAL DEFAULT 0,
  grand_total REAL,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  is_einvoice INTEGER DEFAULT 0,
  einvoice_category TEXT,
  revenue_account TEXT DEFAULT '4000',
  expense_account TEXT DEFAULT '5000',
  created_by TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT,
  description TEXT,
  quantity REAL,
  unit_price REAL,
  tax_rate REAL,
  amount REAL,
  tax_amount REAL,
  total REAL,
  account_code TEXT,
  sort_order INTEGER
);

-- Chart of Accounts
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  code TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  type TEXT,
  category TEXT,
  parent_code TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT
);

-- Journal Entries (double-entry with separate debit/credit accounts)
CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  company_id TEXT,
  date TEXT,
  description TEXT,
  reference TEXT,
  debit_account TEXT,
  credit_account TEXT,
  amount REAL,
  auto_posted INTEGER DEFAULT 0,
  invoice_id TEXT,
  created_by TEXT,
  created_at TEXT
);

-- Zakat Calculations
CREATE TABLE IF NOT EXISTS zakat_calculations (
  id TEXT PRIMARY KEY,
  company_id TEXT,
  calculation_date TEXT,
  modal_kerja REAL,
  kaedah_pertumbuhan REAL,
  nisab REAL,
  zakat_amount REAL,
  notes TEXT,
  created_at TEXT
);
