# KiraEnterprise v5.6 - Deployment Guide

## ✅ Current Status

**Frontend (Cloudflare Pages):** ✅ Deployed and working
- Build size: 226KB (gzipped: 63KB)
- URL: Your Cloudflare Pages URL

**Backend (Cloudflare Workers):** ✅ Deployed and working
- URL: https://kiraenterprisev5-6.mykira.workers.dev/
- Health check: ✅ Working
- D1 Database: ✅ Bound (mykira)
- R2 Storage: ⏸️ Pending (bucket not created yet)

---

## 🚀 Next Steps for Full Deployment

### 1. Initialize D1 Database Schema

The D1 database `mykira` is bound but needs to be initialized with the schema:

```bash
# Initialize database schema
npx wrangler d1 execute mykira --file=schema.sql

# Or if using remote database:
npx wrangler d1 execute mykira --remote --file=schema.sql
```

### 2. Create Demo Data (Optional)

After schema initialization, create demo data:

```bash
curl -X POST https://kiraenterprisev5-6.mykira.workers.dev/api/setup
```

This will create:
- Demo company: "Sabah Maju Enterprise"
- Demo user: `demo@kiraenterprise.my` / password: `demo`

### 3. Set Environment Secrets

Set required secrets for production:

```bash
# JWT Secret for authentication
npx wrangler secret put JWT_SECRET

# LHDN e-Invoice API credentials (when ready)
npx wrangler secret put LHDN_API_KEY
npx wrangler secret put LHDN_CLIENT_ID
npx wrangler secret put LHDN_CLIENT_SECRET
```

### 4. Enable R2 Document Storage (Optional)

To enable receipt/document uploads:

```bash
# Create R2 bucket
npx wrangler r2 bucket create kiraenterprise-documents

# Update wrangler.toml - uncomment the [[r2_buckets]] section
# Then redeploy:
npx wrangler deploy
```

---

## 📡 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info & available endpoints |
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | User login |
| POST | `/api/setup` | Initialize demo data |

### Protected Endpoints (Require JWT)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST/PUT | `/api/companies` | Company management |
| GET/POST/PUT/DELETE | `/api/invoices` | Invoice CRUD |
| GET/POST | `/api/transactions` | Transaction ledger |
| GET | `/api/einvoice` | e-Invoice data export |
| GET/POST | `/api/documents` | Document metadata |
| GET/PUT | `/api/settings` | Company settings |

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 🧪 Testing the API

### Test Health Check
```bash
curl https://kiraenterprisev5-6.mykira.workers.dev/api/health
```

Expected response:
```json
{
  "status": "ok",
  "app": "KiraEnterprise",
  "version": "5.6"
}
```

### Test Login
```bash
curl -X POST https://kiraenterprisev5-6.mykira.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@kiraenterprise.my","password":"demo"}'
```

Expected response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "demo@kiraenterprise.my",
    "name": "Ahmad Razak",
    "role": "accountant_owner",
    "company_id": "..."
  }
}
```

### Test Protected Endpoint
```bash
# First get token from login
TOKEN="your-jwt-token-here"

# Get companies
curl -H "Authorization: Bearer $TOKEN" \
  https://kiraenterprisev5-6.mykira.workers.dev/api/companies
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Cloudflare Pages                      │
│              (Frontend - React + Vite)                   │
│         URL: Your Pages URL                             │
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
│  mykira         │  │  (pending)      │
│  ID: 4037f2cd.. │  │                 │
└─────────────────┘  └─────────────────┘
```

---

## 🔐 Security Features

- ✅ JWT-based authentication
- ✅ Company-level data isolation (multi-tenancy)
- ✅ Role-Based Access Control (RBAC)
- ✅ Prepared statements (SQL injection prevention)
- ✅ CORS headers configured
- ⏸️ R2 encryption (enabled when bucket created)
- ⏸️ Rate limiting (not yet implemented)

---

## 📊 Database Schema

The D1 database includes 10 tables:

1. **companies** - Tenant companies
2. **users** - User accounts
3. **user_company_access** - Multi-company access for accountants
4. **invoices** - Invoice headers
5. **invoice_line_items** - Invoice line items
6. **transactions** - Double-entry transactions
7. **chart_of_accounts** - Account codes
8. **documents** - Document metadata (R2 references)
9. **audit_log** - Audit trail
10. **company_settings** - Per-company configuration

See `schema.sql` for complete DDL with indexes.

---

## 🎯 Features Implemented

### Frontend
- ✅ Login screen with compliance disclaimer
- ✅ Dashboard with real-time stats
- ✅ Invoice builder with dynamic line items
- ✅ Invoice preview with print/PDF
- ✅ WhatsApp sharing
- ✅ e-Invoice module (LHDN-compliant)
- ✅ Transaction ledger (double-entry)
- ✅ Settings (company, tax, users, security)
- ✅ Multi-client switcher
- ✅ Mobile-first responsive design

### Backend
- ✅ REST API with JWT auth
- ✅ Multi-tenant company isolation
- ✅ Invoice CRUD with prepared statements
- ✅ Transaction recording
- ✅ e-Invoice data generation
- ✅ Document metadata storage
- ✅ Company settings management
- ✅ Audit logging

---

## 🐛 Troubleshooting

### Database Not Initialized
**Error:** `no such table: companies`

**Solution:**
```bash
npx wrangler d1 execute mykira --remote --file=schema.sql
```

### R2 Bucket Not Found
**Error:** `R2 bucket 'kiraenterprise-documents' not found`

**Solution:**
```bash
npx wrangler r2 bucket create kiraenterprise-documents
# Then uncomment R2 binding in wrangler.toml and redeploy
```

### Unauthorized Error
**Error:** `{"error":"Unauthorized"}`

**Solution:** Ensure you're sending a valid JWT token in the Authorization header.

---

## 📝 Notes

- The frontend is fully functional with demo data (no backend required for demo)
- The backend API is ready but requires database initialization
- R2 document storage is optional and can be enabled later
- All tax rates, SST rules, and e-Invoice categories are configurable per company
- The app includes a clear compliance disclaimer about LHDN requirements

---

## 📞 Support

For issues or questions:
1. Check the API health: `GET /api/health`
2. Review Cloudflare Worker logs in dashboard
3. Verify D1 database is initialized
4. Check wrangler.toml configuration

---

**Built with:** React + Vite + Tailwind CSS + Cloudflare Workers + D1 + R2
**Version:** 5.6
**Region:** Sabah, Malaysia
**Last Updated:** 2026-09-21
