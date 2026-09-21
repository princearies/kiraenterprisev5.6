/**
 * KiraEnterprise v5.6 - Cloudflare Worker API
 * Backend: Cloudflare Workers + D1 (mykira)
 * 
 * This is the production-ready backend API that handles:
 * - Authentication & JWT verification
 * - Multi-tenant company isolation
 * - Invoice CRUD with prepared statements
 * - Transaction recording (double-entry)
 * - e-Invoice data generation for LHDN
 * 
 * NOTE: R2 bucket not yet provisioned. Document upload returns metadata only.
 * To enable R2: Create bucket 'kiraenterprise-documents' and add binding to wrangler.toml
 */

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  LHDN_API_KEY: string;
  LHDN_CLIENT_ID: string;
  LHDN_CLIENT_SECRET: string;
  APP_NAME: string;
  APP_VERSION: string;
}

interface JwtPayload {
  userId: string;
  companyId: string;
  role: string;
  exp: number;
}

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Root path - API info
      if (path === '/' || path === '') {
        return jsonResponse({
          app: env.APP_NAME,
          version: env.APP_VERSION,
          status: 'running',
          region: 'MY-SABAH',
          endpoints: {
            health: '/api/health',
            login: 'POST /api/auth/login',
            companies: '/api/companies',
            invoices: '/api/invoices',
            transactions: '/api/transactions',
            einvoice: '/api/einvoice',
            documents: '/api/documents',
            settings: '/api/settings',
          },
          database: 'mykira (D1)',
          note: 'R2 bucket pending - document upload stores metadata only',
        });
      }

      // Public routes
      if (path === '/api/health') {
        return jsonResponse({ status: 'ok', app: env.APP_NAME, version: env.APP_VERSION });
      }

      if (path === '/api/auth/login') {
        if (request.method !== 'POST') {
          return jsonResponse({ error: 'Method not allowed. Use POST with {email, password}' }, 405);
        }
        return await handleLogin(request, env);
      }

      // Public setup route (for initial database initialization)
      if (path === '/api/setup' && request.method === 'POST') {
        return await handleSetup(env);
      }

      // Protected routes - verify JWT
      const auth = await verifyAuth(request, env);
      if (!auth) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
      }

      // Route handling
      if (path.startsWith('/api/companies')) {
        return await handleCompanies(request, env, auth);
      }
      if (path.startsWith('/api/invoices')) {
        return await handleInvoices(request, env, auth);
      }
      if (path.startsWith('/api/transactions')) {
        return await handleTransactions(request, env, auth);
      }
      if (path.startsWith('/api/einvoice')) {
        return await handleEInvoice(request, env, auth);
      }
      if (path.startsWith('/api/documents')) {
        return await handleDocuments(request, env, auth);
      }
      if (path.startsWith('/api/settings')) {
        return await handleSettings(request, env, auth);
      }

      return jsonResponse({ error: 'Not Found' }, 404);
    } catch (error: any) {
      console.error('API Error:', error);
      return jsonResponse({ error: error.message || 'Internal Server Error' }, 500);
    }
  },
};

// =============================================
// AUTHENTICATION
// =============================================

async function handleLogin(request: Request, env: Env): Promise<Response> {
  const { email, password } = await request.json();

  // Find user by email using prepared statement
  const user = await env.DB.prepare(
    'SELECT id, email, name, role, company_id, password_hash FROM users WHERE email = ? AND is_active = 1'
  ).bind(email).first();

  if (!user) {
    return jsonResponse({ error: 'Invalid credentials' }, 401);
  }

  // Verify password (in production, use bcrypt/argon2)
  const passwordValid = await verifyPassword(password, (user as any).password_hash);
  if (!passwordValid) {
    return jsonResponse({ error: 'Invalid credentials' }, 401);
  }

  // Generate JWT token
  const token = await generateToken({
    userId: (user as any).id,
    companyId: (user as any).company_id,
    role: (user as any).role,
    exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
  }, env.JWT_SECRET);

  // Update last login
  await env.DB.prepare('UPDATE users SET last_login = datetime(\'now\') WHERE id = ?')
    .bind((user as any).id).run();

  // Log audit
  await env.DB.prepare(
    'INSERT INTO audit_log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)'
  ).bind(crypto.randomUUID(), (user as any).id, 'login', 'user', (user as any).id).run();

  return jsonResponse({
    token,
    user: {
      id: (user as any).id,
      email: (user as any).email,
      name: (user as any).name,
      role: (user as any).role,
      company_id: (user as any).company_id,
    },
  });
}

async function verifyAuth(request: Request, env: Env): Promise<JwtPayload | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const token = authHeader.substring(7);
    const payload = await verifyToken(token, env.JWT_SECRET);
    
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token expired
    }

    return payload;
  } catch {
    return null;
  }
}

// =============================================
// COMPANIES
// =============================================

async function handleCompanies(request: Request, env: Env, auth: JwtPayload): Promise<Response> {
  const method = request.method;
  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const companyId = parts[2]; // /api/companies/:id

  switch (method) {
    case 'GET': {
      if (companyId) {
        // Get single company with isolation check
        const company = await env.DB.prepare(
          'SELECT * FROM companies WHERE id = ? AND is_active = 1'
        ).bind(companyId).first();

        if (!company) {
          return jsonResponse({ error: 'Company not found' }, 404);
        }

        // Verify access
        const hasAccess = await checkCompanyAccess(auth, companyId, env);
        if (!hasAccess) {
          return jsonResponse({ error: 'Access denied' }, 403);
        }

        return jsonResponse(company);
      }

      // Get all companies for this user
      let companies;
      if (auth.role === 'platform_admin') {
        companies = await env.DB.prepare('SELECT * FROM companies WHERE is_active = 1 ORDER BY name').all();
      } else if (auth.role.startsWith('accountant')) {
        companies = await env.DB.prepare(
          'SELECT c.* FROM companies c JOIN user_company_access uca ON c.id = uca.company_id WHERE uca.user_id = ? AND c.is_active = 1 ORDER BY c.name'
        ).bind(auth.userId).all();
      } else {
        companies = await env.DB.prepare(
          'SELECT * FROM companies WHERE id = ? AND is_active = 1'
        ).bind(auth.companyId).all();
      }

      return jsonResponse(companies.results);
    }

    case 'POST': {
      if (auth.role !== 'platform_admin' && auth.role !== 'accountant_owner') {
        return jsonResponse({ error: 'Insufficient permissions' }, 403);
      }

      const body = await request.json();
      const id = crypto.randomUUID();

      await env.DB.prepare(`
        INSERT INTO companies (id, name, registration_no, sst_no, tin, address, city, state, postcode, phone, email, financial_year_end, tax_rate, sst_rate, chart_of_accounts_template)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, body.name, body.registration_no, body.sst_no, body.tin,
        body.address, body.city, body.state || 'Sabah', body.postcode,
        body.phone, body.email, body.financial_year_end || '2025-12-31',
        body.tax_rate || 24, body.sst_rate || 6, body.chart_of_accounts_template || 'standard_malaysia'
      ).run();

      // Grant access to the accountant
      if (auth.role.startsWith('accountant')) {
        await env.DB.prepare(
          'INSERT INTO user_company_access (id, user_id, company_id, role) VALUES (?, ?, ?, ?)'
        ).bind(crypto.randomUUID(), auth.userId, id, auth.role).run();
      }

      return jsonResponse({ id, ...body }, 201);
    }

    case 'PUT': {
      if (!companyId) return jsonResponse({ error: 'Company ID required' }, 400);
      
      const hasAccess = await checkCompanyAccess(auth, companyId, env);
      if (!hasAccess) return jsonResponse({ error: 'Access denied' }, 403);

      const body = await request.json();
      const fields = Object.keys(body).map(k => `${k} = ?`).join(', ');
      const values = Object.values(body);

      await env.DB.prepare(
        `UPDATE companies SET ${fields}, updated_at = datetime('now') WHERE id = ?`
      ).bind(...values as any, companyId).run();

      return jsonResponse({ success: true });
    }

    default:
      return jsonResponse({ error: 'Method not allowed' }, 405);
  }
}

// =============================================
// INVOICES
// =============================================

async function handleInvoices(request: Request, env: Env, auth: JwtPayload): Promise<Response> {
  const method = request.method;
  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const invoiceId = parts[2];
  const companyId = url.searchParams.get('company_id') || auth.companyId;

  // Company isolation check
  const hasAccess = await checkCompanyAccess(auth, companyId, env);
  if (!hasAccess) return jsonResponse({ error: 'Access denied' }, 403);

  switch (method) {
    case 'GET': {
      if (invoiceId) {
        const invoice = await env.DB.prepare(
          'SELECT * FROM invoices WHERE id = ? AND company_id = ?'
        ).bind(invoiceId, companyId).first();

        if (!invoice) return jsonResponse({ error: 'Invoice not found' }, 404);

        // Get line items
        const items = await env.DB.prepare(
          'SELECT * FROM invoice_line_items WHERE invoice_id = ? ORDER BY sort_order'
        ).bind(invoiceId).all();

        return jsonResponse({ ...(invoice as any), line_items: items.results });
      }

      // List invoices with filters
      const status = url.searchParams.get('status');
      const dateFrom = url.searchParams.get('date_from');
      const dateTo = url.searchParams.get('date_to');

      let query = 'SELECT * FROM invoices WHERE company_id = ?';
      const params: any[] = [companyId];

      if (status) { query += ' AND status = ?'; params.push(status); }
      if (dateFrom) { query += ' AND date >= ?'; params.push(dateFrom); }
      if (dateTo) { query += ' AND date <= ?'; params.push(dateTo); }
      query += ' ORDER BY date DESC';

      const stmt = env.DB.prepare(query);
      const invoices = await stmt.bind(...params).all();

      return jsonResponse(invoices.results);
    }

    case 'POST': {
      const body = await request.json();
      const id = crypto.randomUUID();

      // Insert invoice using prepared statement
      await env.DB.prepare(`
        INSERT INTO invoices (id, company_id, invoice_no, customer_name, customer_tin, customer_address, customer_email, customer_phone, date, due_date, subtotal, tax_amount, discount, grand_total, status, notes, is_einvoice, einvoice_category, consolidated, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, companyId, body.invoice_no, body.customer_name, body.customer_tin,
        body.customer_address, body.customer_email, body.customer_phone,
        body.date, body.due_date, body.subtotal, body.tax_amount,
        body.discount || 0, body.grand_total, body.status || 'draft',
        body.notes, body.is_einvoice ? 1 : 0, body.einvoice_category,
        body.consolidated ? 1 : 0, auth.userId
      ).run();

      // Insert line items
      if (body.line_items?.length) {
        for (let i = 0; i < body.line_items.length; i++) {
          const item = body.line_items[i];
          await env.DB.prepare(`
            INSERT INTO invoice_line_items (id, invoice_id, description, quantity, unit_price, tax_rate, amount, tax_amount, total, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            crypto.randomUUID(), id, item.description, item.quantity,
            item.unit_price, item.tax_rate, item.amount, item.tax_amount,
            item.total, i
          ).run();
        }
      }

      // Audit log
      await env.DB.prepare(
        'INSERT INTO audit_log (id, company_id, user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(crypto.randomUUID(), companyId, auth.userId, 'create_invoice', 'invoice', id).run();

      return jsonResponse({ id, ...body }, 201);
    }

    case 'PUT': {
      if (!invoiceId) return jsonResponse({ error: 'Invoice ID required' }, 400);

      const body = await request.json();
      const fields = Object.keys(body).filter(k => k !== 'line_items').map(k => `${k} = ?`).join(', ');
      const values = Object.entries(body).filter(([k]) => k !== 'line_items').map(([, v]) => v);

      if (fields) {
        await env.DB.prepare(
          `UPDATE invoices SET ${fields}, updated_at = datetime('now') WHERE id = ? AND company_id = ?`
        ).bind(...values as any, invoiceId, companyId).run();
      }

      // Update line items if provided
      if (body.line_items) {
        await env.DB.prepare('DELETE FROM invoice_line_items WHERE invoice_id = ?').bind(invoiceId).run();
        for (let i = 0; i < body.line_items.length; i++) {
          const item = body.line_items[i];
          await env.DB.prepare(`
            INSERT INTO invoice_line_items (id, invoice_id, description, quantity, unit_price, tax_rate, amount, tax_amount, total, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            crypto.randomUUID(), invoiceId, item.description, item.quantity,
            item.unit_price, item.tax_rate, item.amount, item.tax_amount,
            item.total, i
          ).run();
        }
      }

      return jsonResponse({ success: true });
    }

    case 'DELETE': {
      if (!invoiceId) return jsonResponse({ error: 'Invoice ID required' }, 400);

      await env.DB.prepare(
        'DELETE FROM invoices WHERE id = ? AND company_id = ?'
      ).bind(invoiceId, companyId).run();

      return jsonResponse({ success: true });
    }

    default:
      return jsonResponse({ error: 'Method not allowed' }, 405);
  }
}

// =============================================
// TRANSACTIONS
// =============================================

async function handleTransactions(request: Request, env: Env, auth: JwtPayload): Promise<Response> {
  const method = request.method;
  const url = new URL(request.url);
  const companyId = url.searchParams.get('company_id') || auth.companyId;

  const hasAccess = await checkCompanyAccess(auth, companyId, env);
  if (!hasAccess) return jsonResponse({ error: 'Access denied' }, 403);

  switch (method) {
    case 'GET': {
      const type = url.searchParams.get('type');
      const category = url.searchParams.get('category');
      const dateFrom = url.searchParams.get('date_from');
      const dateTo = url.searchParams.get('date_to');

      let query = 'SELECT * FROM transactions WHERE company_id = ?';
      const params: any[] = [companyId];

      if (type) { query += ' AND type = ?'; params.push(type); }
      if (category) { query += ' AND category = ?'; params.push(category); }
      if (dateFrom) { query += ' AND date >= ?'; params.push(dateFrom); }
      if (dateTo) { query += ' AND date <= ?'; params.push(dateTo); }
      query += ' ORDER BY date DESC';

      const transactions = await env.DB.prepare(query).bind(...params).all();
      return jsonResponse(transactions.results);
    }

    case 'POST': {
      const body = await request.json();
      const id = crypto.randomUUID();

      await env.DB.prepare(`
        INSERT INTO transactions (id, company_id, date, description, category, account_code, debit, credit, reference, type, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, companyId, body.date, body.description, body.category,
        body.account_code, body.debit || 0, body.credit || 0,
        body.reference, body.type, auth.userId
      ).run();

      return jsonResponse({ id, ...body }, 201);
    }

    default:
      return jsonResponse({ error: 'Method not allowed' }, 405);
  }
}

// =============================================
// E-INVOICE (LHDN)
// =============================================

async function handleEInvoice(request: Request, env: Env, auth: JwtPayload): Promise<Response> {
  const url = new URL(request.url);
  const companyId = url.searchParams.get('company_id') || auth.companyId;

  const hasAccess = await checkCompanyAccess(auth, companyId, env);
  if (!hasAccess) return jsonResponse({ error: 'Access denied' }, 403);

  // Get invoices ready for e-Invoice submission
  const invoices = await env.DB.prepare(
    'SELECT * FROM invoices WHERE company_id = ? AND is_einvoice = 1 AND status IN (?, ?) ORDER BY date DESC'
  ).bind(companyId, 'draft', 'sent').all();

  // Get company details for e-Invoice header
  const company = await env.DB.prepare(
    'SELECT * FROM companies WHERE id = ?'
  ).bind(companyId).first();

  // Generate LHDN-compliant data structure
  const einvoiceData = {
    format: 'LHDN_eInvoice_v2.0',
    generated_at: new Date().toISOString(),
    supplier: {
      tin: (company as any)?.tin,
      name: (company as any)?.name,
      registration_no: (company as any)?.registration_no,
      sst_no: (company as any)?.sst_no,
      address: {
        line1: (company as any)?.address,
        city: (company as any)?.city,
        state: (company as any)?.state,
        postcode: (company as any)?.postcode,
        country: 'MY',
      },
    },
    invoices: invoices.results.map((inv: any) => ({
      invoice_no: inv.invoice_no,
      date: inv.date,
      due_date: inv.due_date,
      buyer: {
        tin: inv.customer_tin,
        name: inv.customer_name,
        address: inv.customer_address,
      },
      category: inv.einvoice_category,
      subtotal: inv.subtotal,
      tax_amount: inv.tax_amount,
      total: inv.grand_total,
      consolidated: inv.consolidated === 1,
    })),
  };

  return jsonResponse(einvoiceData);
}

// =============================================
// DOCUMENTS (Metadata only - R2 not yet provisioned)
// =============================================

async function handleDocuments(request: Request, env: Env, auth: JwtPayload): Promise<Response> {
  const method = request.method;
  const url = new URL(request.url);
  const companyId = url.searchParams.get('company_id') || auth.companyId;

  const hasAccess = await checkCompanyAccess(auth, companyId, env);
  if (!hasAccess) return jsonResponse({ error: 'Access denied' }, 403);

  switch (method) {
    case 'POST': {
      // R2 bucket not yet provisioned - store metadata only
      const body = await request.json();
      const docId = crypto.randomUUID();
      
      await env.DB.prepare(`
        INSERT INTO documents (id, company_id, user_id, filename, original_name, mime_type, size_bytes, r2_key, category, related_invoice_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        docId, companyId, auth.userId, body.filename || 'document',
        body.original_name || body.filename || 'document',
        body.mime_type || 'application/octet-stream',
        body.size_bytes || 0,
        `pending/${companyId}/${docId}`,
        body.category || 'receipt',
        body.invoice_id || null
      ).run();

      return jsonResponse({ 
        id: docId, 
        status: 'metadata_saved',
        message: 'R2 bucket not yet provisioned. Document metadata saved. File upload will be available once R2 is configured.'
      }, 201);
    }

    case 'GET': {
      const docs = await env.DB.prepare(
        'SELECT * FROM documents WHERE company_id = ? ORDER BY created_at DESC'
      ).bind(companyId).all();

      return jsonResponse(docs.results);
    }

    default:
      return jsonResponse({ error: 'Method not allowed' }, 405);
  }
}

// =============================================
// SETTINGS
// =============================================

async function handleSettings(request: Request, env: Env, auth: JwtPayload): Promise<Response> {
  const method = request.method;
  const url = new URL(request.url);
  const companyId = url.searchParams.get('company_id') || auth.companyId;

  const hasAccess = await checkCompanyAccess(auth, companyId, env);
  if (!hasAccess) return jsonResponse({ error: 'Access denied' }, 403);

  switch (method) {
    case 'GET': {
      const settings = await env.DB.prepare(
        'SELECT setting_key, setting_value FROM company_settings WHERE company_id = ?'
      ).bind(companyId).all();

      const settingsMap: Record<string, string> = {};
      for (const row of settings.results) {
        settingsMap[(row as any).setting_key] = (row as any).setting_value;
      }
      return jsonResponse(settingsMap);
    }

    case 'PUT': {
      const body = await request.json();
      for (const [key, value] of Object.entries(body)) {
        await env.DB.prepare(`
          INSERT INTO company_settings (id, company_id, setting_key, setting_value, updated_at)
          VALUES (?, ?, ?, ?, datetime('now'))
          ON CONFLICT(company_id, setting_key) DO UPDATE SET setting_value = ?, updated_at = datetime('now')
        `).bind(crypto.randomUUID(), companyId, key, value as string, value as string).run();
      }
      return jsonResponse({ success: true });
    }

    default:
      return jsonResponse({ error: 'Method not allowed' }, 405);
  }
}

// =============================================
// SETUP / INITIALIZATION
// =============================================

async function handleSetup(env: Env): Promise<Response> {
  try {
    // Check if tables exist
    const tablesCheck = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='companies'"
    ).first();

    if (!tablesCheck) {
      return jsonResponse({ 
        error: 'Database not initialized. Run: npx wrangler d1 execute mykira --file=schema.sql' 
      }, 400);
    }

    // Create demo company
    const companyId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT OR IGNORE INTO companies (id, name, registration_no, sst_no, tin, address, city, state, postcode, phone, email, financial_year_end, tax_rate, sst_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      companyId, 'Sabah Maju Enterprise', 'SA1234567-X', 'B16-1906-32000045',
      'C 1234567890', 'Lot 12, Block B, KK Times Square', 'Kota Kinabalu',
      'Sabah', '88100', '+6088-123456', 'info@sabahmaju.my', '2025-12-31', 24, 6
    ).run();

    // Create demo user
    const userId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT OR IGNORE INTO users (id, email, password_hash, name, role, company_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      userId, 'demo@kiraenterprise.my', 'demo', 'Ahmad Razak', 'accountant_owner', companyId
    ).run();

    return jsonResponse({ 
      success: true, 
      message: 'Demo data created',
      credentials: {
        email: 'demo@kiraenterprise.my',
        password: 'demo',
      },
      company_id: companyId,
    });
  } catch (error: any) {
    return jsonResponse({ error: error.message }, 500);
  }
}

// =============================================
// UTILITIES
// =============================================

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function checkCompanyAccess(auth: JwtPayload, companyId: string, env: Env): Promise<boolean> {
  if (auth.role === 'platform_admin') return true;
  if (auth.companyId === companyId) return true;

  // Check user_company_access table for accountants
  const access = await env.DB.prepare(
    'SELECT id FROM user_company_access WHERE user_id = ? AND company_id = ?'
  ).bind(auth.userId, companyId).first();

  return !!access;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // In production, use bcrypt.compare() or similar
  // Simplified for demo
  return password === hash || hash === 'demo';
}

async function generateToken(payload: JwtPayload, secret: string): Promise<string> {
  // Simplified JWT generation using Web Crypto API
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const signature = btoa(`${header}.${body}.${secret}`.slice(0, 43));
  return `${header}.${body}.${signature}`;
}

async function verifyToken(token: string, secret: string): Promise<JwtPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');
  return JSON.parse(atob(parts[1]));
}
