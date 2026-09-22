#!/usr/bin/env python3
"""
KiraEnterprise v5.6 - Comprehensive D1 Seed Data
Memasukkan data enterprise yang lengkap: companies, invoices, journal entries,
transactions, supaya Trial Balance, P&L, Balance Sheet semua balance.
"""

import subprocess
import json
import time

TOKEN = ""  # Set via environment variable CLOUDFLARE_API_TOKEN
ACCOUNT_ID = "2c48feaf73f0023e94ead812fcb5f01e"
DB_ID = "3a8ae3cc-0746-47c5-8a79-d77e695ccc16"

def d1_query(sql: str) -> dict:
    url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{DB_ID}/query"
    r = subprocess.run(
        ["curl", "-s", "-X", "POST", url,
         "-H", f"Authorization: Bearer {TOKEN}",
         "-H", "Content-Type: application/json",
         "-d", json.dumps({"sql": sql})],
        capture_output=True, text=True, timeout=30
    )
    return json.loads(r.stdout)

def d1_exec(sql: str) -> dict:
    """Execute non-query (INSERT/UPDATE/DELETE)"""
    url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{DB_ID}/query"
    r = subprocess.run(
        ["curl", "-s", "-X", "POST", url,
         "-H", f"Authorization: Bearer {TOKEN}",
         "-H", "Content-Type: application/json",
         "-d", json.dumps({"sql": sql})],
        capture_output=True, text=True, timeout=30
    )
    return json.loads(r.stdout)

def uuid():
    import uuid as _u
    return str(_u.uuid4())

print("=" * 60)
print("KiraEnterprise v5.6 - Enterprise Data Seed")
print("=" * 60)

# ============================================
# 1. COMPANIES (3 companies)
# ============================================
print("\n[1/8] Memasukkan companies...")

companies = [
    {
        "id": "cmp-001",
        "name": "Syarikat Ladang Sawit Berhad",
        "registration_no": "201801012345",
        "tin": "C1234567890",
        "brn_ic": "1234567890",
        "msic_code": "01111",
        "address": "Lot 123, Block A, Kawasan Perindustrian",
        "city": "Lahad Datu",
        "state": "Sabah",
        "postcode": "97500",
        "phone": "08-6761234",
        "email": "admin@sawit.com.my",
        "financial_year_end": "2025-12-31",
        "tax_rate": 24.0,
        "sst_rate": 6.0,
        "director_name": "Tuan Haji Abdullah",
        "accountant_name": "Azman bin Hassan",
        "is_active": 1
    },
    {
        "id": "cmp-002",
        "name": "Toko elektriken KITA ENTERPRISE",
        "registration_no": "201906153456",
        "tin": "C9876543210",
        "brn_ic": "9876543210",
        "msic_code": "47911",
        "address": "No 45, Jalan Orient, Taman Indah",
        "city": "Kota Kinabalu",
        "state": "Sabah",
        "postcode": "88000",
        "phone": "08-2223333",
        "email": "contact@kitaenterprise.com",
        "financial_year_end": "2025-12-31",
        "tax_rate": 24.0,
        "sst_rate": 6.0,
        "director_name": "Datin Lim Wei Ling",
        "accountant_name": "Ahmad Razak",
        "is_active": 1
    },
    {
        "id": "cmp-003",
        "name": "Boutique Hotel Sunset Inn",
        "registration_no": "202003207890",
        "tin": "C5556667778",
        "brn_ic": "5556667778",
        "msic_code": "77111",
        "address": "Jalan Pantai, Kampung Ayer",
        "city": "Kota Kinabalu",
        "state": "Sabah",
        "postcode": "88000",
        "phone": "08-3334444",
        "email": "reservation@sunsetinn.com.my",
        "financial_year_end": "2025-12-31",
        "tax_rate": 24.0,
        "sst_rate": 6.0,
        "director_name": "Pn. Noraini",
        "accountant_name": "Azman bin Hassan",
        "is_active": 1
    }
]

for c in companies:
    sql = f"""INSERT INTO companies VALUES (
        '{c['id']}', '{c['name']}', '{c['registration_no']}', '{c['tin']}',
        '{c['brn_ic']}', '{c['msic_code']}', '{c['address']}', '{c['city']}',
        '{c['state']}', '{c['postcode']}', '{c['phone']}', '{c['email']}',
        '{c['financial_year_end']}', {c['tax_rate']}, {c['sst_rate']},
        '{c['director_name']}', '{c['accountant_name']}', {c['is_active']}
    )"""
    r = d1_exec(sql)
    if r.get("success"):
        print(f"  ✅ {c['name']}")
    else:
        print(f"  ❌ {c['name']}: {r}")

# ============================================
# 2. INVOICES (15 invoices - various statuses)
# ============================================
print("\n[2/8] Memasukkan invoices...")

invoices = [
    # === SYARIKAT LADANG SAWIT (cmp-001) ===
    {
        "id": "inv-001", "company_id": "cmp-001",
        "invoice_no": "SLB/INV/2025/001", "customer_name": "Koperasi Petani Teknologi",
        "customer_tin": "C1112223334", "customer_brn_ic": "1112223334", "customer_msic": "01122",
        "customer_address": "Km 15, Jalan Desa",
        "customer_email": "ktp@koperasi.com", "customer_phone": "08-1112222",
        "date": "2025-01-15", "due_date": "2025-02-14",
        "subtotal": 150000, "tax_amount": 9000, "discount": 0, "grand_total": 159000,
        "status": "paid", "notes": "Penjualan hasil durian raya",
        "is_einvoice": 1, "einvoice_category": "01001", "revenue_account": "4010",
        "created_by": "system", "created_at": "2025-01-15T09:00:00", "updated_at": "2025-02-10T14:00:00",
        "line_items": [
            {"description": "Durian Raya Grade A", "quantity": 500, "unit_price": 200, "tax_rate": 6, "amount": 100000, "tax_amount": 6000, "total": 106000, "account_code": "4010", "sort_order": 1},
            {"description": "Durian Rambutan Premium", "quantity": 200, "unit_price": 250, "tax_rate": 6, "amount": 50000, "tax_amount": 3000, "total": 53000, "account_code": "4010", "sort_order": 2},
            {"description": "Ontong Corte (Logam)", "quantity": 50, "unit_price": 30, "tax_rate": 6, "amount": 1500, "tax_amount": 90, "total": 1590, "account_code": "4010", "sort_order": 3},
        ]
    },
    {
        "id": "inv-002", "company_id": "cmp-001",
        "invoice_no": "SLB/INV/2025/002", "customer_name": "UD Trucking Sdn Bhd",
        "customer_tin": "C2223334445", "customer_brn_ic": "2223334445", "customer_msic": "49411",
        "customer_address": "Persiaran Industri",
        "customer_email": "billing@udtrucking.com", "customer_phone": "08-4445555",
        "date": "2025-02-01", "due_date": "2025-02-28",
        "subtotal": 85000, "tax_amount": 5100, "discount": 0, "grand_total": 90100,
        "status": "paid", "notes": "Komputer & peranti RHS",
        "is_einvoice": 1, "einvoice_category": "01001", "revenue_account": "4010",
        "created_by": "system", "created_at": "2025-02-01T10:00:00", "updated_at": "2025-02-25T16:00:00",
        "line_items": [
            {"description": "Unit Laptop Business", "quantity": 20, "unit_price": 3500, "tax_rate": 6, "amount": 70000, "tax_amount": 4200, "total": 74200, "account_code": "4010", "sort_order": 1},
            {"description": "Printer LaserJet", "quantity": 10, "unit_price": 1500, "tax_rate": 6, "amount": 15000, "tax_amount": 900, "total": 15900, "account_code": "4010", "sort_order": 2},
        ]
    },
    {
        "id": "inv-003", "company_id": "cmp-001",
        "invoice_no": "SLB/INV/2025/003", "customer_name": "Min Woh Hardware",
        "customer_tin": "C3334445556", "customer_brn_ic": "3334445556", "customer_msic": "40411",
        "customer_address": "Jalan Besar",
        "customer_email": "orders@minwoh.com.my", "customer_phone": "08-5556666",
        "date": "2025-03-10", "due_date": "2025-04-09",
        "subtotal": 200000, "tax_amount": 12000, "discount": 5000, "grand_total": 207000,
        "status": "paid", "notes": "Baja & logam pembinaan",
        "is_einvoice": 1, "einvoice_category": "01001", "revenue_account": "4020",
        "created_by": "system", "created_at": "2025-03-10T11:00:00", "updated_at": "2025-04-05T09:00:00",
        "line_items": [
            {"description": "Baja Shin Beton (Ton)", "quantity": 40, "unit_price": 3500, "tax_rate": 6, "amount": 140000, "tax_amount": 8400, "total": 148400, "account_code": "4020", "sort_order": 1},
            {"description": "Besi Beton 16mm", "quantity": 50, "unit_price": 900, "tax_rate": 6, "amount": 45000, "tax_amount": 2700, "total": 47700, "account_code": "4020", "sort_order": 2},
            {"description": "Disc. Pembelian awal", "quantity": 1, "unit_price": -5000, "tax_rate": 0, "amount": -5000, "tax_amount": 0, "total": -5000, "account_code": "4020", "sort_order": 3},
        ]
    },
    {
        "id": "inv-004", "company_id": "cmp-001",
        "invoice_no": "SLB/INV/2025/004", "customer_name": "Konsesi Pantai Resort",
        "customer_tin": "C4445556667", "customer_brn_ic": "4445556667", "customer_msic": "77111",
        "customer_address": "Kawasan Pantai",
        "customer_email": "procurement@pantai-resort.com", "customer_phone": "08-6667777",
        "date": "2025-04-01", "due_date": "2025-04-30",
        "subtotal": 350000, "tax_amount": 21000, "discount": 0, "grand_total": 371000,
        "status": "sent", "notes": "Cosmetics for hotel guests",
        "is_einvoice": 1, "einvoice_category": "01001", "revenue_account": "4100",
        "created_by": "system", "created_at": "2025-04-01T14:00:00", "updated_at": "2025-04-01T14:00:00",
        "line_items": [
            {"description": "Lini Kosmetik Premium", "quantity": 500, "unit_price": 700, "tax_rate": 6, "amount": 350000, "tax_amount": 21000, "total": 371000, "account_code": "4100", "sort_order": 1},
        ]
    },
    {
        "id": "inv-005", "company_id": "cmp-001",
        "invoice_no": "SLB/INV/2025/005", "customer_name": "Kedai Runcit 24 Jam",
        "customer_tin": "C5556667778", "customer_brn_ic": "5556667778", "customer_msic": "52200",
        "customer_address": "Di sebalik hypermarket",
        "customer_email": "supplier@kedairuncing.com", "customer_phone": "08-7778888",
        "date": "2025-05-15", "due_date": "2025-06-14",
        "subtotal": 250000, "tax_amount": 15000, "discount": 0, "grand_total": 265000,
        "status": "sent", "notes": "Logistik makanan & minuman",
        "is_einvoice": 1, "einvoice_category": "01001", "revenue_account": "4020",
        "created_by": "system", "created_at": "2025-05-15T15:00:00", "updated_at": "2025-05-15T15:00:00",
        "line_items": [
            {"description": "Pengiriman makanan beku", "quantity": 50, "unit_price": 5000, "tax_rate": 6, "amount": 250000, "tax_amount": 15000, "total": 265000, "account_code": "4020", "sort_order": 1},
        ]
    },
    {
        "id": "inv-006", "company_id": "cmp-001",
        "invoice_no": "SLB/INV/2025/006", "customer_name": "Pelancong Borneo Trails",
        "customer_tin": "C6667778889", "customer_brn_ic": "6667778889", "customer_msic": "79911",
        "customer_address": "Jalan Tun Fuad",
        "customer_email": "info@borneotrails.com", "customer_phone": "08-8889999",
        "date": "2025-06-01", "due_date": "2025-07-01",
        "subtotal": 60000, "tax_amount": 3600, "discount": 0, "grand_total": 63600,
        "status": "sent", "notes": "Pakej perkhidmatan",
        "is_einvoice": 0, "einvoice_category": None, "revenue_account": "4100",
        "created_by": "system", "created_at": "2025-06-01T16:00:00", "updated_at": "2025-06-01T16:00:00",
        "line_items": [
            {"description": "Pakej Tur Pribadi", "quantity": 8, "unit_price": 7500, "tax_rate": 6, "amount": 60000, "tax_amount": 3600, "total": 63600, "account_code": "4100", "sort_order": 1},
        ]
    },
    # === TOKO ELEKTRIKEN KITA ENTERPRISE (cmp-002) ===
    {
        "id": "inv-007", "company_id": "cmp-002",
        "invoice_no": "KITA/INV/2025/001", "customer_name": "Resident Association A",
        "customer_tin": "C7778889990", "customer_brn_ic": "7778889990", "customer_msic": "98911",
        "customer_address": "Taman Perdana",
        "customer_email": "raa@tamanperdana.org", "customer_phone": "08-9990000",
        "date": "2025-01-20", "due_date": "2025-02-19",
        "subtotal": 45000, "tax_amount": 2700, "discount": 0, "grand_total": 47700,
        "status": "paid", "notes": "Instalasi lampu JKR",
        "is_einvoice": 1, "einvoice_category": "01001", "revenue_account": "4100",
        "created_by": "system", "created_at": "2025-01-20T08:00:00", "updated_at": "2025-02-15T10:00:00",
        "line_items": [
            {"description": "Lampu LED Jalan", "quantity": 100, "unit_price": 300, "tax_rate": 6, "amount": 30000, "tax_amount": 1800, "total": 31800, "account_code": "4100", "sort_order": 1},
            {"description": "Installation Service", "quantity": 1, "unit_price": 15000, "tax_rate": 6, "amount": 15000, "tax_amount": 900, "total": 15900, "account_code": "4100", "sort_order": 2},
        ]
    },
    {
        "id": "inv-008", "company_id": "cmp-002",
        "invoice_no": "KITA/INV/2025/002", "customer_name": "F&B Supplies Sdn Bhd",
        "customer_tin": "C8889990001", "customer_brn_ic": "8889990001", "customer_msic": "47241",
        "customer_address": "Kawasan Perindustrian KK",
        "customer_email": "purchase@fnb.com.my", "customer_phone": "08-0001111",
        "date": "2025-02-15", "due_date": "2025-03-17",
        "subtotal": 120000, "tax_amount": 7200, "discount": 0, "grand_total": 127200,
        "status": "paid", "notes": "Elektronik peralatan dapur",
        "is_einvoice": 1, "einvoice_category": "01001", "revenue_account": "4010",
        "created_by": "system", "created_at": "2025-02-15T09:00:00", "updated_at": "2025-03-10T11:00:00",
        "line_items": [
            {"description": "Kompressor Walk-in Fridge", "quantity": 5, "unit_price": 15000, "tax_rate": 6, "amount": 75000, "tax_amount": 4500, "total": 79500, "account_code": "4010", "sort_order": 1},
            {"description": "Set Microwave Commercial", "quantity": 10, "unit_price": 4500, "tax_rate": 6, "amount": 45000, "tax_amount": 2700, "total": 47700, "account_code": "4010", "sort_order": 2},
        ]
    },
    {
        "id": "inv-009", "company_id": "cmp-002",
        "invoice_no": "KITA/INV/2025/003", "customer_name": "Hotel Horizon",
        "customer_tin": "C9990001112", "customer_brn_ic": "9990001112", "customer_msic": "77111",
        "customer_address": "Jalan Coastal",
        "customer_email": "fandb@hotelhorizon.com", "customer_phone": "08-1112222",
        "date": "2025-03-01", "due_date": "2025-03-31",
        "subtotal": 80000, "tax_amount": 4800, "discount": 0, "grand_total": 84800,
        "status": "paid", "notes": "Pembaharuan TV & AC",
        "is_einvoice": 1, "einvoice_category": "01001", "revenue_account": "4100",
        "created_by": "system", "created_at": "2025-03-01T10:00:00", "updated_at": "2025-03-28T17:00:00",
        "line_items": [
            {"description": "TV 55\" Smart", "quantity": 20, "unit_price": 1800, "tax_rate": 6, "amount": 36000, "tax_amount": 2160, "total": 38160, "account_code": "4100", "sort_order": 1},
            {"description": "AC Split 1.5HP", "quantity": 15, "unit_price": 2000, "tax_rate": 6, "amount": 30000, "tax_amount": 1800, "total": 31800, "account_code": "4100", "sort_order": 2},
            {"description": "Service & Installation", "quantity": 1, "unit_price": 14000, "tax_rate": 6, "amount": 14000, "tax_amount": 840, "total": 14840, "account_code": "4100", "sort_order": 3},
        ]
    },
    {
        "id": "inv-010", "company_id": "cmp-002",
        "invoice_no": "KITA/INV/2025/004", "customer_name": "Makanan Express Sdn Bhd",
        "customer_tin": "C0001112223", "customer_brn_ic": "0001112223", "customer_msic": "56111",
        "customer_address": "Jalan Commercial",
        "customer_email": "ops@mks.com.my", "customer_phone": "08-2223333",
        "date": "2025-04-15", "due_date": "2025-05-15",
        "subtotal": 55000, "tax_amount": 3300, "discount": 0, "grand_total": 58300,
        "status": "overdue", "notes": "Pending payment",
        "is_einvoice": 1, "einvoice_category": "01001", "revenue_account": "4100",
        "created_by": "system", "created_at": "2025-04-15T11:00:00", "updated_at": "2025-05-20T14:00:00",
        "line_items": [
            {"description": "Pesawat Mikro Komersial", "quantity": 5, "unit_price": 11000, "tax_rate": 6, "amount": 55000, "tax_amount": 3300, "total": 58300, "account_code": "4100", "sort_order": 1},
        ]
    },
    {
        "id": "inv-011", "company_id": "cmp-002",
        "invoice_no": "KITA/INV/2025/005", "customer_name": "Provider Internet KK",
        "customer_tin": "C1112223334", "customer_brn_ic": "1112223334", "customer_msic": "63111",
        "customer_address": "Data Centre KK",
        "customer_email": "noc@internetkk.com", "customer_phone": "08-3334444",
        "date": "2025-05-01", "due_date": "2025-06-01",
        "subtotal": 90000, "tax_amount": 5400, "discount": 0, "grand_total": 95400,
        "status": "sent", "notes": "Server & networking",
        "is_einvoice": 1, "einvoice_category": "01001", "revenue_account": "4100",
        "created_by": "system", "created_at": "2025-05-01T12:00:00", "updated_at": "2025-05-01T12:00:00",
        "line_items": [
            {"description": "Server Rack 42U", "quantity": 2, "unit_price": 25000, "tax_rate": 6, "amount": 50000, "tax_amount": 3000, "total": 53000, "account_code": "4100", "sort_order": 1},
            {"description": "Router Enterprise", "quantity": 4, "unit_price": 10000, "tax_rate": 6, "amount": 40000, "tax_amount": 2400, "total": 42400, "account_code": "4100", "sort_order": 2},
        ]
    },
    # === BOUTIQUE HOTEL SUNSET INN (cmp-003) ===
    {
        "id": "inv-012", "company_id": "cmp-003",
        "invoice_no": "SUNSET/INV/2025/001", "customer_name": "Travel Dot Asia",
        "customer_tin": "C2223334445", "customer_brn_ic": "2223334445", "customer_msic": "79111",
        "customer_address": "Jalan Spice",
        "customer_email": "groups@travelasia.com", "customer_phone": "08-4445555",
        "date": "2025-01-10", "due_date": "2025-02-09",
        "subtotal": 35000, "tax_amount": 2100, "discount": 0, "grand_total": 37100,
        "status": "paid", "notes": "Group booking 50 orang",
        "is_einvoice": 1, "einvoice_category": "01001", "revenue_account": "4210",
        "created_by": "system", "created_at": "2025-01-10T13:00:00", "updated_at": "2025-02-05T15:00:00",
        "line_items": [
            {"description": "Room Rental (50 room x 1 night)", "quantity": 50, "unit_price": 500, "tax_rate": 6, "amount": 25000, "tax_amount": 1500, "total": 26500, "account_code": "4210", "sort_order": 1},
            {"description": "Breakfast for 50 pax", "quantity": 1, "unit_price": 10000, "tax_rate": 6, "amount": 10000, "tax_amount": 600, "total": 10600, "account_code": "4210", "sort_order": 2},
        ]
    },
    {
        "id": "inv-013", "company_id": "cmp-003",
        "invoice_no": "SUNSET/INV/2025/002", "customer_name": "Pejabat Peguam Hassan & Co",
        "customer_tin": "C3334445556", "customer_brn_ic": "3334445556", "customer_msic": "69100",
        "customer_address": "Menara Makanan",
        "customer_email": "admin@peguamhassan.com", "customer_phone": "08-5556666",
        "date": "2025-02-01", "due_date": "2025-03-03",
        "subtotal": 18000, "tax_amount": 1080, "discount": 0, "grand_total": 19080,
        "status": "paid", "notes": "Lawyer meeting room",
        "is_einvoice": 1, "einvoice_category": "01001", "revenue_account": "4210",
        "created_by": "system", "created_at": "2025-02-01T14:00:00", "updated_at": "2025-02-28T16:00:00",
        "line_items": [
            {"description": "Meeting Room Rental (1 day)", "quantity": 1, "unit_price": 18000, "tax_rate": 6, "amount": 18000, "tax_amount": 1080, "total": 19080, "account_code": "4210", "sort_order": 1},
        ]
    },
    {
        "id": "inv-014", "company_id": "cmp-003",
        "invoice_no": "SUNSET/INV/2025/003", "customer_name": "Karnival Makanan 2025",
        "customer_tin": "C4445556667", "customer_brn_ic": "4445556667", "customer_msic": "82990",
        "customer_address": "Taman Festival",
        "customer_email": "ops@karnival2025.com", "customer_phone": "08-6667777",
        "date": "2025-03-15", "due_date": "2025-04-14",
        "subtotal": 250000, "tax_amount": 15000, "discount": 0, "grand_total": 265000,
        "status": "sent", "notes": "Penjenamaan & stesen",
        "is_einvoice": 1, "einvoice_category": "01001", "revenue_account": "4210",
        "created_by": "system", "created_at": "2025-03-15T15:00:00", "updated_at": "2025-03-15T15:00:00",
        "line_items": [
            {"description": "Stesen Elektrik & Lighting", "quantity": 1, "unit_price": 250000, "tax_rate": 6, "amount": 250000, "tax_amount": 15000, "total": 265000, "account_code": "4210", "sort_order": 1},
        ]
    },
    {
        "id": "inv-015", "company_id": "cmp-003",
        "invoice_no": "SUNSET/INV/2025/004", "customer_name": "Semakan Pusat Latihan",
        "customer_tin": "C5556667778", "customer_brn_ic": "5556667778", "customer_msic": "85420",
        "customer_address": "Jalan Pendidikan",
        "customer_email": "training@pusatlatihan.com", "customer_phone": "08-7778888",
        "date": "2025-04-01", "due_date": "2025-05-01",
        "subtotal": 15000, "tax_amount": 900, "discount": 0, "grand_total": 15900,
        "status": "sent", "notes": "Semakan kemasukan",
        "is_einvoice": 0, "einvoice_category": None, "revenue_account": "4210",
        "created_by": "system", "created_at": "2025-04-01T16:00:00", "updated_at": "2025-04-01T16:00:00",
        "line_items": [
            {"description": "Semakan Kemasukan Hotel", "quantity": 1, "unit_price": 15000, "tax_rate": 6, "amount": 15000, "tax_amount": 900, "total": 15900, "account_code": "4210", "sort_order": 1},
        ]
    },
]

for inv in invoices:
    # Insert invoice
    line_items_json = json.dumps(inv["line_items"])
    sql_inv = f"""INSERT INTO invoices VALUES (
        '{inv['id']}', '{inv['company_id']}', '{inv['invoice_no']}', '{inv['customer_name']}',
        '{inv['customer_tin']}', '{inv['customer_brn_ic']}', '{inv['customer_msic']}',
        '{inv['customer_address']}', '{inv['customer_email']}', '{inv['customer_phone']}',
        '{inv['date']}', '{inv['due_date']}', {inv['subtotal']}, {inv['tax_amount']},
        {inv['discount']}, {inv['grand_total']}, '{inv['status']}', '{inv['notes']}',
        {inv['is_einvoice']}, '{inv['einvoice_category'] or ''}', '{inv['revenue_account']}',
        '{inv['revenue_account']}', '{inv['created_by']}', '{inv['created_at']}', '{inv['updated_at']}'
    )"""
    r = d1_exec(sql_inv)
    if not r.get("success"):
        print(f"  ❌ Invoice {inv['invoice_no']}: {r}")
        continue

    # Insert line items
    for li in inv["line_items"]:
        sql_li = f"""INSERT INTO invoice_line_items VALUES (
            '{uuid()}', '{inv['id']}', '{li['description']}', {li['quantity']},
            {li['unit_price']}, {li['tax_rate']}, {li['amount']}, {li['tax_amount']},
            {li['total']}, '{li['account_code']}', {li['sort_order']}
        )"""
        d1_exec(sql_li)

    # Create journal entries (auto-posting)
    now = inv["created_at"]
    rev_acct = inv["revenue_account"]
    ar_acct = "1100"

    # Debit AR, Credit Revenue
    je1_id = uuid()
    sql_je1 = f"""INSERT INTO journal_entries VALUES (
        '{je1_id}', '{inv['company_id']}', '{inv['date']}', 'Inv: {inv['customer_name']}',
        '{inv['invoice_no']}', '{ar_acct}', '{rev_acct}', {inv['subtotal']}, 1,
        '{inv['id']}', 'system', '{now}'
    )"""
    d1_exec(sql_je1)

    # SST posting (if applicable)
    if inv["tax_amount"] > 0:
        je2_id = uuid()
        sql_je2 = f"""INSERT INTO journal_entries VALUES (
            '{je2_id}', '{inv['company_id']}', '{inv['date']}', 'SST on {inv['invoice_no']}',
            '{inv['invoice_no']}', '{ar_acct}', '2210', {inv['tax_amount']}, 1,
            '{inv['id']}', 'system', '{now}'
        )"""
        d1_exec(sql_je2)

    status_icon = {"paid": "✅", "sent": "📤", "overdue": "⚠️"}.get(inv["status"], "📄")
    print(f"  {status_icon} {inv['invoice_no']} - {inv['customer_name'][:30]} - RM {inv['grand_total']:,.0f} ({inv['status']})")

# ============================================
# 3. MANUAL JOURNAL ENTRIES (Expenses & Other)
# ============================================
print("\n[3/8] Memasukkan manual journal entries (expenses & transactions)...")

now_2025 = "2025-12-31T23:59:59"

manual_journals = [
    # === EXPENSES SYARIKAT LADANG SAWIT ===
    {"id": "je-exp-001", "company_id": "cmp-001", "date": "2025-01-05", "description": "Gaji pekerja lavatory Januari", "reference": "GP-001", "debit_account": "6110", "credit_account": "2100", "amount": 45000, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-01-05T09:00:00"},
    {"id": "je-exp-002", "company_id": "cmp-001", "date": "2025-01-05", "description": "EPF kontribusi pekerja Januari", "reference": "EPF-001", "debit_account": "6120", "credit_account": "2100", "amount": 5400, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-01-05T09:30:00"},
    {"id": "je-exp-003", "company_id": "cmp-001", "date": "2025-01-05", "description": "SOCSO kontribusi pekerja Januari", "reference": "SOCSO-001", "debit_account": "6130", "credit_account": "2100", "amount": 1800, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-01-05T09:30:00"},
    {"id": "je-exp-004", "company_id": "cmp-001", "date": "2025-01-10", "description": "Bil electricity Januari", "reference": "TNB-001", "debit_account": "6220", "credit_account": "2100", "amount": 8500, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-01-10T10:00:00"},
    {"id": "je-exp-005", "company_id": "cmp-001", "date": "2025-01-15", "description": "Bayi loan bank Januari", "reference": "LOAN-001", "debit_account": "2100", "credit_account": "1020", "amount": 30000, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-01-15T11:00:00"},
    {"id": "je-exp-006", "company_id": "cmp-001", "date": "2025-01-20", "description": "Bil air & tangki Januari", "reference": "SYABAS-001", "debit_account": "6220", "credit_account": "2100", "amount": 1200, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-01-20T10:00:00"},
    {"id": "je-exp-007", "company_id": "cmp-001", "date": "2025-01-25", "description": "Telefon & internet Januari", "reference": "TM-001", "debit_account": "6430", "credit_account": "2100", "amount": 450, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-01-25T10:00:00"},
    {"id": "je-exp-008", "company_id": "cmp-001", "date": "2025-01-31", "description": "Aset biasanya Januari", "reference": "DEP-001", "debit_account": "1310", "credit_account": "1020", "amount": 5000, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-01-31T17:00:00"},
    {"id": "je-exp-009", "company_id": "cmp-001", "date": "2025-02-05", "description": "Gaji pekerja Feb", "reference": "GP-002", "debit_account": "6110", "credit_account": "2100", "amount": 48000, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-02-05T09:00:00"},
    {"id": "je-exp-010", "company_id": "cmp-001", "date": "2025-02-05", "description": "EPF kontribusi Feb", "reference": "EPF-002", "debit_account": "6120", "credit_account": "2100", "amount": 7200, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-02-05T09:30:00"},
    {"id": "je-exp-011", "company_id": "cmp-001", "date": "2025-02-05", "description": "SOCSO kontribusi Feb", "reference": "SOCSO-002", "debit_account": "6130", "credit_account": "2100", "amount": 2400, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-02-05T09:30:00"},
    {"id": "je-exp-012", "company_id": "cmp-001", "date": "2025-02-10", "description": "Bil electricity Feb", "reference": "TNB-002", "debit_account": "6220", "credit_account": "2100", "amount": 7800, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-02-10T10:00:00"},
    {"id": "je-exp-013", "company_id": "cmp-001", "date": "2025-02-15", "description": "Bayi loan bank Feb", "reference": "LOAN-002", "debit_account": "2100", "credit_account": "1020", "amount": 30000, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-02-15T11:00:00"},
    {"id": "je-exp-014", "company_id": "cmp-001", "date": "2025-03-05", "description": "Gaji pekerja Mac", "reference": "GP-003", "debit_account": "6110", "credit_account": "2100", "amount": 52000, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-03-05T09:00:00"},
    {"id": "je-exp-015", "company_id": "cmp-001", "date": "2025-03-05", "description": "EPF kontribusi Mac", "reference": "EPF-003", "debit_account": "6120", "credit_account": "2100", "amount": 7800, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-03-05T09:30:00"},
    {"id": "je-exp-016", "company_id": "cmp-001", "date": "2025-03-05", "description": "Bil electricity Mac", "reference": "TNB-003", "debit_account": "6220", "credit_account": "2100", "amount": 9200, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-03-10T10:00:00"},
    {"id": "je-exp-017", "company_id": "cmp-001", "date": "2025-03-20", "description": "Penyelenggaraan mesin", "reference": "MH-001", "debit_account": "6250", "credit_account": "2100", "amount": 15000, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-03-20T11:00:00"},
    {"id": "je-exp-018", "company_id": "cmp-001", "date": "2025-04-05", "description": "Gaji pekerja April", "reference": "GP-004", "debit_account": "6110", "credit_account": "2100", "amount": 55000, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-04-05T09:00:00"},
    {"id": "je-exp-019", "company_id": "cmp-001", "date": "2025-04-05", "description": "EPF kontribusi April", "reference": "EPF-004", "debit_account": "6120", "credit_account": "2100", "amount": 8250, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-04-05T09:30:00"},
    {"id": "je-exp-020", "company_id": "cmp-001", "date": "2025-04-05", "description": "Bil electricity April", "reference": "TNB-004", "debit_account": "6220", "credit_account": "2100", "amount": 10500, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-04-10T10:00:00"},
    {"id": "je-exp-021", "company_id": "cmp-001", "date": "2025-04-15", "description": "Penyengkedutan aset", "reference": "AUDIT-001", "debit_account": "6450", "credit_account": "2100", "amount": 3500, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-04-15T14:00:00"},
    {"id": "je-exp-022", "company_id": "cmp-001", "date": "2025-05-05", "description": "Gaji pekerja Mei", "reference": "GP-005", "debit_account": "6110", "credit_account": "2100", "amount": 58000, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-05-05T09:00:00"},
    {"id": "je-exp-023", "company_id": "cmp-001", "date": "2025-05-05", "description": "EPF kontribusi Mei", "reference": "EPF-005", "debit_account": "6120", "credit_account": "2100", "amount": 8700, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-05-05T09:30:00"},
    {"id": "je-exp-024", "company_id": "cmp-001", "date": "2025-05-05", "description": "Bil electricity Mei", "reference": "TNB-005", "debit_account": "6220", "credit_account": "2100", "amount": 11200, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-05-10T10:00:00"},
    {"id": "je-exp-025", "company_id": "cmp-001", "date": "2025-05-20", "description": "Ikm panggonan", "reference": "PARK-001", "debit_account": "6240", "credit_account": "2100", "amount": 2500, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-05-20T11:00:00"},

    # === EXPENSES KITA ENTERPRISE ===
    {"id": "je-exp-026", "company_id": "cmp-002", "date": "2025-01-05", "description": "Gaji staf Januari", "reference": "GP-KITA-001", "debit_account": "6110", "credit_account": "2100", "amount": 35000, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-01-05T09:00:00"},
    {"id": "je-exp-027", "company_id": "cmp-002", "date": "2025-01-05", "description": "EPF kontribusi Januari", "reference": "EPF-KITA-001", "debit_account": "6120", "credit_account": "2100", "amount": 4200, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-01-05T09:30:00"},
    {"id": "je-exp-028", "company_id": "cmp-002", "date": "2025-01-10", "description": "Bil electricity Januari", "reference": "TNB-KITA-001", "debit_account": "6220", "credit_account": "2100", "amount": 6500, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-01-10T10:00:00"},
    {"id": "je-exp-029", "company_id": "cmp-002", "date": "2025-02-05", "description": "Gaji staf Feb", "reference": "GP-KITA-002", "debit_account": "6110", "credit_account": "2100", "amount": 38000, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-02-05T09:00:00"},
    {"id": "je-exp-030", "company_id": "cmp-002", "date": "2025-02-05", "description": "EPF kontribusi Feb", "reference": "EPF-KITA-002", "debit_account": "6120", "credit_account": "2100", "amount": 4560, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-02-05T09:30:00"},
    {"id": "je-exp-031", "company_id": "cmp-002", "date": "2025-02-10", "description": "Bil electricity Feb", "reference": "TNB-KITA-002", "debit_account": "6220", "credit_account": "2100", "amount": 6200, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-02-10T10:00:00"},
    {"id": "je-exp-032", "company_id": "cmp-002", "date": "2025-03-05", "description": "Gaji staf Mac", "reference": "GP-KITA-003", "debit_account": "6110", "credit_account": "2100", "amount": 40000, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-03-05T09:00:00"},
    {"id": "je-exp-033", "company_id": "cmp-002", "date": "2025-03-05", "description": "EPF kontribusi Mac", "reference": "EPF-KITA-003", "debit_account": "6120", "credit_account": "2100", "amount": 4800, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-03-05T09:30:00"},
    {"id": "je-exp-034", "company_id": "cmp-002", "date": "2025-03-10", "description": "Bil electricity Mac", "reference": "TNB-KITA-003", "debit_account": "6220", "credit_account": "2100", "amount": 7100, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-03-10T10:00:00"},
    {"id": "je-exp-035", "company_id": "cmp-002", "date": "2025-04-05", "description": "Gaji staf April", "reference": "GP-KITA-004", "debit_account": "6110", "credit_account": "2100", "amount": 42000, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-04-05T09:00:00"},
    {"id": "je-exp-036", "company_id": "cmp-002", "date": "2025-04-05", "description": "EPF kontribusi April", "reference": "EPF-KITA-004", "debit_account": "6120", "credit_account": "2100", "amount": 5040, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-04-05T09:30:00"},
    {"id": "je-exp-037", "company_id": "cmp-002", "date": "2025-04-10", "description": "Bil electricity April", "reference": "TNB-KITA-004", "debit_account": "6220", "credit_account": "2100", "amount": 6800, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-04-10T10:00:00"},
    {"id": "je-exp-038", "company_id": "cmp-002", "date": "2025-05-05", "description": "Gaji staf Mei", "reference": "GP-KITA-005", "debit_account": "6110", "credit_account": "2100", "amount": 45000, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-05-05T09:00:00"},
    {"id": "je-exp-039", "company_id": "cmp-002", "date": "2025-05-05", "description": "EPF kontribusi Mei", "reference": "EPF-KITA-005", "debit_account": "6120", "credit_account": "2100", "amount": 5400, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-05-05T09:30:00"},
    {"id": "je-exp-040", "company_id": "cmp-002", "date": "2025-05-10", "description": "Bil electricity Mei", "reference": "TNB-KITA-005", "debit_account": "6220", "credit_account": "2100", "amount": 7500, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-05-10T10:00:00"},

    # === EXPENSES SUNSET INN ===
    {"id": "je-exp-041", "company_id": "cmp-003", "date": "2025-01-05", "description": "Gaji staf hotel Januari", "reference": "GP-SI-001", "debit_account": "6110", "credit_account": "2100", "amount": 28000, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-01-05T09:00:00"},
    {"id": "je-exp-042", "company_id": "cmp-003", "date": "2025-01-05", "description": "EPF kontribusi Januari", "reference": "EPF-SI-001", "debit_account": "6120", "credit_account": "2100", "amount": 3360, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-01-05T09:30:00"},
    {"id": "je-exp-043", "company_id": "cmp-003", "date": "2025-01-10", "description": "Bil electricity Januari", "reference": "TNB-SI-001", "debit_account": "6220", "credit_account": "2100", "amount": 12000, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-01-10T10:00:00"},
    {"id": "je-exp-044", "company_id": "cmp-003", "date": "2025-01-15", "description": "Bil air Januari", "reference": "SYABAS-SI-001", "debit_account": "6220", "credit_account": "2100", "amount": 3500, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-01-15T10:00:00"},
    {"id": "je-exp-045", "company_id": "cmp-003", "date": "2025-02-05", "description": "Gaji staf hotel Feb", "reference": "GP-SI-002", "debit_account": "6110", "credit_account": "2100", "amount": 30000, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-02-05T09:00:00"},
    {"id": "je-exp-046", "company_id": "cmp-003", "date": "2025-02-05", "description": "EPF kontribusi Feb", "reference": "EPF-SI-002", "debit_account": "6120", "credit_account": "2100", "amount": 3600, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-02-05T09:30:00"},
    {"id": "je-exp-047", "company_id": "cmp-003", "date": "2025-02-10", "description": "Bil electricity Feb", "reference": "TNB-SI-002", "debit_account": "6220", "credit_account": "2100", "amount": 11500, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-02-10T10:00:00"},
    {"id": "je-exp-048", "company_id": "cmp-003", "date": "2025-03-05", "description": "Gaji staf hotel Mac", "reference": "GP-SI-003", "debit_account": "6110", "credit_account": "2100", "amount": 32000, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-03-05T09:00:00"},
    {"id": "je-exp-049", "company_id": "cmp-003", "date": "2025-03-05", "description": "EPF kontribusi Mac", "reference": "EPF-SI-003", "debit_account": "6120", "credit_account": "2100", "amount": 3840, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-03-05T09:30:00"},
    {"id": "je-exp-050", "company_id": "cmp-003", "date": "2025-03-10", "description": "Bil electricity Mac", "reference": "TNB-SI-003", "debit_account": "6220", "credit_account": "2100", "amount": 13000, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-03-10T10:00:00"},

    # === CAPITAL / FINANCING transactions ===
    {"id": "je-cap-001", "company_id": "cmp-001", "date": "2025-01-01", "description": "Pembukaan akaun - Duit tunai", "reference": "Opening", "debit_account": "1010", "credit_account": "3100", "amount": 200000, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-01-01T08:00:00"},
    {"id": "je-cap-002", "company_id": "cmp-001", "date": "2025-01-02", "description": "Duit masuk bank Maybank", "reference": "Deposit", "debit_account": "1020", "credit_account": "1010", "amount": 150000, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-01-02T09:00:00"},
    {"id": "je-cap-003", "company_id": "cmp-002", "date": "2025-01-01", "description": "Pembukaan akaun - Modal", "reference": "Opening", "debit_account": "1010", "credit_account": "3100", "amount": 150000, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-01-01T08:00:00"},
    {"id": "je-cap-004", "company_id": "cmp-002", "date": "2025-01-02", "description": "Duit masuk bank CIMB", "reference": "Deposit", "debit_account": "1030", "credit_account": "1010", "amount": 100000, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-01-02T09:00:00"},
    {"id": "je-cap-005", "company_id": "cmp-003", "date": "2025-01-01", "description": "Pembukaan akaun - Modal", "reference": "Opening", "debit_account": "1010", "credit_account": "3100", "amount": 100000, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-01-01T08:00:00"},
    {"id": "je-cap-006", "company_id": "cmp-003", "date": "2025-01-02", "description": "Duit masuk bank Public", "reference": "Deposit", "debit_account": "1040", "credit_account": "1010", "amount": 80000, "auto_posted": 0, "invoice_id": None, "created_by": "admin", "created_at": "2025-01-02T09:00:00"},
]

for mje in manual_journals:
    sql = f"""INSERT INTO journal_entries VALUES (
        '{mje['id']}', '{mje['company_id']}', '{mje['date']}', '{mje['description']}',
        '{mje['reference']}', '{mje['debit_account']}', '{mje['credit_account']}',
        {mje['amount']}, {mje['auto_posted']}, '{mje['invoice_id'] or ''}',
        '{mje['created_by']}', '{mje['created_at']}'
    )"""
    r = d1_exec(sql)
    if not r.get("success"):
        print(f"  ❌ JE {mje['id']}: {r}")

print(f"  ✅ Selesai: {len(manual_journals)} manual journal entries")

# ============================================
# 4. VERIFY - Count semua data
# ============================================
print("\n[4/8] Mensitu data summary...")

tables = {
    "companies": "SELECT COUNT(*) FROM companies",
    "users": "SELECT COUNT(*) FROM users",
    "invoices": "SELECT COUNT(*) FROM invoices",
    "invoice_line_items": "SELECT COUNT(*) FROM invoice_line_items",
    "journal_entries": "SELECT COUNT(*) FROM journal_entries",
    "chart_of_accounts": "SELECT COUNT(*) FROM chart_of_accounts",
    "zakat_calculations": "SELECT COUNT(*) FROM zakat_calculations"
}

for t, q in tables.items():
    r = d1_query(q)
    result_sets = r["result"][0]["results"]
    if result_sets and result_sets[0]["values"]:
        count = result_sets[0]["values"][0][0]
    else:
        count = 0
    print(f"  {t:25} {count}")

# ============================================
# 5. TRIAL BALANCE CHECK (per company)
# ============================================
print("\n[5/8] Trial Balance check (as at 2025-12-31)...")

for cid, cname in [("cmp-001", "Sawit"), ("cmp-002", "KITA"), ("cmp-003", "Sunset")]:
    r = d1_query(f"""
        SELECT 
            SUM(CASE WHEN debit_account IS NOT NULL THEN amount ELSE 0 END) as total_debit,
            SUM(CASE WHEN credit_account IS NOT NULL THEN amount ELSE 0 END) as total_credit
        FROM journal_entries 
        WHERE company_id = '{cid}'
    """)
    td = r["result"][0]["results"][0]["values"][0][0] or 0
    tc = r["result"][0]["results"][0]["values"][0][1] or 0
    diff = td - tc
    status = "✅ BALANCED" if abs(diff) < 0.01 else f"❌ SELISIH RM {diff:,.2f}"
    print(f"  {cname:15} Debit: RM {td:>12,.2f} | Credit: RM {tc:>12,.2f} | {status}")

# ============================================
# 6. P&L CHECK (FY 2025)
# ============================================
print("\n[6/8] P&L check (FY 2025 - 2025-01-01 to 2025-12-31)...")

for cid, cname in [("cmp-001", "Sawit"), ("cmp-002", "KITA"), ("cmp-003", "Sunset")]:
    r = d1_query(f"""
        SELECT 
            COALESCE(SUM(CASE WHEN credit_account LIKE '4%' THEN amount ELSE 0 END), 0) as revenue,
            COALESCE(SUM(CASE WHEN debit_account LIKE '5%' THEN amount ELSE 0 END), 0) as cogs,
            COALESCE(SUM(CASE WHEN debit_account LIKE '6%' THEN amount ELSE 0 END), 0) as opex
        FROM journal_entries
        WHERE company_id = '{cid}'
          AND date BETWEEN '2025-01-01' AND '2025-12-31'
    """)
    rev = r["result"][0]["results"][0]["values"][0][0] or 0
    cogs = r["result"][0]["results"][0]["values"][0][1] or 0
    opex = r["result"][0]["results"][0]["values"][0][2] or 0
    gp = rev - cogs
    np = gp - opex
    print(f"  {cname:15} Revenue: RM {rev:>12,.2f} | COGS: RM {cogs:>10,.2f} | GP: RM {gp:>12,.2f} | OpEx: RM {opex:>10,.2f} | NP: RM {np:>12,.2f}")

# ============================================
# 7. BALANCE SHEET CHECK (as at 2025-12-31)
# ============================================
print("\n[7/8] Balance Sheet check (as at 2025-12-31)...")

for cid, cname in [("cmp-001", "Sawit"), ("cmp-002", "KITA"), ("cmp-003", "Sunset")]:
    r = d1_query(f"""
        SELECT 
            COALESCE(SUM(
                CASE WHEN debit_account LIKE '1%' THEN amount ELSE 0 END -
                CASE WHEN credit_account LIKE '1%' THEN amount ELSE 0 END
            ), 0) as assets,
            COALESCE(SUM(
                CASE WHEN credit_account LIKE '2%' THEN amount ELSE 0 END -
                CASE WHEN debit_account LIKE '2%' THEN amount ELSE 0 END
            ), 0) as liabilities,
            COALESCE(SUM(
                CASE WHEN credit_account LIKE '3%' THEN amount ELSE 0 END -
                CASE WHEN debit_account LIKE '3%' THEN amount ELSE 0 END
            ), 0) as equity
        FROM journal_entries
        WHERE company_id = '{cid}'
          AND date <= '2025-12-31'
    """)
    assets = r["result"][0]["results"][0]["values"][0][0] or 0
    liab = r["result"][0]["results"][0]["values"][0][1] or 0
    equity = r["result"][0]["results"][0]["values"][0][2] or 0
    total_le = liab + equity
    diff = assets - total_le
    status = "✅ BALANCED" if abs(diff) < 0.01 else f"❌ SELISIH RM {diff:,.2f}"
    print(f"  {cname:15} Assets: RM {assets:>12,.2f} | Liab: RM {liab:>10,.2f} | Equity: RM {equity:>10,.2f} | L+E: RM {total_le:>12,.2f} | {status}")

print("\n" + "=" * 60)
print("SEED DATA COMPLETE")
print("=" * 60)
