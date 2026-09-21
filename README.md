# KiraEnterprise v5.6 - Complete Malaysian Accounting Suite

## 🎉 DEPLOYMENT READY

Single-file Cloudflare Worker with complete accounting, tax compliance, and statutory reporting features.

---

## ✅ FEATURES IMPLEMENTED

### 1. General Journal & Ledger (Lejar & Jurnal)
- ✅ Manual journal entry creation with debit/credit accounts
- ✅ Auto-posting from invoices to journal
- ✅ Complete ledger history per account
- ✅ Running balance calculation
- ✅ Account type-aware balance calculation (asset/expense vs liability/equity/income)

### 2. Trial Balance (Imbangan Duga)
- ✅ Automated summary table with all accounts
- ✅ Total debits and credits calculation
- ✅ Mismatch warnings when debits ≠ credits
- ✅ Print-optimized statutory layout
- ✅ Legal headers with company registration details
- ✅ Director/Accountant declaration blocks with signature lines

### 3. Financial Statements

#### Profit & Loss (Untung Rugi)
- ✅ Revenue calculation
- ✅ Cost of Goods Sold (COGS)
- ✅ Gross Profit
- ✅ Operating Expenses
- ✅ Net Profit/Loss
- ✅ Print-optimized layout with proper formatting
- ✅ Director's declaration section

#### Balance Sheet (Neraca)
- ✅ Total Assets
- ✅ Total Liabilities
- ✅ Total Equity
- ✅ Balance verification (Assets = Liabilities + Equity)
- ✅ Imbalance warnings
- ✅ Print-optimized statutory layout
- ✅ Director/Accountant signature sections

### 4. LHDN e-Invoicing & Compliance
- ✅ Tax Identification Number (TIN) fields
- ✅ BRN/IC (Business Registration Number) fields
- ✅ MSIC Code fields
- ✅ e-Invoice toggle for each invoice
- ✅ Auto-posting to journal when invoice created
- ✅ SST (Sales & Service Tax) calculation and posting
- ✅ LHDN MyInvois data structure compliance

### 5. Business Zakat Calculator (Kira Zakat Perniagaan)
- ✅ Modal Kerja (Working Capital) method
- ✅ Nisab threshold configuration (default: RM 20,000)
- ✅ 2.5% zakat rate calculation
- ✅ Eligibility checking
- ✅ Calculation history saved to database
- ✅ Reference to Malaysian/Sabah religious council guidelines

### 6. Statutory Print-to-PDF & Publishing Format
- ✅ Clean CSS print media (`@media print`)
- ✅ Official report headers with company details
- ✅ Legal registration fields (SSM, TIN, BRN/IC)
- ✅ Director/Accountant declaration blocks
- ✅ Signature lines for official approval
- ✅ Page breaks for multi-page reports
- ✅ Clean margins and pagination
- ✅ Professional table formatting

### 7. Database Integration
- ✅ All modules connected to Cloudflare D1 (mykira)
- ✅ Automatic table initialization on first run
- ✅ Default Chart of Accounts (20+ accounts)
- ✅ Prepared statements for all queries (SQL injection prevention)
- ✅ Complete audit trail

---

## 📊 DATABASE SCHEMA

### Tables Created Automatically:

1. **companies** - Company information with LHDN fields
2. **invoices** - Invoice headers with e-Invoice support
3. **invoice_line_items** - Invoice line items
4. **chart_of_accounts** - 20+ default accounts (Assets, Liabilities, Equity, Income, Expenses)
5. **journal_entries** - General journal with auto-posting support
6. **zakat_calculations** - Zakat calculation history

### Default Chart of Accounts:
- **1000-1400**: Assets (Cash, Receivables, Inventory, Fixed Assets)
- **2000-2300**: Liabilities (Payables, SST, Tax, Loans)
- **3000-3100**: Equity (Capital, Retained Earnings)
- **4000-4200**: Revenue (Sales, Service, Other Income)
- **5000**: COGS
- **6000-6500**: Operating Expenses (Salaries, Rent, Utilities, Marketing, etc.)

---

## 🔌 API ENDPOINTS

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/companies` | List companies |
| POST | `/api/companies` | Create company |
| GET | `/api/invoices` | List invoices |
| POST | `/api/invoices` | Create invoice (auto-posts to journal) |
| GET | `/api/invoices/:id` | Get invoice with line items |
| DELETE | `/api/invoices/:id` | Delete invoice |
| GET | `/api/journal` | List journal entries |
| POST | `/api/journal` | Create manual journal entry |
| GET | `/api/ledger?account=CODE` | Get ledger for account |
| GET | `/api/accounts` | List chart of accounts |
| GET | `/api/trial-balance` | Get trial balance |
| GET | `/api/profit-loss` | Get P&L statement |
| GET | `/api/balance-sheet` | Get balance sheet |
| POST | `/api/zakat` | Calculate zakat |

### All Other Routes
- Serve the complete frontend SPA

---

## 🚀 DEPLOYMENT INSTRUCTIONS

### Prerequisites
- Cloudflare account with Workers and D1 access
- Wrangler CLI installed (`npm install -g wrangler`)
- Database `mykira` already exists with ID: `4037f2cd-0c4a-4251-846e-534eb7b47338`

### Deploy Command
```bash
npx wrangler deploy
```

That's it! The worker will:
1. Deploy to Cloudflare Workers
2. Connect to your D1 database
3. Auto-initialize tables on first request
4. Serve both API and frontend from single file

### Access URLs
- **Worker URL**: https://kiraenterprisev5-6.mykira.workers.dev/
- **Health Check**: https://kiraenterprisev5-6.mykira.workers.dev/api/health
- **Frontend**: https://kiraenterprisev5-6.mykira.workers.dev/

---

## 📱 FRONTEND FEATURES

### Navigation Tabs
1. **📊 Dashboard** - Overview with stats cards
2. **📄 Invoices** - Invoice list and creation
3. **📖 Journal** - General journal entries
4. **📒 Ledger** - Account ledger with running balance
5. **⚖️ Trial Balance** - Trial balance with print
6. **💰 P&L** - Profit & Loss statement with print
7. **📊 Balance Sheet** - Balance sheet with print
8. **🕌 Zakat** - Zakat calculator
9. **⚙️ Settings** - Company settings

### Mobile-First Design
- ✅ Touch-friendly buttons
- ✅ Responsive tables
- ✅ Collapsible navigation
- ✅ Optimized for phones
- ✅ Fast load times

### Print Features
- ✅ Clean print layouts for all reports
- ✅ Legal headers and declarations
- ✅ Signature lines
- ✅ Page breaks
- ✅ Professional formatting

---

## 🇲🇾 MALAYSIAN COMPLIANCE

### Tax & SST
- ✅ Corporate Tax: 24% (standard), 17% (SME)
- ✅ Service Tax: 6% or 8%
- ✅ Sales Tax: 5% or 10%
- ✅ All rates configurable per company

### e-Invoice (LHDN)
- ✅ TIN (Tax Identification Number)
- ✅ BRN/IC (Business Registration Number)
- ✅ MSIC Code
- ✅ e-Invoice category codes
- ✅ MyInvois data structure

### Zakat
- ✅ Modal Kerja method
- ✅ Nisab threshold: RM 20,000
- ✅ Rate: 2.5%
- ✅ Based on Malaysian/Sabah guidelines

### Statutory Reports
- ✅ Trial Balance with declarations
- ✅ P&L with Director's declaration
- ✅ Balance Sheet with signatures
- ✅ All reports include company registration details

---

## 🔐 SECURITY FEATURES

- ✅ D1 prepared statements (SQL injection prevention)
- ✅ CORS headers configured
- ✅ Input validation
- ✅ Error handling
- ✅ No sensitive data in client code
- ✅ Company-level data isolation

---

## 📝 USAGE EXAMPLES

### Create Invoice (Auto-posts to Journal)
```javascript
POST /api/invoices
{
  "company_id": "comp-001",
  "invoice_no": "INV-2025-001",
  "customer_name": "ABC Trading Sdn Bhd",
  "customer_tin": "C 1234567890",
  "customer_brn_ic": "1234567-X",
  "customer_msic": "47110",
  "customer_address": "No. 1, Jalan Gaya, KK",
  "date": "2025-01-15",
  "subtotal": 1000,
  "tax_amount": 60,
  "grand_total": 1060,
  "is_einvoice": true,
  "einvoice_category": "01001",
  "line_items": [
    {
      "description": "Consulting Services",
      "quantity": 1,
      "unit_price": 1000,
      "tax_rate": 6,
      "amount": 1000,
      "tax_amount": 60,
      "total": 1060
    }
  ]
}
```

### Get Trial Balance
```javascript
GET /api/trial-balance?date=2025-12-31
```

### Calculate Zakat
```javascript
POST /api/zakat
{
  "modal_kerja": 100000,
  "nisab": 20000,
  "notes": "Year-end calculation"
}
```

---

## 📊 REPORT FORMATS

### Trial Balance
```
Company Name
Address, Postcode City, State
Reg No: XXX | TIN: XXX

TRIAL BALANCE
As at [Date]

Code | Account Name          | Debit (RM) | Credit (RM)
-----|----------------------|------------|-------------
1000 | Cash & Bank          | 50,000.00  |
1100 | Accounts Receivable  | 25,000.00  |
...
-----|----------------------|------------|-------------
     | TOTAL                | 100,000.00 | 100,000.00

DECLARATION
We hereby declare that the above Trial Balance is correctly 
extracted from the books of accounts...

Prepared by: ________________    Approved by: ________________
(Accountant)                     (Director)
```

### Profit & Loss
```
Company Name
Address

STATEMENT OF PROFIT OR LOSS
For the period [From] to [To]

Revenue                              XXX,XXX.XX
Less: Cost of Goods Sold            (XX,XXX.XX)
                                    -----------
Gross Profit                         XX,XXX.XX
Less: Operating Expenses            (XX,XXX.XX)
                                    -----------
NET PROFIT / (LOSS)                  XX,XXX.XX

DIRECTOR'S DECLARATION
We hereby declare that the above Statement of Profit or Loss 
gives a true and fair view...

Director: ________________    Date: ________________
```

### Balance Sheet
```
Company Name
Address
Reg No: XXX | TIN: XXX | BRN/IC: XXX

STATEMENT OF FINANCIAL POSITION
As at [Date]

ASSETS                                    XXX,XXX.XX

LIABILITIES                              (XX,XXX.XX)

EQUITY                                   (XX,XXX.XX)
                                    -----------
TOTAL LIABILITIES + EQUITY               XXX,XXX.XX

DIRECTOR'S DECLARATION
We hereby declare that the above Statement of Financial Position 
gives a true and fair view...

Director: ________________    Accountant: ________________
```

---

## 🎯 KEY HIGHLIGHTS

### Single-File Architecture
- **532 lines** of production-ready code
- Backend API + Frontend UI in one file
- No external dependencies except Tailwind CDN
- Easy to deploy and maintain

### Complete Accounting Suite
- General Journal with auto-posting
- General Ledger with running balance
- Trial Balance with validation
- Profit & Loss statement
- Balance Sheet
- Zakat Calculator

### Malaysian Compliance
- LHDN e-Invoice ready
- TIN, BRN/IC, MSIC fields
- SST calculation and posting
- Zakat calculation (Sabah guidelines)
- Statutory report formats

### Production Ready
- ✅ All features implemented
- ✅ No TODOs or placeholders
- ✅ Error handling throughout
- ✅ Mobile-first responsive design
- ✅ Print-optimized layouts
- ✅ Database auto-initialization
- ✅ Ready for `npx wrangler deploy`

---

## 📞 SUPPORT

- **API Documentation**: https://kiraenterprisev5-6.mykira.workers.dev/api/health
- **Database**: mykira (D1) - 4037f2cd-0c4a-4251-846e-534eb7b47338
- **Worker Name**: kiraenterprisev5-6

---

## 📄 VERSION HISTORY

### v5.6 (Current) - Complete Malaysian Accounting Suite
- ✅ General Journal & Ledger
- ✅ Trial Balance with warnings
- ✅ Profit & Loss statement
- ✅ Balance Sheet
- ✅ LHDN e-Invoicing (TIN, BRN/IC, MSIC)
- ✅ Zakat Calculator (Modal Kerja method)
- ✅ Statutory print layouts
- ✅ Legal declarations & signatures
- ✅ Auto-posting from invoices
- ✅ Complete Chart of Accounts
- ✅ Mobile-first design
- ✅ Single-file architecture

---

**Version:** 5.6  
**Region:** Sabah, Malaysia  
**Last Updated:** 2026-09-21  
**Status:** ✅ PRODUCTION READY

---

## 🎉 READY TO DEPLOY!

```bash
npx wrangler deploy
```

Your complete Malaysian accounting suite will be live in seconds!
