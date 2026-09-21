# KiraEnterprise v5.6

**Multi-tenant Cloud Accounting & e-Invoice Platform for Malaysian Businesses**

🌐 **Live API:** https://kiraenterprisev5-6.mykira.workers.dev/  
📍 **Region:** Sabah, Malaysia  
🗄️ **Database:** Cloudflare D1 (mykira)

---

## 🎯 Overview

KiraEnterprise is a production-ready, mobile-first cloud accounting application designed for Malaysian small enterprises, micro-businesses, freelancers, and professional accountants. Built with modern web technologies and deployed on Cloudflare's edge network for ultra-fast performance.

### Key Features

- ✅ **Multi-tenant Architecture** - Strict company-level data isolation
- ✅ **Role-Based Access Control** - 6 user roles (platform_admin → viewer)
- ✅ **Dynamic Invoice Builder** - Real-time MYR calculations, dynamic line items
- ✅ **e-Invoice Compliance** - LHDN-compliant data generation
- ✅ **Double-Entry Accounting** - Transaction ledger with chart of accounts
- ✅ **Mobile-First Design** - Touch-friendly, responsive UI
- ✅ **Print & PDF** - Browser native print optimization
- ✅ **WhatsApp Integration** - One-click invoice sharing
- ✅ **Multi-Client Support** - Accountants can manage multiple companies
- ✅ **Configurable Tax/SST** - Per-company tax rates and SST rules

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Cloudflare Pages                      │
│              (Frontend - React + Vite)                   │
│         Build: 231KB / 64KB gzipped                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ HTTPS API Calls
                 │
┌────────────────▼────────────────────────────────────────┐
│              Cloudflare Workers                          │
│         (Backend API - TypeScript)                       │
│    URL: kiraenterprisev5-6.mykira.workers.dev           │
└────────┬──────────────────┬─────────────────────────────┘
         │                  │
         │                  │
┌────────▼────────┐  ┌──────▼──────────┐
│  Cloudflare D1  │  │  Cloudflare R2  │
│   (Database)    │  │   (Storage)     │
│  Database:      │  │  Bucket:        │
│  mykira         │  │  (optional)     │
│  ID: 4037f2cd.. │  │                 │
└─────────────────┘  └─────────────────┘
```

---

## 📁 Project Structure

```
kiraenterprise/
├── src/                          # Frontend (React + Vite + Tailwind)
│   ├── components/
│   │   ├── Login.tsx            # Login with API/Demo mode toggle
│   │   ├── Layout.tsx           # Main layout with sidebar
│   │   ├── Dashboard.tsx        # Dashboard with real-time stats
│   │   ├── InvoiceBuilder.tsx   # Invoice CRUD + Print + WhatsApp
│   │   ├── EInvoiceModule.tsx   # LHDN e-Invoice module
│   │   ├── TransactionLedger.tsx # Double-entry transactions
│   │   └── Settings.tsx         # Company/tax/user settings
│   ├── context/
│   │   └── AppContext.tsx       # State management
│   ├── services/
│   │   └── api.ts               # API service layer
│   ├── types.ts                 # TypeScript types
│   ├── App.tsx                  # Main app component
│   ├── main.tsx                 # Entry point
│   └── index.css                # Tailwind styles
│
├── worker/                       # Backend (Cloudflare Workers)
│   └── src/
│       └── index.ts             # API endpoints (726 lines)
│
├── schema.sql                    # D1 database schema (10 tables)
├── wrangler.toml                 # Worker configuration
├── package.json                  # Dependencies
└── README.md                     # This file
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account (for deployment)

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd kiraenterprise

# Install dependencies
npm install
```

### Development

```bash
# Start frontend dev server
npm run dev

# Frontend runs at: http://localhost:5173
```

### Build

```bash
# Build for production
npm run build

# Output: dist/ (231KB / 64KB gzipped)
```

---

## 🗄️ Database Setup

The D1 database `mykira` is already configured with data. If you need to reset or initialize:

```bash
# Initialize schema (creates 10 tables + indexes)
npx wrangler d1 execute mykira --remote --file=schema.sql

# Create demo data
curl -X POST https://kiraenterprisev5-6.mykira.workers.dev/api/setup
```

### Database Schema

- **companies** - Tenant companies
- **users** - User accounts
- **user_company_access** - Multi-company access
- **invoices** - Invoice headers
- **invoice_line_items** - Invoice line items
- **transactions** - Double-entry transactions
- **chart_of_accounts** - Account codes
- **documents** - Document metadata
- **audit_log** - Audit trail
- **company_settings** - Per-company configuration

---

## 🔌 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info & endpoints |
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | User login |
| POST | `/api/setup` | Initialize demo data |

### Protected Endpoints (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST/PUT | `/api/companies` | Company management |
| GET/POST/PUT/DELETE | `/api/invoices` | Invoice CRUD |
| GET/POST | `/api/transactions` | Transaction ledger |
| GET | `/api/einvoice` | e-Invoice data export |
| GET/POST | `/api/documents` | Document metadata |
| GET/PUT | `/api/settings` | Company settings |

### Authentication

All protected endpoints require JWT token:

```
Authorization: Bearer <your-jwt-token>
```

### Example API Calls

```bash
# Health check
curl https://kiraenterprisev5-6.mykira.workers.dev/api/health

# Login
curl -X POST https://kiraenterprisev5-6.mykira.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@kiraenterprise.my","password":"demo"}'

# Get companies (with token)
TOKEN="your-jwt-token"
curl -H "Authorization: Bearer $TOKEN" \
  https://kiraenterprisev5-6.mykira.workers.dev/api/companies
```

---

## 🌐 Deployment

### Frontend (Cloudflare Pages)

The frontend is automatically deployed via Cloudflare Pages when you push to GitHub.

**Build Settings:**
- Build command: `npm run build`
- Output directory: `dist`
- Node version: 18+

### Backend (Cloudflare Workers)

The backend is automatically deployed via Cloudflare Workers Builds.

**Configuration:**
- Worker name: `kiraenterprisev5-6`
- Entry point: `worker/src/index.ts`
- Database: `mykira` (D1)

### Manual Deployment

```bash
# Deploy worker
npx wrangler deploy

# Deploy frontend (if not using Pages)
npm run build
# Upload dist/ to Cloudflare Pages
```

---

## 🔐 Security Features

- ✅ JWT-based authentication
- ✅ Company-level data isolation (multi-tenancy)
- ✅ Role-Based Access Control (RBAC)
- ✅ Prepared statements (SQL injection prevention)
- ✅ CORS headers configured
- ✅ Audit logging
- ⏸️ Rate limiting (not yet implemented)

---

## 🇲🇾 Malaysian Compliance

### Tax & SST Configuration

- **Corporate Tax:** 24% (standard), 17% (SME first RM600k)
- **Service Tax:** 6% or 8%
- **Sales Tax:** 5% or 10%
- **All rates configurable per company**

### e-Invoice (LHDN)

- ✅ LHDN-compliant data generation
- ✅ Consolidated e-Invoice support
- ✅ Category codes (01001, 02001, etc.)
- ✅ JSON export for LHDN submission
- ⏸️ Direct LHDN API submission (requires credentials)

### Disclaimer

⚠️ **Important:** KiraEnterprise helps organize and prepare data for tax/e-Invoice purposes. It does not automatically guarantee full legal compliance with LHDN/IRBM regulations. Final review must be performed by a qualified accountant or registered tax agent.

---

## 👥 User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `platform_admin` | System-wide manager | Full access |
| `accountant_owner` | Professional accountant | Manage multiple clients |
| `accountant_staff` | Accounting firm staff | Assigned clients only |
| `client_owner` | Business owner | Own company + staff |
| `client_staff` | Employee | Issue invoices, upload receipts |
| `viewer` | Auditor | Read-only access |

---

## 📱 Mobile-First Features

- Touch-friendly buttons and controls
- Responsive tables that work on phones
- Collapsible sidebar navigation
- Optimized for small screens
- Fast load times (64KB gzipped)
- Offline-capable demo mode

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS 4** - Styling
- **Lucide React** - Icons
- **UUID** - Unique IDs

### Backend
- **Cloudflare Workers** - Serverless platform
- **TypeScript** - Type safety
- **Cloudflare D1** - SQLite database
- **JWT** - Authentication
- **Prepared Statements** - SQL security

### Infrastructure
- **Cloudflare Pages** - Frontend hosting
- **Cloudflare Workers** - Backend API
- **Cloudflare D1** - Database
- **Cloudflare R2** - Document storage (optional)

---

## 🧪 Testing

### Frontend Demo Mode

The frontend works in demo mode with local data - no backend required:

1. Open the app
2. Login with any email/password
3. Toggle "Demo Mode" on login screen
4. Explore all features with sample data

### API Testing

```bash
# Test health endpoint
curl https://kiraenterprisev5-6.mykira.workers.dev/api/health

# Test login
curl -X POST https://kiraenterprisev5-6.mykira.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@kiraenterprise.my","password":"demo"}'
```

---

## 📊 Features Breakdown

### Invoice Management
- Dynamic line items (add/remove rows)
- Real-time MYR calculations
- SST/tax computation
- Customer TIN support
- Print/PDF via browser native print
- WhatsApp one-click sharing

### Transaction Ledger
- Double-entry bookkeeping
- Income/expense tracking
- Chart of accounts
- Date/category filtering
- Search functionality

### e-Invoice Module
- LHDN-compliant categories
- Consolidated e-Invoice support
- JSON export for LHDN
- Status tracking (ready/submitted)

### Settings
- Company information
- Tax rates (configurable)
- SST rates (configurable)
- Financial year-end
- User management
- Security settings

---

## 🐛 Troubleshooting

### Database Not Initialized
**Error:** `no such table: companies`  
**Solution:** `npx wrangler d1 execute mykira --remote --file=schema.sql`

### Unauthorized Error
**Error:** `{"error":"Unauthorized"}`  
**Solution:** Login first, then include JWT token in Authorization header

### Frontend Not Connecting to Backend
**Note:** Frontend works in demo mode by default. Toggle "API Mode" on login screen to connect to backend.

### R2 Bucket Not Found
**Error:** `R2 bucket 'kiraenterprise-documents' not found`  
**Solution:** Create bucket: `npx wrangler r2 bucket create kiraenterprise-documents`

---

## 📝 Environment Variables

### Required Secrets (set via wrangler)

```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put LHDN_API_KEY
npx wrangler secret put LHDN_CLIENT_ID
npx wrangler secret put LHDN_CLIENT_SECRET
```

### Environment Variables (in wrangler.toml)

```toml
[vars]
APP_NAME = "KiraEnterprise"
APP_VERSION = "5.6"
ENVIRONMENT = "production"
REGION = "MY-SABAH"
```

---

## 📞 Support & Documentation

- **API Documentation:** https://kiraenterprisev5-6.mykira.workers.dev/
- **Deployment Guide:** See `DEPLOYMENT.md`
- **Verification Report:** See `VERIFICATION.md`
- **Status Report:** See `STATUS.md`

---

## 📄 License

This project is proprietary software.

---

## 🎉 Credits

**Built with:**
- React + Vite + Tailwind CSS
- Cloudflare Workers + D1 + R2
- TypeScript
- Lucide Icons

**Designed for:**
- Malaysian small businesses
- Freelancers in Sabah
- Professional accountants
- Tax agents

---

## 📈 Version History

### v5.6 (Current)
- ✅ Multi-tenant architecture
- ✅ e-Invoice module (LHDN-compliant)
- ✅ Mobile-first design
- ✅ WhatsApp integration
- ✅ Print/PDF optimization
- ✅ Double-entry accounting
- ✅ Role-based access control
- ✅ API service layer
- ✅ Demo mode for frontend

---

**Version:** 5.6  
**Region:** Sabah, Malaysia  
**Last Updated:** 2026-09-21  
**Status:** ✅ Production Ready
