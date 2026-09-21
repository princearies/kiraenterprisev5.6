/**
 * KiraEnterprise v5.6 - Single-File Cloudflare Worker
 * Serves both REST API and mobile-first UI from one file
 * Database: mykira (D1) - 4037f2cd-0c4a-4251-846e-534eb7b47338
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors() });
    }

    try {
      // API Routes
      if (path === '/api/health') return handleHealth(env);
      if (path === '/api/companies' && request.method === 'GET') return await getCompanies(env);
      if (path === '/api/invoices' && request.method === 'GET') return await getInvoices(request, env);
      if (path === '/api/invoices' && request.method === 'POST') return await createInvoice(request, env);
      if (path.match(/^\/api\/invoices\/[^/]+$/) && request.method === 'GET') return await getInvoice(path, env);
      if (path.match(/^\/api\/invoices\/[^/]+$/) && request.method === 'DELETE') return await deleteInvoice(path, env);

      // Serve frontend for all other routes
      return new Response(renderHTML(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...cors() }
      });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }
};

// ============================================
// UTILITIES
// ============================================
function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors() }
  });
}

// ============================================
// API: Health
// ============================================
function handleHealth(env) {
  return json({
    status: 'ok',
    app: env.APP_NAME || 'KiraEnterprise',
    version: env.APP_VERSION || '5.6',
    region: env.REGION || 'MY-SABAH',
    timestamp: new Date().toISOString()
  });
}

// ============================================
// API: Companies
// ============================================
async function getCompanies(env) {
  try {
    const { results } = await env.DB.prepare('SELECT * FROM companies WHERE is_active = 1 ORDER BY name').all();
    return json(results);
  } catch (e) {
    return json({ error: 'Failed to fetch companies', details: e.message }, 500);
  }
}

// ============================================
// API: Invoices - GET (list)
// ============================================
async function getInvoices(request, env) {
  const url = new URL(request.url);
  const companyId = url.searchParams.get('company_id');
  const status = url.searchParams.get('status');

  let query = 'SELECT * FROM invoices WHERE 1=1';
  const params = [];

  if (companyId) {
    query += ' AND company_id = ?';
    params.push(companyId);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  query += ' ORDER BY date DESC LIMIT 100';

  try {
    const stmt = env.DB.prepare(query);
    const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
    return json(results);
  } catch (e) {
    return json({ error: 'Failed to fetch invoices', details: e.message }, 500);
  }
}

// ============================================
// API: Invoices - GET (single with line items)
// ============================================
async function getInvoice(path, env) {
  const id = path.split('/').pop();

  try {
    const invoice = await env.DB.prepare('SELECT * FROM invoices WHERE id = ?').bind(id).first();
    if (!invoice) return json({ error: 'Invoice not found' }, 404);

    const { results: items } = await env.DB.prepare(
      'SELECT * FROM invoice_line_items WHERE invoice_id = ? ORDER BY sort_order'
    ).bind(id).all();

    return json({ ...invoice, line_items: items });
  } catch (e) {
    return json({ error: 'Failed to fetch invoice', details: e.message }, 500);
  }
}

// ============================================
// API: Invoices - POST (create)
// ============================================
async function createInvoice(request, env) {
  const body = await request.json();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    await env.DB.prepare(`
      INSERT INTO invoices (id, company_id, invoice_no, customer_name, customer_tin, customer_address, customer_email, customer_phone, date, due_date, subtotal, tax_amount, discount, grand_total, status, notes, is_einvoice, einvoice_category, consolidated, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.company_id || null,
      body.invoice_no || ('INV-' + Date.now()),
      body.customer_name || '',
      body.customer_tin || '',
      body.customer_address || '',
      body.customer_email || '',
      body.customer_phone || '',
      body.date || now.split('T')[0],
      body.due_date || '',
      body.subtotal || 0,
      body.tax_amount || 0,
      body.discount || 0,
      body.grand_total || 0,
      body.status || 'draft',
      body.notes || '',
      body.is_einvoice ? 1 : 0,
      body.einvoice_category || '01001',
      body.consolidated ? 1 : 0,
      'web-user',
      now,
      now
    ).run();

    if (body.line_items && body.line_items.length > 0) {
      for (let i = 0; i < body.line_items.length; i++) {
        const item = body.line_items[i];
        await env.DB.prepare(`
          INSERT INTO invoice_line_items (id, invoice_id, description, quantity, unit_price, tax_rate, amount, tax_amount, total, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          crypto.randomUUID(),
          id,
          item.description || '',
          item.quantity || 1,
          item.unit_price || 0,
          item.tax_rate || 0,
          item.amount || 0,
          item.tax_amount || 0,
          item.total || 0,
          i
        ).run();
      }
    }

    return json({ id, message: 'Invoice created successfully' }, 201);
  } catch (e) {
    return json({ error: 'Failed to create invoice', details: e.message }, 500);
  }
}

// ============================================
// API: Invoices - DELETE
// ============================================
async function deleteInvoice(path, env) {
  const id = path.split('/').pop();

  try {
    await env.DB.prepare('DELETE FROM invoice_line_items WHERE invoice_id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM invoices WHERE id = ?').bind(id).run();
    return json({ success: true, message: 'Invoice deleted' });
  } catch (e) {
    return json({ error: 'Failed to delete invoice', details: e.message }, 500);
  }
}

// ============================================
// FRONTEND HTML
// ============================================
function renderHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>KiraEnterprise v5.6 - Cloud Accounting & e-Invoice</title>
  <meta name="description" content="Multi-tenant cloud accounting for Malaysian businesses">
  <meta name="theme-color" content="#1e40af">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: { 50:'#eff6ff',100:'#dbeafe',200:'#bfdbfe',300:'#93c5fd',400:'#60a5fa',500:'#3b82f6',600:'#2563eb',700:'#1d4ed8',800:'#1e40af',900:'#1e3a8a' }
          },
          fontFamily: { sans: ['Inter','system-ui','sans-serif'] }
        }
      }
    }
  </script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { -webkit-tap-highlight-color: transparent; }
    body { font-family: 'Inter', system-ui, sans-serif; }
    @media print {
      .no-print { display: none !important; }
      body { background: white !important; }
    }
    .fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <div id="app"></div>

  <script>
  // ============================================
  // STATE
  // ============================================
  const state = {
    view: 'dashboard',
    invoices: [],
    companies: [],
    activeCompany: null,
    currentInvoice: null,
    loading: true,
    error: null,
    form: {
      customer_name: '',
      customer_tin: '',
      customer_address: '',
      customer_email: '',
      customer_phone: '',
      date: new Date().toISOString().split('T')[0],
      due_date: '',
      notes: '',
      is_einvoice: true,
      line_items: [{ id: Date.now(), description: '', quantity: 1, unit_price: 0, tax_rate: 6 }]
    }
  };

  // ============================================
  // API CALLS
  // ============================================
  async function api(path, opts = {}) {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...opts
    });
    if (!res.ok) throw new Error((await res.json()).error || 'API error');
    return res.json();
  }

  async function loadInvoices() {
    try {
      state.loading = true;
      render();
      state.invoices = await api('/api/invoices');
      state.loading = false;
      render();
    } catch (e) {
      state.error = e.message;
      state.loading = false;
      render();
    }
  }

  async function loadCompanies() {
    try {
      state.companies = await api('/api/companies');
      if (state.companies.length > 0) state.activeCompany = state.companies[0];
    } catch (e) { /* silent */ }
  }

  async function saveInvoice() {
    const f = state.form;
    const items = f.line_items.map(item => {
      const amount = item.quantity * item.unit_price;
      const tax_amount = amount * (item.tax_rate / 100);
      return { ...item, amount, tax_amount, total: amount + tax_amount };
    });
    const subtotal = items.reduce((s, i) => s + i.amount, 0);
    const tax_amount = items.reduce((s, i) => s + i.tax_amount, 0);
    const grand_total = subtotal + tax_amount;

    const data = {
      company_id: state.activeCompany?.id || null,
      invoice_no: 'INV-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 999)).padStart(3, '0'),
      customer_name: f.customer_name,
      customer_tin: f.customer_tin,
      customer_address: f.customer_address,
      customer_email: f.customer_email,
      customer_phone: f.customer_phone,
      date: f.date,
      due_date: f.due_date,
      subtotal, tax_amount, discount: 0, grand_total,
      status: 'draft',
      notes: f.notes,
      is_einvoice: f.is_einvoice,
      einvoice_category: '01001',
      consolidated: false,
      line_items: items
    };

    try {
      await api('/api/invoices', { method: 'POST', body: JSON.stringify(data) });
      state.view = 'list';
      resetForm();
      await loadInvoices();
      showToast('Invoice saved successfully!');
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    }
  }

  async function deleteInvoice(id) {
    if (!confirm('Delete this invoice?')) return;
    try {
      await api('/api/invoices/' + id, { method: 'DELETE' });
      await loadInvoices();
      showToast('Invoice deleted');
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    }
  }

  // ============================================
  // HELPERS
  // ============================================
  function fmt(n) {
    return 'RM ' + Number(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function resetForm() {
    state.form = {
      customer_name: '', customer_tin: '', customer_address: '',
      customer_email: '', customer_phone: '',
      date: new Date().toISOString().split('T')[0], due_date: '', notes: '',
      is_einvoice: true,
      line_items: [{ id: Date.now(), description: '', quantity: 1, unit_price: 0, tax_rate: 6 }]
    };
  }

  function calcTotals() {
    return state.form.line_items.map(item => {
      const amount = item.quantity * item.unit_price;
      const tax_amount = amount * (item.tax_rate / 100);
      return { ...item, amount, tax_amount, total: amount + tax_amount };
    });
  }

  function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 left-4 sm:left-auto sm:w-80 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium z-50 fade-in ' +
      (type === 'error' ? 'bg-red-500' : 'bg-green-500');
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  function shareWhatsApp(inv) {
    const items = (inv.line_items || []).map(i => '• ' + i.description + ' x' + i.quantity + ' = ' + fmt(i.total)).join('\\n');
    const msg = '*INVOICE ' + inv.invoice_no + '*\\n\\n' +
      'From: ' + (state.activeCompany?.name || 'KiraEnterprise') + '\\n' +
      'To: ' + inv.customer_name + '\\n' +
      'Date: ' + inv.date + '\\n' +
      'Due: ' + (inv.due_date || 'N/A') + '\\n\\n' +
      '*Items:*\\n' + items + '\\n\\n' +
      'Subtotal: ' + fmt(inv.subtotal) + '\\n' +
      'Tax: ' + fmt(inv.tax_amount) + '\\n' +
      '*Total: ' + fmt(inv.grand_total) + '*\\n\\n' +
      'Thank you!';
    const phone = (inv.customer_phone || '').replace(/[^0-9]/g, '');
    window.open('https://wa.me/' + (phone ? '6' + phone : '') + '?text=' + encodeURIComponent(msg), '_blank');
  }

  function printInvoice() { window.print(); }

  // ============================================
  // RENDER
  // ============================================
  function render() {
    const app = document.getElementById('app');
    app.innerHTML = renderShell();
  }

  function renderShell() {
    let html = '';
    
    // Header
    html += '<header class="bg-white border-b border-gray-200 sticky top-0 z-40 no-print">';
    html += '<div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">';
    html += '<div class="flex items-center gap-3">';
    html += '<div class="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">';
    html += '<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>';
    html += '</div>';
    html += '<div><h1 class="text-sm font-bold text-gray-800">KiraEnterprise</h1>';
    html += '<p class="text-xs text-gray-400">v5.6 • ' + (state.activeCompany?.name || 'Sabah, Malaysia') + '</p></div>';
    html += '</div></div>';
    
    // Nav
    html += '<nav class="max-w-5xl mx-auto px-4 pb-2 flex gap-1 overflow-x-auto">';
    html += navBtn('dashboard', '📊 Dashboard');
    html += navBtn('list', '📋 Invoices');
    html += navBtn('new', '➕ New Invoice');
    html += '</nav></header>';

    // Main
    html += '<main class="max-w-5xl mx-auto px-4 py-4 pb-20">';
    if (state.view === 'dashboard') html += renderDashboard();
    if (state.view === 'list') html += renderList();
    if (state.view === 'new') html += renderForm();
    if (state.view === 'view' && state.currentInvoice) html += renderView(state.currentInvoice);
    html += '</main>';

    // Disclaimer
    html += '<div class="no-print max-w-5xl mx-auto px-4 pb-6">';
    html += '<div class="bg-amber-50 border border-amber-200 rounded-xl p-3">';
    html += '<p class="text-amber-800 text-xs leading-relaxed"><strong>⚠️ Disclaimer:</strong> KiraEnterprise helps organize data for tax/e-Invoice purposes. It does not guarantee full LHDN compliance. Final review by a qualified accountant is required.</p>';
    html += '</div></div>';

    return html;
  }

  function navBtn(id, label) {
    const active = state.view === id;
    return '<button onclick="navigate(\\'' + id + '\\')" class="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ' +
      (active ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200') + '">' + label + '</button>';
  }

  // ============================================
  // DASHBOARD
  // ============================================
  function renderDashboard() {
    const invs = state.invoices;
    const total = invs.reduce((s, i) => s + (i.grand_total || 0), 0);
    const paid = invs.filter(i => i.status === 'paid').reduce((s, i) => s + (i.grand_total || 0), 0);
    const outstanding = invs.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + (i.grand_total || 0), 0);

    let html = '<div class="fade-in space-y-4">';
    html += '<div><h2 class="text-xl font-bold text-gray-800">Dashboard</h2>';
    html += '<p class="text-sm text-gray-500">' + (state.activeCompany?.name || 'All Companies') + ' • ' + invs.length + ' invoices</p></div>';

    html += '<div class="grid grid-cols-2 gap-3">';
    html += statCard('Total Revenue', fmt(total), '💰');
    html += statCard('Invoices', invs.length.toString(), '📄');
    html += statCard('Outstanding', fmt(outstanding), '⏳');
    html += statCard('Paid', fmt(paid), '✅');
    html += '</div>';

    html += '<div class="grid grid-cols-2 gap-3">';
    html += '<button onclick="navigate(\\'new\\')" class="bg-primary-600 hover:bg-primary-700 text-white rounded-xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"><span class="text-2xl">➕</span><span class="text-xs font-medium">New Invoice</span></button>';
    html += '<button onclick="navigate(\\'list\\')" class="bg-gray-700 hover:bg-gray-800 text-white rounded-xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"><span class="text-2xl">📋</span><span class="text-xs font-medium">View All</span></button>';
    html += '</div>';

    html += '<div class="bg-white rounded-xl border border-gray-200 p-4">';
    html += '<h3 class="font-semibold text-gray-800 mb-3 text-sm">Recent Invoices</h3>';
    html += '<div class="space-y-2">';
    
    if (invs.length === 0) {
      html += '<p class="text-sm text-gray-400 text-center py-4">No invoices yet</p>';
    } else {
      invs.slice(0, 5).forEach(inv => {
        html += '<div onclick="viewInvoice(\\'' + inv.id + '\\')" class="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100">';
        html += '<div class="flex-1 min-w-0"><p class="text-sm font-medium text-gray-800 truncate">' + (inv.customer_name || 'No customer') + '</p>';
        html += '<p class="text-xs text-gray-500">' + inv.invoice_no + ' • ' + inv.date + '</p></div>';
        html += '<div class="text-right ml-3"><p class="text-sm font-semibold">' + fmt(inv.grand_total) + '</p>';
        html += '<span class="text-xs px-2 py-0.5 rounded-full ' + statusColor(inv.status) + '">' + inv.status + '</span></div>';
        html += '</div>';
      });
    }
    
    html += '</div></div></div>';
    return html;
  }

  function statCard(title, value, icon) {
    return '<div class="bg-white rounded-xl border border-gray-200 p-3"><div class="flex items-center justify-between mb-2"><span class="text-lg">' + icon + '</span></div><p class="text-lg font-bold text-gray-800">' + value + '</p><p class="text-xs text-gray-500">' + title + '</p></div>';
  }

  function statusColor(s) {
    const m = { draft:'bg-gray-100 text-gray-700', sent:'bg-blue-100 text-blue-700', paid:'bg-green-100 text-green-700', overdue:'bg-red-100 text-red-700', cancelled:'bg-gray-100 text-gray-500' };
    return m[s] || m.draft;
  }

  // ============================================
  // INVOICE LIST
  // ============================================
  function renderList() {
    const invs = state.invoices;
    let html = '<div class="fade-in space-y-4">';
    html += '<div class="flex items-center justify-between"><div><h2 class="text-xl font-bold text-gray-800">Invoices</h2><p class="text-sm text-gray-500">' + invs.length + ' total</p></div>';
    html += '<button onclick="navigate(\\'new\\')" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl active:scale-95">+ New</button></div>';

    html += '<div class="space-y-2">';
    if (invs.length === 0) {
      html += '<div class="text-center py-12 bg-white rounded-xl border"><p class="text-gray-400 text-sm">No invoices found</p></div>';
    } else {
      invs.forEach(inv => {
        html += '<div class="bg-white rounded-xl border border-gray-200 p-4"><div class="flex items-start justify-between gap-3">';
        html += '<div class="flex-1 min-w-0"><div class="flex items-center gap-2 mb-1 flex-wrap">';
        html += '<span class="text-sm font-semibold text-gray-800">' + inv.invoice_no + '</span>';
        html += '<span class="text-xs px-2 py-0.5 rounded-full ' + statusColor(inv.status) + '">' + inv.status + '</span>';
        if (inv.is_einvoice) html += '<span class="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">e-Invoice</span>';
        html += '</div><p class="text-sm text-gray-600">' + (inv.customer_name || 'No customer') + '</p>';
        html += '<p class="text-xs text-gray-400 mt-1">' + inv.date + (inv.due_date ? ' • Due: ' + inv.due_date : '') + '</p></div>';
        html += '<div class="text-right"><p class="text-lg font-bold text-gray-800">' + fmt(inv.grand_total) + '</p>';
        html += '<div class="flex items-center gap-1 mt-2 justify-end">';
        html += '<button onclick="viewInvoice(\\'' + inv.id + '\\')" class="p-1.5 hover:bg-gray-100 rounded-lg text-xs" title="View">👁️</button>';
        html += '<button onclick="deleteInvoice(\\'' + inv.id + '\\')" class="p-1.5 hover:bg-red-50 rounded-lg text-xs" title="Delete">🗑️</button>';
        html += '</div></div></div></div>';
      });
    }
    html += '</div></div>';
    return html;
  }

  // ============================================
  // INVOICE FORM
  // ============================================
  function renderForm() {
    const f = state.form;
    const items = calcTotals();
    const subtotal = items.reduce((s, i) => s + i.amount, 0);
    const tax = items.reduce((s, i) => s + i.tax_amount, 0);
    const total = subtotal + tax;

    let html = '<div class="fade-in space-y-4">';
    html += '<div class="flex items-center justify-between"><h2 class="text-xl font-bold text-gray-800">New Invoice</h2>';
    html += '<button onclick="navigate(\\'list\\')" class="text-sm text-gray-500">Cancel</button></div>';

    html += '<div class="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">';
    
    // Customer
    html += '<div><h3 class="font-semibold text-gray-700 mb-2 text-sm">Customer</h3>';
    html += '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">';
    html += inputField('Customer Name *', 'customer_name', f.customer_name);
    html += inputField('Customer TIN', 'customer_tin', f.customer_tin);
    html += inputField('Email', 'customer_email', f.customer_email, 'email');
    html += inputField('Phone', 'customer_phone', f.customer_phone, 'tel');
    html += '<div class="sm:col-span-2"><label class="text-xs text-gray-500 mb-1 block">Address</label>';
    html += '<textarea id="customer_address" onchange="updateForm(\\'customer_address\\', this.value)" class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" rows="2" placeholder="Customer address">' + f.customer_address + '</textarea></div>';
    html += '</div></div>';

    // Invoice Details
    html += '<div><h3 class="font-semibold text-gray-700 mb-2 text-sm">Invoice Details</h3>';
    html += '<div class="grid grid-cols-2 gap-3">';
    html += '<div><label class="text-xs text-gray-500 mb-1 block">Date</label>';
    html += '<input type="date" value="' + f.date + '" onchange="updateForm(\\'date\\', this.value)" class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"></div>';
    html += '<div><label class="text-xs text-gray-500 mb-1 block">Due Date</label>';
    html += '<input type="date" value="' + f.due_date + '" onchange="updateForm(\\'due_date\\', this.value)" class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"></div>';
    html += '</div>';
    html += '<label class="flex items-center gap-2 mt-3 cursor-pointer"><input type="checkbox" ' + (f.is_einvoice ? 'checked' : '') + ' onchange="updateForm(\\'is_einvoice\\', this.checked)" class="w-4 h-4 rounded text-primary-600"><span class="text-sm text-gray-700">e-Invoice (LHDN)</span></label>';
    html += '</div>';

    // Line Items
    html += '<div><div class="flex items-center justify-between mb-2"><h3 class="font-semibold text-gray-700 text-sm">Line Items</h3>';
    html += '<button onclick="addLineItem()" class="text-xs text-primary-600 font-medium hover:text-primary-700">+ Add Row</button></div>';
    html += '<div class="space-y-3">';
    
    items.forEach((item, idx) => {
      html += '<div class="bg-gray-50 rounded-xl p-3 space-y-2">';
      html += '<div class="flex items-center justify-between"><span class="text-xs text-gray-400">Item #' + (idx + 1) + '</span>';
      if (items.length > 1) html += '<button onclick="removeLineItem(' + item.id + ')" class="text-red-400 hover:text-red-600 text-xs">🗑️ Remove</button>';
      html += '</div>';
      html += '<input value="' + item.description + '" onchange="updateLineItem(' + item.id + ', \\'description\\', this.value)" placeholder="Description" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">';
      html += '<div class="grid grid-cols-3 gap-2">';
      html += '<div><label class="text-xs text-gray-400">Qty</label><input type="number" value="' + item.quantity + '" onchange="updateLineItem(' + item.id + ', \\'quantity\\', parseFloat(this.value)||0)" class="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" min="0"></div>';
      html += '<div><label class="text-xs text-gray-400">Price (RM)</label><input type="number" value="' + item.unit_price + '" onchange="updateLineItem(' + item.id + ', \\'unit_price\\', parseFloat(this.value)||0)" class="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" min="0" step="0.01"></div>';
      html += '<div><label class="text-xs text-gray-400">Tax %</label><input type="number" value="' + item.tax_rate + '" onchange="updateLineItem(' + item.id + ', \\'tax_rate\\', parseFloat(this.value)||0)" class="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" min="0"></div>';
      html += '</div>';
      html += '<div class="text-right text-sm"><span class="text-gray-600">Amount: <strong>' + fmt(item.total) + '</strong></span></div>';
      html += '</div>';
    });
    
    html += '</div></div>';

    // Totals
    html += '<div class="bg-primary-50 rounded-xl p-4 space-y-2">';
    html += '<div class="flex justify-between text-sm"><span class="text-gray-600">Subtotal</span><span class="font-medium">' + fmt(subtotal) + '</span></div>';
    html += '<div class="flex justify-between text-sm"><span class="text-gray-600">Tax</span><span class="font-medium">' + fmt(tax) + '</span></div>';
    html += '<div class="border-t border-primary-200 pt-2 flex justify-between"><span class="font-semibold">Grand Total</span><span class="text-lg font-bold text-primary-700">' + fmt(total) + '</span></div>';
    html += '</div>';

    // Notes
    html += '<div><label class="text-xs text-gray-500 mb-1 block">Notes</label>';
    html += '<textarea id="notes" onchange="updateForm(\\'notes\\', this.value)" class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" rows="2" placeholder="Additional notes...">' + f.notes + '</textarea></div>';

    // Save Button
    html += '<button onclick="saveInvoice()" class="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl active:scale-95 transition-transform">💾 Save Invoice</button>';
    html += '</div></div>';
    
    return html;
  }

  function inputField(label, key, value, type = 'text') {
    return '<div><label class="text-xs text-gray-500 mb-1 block">' + label + '</label>' +
      '<input type="' + type + '" value="' + (value || '') + '" onchange="updateForm(\\'' + key + '\\', this.value)" placeholder="' + label + '" class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"></div>';
  }

  // ============================================
  // INVOICE VIEW
  // ============================================
  function renderView(inv) {
    let html = '<div class="fade-in space-y-4">';
    html += '<div class="flex items-center justify-between no-print">';
    html += '<button onclick="navigate(\\'list\\')" class="text-sm text-gray-500">← Back</button>';
    html += '<div class="flex gap-2">';
    html += '<button onclick=\\'shareWhatsApp(' + JSON.stringify(inv).replace(/'/g, "\\\\'") + ')\\' class="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg">💬 WhatsApp</button>';
    html += '<button onclick="printInvoice()" class="flex items-center gap-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg">🖨️ Print</button>';
    html += '</div></div>';
    html += renderInvoiceDoc(inv);
    html += '</div>';
    return html;
  }

  function renderInvoiceDoc(inv) {
    const items = inv.line_items || [];
    let html = '<div class="bg-white rounded-2xl border border-gray-200 p-4 sm:p-8 max-w-3xl mx-auto">';
    
    // Header
    html += '<div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 pb-6 border-b border-gray-200">';
    html += '<div><div class="flex items-center gap-2 mb-2">';
    html += '<div class="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center"><svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg></div>';
    html += '<div><h2 class="text-lg font-bold text-gray-800">' + (state.activeCompany?.name || 'KiraEnterprise') + '</h2>';
    html += '<p class="text-xs text-gray-500">' + (state.activeCompany?.registration_no || '') + '</p></div></div>';
    html += '<div class="text-xs text-gray-500 space-y-0.5 mt-2">';
    html += '<p>' + (state.activeCompany?.address || '') + ', ' + (state.activeCompany?.postcode || '') + ' ' + (state.activeCompany?.city || '') + '</p>';
    html += '<p>TIN: ' + (state.activeCompany?.tin || 'N/A') + ' | SST: ' + (state.activeCompany?.sst_no || 'N/A') + '</p></div></div>';
    html += '<div class="text-right"><h1 class="text-2xl font-bold text-primary-700">INVOICE</h1>';
    html += '<p class="text-sm font-medium text-gray-700 mt-1">' + inv.invoice_no + '</p>';
    html += '<p class="text-xs text-gray-500 mt-2">Date: ' + inv.date + '</p>';
    html += '<p class="text-xs text-gray-500">Due: ' + (inv.due_date || 'N/A') + '</p>';
    if (inv.is_einvoice) html += '<span class="inline-block mt-2 text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">LHDN e-Invoice</span>';
    html += '</div></div>';

    // Bill To
    html += '<div class="mb-6"><h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bill To</h3>';
    html += '<div class="bg-gray-50 rounded-xl p-4"><p class="font-semibold text-gray-800">' + (inv.customer_name || 'N/A') + '</p>';
    if (inv.customer_tin) html += '<p class="text-xs text-gray-500">TIN: ' + inv.customer_tin + '</p>';
    html += '<p class="text-sm text-gray-600 mt-1">' + (inv.customer_address || '') + '</p></div></div>';

    // Items Table
    html += '<div class="overflow-x-auto mb-6"><table class="w-full text-sm"><thead><tr class="border-b-2 border-gray-200">';
    html += '<th class="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Description</th>';
    html += '<th class="text-center py-2 text-xs font-semibold text-gray-500 uppercase">Qty</th>';
    html += '<th class="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Price</th>';
    html += '<th class="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Total</th>';
    html += '</tr></thead><tbody>';
    
    items.forEach(item => {
      html += '<tr class="border-b border-gray-100">';
      html += '<td class="py-3 text-gray-800">' + item.description + '</td>';
      html += '<td class="py-3 text-center text-gray-600">' + item.quantity + '</td>';
      html += '<td class="py-3 text-right text-gray-600">' + fmt(item.unit_price) + '</td>';
      html += '<td class="py-3 text-right font-medium text-gray-800">' + fmt(item.total) + '</td>';
      html += '</tr>';
    });
    
    html += '</tbody></table></div>';

    // Totals
    html += '<div class="flex justify-end"><div class="w-full sm:w-64 space-y-2">';
    html += '<div class="flex justify-between text-sm"><span class="text-gray-500">Subtotal</span><span>' + fmt(inv.subtotal) + '</span></div>';
    html += '<div class="flex justify-between text-sm"><span class="text-gray-500">Tax</span><span>' + fmt(inv.tax_amount) + '</span></div>';
    html += '<div class="border-t-2 border-gray-800 pt-2 flex justify-between"><span class="font-bold text-gray-800">Total</span><span class="text-xl font-bold text-primary-700">' + fmt(inv.grand_total) + '</span></div>';
    html += '</div></div>';

    if (inv.notes) html += '<div class="mt-6 pt-4 border-t border-gray-200"><p class="text-xs text-gray-500">Notes: ' + inv.notes + '</p></div>';

    html += '<div class="mt-8 pt-4 border-t border-gray-100 text-center"><p class="text-xs text-gray-400">Thank you for your business!</p><p class="text-xs text-gray-300 mt-1">Generated by KiraEnterprise v5.6</p></div>';
    html += '</div>';
    
    return html;
  }

  // ============================================
  // EVENT HANDLERS
  // ============================================
  function navigate(view) {
    state.view = view;
    state.currentInvoice = null;
    if (view === 'new') resetForm();
    render();
    window.scrollTo(0, 0);
  }

  function updateForm(key, value) {
    state.form[key] = value;
  }

  function addLineItem() {
    state.form.line_items.push({ id: Date.now(), description: '', quantity: 1, unit_price: 0, tax_rate: 6 });
    render();
  }

  function removeLineItem(id) {
    state.form.line_items = state.form.line_items.filter(i => i.id !== id);
    render();
  }

  function updateLineItem(id, field, value) {
    state.form.line_items = state.form.line_items.map(i => i.id === id ? { ...i, [field]: value } : i);
    render();
  }

  async function viewInvoice(id) {
    try {
      const inv = await api('/api/invoices/' + id);
      state.currentInvoice = inv;
      state.view = 'view';
      render();
    } catch (e) {
      showToast('Error loading invoice: ' + e.message, 'error');
    }
  }

  // ============================================
  // INIT
  // ============================================
  async function init() {
    await Promise.all([loadCompanies(), loadInvoices()]);
    render();
  }

  init();
  </script>
</body>
</html>`;
}
