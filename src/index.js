/**
 * KiraEnterprise v5.6 - Complete Malaysian Accounting Suite
 * Single-File Cloudflare Worker with Full Accounting, Tax & Statutory Reporting
 * Database: mykira (D1) - 4037f2cd-0c4a-4251-846e-534eb7b47338
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors() });
    try {
      await initDatabase(env);
      if (path === '/api/health') return handleHealth(env);
      if (path === '/api/companies' && request.method === 'GET') return await getCompanies(env);
      if (path === '/api/companies' && request.method === 'POST') return await createCompany(request, env);
      if (path === '/api/invoices' && request.method === 'GET') return await getInvoices(request, env);
      if (path === '/api/invoices' && request.method === 'POST') return await createInvoice(request, env);
      if (path.match(/^\/api\/invoices\/[^/]+$/) && request.method === 'GET') return await getInvoice(path, env);
      if (path.match(/^\/api\/invoices\/[^/]+$/) && request.method === 'DELETE') return await deleteInvoice(path, env);
      if (path === '/api/journal' && request.method === 'GET') return await getJournal(request, env);
      if (path === '/api/journal' && request.method === 'POST') return await createJournalEntry(request, env);
      if (path === '/api/ledger' && request.method === 'GET') return await getLedger(request, env);
      if (path === '/api/accounts' && request.method === 'GET') return await getAccounts(env);
      if (path === '/api/trial-balance') return await getTrialBalance(request, env);
      if (path === '/api/profit-loss') return await getProfitLoss(request, env);
      if (path === '/api/balance-sheet') return await getBalanceSheet(request, env);
      if (path === '/api/zakat' && request.method === 'POST') return await calculateZakat(request, env);
      return new Response(renderHTML(), { headers: { 'Content-Type': 'text/html; charset=utf-8', ...cors() } });
    } catch (err) { return json({ error: err.message }, 500); }
  }
};

async function initDatabase(env) {
  const tables = [
    `CREATE TABLE IF NOT EXISTS companies (id TEXT PRIMARY KEY, name TEXT, registration_no TEXT, tin TEXT, brn_ic TEXT, msic_code TEXT, address TEXT, city TEXT, state TEXT DEFAULT 'Sabah', postcode TEXT, phone TEXT, email TEXT, financial_year_end TEXT, tax_rate REAL DEFAULT 24, sst_rate REAL DEFAULT 6, director_name TEXT, accountant_name TEXT, is_active INTEGER DEFAULT 1)`,
    `CREATE TABLE IF NOT EXISTS invoices (id TEXT PRIMARY KEY, company_id TEXT, invoice_no TEXT, customer_name TEXT, customer_tin TEXT, customer_brn_ic TEXT, customer_msic TEXT, customer_address TEXT, customer_email TEXT, customer_phone TEXT, date TEXT, due_date TEXT, subtotal REAL, tax_amount REAL, discount REAL DEFAULT 0, grand_total REAL, status TEXT DEFAULT 'draft', notes TEXT, is_einvoice INTEGER DEFAULT 0, einvoice_category TEXT, created_by TEXT, created_at TEXT, updated_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS invoice_line_items (id TEXT PRIMARY KEY, invoice_id TEXT, description TEXT, quantity REAL, unit_price REAL, tax_rate REAL, amount REAL, tax_amount REAL, total REAL, sort_order INTEGER)`,
    `CREATE TABLE IF NOT EXISTS chart_of_accounts (code TEXT PRIMARY KEY, name TEXT, type TEXT, category TEXT, is_active INTEGER DEFAULT 1)`,
    `CREATE TABLE IF NOT EXISTS journal_entries (id TEXT PRIMARY KEY, date TEXT, description TEXT, reference TEXT, debit_account TEXT, credit_account TEXT, amount REAL, auto_posted INTEGER DEFAULT 0, invoice_id TEXT, created_by TEXT, created_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS zakat_calculations (id TEXT PRIMARY KEY, company_id TEXT, calculation_date TEXT, modal_kerja REAL, kaedah_pertumbuhan REAL, nisab REAL, zakat_amount REAL, notes TEXT, created_at TEXT)`
  ];
  for (const sql of tables) await env.DB.prepare(sql).run();
  const count = await env.DB.prepare('SELECT COUNT(*) as c FROM chart_of_accounts').first();
  if (count.c === 0) {
    const accounts = [
      ['1000','Cash & Bank','asset','Current Asset'],['1100','Accounts Receivable','asset','Current Asset'],['1200','Inventory','asset','Current Asset'],['1300','Fixed Assets','asset','Non-Current Asset'],['1400','Accumulated Depreciation','asset','Non-Current Asset'],
      ['2000','Accounts Payable','liability','Current Liability'],['2100','SST Payable','liability','Current Liability'],['2200','Tax Payable','liability','Current Liability'],['2300','Long-term Loans','liability','Non-Current Liability'],
      ['3000','Share Capital','equity','Equity'],['3100','Retained Earnings','equity','Equity'],
      ['4000','Sales Revenue','income','Revenue'],['4100','Service Revenue','income','Revenue'],['4200','Other Income','income','Revenue'],
      ['5000','Cost of Goods Sold','expense','COGS'],
      ['6000','Salaries & Wages','expense','Operating Expense'],['6100','Rent Expense','expense','Operating Expense'],['6200','Utilities','expense','Operating Expense'],['6300','Marketing','expense','Operating Expense'],['6400','Professional Fees','expense','Operating Expense'],['6500','Depreciation','expense','Operating Expense']
    ];
    for (const [code, name, type, category] of accounts) {
      await env.DB.prepare('INSERT INTO chart_of_accounts (code, name, type, category) VALUES (?, ?, ?, ?)').bind(code, name, type, category).run();
    }
  }
}

function cors() { return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }; }
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...cors() } }); }
function handleHealth(env) { return json({ status: 'ok', app: env.APP_NAME, version: env.APP_VERSION, region: env.REGION }); }

async function getCompanies(env) { const { results } = await env.DB.prepare('SELECT * FROM companies WHERE is_active = 1').all(); return json(results); }
async function createCompany(request, env) {
  const b = await request.json();
  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO companies (id, name, registration_no, tin, brn_ic, msic_code, address, city, state, postcode, phone, email, financial_year_end, tax_rate, sst_rate, director_name, accountant_name) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id, b.name, b.registration_no, b.tin, b.brn_ic, b.msic_code, b.address, b.city, b.state||'Sabah', b.postcode, b.phone, b.email, b.financial_year_end, b.tax_rate||24, b.sst_rate||6, b.director_name, b.accountant_name).run();
  return json({ id }, 201);
}

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
  await env.DB.prepare('INSERT INTO invoices (id,company_id,invoice_no,customer_name,customer_tin,customer_brn_ic,customer_msic,customer_address,customer_email,customer_phone,date,due_date,subtotal,tax_amount,discount,grand_total,status,notes,is_einvoice,einvoice_category,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,b.company_id,b.invoice_no||('INV-'+Date.now()),b.customer_name,b.customer_tin,b.customer_brn_ic,b.customer_msic,b.customer_address,b.customer_email,b.customer_phone,b.date,b.due_date,b.subtotal,b.tax_amount,b.discount||0,b.grand_total,b.status||'draft',b.notes,b.is_einvoice?1:0,b.einvoice_category||'01001','web',now,now).run();
  if (b.line_items) for (let i=0;i<b.line_items.length;i++) { const it=b.line_items[i]; await env.DB.prepare('INSERT INTO invoice_line_items (id,invoice_id,description,quantity,unit_price,tax_rate,amount,tax_amount,total,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),id,it.description,it.quantity,it.unit_price,it.tax_rate,it.amount,it.tax_amount,it.total,i).run(); }
  await env.DB.prepare('INSERT INTO journal_entries (id,date,description,reference,debit_account,credit_account,amount,auto_posted,invoice_id,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),b.date,'Invoice: '+b.customer_name,b.invoice_no,'1100','4000',b.subtotal,1,id,'system',now).run();
  if (b.tax_amount > 0) await env.DB.prepare('INSERT INTO journal_entries (id,date,description,reference,debit_account,credit_account,amount,auto_posted,invoice_id,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),b.date,'SST on '+b.invoice_no,b.invoice_no,'1100','2100',b.tax_amount,1,id,'system',now).run();
  return json({ id }, 201);
}

async function deleteInvoice(path, env) {
  const id = path.split('/').pop();
  await env.DB.prepare('DELETE FROM invoice_line_items WHERE invoice_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM journal_entries WHERE invoice_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM invoices WHERE id = ?').bind(id).run();
  return json({ success: true });
}

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

async function getAccounts(env) { const { results } = await env.DB.prepare('SELECT * FROM chart_of_accounts WHERE is_active = 1 ORDER BY code').all(); return json(results); }

async function getTrialBalance(request, env) {
  const url = new URL(request.url);
  const asOf = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const { results: accounts } = await env.DB.prepare('SELECT * FROM chart_of_accounts WHERE is_active = 1 ORDER BY code').all();
  const tb = []; let td = 0, tc = 0;
  for (const acc of accounts) {
    const r = await env.DB.prepare('SELECT COALESCE(SUM(CASE WHEN debit_account=? THEN amount ELSE 0 END),0) as td, COALESCE(SUM(CASE WHEN credit_account=? THEN amount ELSE 0 END),0) as tc FROM journal_entries WHERE date <= ?').bind(acc.code,acc.code,asOf).first();
    if (r.td > 0 || r.tc > 0) { tb.push({ code: acc.code, name: acc.name, type: acc.type, debit: r.td, credit: r.tc }); td += r.td; tc += r.tc; }
  }
  return json({ as_of_date: asOf, accounts: tb, total_debit: td, total_credit: tc, balanced: Math.abs(td-tc)<0.01, difference: td-tc });
}

async function getProfitLoss(request, env) {
  const url = new URL(request.url);
  const from = url.searchParams.get('from') || new Date(new Date().getFullYear(),0,1).toISOString().split('T')[0];
  const to = url.searchParams.get('to') || new Date().toISOString().split('T')[0];
  const rev = await env.DB.prepare('SELECT COALESCE(SUM(amount),0) as t FROM journal_entries WHERE credit_account LIKE ? AND date BETWEEN ? AND ?').bind('4%',from,to).first();
  const cogs = await env.DB.prepare('SELECT COALESCE(SUM(amount),0) as t FROM journal_entries WHERE debit_account = ? AND date BETWEEN ? AND ?').bind('5000',from,to).first();
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
// FRONTEND HTML - COMPLETE SPA
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
const S={view:'dashboard',companies:[],invoices:[],journal:[],accounts:[],company:null,modal:null,reportData:null};
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
  const tabs=[['dashboard','📊 Dashboard'],['invoices','📄 Invoices'],['journal','📖 Journal'],['ledger','📒 Ledger'],['trial-balance','⚖️ Trial Balance'],['profit-loss','💰 P&L'],['balance-sheet','📊 Balance Sheet'],['zakat','🕌 Zakat'],['settings','⚙️ Settings']];
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
    case 'journal':return renderJournal();
    case 'ledger':return renderLedger();
    case 'trial-balance':return renderTrialBalance();
    case 'profit-loss':return renderPL();
    case 'balance-sheet':return renderBS();
    case 'zakat':return renderZakat();
    case 'settings':return renderSettings();
    default:return renderDashboard();
  }
}

async function renderDashboard(){
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
  '<button onclick="nav(\\'invoices\\')" class="bg-blue-600 text-white rounded-xl p-4 text-center hover:bg-blue-700"><span class="text-2xl block mb-1">📄</span><span class="text-sm font-medium">Invoices</span></button>'+
  '<button onclick="nav(\\'journal\\')" class="bg-indigo-600 text-white rounded-xl p-4 text-center hover:bg-indigo-700"><span class="text-2xl block mb-1">📖</span><span class="text-sm font-medium">Journal</span></button>'+
  '<button onclick="nav(\\'trial-balance\\')" class="bg-teal-600 text-white rounded-xl p-4 text-center hover:bg-teal-700"><span class="text-2xl block mb-1">⚖️</span><span class="text-sm font-medium">Trial Balance</span></button>'+
  '</div></div>';
}

function statCard(t,v,c,icon){return '<div class="bg-white rounded-xl border border-gray-200 p-4"><div class="flex justify-between items-start mb-2"><span class="text-2xl">'+icon+'</span></div><p class="text-xl font-bold text-gray-800">'+v+'</p><p class="text-xs text-gray-500 mt-1">'+t+'</p></div>'}

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
  h+='<div class="bg-white rounded-xl border overflow-x-auto"><table class="w-full text-sm"><thead class="bg-gray-50"><tr><th class="px-3 py-2 text-left text-xs font-semibold">Code</th><th class="px-3 py-2 text-left text-xs font-semibold">Account</th><th class="px-3 py-2 text-right text-xs font-semibold">Debit (RM)</th><th class="px-3 py-2 text-right text-xs font-semibold">Credit (RM)</th></tr></thead><tbody>';
  data.accounts.forEach(a=>{
    h+='<tr class="border-t hover:bg-gray-50"><td class="px-3 py-2 text-xs font-mono">'+a.code+'</td><td class="px-3 py-2 text-sm">'+a.name+'</td>';
    h+='<td class="px-3 py-2 text-right">'+(a.debit>0?fmt(a.debit):'-')+'</td><td class="px-3 py-2 text-right">'+(a.credit>0?fmt(a.credit):'-')+'</td></tr>';
  });
  h+='<tr class="border-t-2 border-gray-800 font-bold bg-gray-50"><td class="px-3 py-3" colspan="2">TOTALS</td>';
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
  h+='<table class="w-full border-collapse mt-6"><thead><tr class="border-b-2 border-black"><th class="py-2 text-left text-xs">Code</th><th class="py-2 text-left text-xs">Account Name</th><th class="py-2 text-right text-xs">Debit (RM)</th><th class="py-2 text-right text-xs">Credit (RM)</th></tr></thead><tbody>';
  data.accounts.forEach(a=>{
    h+='<tr class="border-b"><td class="py-1 text-xs">'+a.code+'</td><td class="py-1 text-xs">'+a.name+'</td>';
    h+='<td class="py-1 text-right text-xs">'+(a.debit>0?a.debit.toFixed(2):'')+'</td><td class="py-1 text-right text-xs">'+(a.credit>0?a.credit.toFixed(2):'')+'</td></tr>';
  });
  h+='<tr class="border-t-2 border-black font-bold"><td class="py-2" colspan="2">TOTAL</td><td class="py-2 text-right">'+data.total_debit.toFixed(2)+'</td><td class="py-2 text-right">'+data.total_credit.toFixed(2)+'</td></tr>';
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

function renderSettings(){
  const c=S.company||{};
  let h='<div class="fade-in space-y-4"><h2 class="text-2xl font-bold">Company Settings</h2>';
  h+='<div class="bg-white rounded-xl border p-6 space-y-4">';
  h+='<h3 class="font-semibold text-gray-700">Company Information (LHDN Compliant)</h3>';
  h+='<div class="grid grid-cols-1 md:grid-cols-2 gap-3">';
  h+=input('Company Name','set-name',c.name);
  h+=input('Registration No. (SSM)','set-reg',c.registration_no);
  h+=input('TIN (Tax Identification No.)','set-tin',c.tin);
  h+=input('BRN/IC','set-brn',c.brn_ic);
  h+=input('MSIC Code','set-msic',c.msic_code);
  h+=input('Phone','set-phone',c.phone);
  h+=input('Email','set-email',c.email);
  h+='<div class="md:col-span-2">'+input('Address','set-addr',c.address)+'</div>';
  h+=input('City','set-city',c.city);
  h+=input('State','set-state',c.state||'Sabah');
  h+=input('Postcode','set-post',c.postcode);
  h+=input('Director Name','set-director',c.director_name);
  h+=input('Accountant Name','set-accountant',c.accountant_name);
  h+='</div>';
  h+='<button onclick="saveSettings()" class="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700">💾 Save Settings</button>';
  h+='</div></div>';
  return h;
}

function input(label,id,val){return '<div><label class="text-xs text-gray-500 mb-1 block">'+label+'</label><input id="'+id+'" value="'+(val||'')+'" class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"></div>'}

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

async function saveSettings(){
  showToast('Settings saved (demo mode)');
}

function showNewInvoice(){S.view='new-invoice';render()}
function showNewJournal(){S.view='new-journal';render()}
async function viewInvoice(id){const inv=await api('/api/invoices/'+id);S.currentInvoice=inv;S.view='view-invoice';render()}

function printTB(){document.getElementById('print-tb').style.display='block';setTimeout(()=>{window.print();document.getElementById('print-tb').style.display='none'},100)}
function printPL(){document.getElementById('print-pl').style.display='block';setTimeout(()=>{window.print();document.getElementById('print-pl').style.display='none'},100)}
function printBS(){document.getElementById('print-bs').style.display='block';setTimeout(()=>{window.print();document.getElementById('print-bs').style.display='none'},100)}

function showToast(msg){const t=document.createElement('div');t.className='fixed bottom-4 right-4 left-4 sm:left-auto sm:w-80 px-4 py-3 bg-green-500 text-white rounded-xl shadow-lg text-sm font-medium z-50 fade-in';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),3000)}

init();
</script>
</body>
</html>`;
}
