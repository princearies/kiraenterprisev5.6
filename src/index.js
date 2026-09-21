/**
 * KiraEnterprise v5.6 - Complete Malaysian Accounting Suite
 * Enhanced Chart of Accounts Module with Comprehensive Code Structure
 * Database: mykira (D1) - 4037f2cd-0c4a-4251-846e-534eb7b47338
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors() });
    try {
      await initDatabase(env);
      
      // API Routes
      if (path === '/api/health') return handleHealth(env);
      
      // Login endpoint
      if (path === '/api/auth/login' && request.method === 'POST') {
        const body = await request.json();
        const user = await env.DB.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').bind(body.email).first();
        
        if (!user) {
          return json({ error: 'User not found' }, 401);
        }
        
        const validPassword = await verifyPassword(body.password, user.password_hash);
        if (!validPassword) {
          return json({ error: 'Invalid password' }, 401);
        }
        
        return json({
          token: 'token-' + Date.now(),
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            company_id: user.company_id
          }
        });
      }
      
      if (path === '/api/companies' && request.method === 'GET') return await getCompanies(env);
      if (path === '/api/companies' && request.method === 'POST') return await createCompany(request, env);
      if (path === '/api/invoices' && request.method === 'GET') return await getInvoices(request, env);
      if (path === '/api/invoices' && request.method === 'POST') return await createInvoice(request, env);
      if (path.match(/^\/api\/invoices\/[^/]+$/) && request.method === 'GET') return await getInvoice(path, env);
      if (path.match(/^\/api\/invoices\/[^/]+$/) && request.method === 'DELETE') return await deleteInvoice(path, env);
      if (path === '/api/journal' && request.method === 'GET') return await getJournal(request, env);
      if (path === '/api/journal' && request.method === 'POST') return await createJournalEntry(request, env);
      if (path === '/api/ledger' && request.method === 'GET') return await getLedger(request, env);
      
      // Chart of Accounts API
      if (path === '/api/accounts' && request.method === 'GET') return await getAccounts(env);
      if (path === '/api/accounts' && request.method === 'POST') return await createAccount(request, env);
      if (path.match(/^\/api\/accounts\/[^/]+$/) && request.method === 'PUT') return await updateAccount(path, request, env);
      if (path.match(/^\/api\/accounts\/[^/]+$/) && request.method === 'DELETE') return await deleteAccount(path, env);
      
      // Financial Reports
      if (path === '/api/trial-balance') return await getTrialBalance(request, env);
      if (path === '/api/profit-loss') return await getProfitLoss(request, env);
      if (path === '/api/balance-sheet') return await getBalanceSheet(request, env);
      if (path === '/api/zakat' && request.method === 'POST') return await calculateZakat(request, env);
      
      // Admin Panel Endpoints
      if (path === '/api/admin/query' && request.method === 'POST') return await handleAdminQuery(request, env);
      if (path === '/api/admin/maintenance' && request.method === 'POST') return await handleMaintenance(request, env);
      if (path === '/api/admin/backup' && request.method === 'GET') return await handleBackup(env);
      
      return new Response(renderHTML(), { headers: { 'Content-Type': 'text/html; charset=utf-8', ...cors() } });
    } catch (err) { return json({ error: err.message }, 500); }
  }
};

// ============================================
// DATABASE INITIALIZATION
// ============================================
async function initDatabase(env) {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, password_hash TEXT, name TEXT, role TEXT DEFAULT 'client_staff', company_id TEXT, is_active INTEGER DEFAULT 1, created_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS companies (id TEXT PRIMARY KEY, name TEXT, registration_no TEXT, tin TEXT, brn_ic TEXT, msic_code TEXT, address TEXT, city TEXT, state TEXT DEFAULT 'Sabah', postcode TEXT, phone TEXT, email TEXT, financial_year_end TEXT, tax_rate REAL DEFAULT 24, sst_rate REAL DEFAULT 6, director_name TEXT, accountant_name TEXT, is_active INTEGER DEFAULT 1)`,
    `CREATE TABLE IF NOT EXISTS invoices (id TEXT PRIMARY KEY, company_id TEXT, invoice_no TEXT, customer_name TEXT, customer_tin TEXT, customer_brn_ic TEXT, customer_msic TEXT, customer_address TEXT, customer_email TEXT, customer_phone TEXT, date TEXT, due_date TEXT, subtotal REAL, tax_amount REAL, discount REAL DEFAULT 0, grand_total REAL, status TEXT DEFAULT 'draft', notes TEXT, is_einvoice INTEGER DEFAULT 0, einvoice_category TEXT, revenue_account TEXT DEFAULT '4000', expense_account TEXT DEFAULT '5000', created_by TEXT, created_at TEXT, updated_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS invoice_line_items (id TEXT PRIMARY KEY, invoice_id TEXT, description TEXT, quantity REAL, unit_price REAL, tax_rate REAL, amount REAL, tax_amount REAL, total REAL, account_code TEXT, sort_order INTEGER)`,
    `CREATE TABLE IF NOT EXISTS chart_of_accounts (code TEXT PRIMARY KEY, name TEXT, description TEXT, type TEXT, category TEXT, parent_code TEXT, is_active INTEGER DEFAULT 1, created_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS journal_entries (id TEXT PRIMARY KEY, date TEXT, description TEXT, reference TEXT, debit_account TEXT, credit_account TEXT, amount REAL, auto_posted INTEGER DEFAULT 0, invoice_id TEXT, created_by TEXT, created_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS zakat_calculations (id TEXT PRIMARY KEY, company_id TEXT, calculation_date TEXT, modal_kerja REAL, kaedah_pertumbuhan REAL, nisab REAL, zakat_amount REAL, notes TEXT, created_at TEXT)`
  ];
  
  for (const sql of tables) await env.DB.prepare(sql).run();
  
  // Create default admin user if not exists
  const userCount = await env.DB.prepare('SELECT COUNT(*) as c FROM users').first();
  if (userCount.c === 0) {
    // Default credentials: admin@kiraenterprise.my / KiraAdmin2025!
    const passwordHash = await hashPassword('KiraAdmin2025!');
    await env.DB.prepare('INSERT INTO users (id, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), 'admin@kiraenterprise.my', passwordHash, 'Administrator', 'platform_admin', new Date().toISOString()).run();
    
    // Also create a demo accountant user
    const accountantHash = await hashPassword('Accountant2025!');
    await env.DB.prepare('INSERT INTO users (id, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), 'accountant@kiraenterprise.my', accountantHash, 'Ahmad Razak', 'accountant_owner', new Date().toISOString()).run();
  }
  
  // Initialize comprehensive Chart of Accounts
  const count = await env.DB.prepare('SELECT COUNT(*) as c FROM chart_of_accounts').first();
  if (count.c === 0) {
    const accounts = [
      // 1000 Series - ASSETS (ASET)
      ['1000', 'Cash & Bank Equivalents', 'Liquid assets including cash on hand and bank balances', 'asset', 'Current Asset', null],
      ['1010', 'Cash on Hand', 'Physical cash held by the business', 'asset', 'Current Asset', '1000'],
      ['1020', 'Maybank Current Account', 'Maybank business current account', 'asset', 'Current Asset', '1000'],
      ['1030', 'CIMB Savings Account', 'CIMB business savings account', 'asset', 'Current Asset', '1000'],
      ['1040', 'Public Bank Account', 'Public Bank business account', 'asset', 'Current Asset', '1000'],
      ['1100', 'Accounts Receivable', 'Money owed by customers for goods/services delivered', 'asset', 'Current Asset', null],
      ['1110', 'Trade Debtors', 'Amounts owed by trade customers', 'asset', 'Current Asset', '1100'],
      ['1120', 'Other Receivables', 'Non-trade amounts receivable', 'asset', 'Current Asset', '1100'],
      ['1200', 'Inventory & Stock', 'Goods held for sale or raw materials', 'asset', 'Current Asset', null],
      ['1210', 'Finished Goods', 'Completed products ready for sale', 'asset', 'Current Asset', '1200'],
      ['1220', 'Raw Materials', 'Materials used in production', 'asset', 'Current Asset', '1200'],
      ['1230', 'Work in Progress', 'Partially completed goods', 'asset', 'Current Asset', '1200'],
      ['1300', 'Fixed Assets', 'Long-term tangible assets used in operations', 'asset', 'Non-Current Asset', null],
      ['1310', 'Office Equipment', 'Computers, furniture, and office machinery', 'asset', 'Non-Current Asset', '1300'],
      ['1320', 'Motor Vehicles', 'Company vehicles and transportation', 'asset', 'Non-Current Asset', '1300'],
      ['1330', 'Machinery & Equipment', 'Production machinery and tools', 'asset', 'Non-Current Asset', '1300'],
      ['1340', 'Land & Buildings', 'Property owned by the business', 'asset', 'Non-Current Asset', '1300'],
      ['1400', 'Accumulated Depreciation', 'Total depreciation charged on fixed assets (contra asset)', 'asset', 'Non-Current Asset', null],
      ['1410', 'Accum. Deprec. - Equipment', 'Accumulated depreciation on office equipment', 'asset', 'Non-Current Asset', '1400'],
      ['1420', 'Accum. Deprec. - Vehicles', 'Accumulated depreciation on motor vehicles', 'asset', 'Non-Current Asset', '1400'],
      ['1500', 'Prepayments', 'Expenses paid in advance', 'asset', 'Current Asset', null],
      ['1600', 'Deposits', 'Security deposits and advances', 'asset', 'Current Asset', null],
      
      // 2000 Series - LIABILITIES (LIABILITI)
      ['2000', 'Current Liabilities', 'Obligations due within one year', 'liability', 'Current Liability', null],
      ['2100', 'Accounts Payable', 'Money owed to suppliers for goods/services received', 'liability', 'Current Liability', null],
      ['2110', 'Trade Creditors', 'Amounts owed to trade suppliers', 'liability', 'Current Liability', '2100'],
      ['2120', 'Other Payables', 'Non-trade amounts payable', 'liability', 'Current Liability', '2100'],
      ['2200', 'Tax Payables', 'Taxes owed to government authorities', 'liability', 'Current Liability', null],
      ['2210', 'SST Payable', 'Sales and Service Tax collected but not yet remitted', 'liability', 'Current Liability', '2200'],
      ['2220', 'Income Tax Payable', 'Corporate income tax owed to LHDN', 'liability', 'Current Liability', '2200'],
      ['2230', 'EPF Payable', 'Employees Provident Fund contributions owed', 'liability', 'Current Liability', '2200'],
      ['2240', 'SOCSO Payable', 'Social Security Organization contributions owed', 'liability', 'Current Liability', '2200'],
      ['2250', 'EIS Payable', 'Employment Insurance System contributions owed', 'liability', 'Current Liability', '2200'],
      ['2260', 'PCB Payable', 'Monthly Tax Deduction (Potongan Cukai Berjadual) owed', 'liability', 'Current Liability', '2200'],
      ['2300', 'Accruals', 'Expenses incurred but not yet paid', 'liability', 'Current Liability', null],
      ['2310', 'Accrued Salaries', 'Salaries earned by employees but not yet paid', 'liability', 'Current Liability', '2300'],
      ['2320', 'Accrued Utilities', 'Utilities used but not yet billed', 'liability', 'Current Liability', '2300'],
      ['2400', 'Short-term Loans', 'Bank loans and overdrafts due within one year', 'liability', 'Current Liability', null],
      ['2500', 'Non-Current Liabilities', 'Obligations due after one year', 'liability', 'Non-Current Liability', null],
      ['2510', 'Long-term Bank Loans', 'Bank loans with maturity over one year', 'liability', 'Non-Current Liability', '2500'],
      ['2520', 'Hire Purchase Payable', 'Hire purchase obligations for assets', 'liability', 'Non-Current Liability', '2500'],
      
      // 3000 Series - EQUITY (EKUITI)
      ['3000', 'Shareholders Equity', 'Owners interest in the business', 'equity', 'Equity', null],
      ['3100', 'Share Capital', 'Paid-up capital from shareholders', 'equity', 'Equity', null],
      ['3110', 'Ordinary Shares', 'Ordinary share capital', 'equity', 'Equity', '3100'],
      ['3120', 'Preference Shares', 'Preference share capital', 'equity', 'Equity', '3100'],
      ['3200', 'Retained Earnings', 'Accumulated profits not distributed as dividends', 'equity', 'Equity', null],
      ['3210', 'Current Year Earnings', 'Profit or loss for current financial year', 'equity', 'Equity', '3200'],
      ['3220', 'Prior Year Earnings', 'Accumulated profits from previous years', 'equity', 'Equity', '3200'],
      ['3300', 'Dividends Paid', 'Dividends distributed to shareholders (contra equity)', 'equity', 'Equity', null],
      ['3400', 'Directors Loans', 'Loans from/to directors', 'equity', 'Equity', null],
      
      // 4000 Series - REVENUE (HASIL)
      ['4000', 'Sales Revenue', 'Income from sale of goods', 'income', 'Revenue', null],
      ['4010', 'Local Sales', 'Sales to customers within Malaysia', 'income', 'Revenue', '4000'],
      ['4020', 'Export Sales', 'Sales to customers outside Malaysia', 'income', 'Revenue', '4000'],
      ['4100', 'Service Revenue', 'Income from services rendered', 'income', 'Revenue', null],
      ['4110', 'Consulting Fees', 'Revenue from consulting services', 'income', 'Revenue', '4100'],
      ['4120', 'Professional Fees', 'Revenue from professional services', 'income', 'Revenue', '4100'],
      ['4130', 'Commission Income', 'Commission earned on sales', 'income', 'Revenue', '4100'],
      ['4200', 'Other Operating Income', 'Income from other business operations', 'income', 'Revenue', null],
      ['4210', 'Rental Income', 'Income from property rental', 'income', 'Revenue', '4200'],
      ['4220', 'Interest Income', 'Interest earned on bank deposits', 'income', 'Revenue', '4200'],
      ['4230', 'Discount Received', 'Discounts received from suppliers', 'income', 'Revenue', '4200'],
      ['4240', 'Sundry Income', 'Miscellaneous income', 'income', 'Revenue', '4200'],
      ['4300', 'Non-Operating Income', 'Income not from core business operations', 'income', 'Revenue', null],
      ['4310', 'Gain on Sale of Assets', 'Profit from disposal of fixed assets', 'income', 'Revenue', '4300'],
      ['4320', 'Foreign Exchange Gain', 'Gains from currency fluctuations', 'income', 'Revenue', '4300'],
      
      // 5000 Series - COST OF GOODS SOLD (KOS JUALAN)
      ['5000', 'Cost of Goods Sold', 'Direct costs attributable to goods sold', 'expense', 'COGS', null],
      ['5010', 'Opening Stock', 'Value of inventory at start of period', 'expense', 'COGS', '5000'],
      ['5020', 'Purchases', 'Cost of goods purchased for resale', 'expense', 'COGS', '5000'],
      ['5030', 'Direct Labour', 'Wages of workers directly involved in production', 'expense', 'COGS', '5000'],
      ['5040', 'Manufacturing Overheads', 'Indirect production costs', 'expense', 'COGS', '5000'],
      ['5050', 'Closing Stock', 'Value of inventory at end of period (credit balance)', 'expense', 'COGS', '5000'],
      ['5060', 'Purchase Returns', 'Goods returned to suppliers', 'expense', 'COGS', '5000'],
      ['5070', 'Carriage Inwards', 'Transport costs for incoming goods', 'expense', 'COGS', '5000'],
      
      // 6000 Series - OPERATING EXPENSES (PERBELANJAAN OPERASI)
      ['6000', 'Operating Expenses', 'Expenses incurred in day-to-day operations', 'expense', 'Operating Expense', null],
      
      // 6100 - Staff Costs
      ['6100', 'Staff Costs', 'All employee-related expenses', 'expense', 'Operating Expense', null],
      ['6110', 'Salaries & Wages', 'Basic salaries and wages paid to employees', 'expense', 'Operating Expense', '6100'],
      ['6120', 'EPF Contributions', 'Employer EPF contributions (12-13%)', 'expense', 'Operating Expense', '6100'],
      ['6130', 'SOCSO Contributions', 'Employer SOCSO contributions', 'expense', 'Operating Expense', '6100'],
      ['6140', 'EIS Contributions', 'Employer EIS contributions', 'expense', 'Operating Expense', '6100'],
      ['6150', 'Staff Benefits', 'Bonuses, allowances, and benefits', 'expense', 'Operating Expense', '6100'],
      ['6160', 'Staff Training', 'Training and development costs', 'expense', 'Operating Expense', '6100'],
      
      // 6200 - Premises Costs
      ['6200', 'Premises Costs', 'Expenses related to business premises', 'expense', 'Operating Expense', null],
      ['6210', 'Rent Expense', 'Rental payments for office/shop premises', 'expense', 'Operating Expense', '6200'],
      ['6220', 'Utilities', 'Electricity, water, internet, and phone', 'expense', 'Operating Expense', '6200'],
      ['6230', 'Insurance', 'Business insurance premiums', 'expense', 'Operating Expense', '6200'],
      ['6240', 'Security', 'Security services and systems', 'expense', 'Operating Expense', '6200'],
      ['6250', 'Cleaning & Maintenance', 'Premises cleaning and maintenance', 'expense', 'Operating Expense', '6200'],
      
      // 6300 - Marketing & Sales
      ['6300', 'Marketing & Sales', 'Expenses for marketing and sales activities', 'expense', 'Operating Expense', null],
      ['6310', 'Advertising', 'Advertising costs (online, print, media)', 'expense', 'Operating Expense', '6300'],
      ['6320', 'Promotions', 'Sales promotions and discounts given', 'expense', 'Operating Expense', '6300'],
      ['6330', 'Entertainment', 'Business entertainment expenses', 'expense', 'Operating Expense', '6300'],
      ['6340', 'Travel & Accommodation', 'Business travel and hotel costs', 'expense', 'Operating Expense', '6300'],
      
      // 6400 - Administrative
      ['6400', 'Administrative Expenses', 'General administrative costs', 'expense', 'Operating Expense', null],
      ['6410', 'Office Supplies', 'Stationery, printing, and office materials', 'expense', 'Operating Expense', '6400'],
      ['6420', 'Postage & Courier', 'Postal and courier charges', 'expense', 'Operating Expense', '6400'],
      ['6430', 'Telephone & Internet', 'Business phone and internet costs', 'expense', 'Operating Expense', '6400'],
      ['6440', 'Bank Charges', 'Bank fees and charges', 'expense', 'Operating Expense', '6400'],
      ['6450', 'Audit & Accounting Fees', 'Professional fees for audit and accounting', 'expense', 'Operating Expense', '6400'],
      ['6460', 'Legal Fees', 'Legal and professional fees', 'expense', 'Operating Expense', '6400'],
      ['6470', 'Secretarial Fees', 'Company secretarial fees', 'expense', 'Operating Expense', '6400'],
      ['6480', 'Licenses & Permits', 'Business licenses and permits', 'expense', 'Operating Expense', '6400'],
      ['6490', 'Subscriptions', 'Magazines, software, and service subscriptions', 'expense', 'Operating Expense', '6400'],
      
      // 6500 - Depreciation & Amortization
      ['6500', 'Depreciation & Amortization', 'Non-cash charges for asset value reduction', 'expense', 'Operating Expense', null],
      ['6510', 'Depreciation - Equipment', 'Depreciation on office equipment', 'expense', 'Operating Expense', '6500'],
      ['6520', 'Depreciation - Vehicles', 'Depreciation on motor vehicles', 'expense', 'Operating Expense', '6500'],
      ['6530', 'Depreciation - Machinery', 'Depreciation on production machinery', 'expense', 'Operating Expense', '6500'],
      ['6540', 'Amortization', 'Amortization of intangible assets', 'expense', 'Operating Expense', '6500'],
      
      // 6600 - Finance Costs
      ['6600', 'Finance Costs', 'Interest and financing expenses', 'expense', 'Operating Expense', null],
      ['6610', 'Interest Expense', 'Interest on bank loans and overdrafts', 'expense', 'Operating Expense', '6600'],
      ['6620', 'Hire Purchase Interest', 'Interest on hire purchase agreements', 'expense', 'Operating Expense', '6600'],
      ['6630', 'Bank Overdraft Interest', 'Interest on bank overdraft facilities', 'expense', 'Operating Expense', '6600'],
      
      // 6700 - Other Expenses
      ['6700', 'Other Expenses', 'Miscellaneous operating expenses', 'expense', 'Operating Expense', null],
      ['6710', 'Bad Debts', 'Uncollectible accounts written off', 'expense', 'Operating Expense', '6700'],
      ['6720', 'Donations', 'Charitable donations and contributions', 'expense', 'Operating Expense', '6700'],
      ['6730', 'Sundry Expenses', 'Miscellaneous expenses not elsewhere classified', 'expense', 'Operating Expense', '6700'],
      ['6740', 'Foreign Exchange Loss', 'Losses from currency fluctuations', 'expense', 'Operating Expense', '6700'],
      ['6750', 'Loss on Sale of Assets', 'Loss from disposal of fixed assets', 'expense', 'Operating Expense', '6700']
    ];
    
    const now = new Date().toISOString();
    for (const [code, name, description, type, category, parent] of accounts) {
      await env.DB.prepare('INSERT INTO chart_of_accounts (code, name, description, type, category, parent_code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(code, name, description, type, category, parent, now).run();
    }
  }
}

// ============================================
// UTILITIES
// ============================================
function cors() { return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }; }
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...cors() } }); }
function handleHealth(env) { return json({ status: 'ok', app: env.APP_NAME, version: env.APP_VERSION, region: env.REGION }); }

// Password hashing function
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify password
async function verifyPassword(password, hash) {
  const hashed = await hashPassword(password);
  return hashed === hash;
}

// ============================================
// COMPANIES
// ============================================
async function getCompanies(env) { const { results } = await env.DB.prepare('SELECT * FROM companies WHERE is_active = 1').all(); return json(results); }
async function createCompany(request, env) {
  const b = await request.json();
  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO companies (id, name, registration_no, tin, brn_ic, msic_code, address, city, state, postcode, phone, email, financial_year_end, tax_rate, sst_rate, director_name, accountant_name) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id, b.name, b.registration_no, b.tin, b.brn_ic, b.msic_code, b.address, b.city, b.state||'Sabah', b.postcode, b.phone, b.email, b.financial_year_end, b.tax_rate||24, b.sst_rate||6, b.director_name, b.accountant_name).run();
  return json({ id }, 201);
}

// ============================================
// INVOICES
// ============================================
async function getInvoices(request, env) {
  const url = new URL(request.url);
  const cid = url.searchParams.get('company_id');
  let q = 'SELECT * FROM invoices WHERE 1=1'; const p = [];
  if (cid) { q += ' AND company_id = ?'; p.push(cid); }
  q += ' ORDER BY date DESC LIMIT 100';
  const { results } = p.length > 0 ? await env.DB.prepare(q).bind(...p).all() : await env.DB.prepare(q).all();
  return json(results);
}

async function getInvoice(path, env) {
  const id = path.split('/').pop();
  const inv = await env.DB.prepare('SELECT * FROM invoices WHERE id = ?').bind(id).first();
  if (!inv) return json({ error: 'Not found' }, 404);
  const { results: items } = await env.DB.prepare('SELECT * FROM invoice_line_items WHERE invoice_id = ? ORDER BY sort_order').bind(id).all();
  return json({ ...inv, line_items: items });
}

async function createInvoice(request, env) {
  const b = await request.json();
  const id = crypto.randomUUID(); const now = new Date().toISOString();
  
  // Auto-map accounts based on invoice type
  const revenueAccount = b.revenue_account || '4000'; // Default: Sales Revenue
  const sstAccount = '2210'; // SST Payable
  
  await env.DB.prepare('INSERT INTO invoices (id,company_id,invoice_no,customer_name,customer_tin,customer_brn_ic,customer_msic,customer_address,customer_email,customer_phone,date,due_date,subtotal,tax_amount,discount,grand_total,status,notes,is_einvoice,einvoice_category,revenue_account,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,b.company_id,b.invoice_no||('INV-'+Date.now()),b.customer_name,b.customer_tin,b.customer_brn_ic,b.customer_msic,b.customer_address,b.customer_email,b.customer_phone,b.date,b.due_date,b.subtotal,b.tax_amount,b.discount||0,b.grand_total,b.status||'draft',b.notes,b.is_einvoice?1:0,b.einvoice_category||'01001',revenueAccount,'web',now,now).run();
  
  // Insert line items with account codes
  if (b.line_items) {
    for (let i=0;i<b.line_items.length;i++) {
      const it=b.line_items[i];
      // Auto-map account based on description if not provided
      const accountCode = it.account_code || autoMapAccount(it.description);
      await env.DB.prepare('INSERT INTO invoice_line_items (id,invoice_id,description,quantity,unit_price,tax_rate,amount,tax_amount,total,account_code,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),id,it.description,it.quantity,it.unit_price,it.tax_rate,it.amount,it.tax_amount,it.total,accountCode,i).run();
    }
  }
  
  // Auto-post to journal: Debit Accounts Receivable, Credit Revenue
  await env.DB.prepare('INSERT INTO journal_entries (id,date,description,reference,debit_account,credit_account,amount,auto_posted,invoice_id,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),b.date,'Invoice: '+b.customer_name,b.invoice_no,'1100',revenueAccount,b.subtotal,1,id,'system',now).run();
  
  // Post SST if applicable
  if (b.tax_amount > 0) {
    await env.DB.prepare('INSERT INTO journal_entries (id,date,description,reference,debit_account,credit_account,amount,auto_posted,invoice_id,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),b.date,'SST on '+b.invoice_no,b.invoice_no,'1100',sstAccount,b.tax_amount,1,id,'system',now).run();
  }
  
  return json({ id }, 201);
}

// Auto-map account based on description keywords
function autoMapAccount(description) {
  const desc = (description || '').toLowerCase();
  if (desc.includes('service') || desc.includes('consulting') || desc.includes('professional')) return '4100';
  if (desc.includes('rental') || desc.includes('rent')) return '4210';
  if (desc.includes('commission')) return '4130';
  if (desc.includes('interest')) return '4220';
  return '4000'; // Default to Sales Revenue
}

async function deleteInvoice(path, env) {
  const id = path.split('/').pop();
  await env.DB.prepare('DELETE FROM invoice_line_items WHERE invoice_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM journal_entries WHERE invoice_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM invoices WHERE id = ?').bind(id).run();
  return json({ success: true });
}

// ============================================
// CHART OF ACCOUNTS
// ============================================
async function getAccounts(env) {
  const { results } = await env.DB.prepare('SELECT * FROM chart_of_accounts WHERE is_active = 1 ORDER BY code').all();
  return json(results);
}

async function createAccount(request, env) {
  const b = await request.json();
  const now = new Date().toISOString();
  await env.DB.prepare('INSERT INTO chart_of_accounts (code, name, description, type, category, parent_code, created_at) VALUES (?,?,?,?,?,?,?)').bind(b.code, b.name, b.description, b.type, b.category, b.parent_code || null, now).run();
  return json({ code: b.code }, 201);
}

async function updateAccount(path, request, env) {
  const code = path.split('/').pop();
  const b = await request.json();
  await env.DB.prepare('UPDATE chart_of_accounts SET name = ?, description = ?, type = ?, category = ?, parent_code = ? WHERE code = ?').bind(b.name, b.description, b.type, b.category, b.parent_code || null, code).run();
  return json({ success: true });
}

async function deleteAccount(path, env) {
  const code = path.split('/').pop();
  await env.DB.prepare('UPDATE chart_of_accounts SET is_active = 0 WHERE code = ?').bind(code).run();
  return json({ success: true });
}

// ============================================
// JOURNAL & LEDGER
// ============================================
async function getJournal(request, env) {
  const url = new URL(request.url);
  const from = url.searchParams.get('from'); const to = url.searchParams.get('to');
  let q = 'SELECT j.*, c1.name as debit_name, c2.name as credit_name FROM journal_entries j LEFT JOIN chart_of_accounts c1 ON j.debit_account=c1.code LEFT JOIN chart_of_accounts c2 ON j.credit_account=c2.code WHERE 1=1'; const p = [];
  if (from) { q += ' AND j.date >= ?'; p.push(from); }
  if (to) { q += ' AND j.date <= ?'; p.push(to); }
  q += ' ORDER BY j.date DESC, j.created_at DESC';
  const { results } = p.length > 0 ? await env.DB.prepare(q).bind(...p).all() : await env.DB.prepare(q).all();
  return json(results);
}

async function createJournalEntry(request, env) {
  const b = await request.json(); const id = crypto.randomUUID(); const now = new Date().toISOString();
  await env.DB.prepare('INSERT INTO journal_entries (id,date,description,reference,debit_account,credit_account,amount,auto_posted,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(id,b.date,b.description,b.reference,b.debit_account,b.credit_account,b.amount,0,'manual',now).run();
  return json({ id }, 201);
}

async function getLedger(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('account');
  if (!code) return json({ error: 'Account code required' }, 400);
  const account = await env.DB.prepare('SELECT * FROM chart_of_accounts WHERE code = ?').bind(code).first();
  const { results: entries } = await env.DB.prepare('SELECT j.*, CASE WHEN j.debit_account=? THEN j.amount ELSE 0 END as debit, CASE WHEN j.credit_account=? THEN j.amount ELSE 0 END as credit FROM journal_entries j WHERE j.debit_account=? OR j.credit_account=? ORDER BY j.date ASC').bind(code,code,code,code).all();
  let balance = 0;
  const withBal = entries.map(e => {
    if (account.type==='asset'||account.type==='expense') balance += e.debit - e.credit;
    else balance += e.credit - e.debit;
    return { ...e, balance };
  });
  return json({ account, entries: withBal, totalBalance: balance });
}

// ============================================
// FINANCIAL REPORTS
// ============================================
async function getTrialBalance(request, env) {
  const url = new URL(request.url);
  const asOf = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const { results: accounts } = await env.DB.prepare('SELECT * FROM chart_of_accounts WHERE is_active = 1 ORDER BY code').all();
  const tb = []; let td = 0, tc = 0;
  for (const acc of accounts) {
    const r = await env.DB.prepare('SELECT COALESCE(SUM(CASE WHEN debit_account=? THEN amount ELSE 0 END),0) as td, COALESCE(SUM(CASE WHEN credit_account=? THEN amount ELSE 0 END),0) as tc FROM journal_entries WHERE date <= ?').bind(acc.code,acc.code,asOf).first();
    if (r.td > 0 || r.tc > 0) { tb.push({ code: acc.code, name: acc.name, description: acc.description, type: acc.type, debit: r.td, credit: r.tc }); td += r.td; tc += r.tc; }
  }
  return json({ as_of_date: asOf, accounts: tb, total_debit: td, total_credit: tc, balanced: Math.abs(td-tc)<0.01, difference: td-tc });
}

async function getProfitLoss(request, env) {
  const url = new URL(request.url);
  const from = url.searchParams.get('from') || new Date(new Date().getFullYear(),0,1).toISOString().split('T')[0];
  const to = url.searchParams.get('to') || new Date().toISOString().split('T')[0];
  const rev = await env.DB.prepare('SELECT COALESCE(SUM(amount),0) as t FROM journal_entries WHERE credit_account LIKE ? AND date BETWEEN ? AND ?').bind('4%',from,to).first();
  const cogs = await env.DB.prepare('SELECT COALESCE(SUM(amount),0) as t FROM journal_entries WHERE debit_account LIKE ? AND date BETWEEN ? AND ?').bind('5%',from,to).first();
  const opex = await env.DB.prepare('SELECT COALESCE(SUM(amount),0) as t FROM journal_entries WHERE debit_account LIKE ? AND date BETWEEN ? AND ?').bind('6%',from,to).first();
  return json({ period: { from, to }, revenue: rev.t, cogs: cogs.t, gross_profit: rev.t - cogs.t, operating_expenses: opex.t, net_profit: rev.t - cogs.t - opex.t });
}

async function getBalanceSheet(request, env) {
  const url = new URL(request.url);
  const asOf = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const assets = await env.DB.prepare('SELECT COALESCE(SUM(CASE WHEN debit_account LIKE ? THEN amount ELSE 0 END - CASE WHEN credit_account LIKE ? THEN amount ELSE 0 END),0) as t FROM journal_entries WHERE date <= ?').bind('1%','1%',asOf).first();
  const liab = await env.DB.prepare('SELECT COALESCE(SUM(CASE WHEN credit_account LIKE ? THEN amount ELSE 0 END - CASE WHEN debit_account LIKE ? THEN amount ELSE 0 END),0) as t FROM journal_entries WHERE date <= ?').bind('2%','2%',asOf).first();
  const eq = await env.DB.prepare('SELECT COALESCE(SUM(CASE WHEN credit_account LIKE ? THEN amount ELSE 0 END - CASE WHEN debit_account LIKE ? THEN amount ELSE 0 END),0) as t FROM journal_entries WHERE date <= ?').bind('3%','3%',asOf).first();
  return json({ as_of_date: asOf, assets: assets.t, liabilities: liab.t, equity: eq.t, total_le: liab.t + eq.t, balanced: Math.abs(assets.t - (liab.t + eq.t)) < 0.01 });
}

async function calculateZakat(request, env) {
  const b = await request.json();
  const modal = b.modal_kerja || 0; const nisab = b.nisab || 20000;
  const zakat = modal >= nisab ? modal * 0.025 : 0;
  const id = crypto.randomUUID(); const now = new Date().toISOString();
  await env.DB.prepare('INSERT INTO zakat_calculations (id,company_id,calculation_date,modal_kerja,kaedah_pertumbuhan,nisab,zakat_amount,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,b.company_id,b.calculation_date||now.split('T')[0],modal,b.kaedah_pertumbuhan||0,nisab,zakat,b.notes||'',now).run();
  return json({ id, modal_kerja: modal, nisab, zakat_rate: 2.5, zakat_amount: zakat, eligible: modal >= nisab });
}

// ============================================
// ADMIN PANEL FUNCTIONS
// ============================================

async function handleAdminQuery(request, env) {
  const body = await request.json();
  const query = body.query;
  
  if (!query || typeof query !== 'string') {
    return json({ error: 'Invalid query' }, 400);
  }
  
  // Security: Block dangerous operations
  const dangerous = ['DROP TABLE', 'DELETE FROM users', 'TRUNCATE'];
  const queryUpper = query.toUpperCase();
  if (dangerous.some(d => queryUpper.includes(d))) {
    return json({ error: 'Dangerous query blocked for security' }, 403);
  }
  
  try {
    // Check if it's a SELECT query
    if (queryUpper.startsWith('SELECT')) {
      const result = await env.DB.prepare(query).all();
      return json({ results: result.results });
    } else {
      // For INSERT, UPDATE, DELETE
      const result = await env.DB.prepare(query).run();
      return json({ changes: result.meta.changes });
    }
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

async function handleMaintenance(request, env) {
  const body = await request.json();
  const task = body.task;
  
  try {
    switch (task) {
      case 'reinit-schema':
        // Reinitialize all tables
        const tables = [
          `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, password_hash TEXT, name TEXT, role TEXT DEFAULT 'client_staff', company_id TEXT, is_active INTEGER DEFAULT 1, created_at TEXT)`,
          `CREATE TABLE IF NOT EXISTS companies (id TEXT PRIMARY KEY, name TEXT, registration_no TEXT, tin TEXT, brn_ic TEXT, msic_code TEXT, address TEXT, city TEXT, state TEXT DEFAULT 'Sabah', postcode TEXT, phone TEXT, email TEXT, financial_year_end TEXT, tax_rate REAL DEFAULT 24, sst_rate REAL DEFAULT 6, director_name TEXT, accountant_name TEXT, is_active INTEGER DEFAULT 1)`,
          `CREATE TABLE IF NOT EXISTS invoices (id TEXT PRIMARY KEY, company_id TEXT, invoice_no TEXT, customer_name TEXT, customer_tin TEXT, customer_brn_ic TEXT, customer_msic TEXT, customer_address TEXT, customer_email TEXT, customer_phone TEXT, date TEXT, due_date TEXT, subtotal REAL, tax_amount REAL, discount REAL DEFAULT 0, grand_total REAL, status TEXT DEFAULT 'draft', notes TEXT, is_einvoice INTEGER DEFAULT 0, einvoice_category TEXT, revenue_account TEXT DEFAULT '4000', expense_account TEXT DEFAULT '5000', created_by TEXT, created_at TEXT, updated_at TEXT)`,
          `CREATE TABLE IF NOT EXISTS invoice_line_items (id TEXT PRIMARY KEY, invoice_id TEXT, description TEXT, quantity REAL, unit_price REAL, tax_rate REAL, amount REAL, tax_amount REAL, total REAL, account_code TEXT, sort_order INTEGER)`,
          `CREATE TABLE IF NOT EXISTS chart_of_accounts (code TEXT PRIMARY KEY, name TEXT, description TEXT, type TEXT, category TEXT, parent_code TEXT, is_active INTEGER DEFAULT 1, created_at TEXT)`,
          `CREATE TABLE IF NOT EXISTS journal_entries (id TEXT PRIMARY KEY, date TEXT, description TEXT, reference TEXT, debit_account TEXT, credit_account TEXT, amount REAL, auto_posted INTEGER DEFAULT 0, invoice_id TEXT, created_by TEXT, created_at TEXT)`,
          `CREATE TABLE IF NOT EXISTS zakat_calculations (id TEXT PRIMARY KEY, company_id TEXT, calculation_date TEXT, modal_kerja REAL, kaedah_pertumbuhan REAL, nisab REAL, zakat_amount REAL, notes TEXT, created_at TEXT)`
        ];
        for (const sql of tables) await env.DB.prepare(sql).run();
        return json({ message: 'Schema reinitialized successfully' });
        
      case 'reset-coa':
        // Reset chart of accounts
        await env.DB.prepare('DELETE FROM chart_of_accounts').run();
        // Reinitialize with default accounts (same logic as initDatabase)
        await initDatabase(env);
        return json({ message: 'Chart of accounts reset successfully' });
        
      case 'clear-test-data':
        // Clear all transaction data
        await env.DB.prepare('DELETE FROM invoice_line_items').run();
        await env.DB.prepare('DELETE FROM invoices').run();
        await env.DB.prepare('DELETE FROM journal_entries').run();
        await env.DB.prepare('DELETE FROM zakat_calculations').run();
        return json({ message: 'Test data cleared successfully' });
        
      case 'optimize':
        // Run VACUUM (SQLite optimization)
        await env.DB.prepare('VACUUM').run();
        return json({ message: 'Database optimized successfully' });
        
      default:
        return json({ error: 'Unknown maintenance task' }, 400);
    }
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

async function handleBackup(env) {
  try {
    // Export all data
    const companies = await env.DB.prepare('SELECT * FROM companies').all();
    const users = await env.DB.prepare('SELECT * FROM users').all();
    const invoices = await env.DB.prepare('SELECT * FROM invoices').all();
    const accounts = await env.DB.prepare('SELECT * FROM chart_of_accounts').all();
    const journal = await env.DB.prepare('SELECT * FROM journal_entries').all();
    const zakat = await env.DB.prepare('SELECT * FROM zakat_calculations').all();
    
    return json({
      exported_at: new Date().toISOString(),
      data: {
        companies: companies.results,
        users: users.results,
        invoices: invoices.results,
        chart_of_accounts: accounts.results,
        journal_entries: journal.results,
        zakat_calculations: zakat.results
      }
    });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

// ============================================
// FRONTEND HTML - COMPLETE SPA WITH CHART OF ACCOUNTS
// ============================================
function renderHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KiraEnterprise v5.6 - Malaysian Accounting Suite</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{font-family:'Inter',system-ui,sans-serif;-webkit-tap-highlight-color:transparent}
@media print{
  .no-print{display:none!important}
  body{background:white!important;font-size:11pt}
  .print-area{display:block!important}
  .page-break{page-break-after:always}
  @page{margin:1.5cm;size:A4}
  table{font-size:10pt}
  .report-header{border-bottom:3px double #000;padding-bottom:10px;margin-bottom:20px}
  .report-title{font-size:16pt;font-weight:bold;text-align:center;text-transform:uppercase}
  .report-subtitle{font-size:11pt;text-align:center;margin-top:5px}
  .declaration-box{border:1px solid #000;padding:15px;margin-top:30px}
  .signature-line{border-bottom:1px solid #000;width:200px;margin-top:40px}
}
.print-area{display:none}
.fade-in{animation:fadeIn .3s ease-out}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
</style>
</head>
<body class="bg-gray-50 min-h-screen">
<div id="app"></div>
<script>
const S={view:'dashboard',companies:[],invoices:[],journal:[],accounts:[],company:null};
const fmt=n=>'RM '+Number(n||0).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2});
async function api(p,o={}){const r=await fetch(p,{headers:{'Content-Type':'application/json'},...o});return r.json()}

async function init(){
  [S.companies,S.invoices,S.accounts]=await Promise.all([api('/api/companies'),api('/api/invoices'),api('/api/accounts')]);
  if(S.companies.length>0)S.company=S.companies[0];
  render();
}

function render(){document.getElementById('app').innerHTML=renderShell()}

function renderShell(){
  let h='<header class="bg-white border-b border-gray-200 sticky top-0 z-40 no-print">';
  h+='<div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">';
  h+='<div class="flex items-center gap-3"><div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">K</div>';
  h+='<div><h1 class="font-bold text-gray-800">KiraEnterprise v5.6</h1><p class="text-xs text-gray-500">'+(S.company?S.company.name:'Malaysian Accounting Suite')+'</p></div></div></div>';
  h+='<nav class="max-w-7xl mx-auto px-4 pb-2 flex gap-1 overflow-x-auto text-xs">';
  const tabs=[['dashboard','📊 Dashboard'],['invoices','📄 Invoices'],['accounts','📋 Chart of Accounts'],['journal','📖 Journal'],['ledger','📒 Ledger'],['trial-balance','⚖️ Trial Balance'],['profit-loss','💰 P&L'],['balance-sheet','📊 Balance Sheet'],['zakat','🕌 Zakat']];
  tabs.forEach(([id,l])=>{h+='<button onclick="nav(\\''+id+'\\')" class="px-3 py-1.5 rounded-lg font-medium whitespace-nowrap '+(S.view===id?'bg-blue-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200')+'">'+l+'</button>'});
  h+='</nav></header>';
  h+='<main class="max-w-7xl mx-auto px-4 py-4 pb-20">'+renderView()+'</main>';
  h+='<div class="no-print max-w-7xl mx-auto px-4 pb-6"><div class="bg-amber-50 border border-amber-200 rounded-xl p-3"><p class="text-amber-800 text-xs"><strong>⚠️ Disclaimer:</strong> KiraEnterprise helps organize data for tax/e-Invoice purposes. It does not guarantee full LHDN compliance. Final review by a qualified accountant is required.</p></div></div>';
  return h;
}

function renderView(){
  switch(S.view){
    case 'dashboard':return renderDashboard();
    case 'invoices':return renderInvoices();
    case 'accounts':return renderAccounts();
    case 'journal':return renderJournal();
    case 'ledger':return renderLedger();
    case 'trial-balance':return renderTrialBalance();
    case 'profit-loss':return renderPL();
    case 'balance-sheet':return renderBS();
    case 'zakat':return renderZakat();
    default:return renderDashboard();
  }
}

function renderDashboard(){
  const total=S.invoices.reduce((s,i)=>s+(i.grand_total||0),0);
  const paid=S.invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+(i.grand_total||0),0);
  const outstanding=S.invoices.filter(i=>i.status==='sent'||i.status==='overdue').reduce((s,i)=>s+(i.grand_total||0),0);
  return '<div class="fade-in space-y-4"><h2 class="text-2xl font-bold text-gray-800">Dashboard</h2>'+
  '<div class="grid grid-cols-2 md:grid-cols-4 gap-3">'+
  statCard('Total Revenue',fmt(total),'bg-green-500','💰')+
  statCard('Invoices',S.invoices.length.toString(),'bg-blue-500','📄')+
  statCard('Outstanding',fmt(outstanding),'bg-amber-500','⏳')+
  statCard('Paid',fmt(paid),'bg-purple-500','✅')+
  '</div>'+
  '<div class="grid grid-cols-2 md:grid-cols-3 gap-3">'+
  '<button onclick="nav(\\'accounts\\')" class="bg-indigo-600 text-white rounded-xl p-4 text-center hover:bg-indigo-700"><span class="text-2xl block mb-1">📋</span><span class="text-sm font-medium">Chart of Accounts</span></button>'+
  '<button onclick="nav(\\'invoices\\')" class="bg-blue-600 text-white rounded-xl p-4 text-center hover:bg-blue-700"><span class="text-2xl block mb-1">📄</span><span class="text-sm font-medium">Invoices</span></button>'+
  '<button onclick="nav(\\'trial-balance\\')" class="bg-teal-600 text-white rounded-xl p-4 text-center hover:bg-teal-700"><span class="text-2xl block mb-1">⚖️</span><span class="text-sm font-medium">Trial Balance</span></button>'+
  '</div></div>';
}

function statCard(t,v,c,icon){return '<div class="bg-white rounded-xl border border-gray-200 p-4"><div class="flex justify-between items-start mb-2"><span class="text-2xl">'+icon+'</span></div><p class="text-xl font-bold text-gray-800">'+v+'</p><p class="text-xs text-gray-500 mt-1">'+t+'</p></div>'}

function renderAccounts(){
  // Group accounts by type
  const groups = {
    asset: { title: '1000 Series - ASSETS (ASET)', color: 'bg-blue-50 border-blue-200', accounts: [] },
    liability: { title: '2000 Series - LIABILITIES (LIABILITI)', color: 'bg-red-50 border-red-200', accounts: [] },
    equity: { title: '3000 Series - EQUITY (EKUITI)', color: 'bg-purple-50 border-purple-200', accounts: [] },
    income: { title: '4000 Series - REVENUE (HASIL)', color: 'bg-green-50 border-green-200', accounts: [] },
    expense: { title: '5000+ Series - EXPENSES (PERBELANJAAN)', color: 'bg-amber-50 border-amber-200', accounts: [] }
  };
  
  S.accounts.forEach(acc => {
    if (groups[acc.type]) groups[acc.type].accounts.push(acc);
  });
  
  let h = '<div class="fade-in space-y-4"><h2 class="text-2xl font-bold text-gray-800">Chart of Accounts (Carta Akaun)</h2>';
  h += '<p class="text-sm text-gray-600">Comprehensive account code structure with descriptions for Malaysian accounting standards</p>';
  
  // Render each group
  Object.keys(groups).forEach(type => {
    const group = groups[type];
    if (group.accounts.length === 0) return;
    
    h += '<div class="bg-white rounded-xl border-2 ' + group.color + ' p-4">';
    h += '<h3 class="font-bold text-lg mb-3">' + group.title + '</h3>';
    h += '<div class="space-y-2">';
    
    group.accounts.forEach(acc => {
      const indent = acc.parent_code ? 'ml-6' : '';
      h += '<div class="flex items-start gap-3 p-2 hover:bg-white rounded-lg ' + indent + '">';
      h += '<span class="font-mono text-sm font-semibold text-gray-700 w-16 flex-shrink-0">' + acc.code + '</span>';
      h += '<div class="flex-1">';
      h += '<p class="text-sm font-medium text-gray-800">' + acc.name + '</p>';
      h += '<p class="text-xs text-gray-500 mt-0.5">' + (acc.description || '') + '</p>';
      h += '</div>';
      h += '<span class="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">' + acc.category + '</span>';
      h += '</div>';
    });
    
    h += '</div></div>';
  });
  
  h += '</div>';
  return h;
}

function renderInvoices(){
  let h='<div class="fade-in space-y-4"><div class="flex justify-between items-center"><h2 class="text-2xl font-bold">Invoices</h2>';
  h+='<button onclick="showNewInvoice()" class="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">+ New Invoice</button></div>';
  h+='<div class="space-y-2">';
  if(S.invoices.length===0) h+='<div class="bg-white rounded-xl border p-8 text-center text-gray-400">No invoices yet</div>';
  else S.invoices.forEach(inv=>{
    h+='<div class="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow cursor-pointer" onclick="viewInvoice(\\''+inv.id+'\\')">';
    h+='<div class="flex justify-between items-start"><div><div class="flex gap-2 items-center mb-1"><span class="font-semibold text-sm">'+inv.invoice_no+'</span>';
    h+='<span class="text-xs px-2 py-0.5 rounded-full '+(inv.status==='paid'?'bg-green-100 text-green-700':inv.status==='sent'?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-600')+'">'+inv.status+'</span>';
    if(inv.is_einvoice) h+='<span class="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">e-Invoice</span>';
    h+='</div><p class="text-sm text-gray-600">'+inv.customer_name+'</p><p class="text-xs text-gray-400">'+inv.date+'</p></div>';
    h+='<div class="text-right"><p class="text-lg font-bold">'+fmt(inv.grand_total)+'</p></div></div></div>';
  });
  h+='</div></div>';
  return h;
}

async function renderJournal(){
  S.journal=await api('/api/journal');
  let h='<div class="fade-in space-y-4"><div class="flex justify-between items-center"><h2 class="text-2xl font-bold">General Journal</h2>';
  h+='<button onclick="showNewJournal()" class="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">+ New Entry</button></div>';
  h+='<div class="bg-white rounded-xl border overflow-x-auto"><table class="w-full text-sm"><thead class="bg-gray-50"><tr>';
  h+='<th class="px-3 py-2 text-left text-xs font-semibold text-gray-500">Date</th>';
  h+='<th class="px-3 py-2 text-left text-xs font-semibold text-gray-500">Description</th>';
  h+='<th class="px-3 py-2 text-left text-xs font-semibold text-gray-500">Ref</th>';
  h+='<th class="px-3 py-2 text-left text-xs font-semibold text-gray-500">Debit A/c</th>';
  h+='<th class="px-3 py-2 text-left text-xs font-semibold text-gray-500">Credit A/c</th>';
  h+='<th class="px-3 py-2 text-right text-xs font-semibold text-gray-500">Amount</th>';
  h+='</tr></thead><tbody>';
  if(S.journal.length===0) h+='<tr><td colspan="6" class="px-3 py-8 text-center text-gray-400">No journal entries</td></tr>';
  else S.journal.forEach(j=>{
    h+='<tr class="border-t hover:bg-gray-50"><td class="px-3 py-2 text-xs">'+j.date+'</td>';
    h+='<td class="px-3 py-2 text-sm">'+j.description+'</td>';
    h+='<td class="px-3 py-2 text-xs text-gray-500">'+(j.reference||'')+'</td>';
    h+='<td class="px-3 py-2 text-xs">'+(j.debit_name||j.debit_account)+'</td>';
    h+='<td class="px-3 py-2 text-xs">'+(j.credit_name||j.credit_account)+'</td>';
    h+='<td class="px-3 py-2 text-right font-medium">'+fmt(j.amount)+'</td></tr>';
  });
  h+='</tbody></table></div></div>';
  return h;
}

async function renderLedger(){
  if(!S.ledgerAccount) S.ledgerAccount='1000';
  const data=await api('/api/ledger?account='+S.ledgerAccount);
  let h='<div class="fade-in space-y-4"><h2 class="text-2xl font-bold">General Ledger</h2>';
  h+='<div class="bg-white rounded-xl border p-4"><label class="text-sm font-medium text-gray-700">Select Account:</label>';
  h+='<select onchange="S.ledgerAccount=this.value;render()" class="mt-1 w-full px-3 py-2 border rounded-lg text-sm">';
  S.accounts.forEach(a=>{h+='<option value="'+a.code+'" '+(a.code===S.ledgerAccount?'selected':'')+'>'+a.code+' - '+a.name+'</option>'});
  h+='</select></div>';
  h+='<div class="bg-white rounded-xl border p-4"><h3 class="font-semibold mb-2">'+data.account.code+' - '+data.account.name+' ('+data.account.type+')</h3>';
  h+='<p class="text-xs text-gray-500 mb-3">'+data.account.description+'</p>';
  h+='<table class="w-full text-sm"><thead class="bg-gray-50"><tr><th class="px-3 py-2 text-left text-xs">Date</th><th class="px-3 py-2 text-left text-xs">Description</th><th class="px-3 py-2 text-right text-xs">Debit</th><th class="px-3 py-2 text-right text-xs">Credit</th><th class="px-3 py-2 text-right text-xs">Balance</th></tr></thead><tbody>';
  data.entries.forEach(e=>{
    h+='<tr class="border-t"><td class="px-3 py-2 text-xs">'+e.date+'</td><td class="px-3 py-2 text-sm">'+e.description+'</td>';
    h+='<td class="px-3 py-2 text-right">'+(e.debit>0?fmt(e.debit):'')+'</td><td class="px-3 py-2 text-right">'+(e.credit>0?fmt(e.credit):'')+'</td>';
    h+='<td class="px-3 py-2 text-right font-medium">'+fmt(e.balance)+'</td></tr>';
  });
  h+='</tbody></table><div class="mt-3 p-3 bg-blue-50 rounded-lg"><p class="text-sm font-semibold">Running Balance: '+fmt(data.totalBalance)+'</p></div></div></div>';
  return h;
}

async function renderTrialBalance(){
  const data=await api('/api/trial-balance');
  let h='<div class="fade-in space-y-4"><div class="flex justify-between items-center"><h2 class="text-2xl font-bold">Trial Balance (Imbangan Duga)</h2>';
  h+='<button onclick="printTB()" class="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 no-print">🖨️ Print</button></div>';
  if(!data.balanced) h+='<div class="bg-red-50 border border-red-200 rounded-xl p-3"><p class="text-red-700 text-sm font-medium">⚠️ WARNING: Debits and Credits do not match! Difference: '+fmt(data.difference)+'</p></div>';
  else h+='<div class="bg-green-50 border border-green-200 rounded-xl p-3"><p class="text-green-700 text-sm font-medium">✅ Trial Balance is balanced</p></div>';
  h+='<div class="bg-white rounded-xl border overflow-x-auto"><table class="w-full text-sm"><thead class="bg-gray-50"><tr><th class="px-3 py-2 text-left text-xs font-semibold">Code</th><th class="px-3 py-2 text-left text-xs font-semibold">Account</th><th class="px-3 py-2 text-left text-xs font-semibold">Description</th><th class="px-3 py-2 text-right text-xs font-semibold">Debit (RM)</th><th class="px-3 py-2 text-right text-xs font-semibold">Credit (RM)</th></tr></thead><tbody>';
  data.accounts.forEach(a=>{
    h+='<tr class="border-t hover:bg-gray-50"><td class="px-3 py-2 text-xs font-mono">'+a.code+'</td><td class="px-3 py-2 text-sm">'+a.name+'</td>';
    h+='<td class="px-3 py-2 text-xs text-gray-500">'+(a.description||'')+'</td>';
    h+='<td class="px-3 py-2 text-right">'+(a.debit>0?fmt(a.debit):'-')+'</td><td class="px-3 py-2 text-right">'+(a.credit>0?fmt(a.credit):'-')+'</td></tr>';
  });
  h+='<tr class="border-t-2 border-gray-800 font-bold bg-gray-50"><td class="px-3 py-3" colspan="3">TOTALS</td>';
  h+='<td class="px-3 py-3 text-right">'+fmt(data.total_debit)+'</td><td class="px-3 py-3 text-right">'+fmt(data.total_credit)+'</td></tr>';
  h+='</tbody></table></div>';
  h+=renderPrintTB(data);
  return h;
}

function renderPrintTB(data){
  const c=S.company||{};
  let h='<div class="print-area" id="print-tb">';
  h+='<div class="report-header"><p class="text-sm font-semibold">'+c.name+'</p><p class="text-xs">'+(c.address||'')+', '+(c.postcode||'')+' '+(c.city||'')+', '+(c.state||'Sabah')+'</p>';
  h+='<p class="text-xs">Reg No: '+(c.registration_no||'N/A')+' | TIN: '+(c.tin||'N/A')+'</p></div>';
  h+='<p class="report-title">Trial Balance</p><p class="report-subtitle">As at '+data.as_of_date+'</p>';
  h+='<table class="w-full border-collapse mt-6"><thead><tr class="border-b-2 border-black"><th class="py-2 text-left text-xs">Code</th><th class="py-2 text-left text-xs">Account Name</th><th class="py-2 text-left text-xs">Description</th><th class="py-2 text-right text-xs">Debit (RM)</th><th class="py-2 text-right text-xs">Credit (RM)</th></tr></thead><tbody>';
  data.accounts.forEach(a=>{
    h+='<tr class="border-b"><td class="py-1 text-xs">'+a.code+'</td><td class="py-1 text-xs">'+a.name+'</td><td class="py-1 text-xs">'+(a.description||'')+'</td>';
    h+='<td class="py-1 text-right text-xs">'+(a.debit>0?a.debit.toFixed(2):'')+'</td><td class="py-1 text-right text-xs">'+(a.credit>0?a.credit.toFixed(2):'')+'</td></tr>';
  });
  h+='<tr class="border-t-2 border-black font-bold"><td class="py-2" colspan="3">TOTAL</td><td class="py-2 text-right">'+data.total_debit.toFixed(2)+'</td><td class="py-2 text-right">'+data.total_credit.toFixed(2)+'</td></tr>';
  h+='</tbody></table>';
  h+='<div class="declaration-box mt-8"><p class="text-xs font-semibold mb-2">DECLARATION</p><p class="text-xs mb-4">We hereby declare that the above Trial Balance is correctly extracted from the books of accounts of '+c.name+' as at '+data.as_of_date+'.</p>';
  h+='<div class="flex justify-between"><div><p class="signature-line"></p><p class="text-xs mt-1">Prepared by (Accountant)</p><p class="text-xs">'+(c.accountant_name||'________________')+'</p></div>';
  h+='<div><p class="signature-line"></p><p class="text-xs mt-1">Approved by (Director)</p><p class="text-xs">'+(c.director_name||'________________')+'</p></div></div></div>';
  h+='</div>';
  return h;
}

async function renderPL(){
  const data=await api('/api/profit-loss');
  let h='<div class="fade-in space-y-4"><div class="flex justify-between items-center"><h2 class="text-2xl font-bold">Profit & Loss (Untung Rugi)</h2>';
  h+='<button onclick="printPL()" class="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 no-print">🖨️ Print</button></div>';
  h+='<div class="bg-white rounded-xl border p-6">';
  h+='<div class="space-y-3">';
  h+=plRow('Revenue',data.revenue,true);
  h+=plRow('Cost of Goods Sold',-data.cogs);
  h+='<div class="border-t-2 border-gray-800 pt-3 mt-3">'+plRow('Gross Profit',data.gross_profit,true,true)+'</div>';
  h+=plRow('Operating Expenses',-data.operating_expenses);
  h+='<div class="border-t-2 border-gray-800 pt-3 mt-3">'+plRow('Net Profit / (Loss)',data.net_profit,true,true)+'</div>';
  h+='</div></div>';
  h+=renderPrintPL(data);
  return h;
}

function plRow(label,amount,bold=false,highlight=false){
  const cls=bold?'font-bold':'';
  const color=amount<0?'text-red-600':'text-gray-800';
  return '<div class="flex justify-between '+cls+'"><span class="'+(highlight?'text-lg':'text-sm')+'">'+label+'</span><span class="'+(highlight?'text-lg':'text-sm')+' '+color+'">'+fmt(amount)+'</span></div>';
}

function renderPrintPL(data){
  const c=S.company||{};
  let h='<div class="print-area" id="print-pl">';
  h+='<div class="report-header"><p class="text-sm font-semibold">'+c.name+'</p><p class="text-xs">'+(c.address||'')+', '+(c.postcode||'')+' '+(c.city||'')+'</p>';
  h+='<p class="text-xs">Reg No: '+(c.registration_no||'N/A')+' | TIN: '+(c.tin||'N/A')+'</p></div>';
  h+='<p class="report-title">Statement of Profit or Loss</p><p class="report-subtitle">For the period '+data.period.from+' to '+data.period.to+'</p>';
  h+='<table class="w-full mt-6 text-sm"><tbody>';
  h+='<tr class="font-semibold"><td class="py-2">Revenue</td><td class="py-2 text-right">'+data.revenue.toFixed(2)+'</td></tr>';
  h+='<tr><td class="py-2 pl-4">Cost of Goods Sold</td><td class="py-2 text-right">('+data.cogs.toFixed(2)+')</td></tr>';
  h+='<tr class="border-t-2 border-black font-bold"><td class="py-2">Gross Profit</td><td class="py-2 text-right">'+data.gross_profit.toFixed(2)+'</td></tr>';
  h+='<tr><td class="py-2 pl-4">Operating Expenses</td><td class="py-2 text-right">('+data.operating_expenses.toFixed(2)+')</td></tr>';
  h+='<tr class="border-t-2 border-black font-bold text-base"><td class="py-3">NET PROFIT / (LOSS)</td><td class="py-3 text-right">'+data.net_profit.toFixed(2)+'</td></tr>';
  h+='</tbody></table>';
  h+='<div class="declaration-box mt-8"><p class="text-xs font-semibold mb-2">DIRECTOR\\'S DECLARATION</p><p class="text-xs mb-4">We hereby declare that the above Statement of Profit or Loss gives a true and fair view of the financial performance of '+c.name+' for the period ended '+data.period.to+'.</p>';
  h+='<div class="flex justify-between"><div><p class="signature-line"></p><p class="text-xs mt-1">Director</p><p class="text-xs">'+(c.director_name||'________________')+'</p></div>';
  h+='<div><p class="signature-line"></p><p class="text-xs mt-1">Date</p><p class="text-xs">________________</p></div></div></div></div>';
  return h;
}

async function renderBS(){
  const data=await api('/api/balance-sheet');
  let h='<div class="fade-in space-y-4"><div class="flex justify-between items-center"><h2 class="text-2xl font-bold">Balance Sheet (Neraca)</h2>';
  h+='<button onclick="printBS()" class="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 no-print">🖨️ Print</button></div>';
  if(!data.balanced) h+='<div class="bg-red-50 border border-red-200 rounded-xl p-3"><p class="text-red-700 text-sm font-medium">⚠️ Balance Sheet does not balance! Assets ≠ Liabilities + Equity</p></div>';
  h+='<div class="bg-white rounded-xl border p-6 space-y-4">';
  h+='<div><h3 class="font-semibold text-lg text-gray-800 mb-2">Assets</h3>'+bsRow('Total Assets',data.assets,true)+'</div>';
  h+='<div class="border-t pt-4"><h3 class="font-semibold text-lg text-gray-800 mb-2">Liabilities</h3>'+bsRow('Total Liabilities',data.liabilities)+'</div>';
  h+='<div><h3 class="font-semibold text-lg text-gray-800 mb-2">Equity</h3>'+bsRow('Total Equity',data.equity)+'</div>';
  h+='<div class="border-t-2 border-gray-800 pt-4">'+bsRow('Total Liabilities + Equity',data.total_le,true,true)+'</div>';
  h+='</div>';
  h+=renderPrintBS(data);
  return h;
}

function bsRow(label,amount,bold=false,highlight=false){
  return '<div class="flex justify-between '+(bold?'font-bold':'')+'"><span class="'+(highlight?'text-lg':'text-sm')+'">'+label+'</span><span class="'+(highlight?'text-lg':'text-sm')+'">'+fmt(amount)+'</span></div>';
}

function renderPrintBS(data){
  const c=S.company||{};
  let h='<div class="print-area" id="print-bs">';
  h+='<div class="report-header"><p class="text-sm font-semibold">'+c.name+'</p><p class="text-xs">'+(c.address||'')+', '+(c.postcode||'')+' '+(c.city||'')+', '+(c.state||'Sabah')+'</p>';
  h+='<p class="text-xs">Reg No: '+(c.registration_no||'N/A')+' | TIN: '+(c.tin||'N/A')+' | BRN/IC: '+(c.brn_ic||'N/A')+'</p></div>';
  h+='<p class="report-title">Statement of Financial Position</p><p class="report-subtitle">As at '+data.as_of_date+'</p>';
  h+='<table class="w-full mt-6 text-sm"><tbody>';
  h+='<tr class="font-bold border-b"><td class="py-2">ASSETS</td><td class="py-2 text-right">'+data.assets.toFixed(2)+'</td></tr>';
  h+='<tr class="font-bold border-t-2 border-black"><td class="py-2">LIABILITIES</td><td class="py-2 text-right">'+data.liabilities.toFixed(2)+'</td></tr>';
  h+='<tr class="font-bold"><td class="py-2">EQUITY</td><td class="py-2 text-right">'+data.equity.toFixed(2)+'</td></tr>';
  h+='<tr class="border-t-2 border-black font-bold text-base"><td class="py-3">TOTAL LIABILITIES + EQUITY</td><td class="py-3 text-right">'+data.total_le.toFixed(2)+'</td></tr>';
  h+='</tbody></table>';
  h+='<div class="declaration-box mt-8"><p class="text-xs font-semibold mb-2">DIRECTOR\\'S DECLARATION</p><p class="text-xs mb-4">We hereby declare that the above Statement of Financial Position gives a true and fair view of the financial position of '+c.name+' as at '+data.as_of_date+'.</p>';
  h+='<div class="flex justify-between"><div><p class="signature-line"></p><p class="text-xs mt-1">Director</p><p class="text-xs">'+(c.director_name||'________________')+'</p></div>';
  h+='<div><p class="signature-line"></p><p class="text-xs mt-1">Company Secretary / Accountant</p><p class="text-xs">'+(c.accountant_name||'________________')+'</p></div></div></div></div>';
  return h;
}

function renderZakat(){
  let h='<div class="fade-in space-y-4"><h2 class="text-2xl font-bold">Zakat Perniagaan Calculator</h2>';
  h+='<div class="bg-white rounded-xl border p-6 space-y-4">';
  h+='<div class="bg-blue-50 rounded-lg p-4"><p class="text-sm text-blue-800"><strong>Reference:</strong> Based on Malaysian/Sabah Religious Council guidelines for business zakat (Kaedah Modal Kerja / Pertumbuhan).</p></div>';
  h+='<div><label class="text-sm font-medium text-gray-700">Modal Kerja (Working Capital) - RM</label>';
  h+='<input type="number" id="zakat-modal" class="mt-1 w-full px-3 py-2 border rounded-lg text-sm" placeholder="Enter working capital amount" step="0.01"></div>';
  h+='<div><label class="text-sm font-medium text-gray-700">Nisab Threshold - RM (Default: 20,000)</label>';
  h+='<input type="number" id="zakat-nisab" value="20000" class="mt-1 w-full px-3 py-2 border rounded-lg text-sm" step="0.01"></div>';
  h+='<div><label class="text-sm font-medium text-gray-700">Notes</label>';
  h+='<textarea id="zakat-notes" class="mt-1 w-full px-3 py-2 border rounded-lg text-sm" rows="2" placeholder="Additional notes..."></textarea></div>';
  h+='<button onclick="calcZakat()" class="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700">🕌 Calculate Zakat</button>';
  h+='<div id="zakat-result"></div></div>';
  h+='<div class="bg-amber-50 border border-amber-200 rounded-xl p-4"><p class="text-xs text-amber-800"><strong>Note:</strong> Zakat calculation is an estimate based on Modal Kerja method. Please consult your local religious authority (MUIS/MAIS/JAIN) for official assessment.</p></div></div>';
  return h;
}

// Actions
function nav(v){S.view=v;render()}

async function calcZakat(){
  const modal=parseFloat(document.getElementById('zakat-modal').value)||0;
  const nisab=parseFloat(document.getElementById('zakat-nisab').value)||20000;
  const notes=document.getElementById('zakat-notes').value;
  const result=await api('/api/zakat',{method:'POST',body:JSON.stringify({modal_kerja:modal,nisab,notes,company_id:S.company?.id})});
  const el=document.getElementById('zakat-result');
  el.innerHTML='<div class="mt-4 p-4 rounded-xl '+(result.eligible?'bg-green-50 border border-green-200':'bg-gray-50 border border-gray-200')+'"><p class="font-semibold '+(result.eligible?'text-green-700':'text-gray-600')+'">'+result.message+'</p>';
  if(result.eligible) el.innerHTML+='<p class="text-2xl font-bold text-green-700 mt-2">Zakat: '+fmt(result.zakat_amount)+'</p><p class="text-xs text-gray-500 mt-1">Rate: '+result.zakat_rate+'% of Modal Kerja</p>';
  el.innerHTML+='</div>';
}

function showNewInvoice(){S.view='new-invoice';render()}
function showNewJournal(){S.view='new-journal';render()}
async function viewInvoice(id){const inv=await api('/api/invoices/'+id);S.currentInvoice=inv;S.view='view-invoice';render()}

function printTB(){document.getElementById('print-tb').style.display='block';setTimeout(()=>{window.print();document.getElementById('print-tb').style.display='none'},100)}
function printPL(){document.getElementById('print-pl').style.display='block';setTimeout(()=>{window.print();document.getElementById('print-pl').style.display='none'},100)}
function printBS(){document.getElementById('print-bs').style.display='block';setTimeout(()=>{window.print();document.getElementById('print-bs').style.display='none'},100)}

init();
</script>
</body>
</html>`;
}
