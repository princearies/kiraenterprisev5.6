-- =============================================
-- KiraEnterprise v5.6 - Database Schema
-- Database: mykira (Cloudflare D1 - SQLite)
-- Database ID: 4037f2cd-0c4a-4251-846e-534eb7b47338
-- =============================================

-- Companies (Tenants)
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    registration_no TEXT UNIQUE,
    sst_no TEXT,
    tin TEXT,
    address TEXT,
    city TEXT,
    state TEXT DEFAULT 'Sabah',
    postcode TEXT,
    phone TEXT,
    email TEXT,
    financial_year_end TEXT DEFAULT '2025-12-31',
    tax_rate REAL DEFAULT 24.0,
    sst_rate REAL DEFAULT 6.0,
    chart_of_accounts_template TEXT DEFAULT 'standard_malaysia',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('platform_admin', 'accountant_owner', 'accountant_staff', 'client_owner', 'client_staff', 'viewer')),
    company_id TEXT,
    is_active INTEGER DEFAULT 1,
    last_login TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- User-Company assignments (for accountants managing multiple companies)
CREATE TABLE IF NOT EXISTS user_company_access (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    company_id TEXT NOT NULL,
    role TEXT NOT NULL,
    granted_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    UNIQUE(user_id, company_id)
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    invoice_no TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_tin TEXT,
    customer_address TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    date TEXT NOT NULL,
    due_date TEXT,
    subtotal REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    grand_total REAL DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    notes TEXT,
    is_einvoice INTEGER DEFAULT 0,
    einvoice_category TEXT,
    einvoice_uid TEXT,
    einvoice_status TEXT,
    consolidated INTEGER DEFAULT 0,
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity REAL DEFAULT 1,
    unit_price REAL DEFAULT 0,
    tax_rate REAL DEFAULT 0,
    amount REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    total REAL DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Transactions (Double-Entry)
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    account_code TEXT,
    debit REAL DEFAULT 0,
    credit REAL DEFAULT 0,
    reference TEXT,
    type TEXT CHECK(type IN ('income', 'expense', 'asset', 'liability', 'equity')),
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Chart of Accounts
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('asset', 'liability', 'equity', 'income', 'expense')),
    parent_code TEXT,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    UNIQUE(company_id, code)
);

-- Receipts/Documents (R2 references)
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT,
    size_bytes INTEGER,
    r2_key TEXT NOT NULL,
    category TEXT,
    related_invoice_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (related_invoice_id) REFERENCES invoices(id)
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    company_id TEXT,
    user_id TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Company Settings (key-value per company)
CREATE TABLE IF NOT EXISTS company_settings (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value TEXT,
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    UNIQUE(company_id, setting_key)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_transactions_company ON transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_coa_company ON chart_of_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_company ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_invoice ON documents(related_invoice_id);
CREATE INDEX IF NOT EXISTS idx_audit_company ON audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_access_user ON user_company_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_access_company ON user_company_access(company_id);
