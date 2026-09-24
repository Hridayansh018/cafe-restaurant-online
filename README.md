# Precision Flow (DinePulse) — Restaurant & Cafe Operating System

Precision Flow (DinePulse) is a modern, full-stack restaurant management and point-of-sale (POS) operating system. It features a high-performance **FastAPI backend** (with SQLAlchemy async, WebSockets, and database persistence) and an intuitive **React/Vite frontend** supporting digital QR ordering, kitchen display systems (KDS), table management, billing, CRM, and analytics.

---

## Table of Contents
1. [User Personas & End-to-End User Flows](#user-personas--end-to-end-user-flows)
   - [Customer / Diner Flows](#1-customer--diner-flow)
   - [Restaurant & Cafe Owner / Staff Flows](#2-restaurant--cafe-owner--staff-flows)
2. [Architecture Overview](#architecture-overview)
3. [Zero-Config Hosting (Hosting Without External Database)](#zero-config-hosting-hosting-without-external-database)
4. [Complete Supabase & PostgreSQL Database Setup](#complete-supabase--postgresql-database-setup)
5. [Environment Configuration (Dev vs. Production)](#environment-configuration-dev-vs-production)
6. [Step-by-Step Setup Guide](#step-by-step-setup-guide)
   - [Local Development Setup (Two-Terminal Workflow)](#local-development-setup-two-terminal-workflow)
   - [Production Deployment Guide](#production-deployment-guide)
7. [Troubleshooting & Common Issues (`ECONNREFUSED` Fix)](#troubleshooting--common-issues-econnrefused-fix)
8. [API & WebSocket Reference](#api--websocket-reference)
9. [Testing & Quality Assurance](#testing--quality-assurance)

---

## User Personas & End-to-End User Flows

Precision Flow provides tailored experiences for both the dining customer and restaurant team.

```
       ┌───────────────────────────────┐
       │   Customer / Diner Device     │
       │  (QR Scan ➔ Order ➔ Pay)      │
       └──────────────┬────────────────┘
                      │ WebSockets & REST API
                      ▼
 ┌───────────────────────────────────────────┐
 │          FastAPI Backend (8000)           │
 │   Auth · Orders · Billing · Realtime WS   │
 └────────────────────┬──────────────────────┘
                      │ Live Events
       ┌──────────────┴────────────────┐
       ▼                               ▼
┌──────────────┐               ┌──────────────┐
│ Kitchen KDS  │               │ Owner / POS  │
│ SLA & Prep   │               │ Tables & Rev │
└──────────────┘               └──────────────┘
```

---

### 1. Customer / Diner Flow

#### Flow 1.1: Table Check-In & Dynamic QR Scanning
- **Step 1:** The diner sits at a table and scans the physical table QR code using their smartphone camera.
- **Step 2:** The URL embeds the table identifier and secure QR token (e.g. `?table=tbl_1&token=tok_...`).
- **Step 3:** The diner enters their name and phone number on the welcome screen.
- **Step 4:** The backend validates the QR token, assigns the table to an active session, links any existing reservations matching that phone number, and records the guest in the CRM.

#### Flow 1.2: Menu Browsing & Customization
- **Step 1:** The diner browses categorized dishes (Starters, Mains, Breads, Beverages, Desserts).
- **Step 2:** They filter by dietary preference (`veg`, `non_veg`, `egg`, `vegan`) and view spice intensity indicators.
- **Step 3:** Selecting an item reveals available modifiers (e.g., choice of portion size, dips, preparation styles) and live stock availability.

#### Flow 1.3: Round-Based Ordering & Kitchen Submission
- **Step 1:** The customer adds items to their table cart and specifies optional special cooking instructions.
- **Step 2:** Upon clicking **"Place Order"**, the order is dispatched to the backend with an incremented round number (allowing multiple order rounds throughout the meal).
- **Step 3:** A prep countdown timer automatically begins based on the restaurant's SLA (default: 15 minutes).

#### Flow 1.4: Real-Time Order Tracking & Calling Waiter
- **Step 1:** The diner watches their order transition in real-time: `placed` ➔ `preparing` ➔ `ready` ➔ `served`.
- **Step 2:** If assistance, extra cutlery, or water is needed, the diner taps **"Call Waiter"**, choosing a reason. The floor team is notified instantly.

#### Flow 1.5: Bill Request, Split, & Payment Settlement
- **Step 1:** Once dining is finished, the customer taps **"Request Bill"**.
- **Step 2:** The system aggregates all rounds, computes GST (5%), applies promotional discounts or reservation deposit credits, and displays the exact total.
- **Step 3:** The customer chooses their payment method:
  - **Online:** Instant UPI or Card.
  - **Counter:** Cash or Card at POS.
- **Step 4:** Once settled, the table session closes automatically, releasing the table to vacant.

#### Flow 1.6: Automated Digital Invoicing
- An official GST-compliant tax invoice is generated with a unique sequence number (e.g., `INV-20260914-XXXX`) and sent to the diner via WhatsApp / Email.

---

### 2. Restaurant & Cafe Owner / Staff Flows

#### Flow 2.1: Owner / General Manager (Admin POV)
- **Live Performance Dashboard:**
  - View live revenue charts, total daily orders, and Average Order Value (AOV).
  - Inspect top-selling catalog items to optimize purchasing and menu pricing.
- **Floor Plan & Table Operations:**
  - Interactive 2D floor visualizer showing each table's status: `vacant`, `occupied`, `billing_requested`, or `reserved`.
  - Reissue table QR codes with a single click if a QR code is compromised or rotated.
- **Menu & Catalog Engineering:**
  - Add, edit, or disable menu items instantly.
  - "86" an item (mark out-of-stock) in real-time to prevent orders when ingredients run out.
- **Staff PIN Management:**
  - Issue 4-digit bcrypt-hashed PINs with role-based authorization: `admin`, `waiter`, `cashier`, `kitchen`.
- **Targeted Marketing Campaigns:**
  - Filter CRM audiences (e.g. diners inactive for >30 days with >2 past visits).
  - Schedule targeted promotional campaigns via WhatsApp and Email templates.

#### Flow 2.2: Kitchen Display System (Kitchen POV)
- **Ticket Organization:**
  - Kitchen screens update in real-time via WebSockets as orders are placed.
  - Orders are organized by round number and table label.
- **SLA Breach Warnings:**
  - Visual countdown timer for each order based on SLA prep time.
  - Automatic color shifts (Green ➔ Amber ➔ Flashing Red) if an order breaches SLA prep thresholds.
- **Item-Level Control:**
  - Kitchen staff mark individual items as `preparing` or `ready`.
  - When all items in a ticket are ready, the order cascades to `ready` for waiter pickup.

#### Flow 2.3: Floor Waiter POV
- **Service Alert Inbox:**
  - Immediate visual alerts when diners trigger "Call Waiter" with specific reasons (e.g. "Table 4 requests water").
- **Table Delivery:**
  - Notification when kitchen marks food `ready`. Waiter delivers food and marks the status as `served`.

#### Flow 2.4: Cashier / POS Checkout POV
- **Bill Finalization:**
  - Instant notification when a table enters `billing_requested`.
  - Apply custom discounts or adjust payment mode (UPI, Cash, POS Card Terminal).
- **Payment Reconciliation & Table Reset:**
  - Marking a bill as `paid` automatically triggers invoice creation and frees the table for the next customer.
  - One-click button to re-send invoices via WhatsApp or Email.

---

## Architecture Overview

```
precision-flow/
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── context/            # DinePulseContext (Global state + native WebSocket)
│   │   ├── lib/                # API client (db.ts) calling FastAPI backend
│   │   ├── components/         # Floor plan, KDS, POS, Menu, and Diner views
│   │   └── types.ts            # Core TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts          # Reverse proxy (/api, /ws -> 127.0.0.1:8000)
│
├── server/                     # FastAPI Async Python Backend
│   ├── config.py               # Pydantic-settings configuration
│   ├── database.py             # SQLAlchemy 2.0 async engine & sessions
│   ├── dependencies.py         # PIN verification, auth helpers, timestamp converters
│   ├── main.py                 # FastAPI application, CORS, and WebSocket router
│   ├── mappers.py              # ORM-to-Schema bidirectional transformations
│   ├── requirements.txt        # Pinned Python dependencies
│   ├── seed.py                 # Out-of-the-box restaurant & menu catalog seeder
│   ├── websocket.py            # Realtime multi-client WebSocket connection manager
│   ├── models/                 # SQLAlchemy 13-table relational schema
│   ├── schemas/                # Pydantic v2 request/response schemas
│   ├── services/               # Business logic (Order SLA, Billing GST, Check-in)
│   ├── routers/                # REST domain endpoints (/api/*)
│   └── test_app.py             # Pytest end-to-end integration test suite
└── README.md                   # System documentation
```

---

## Zero-Config Hosting (Hosting Without External Database)

### Can I host this project without setting up a database?

**YES! Absolutely.**

As of the current implementation, **Precision Flow requires ZERO external database provisioning to run or be hosted.**

#### How It Works:
1. **Built-in Async SQLite:** The backend includes `aiosqlite` and defaults to `sqlite+aiosqlite:///./dinepulse.db`.
2. **Automatic Schema Initialization:** On startup, the server automatically inspects and generates all 13 tables (`init_db()`).
3. **Automatic Data Seeding:** The server automatically populates `dinepulse.db` with the default restaurant profile, tables T1–T6, categories, catalog items, modifiers, and staff accounts with hashed PINs.

#### Where You Can Host Without an External DB:
- **Virtual Private Server (VPS) / Droplet / EC2:** Run FastAPI in Docker or via systemd. The SQLite file `dinepulse.db` is stored locally on the file system.
- **PaaS (Railway, Render, Fly.io):** Mount a persistent volume (e.g. `/data`) and point `DATABASE_URL=sqlite+aiosqlite:////data/dinepulse.db` so data persists across container redeployments.

> [!NOTE]
> SQLite is ideal for single-instance hosting, local testing, and cafes with moderate traffic. For high-availability, multi-container autoscaling or serverless platforms, an external PostgreSQL database (such as Supabase) is recommended.

---

## Complete Supabase & PostgreSQL Database Setup

When you are ready to switch from local SQLite to your cloud-hosted PostgreSQL database (such as Supabase), follow this complete step-by-step guide.

### Step 1: Create or Access Your Supabase Project
1. Log in to [Supabase](https://supabase.com) and navigate to your dashboard.
2. Select your project (e.g., project ref: `oprwpgcvctinnkgvwast`).

### Step 2: Run the SQL Database Schema
Precision Flow includes a pre-built SQL file containing all 13 tables, primary keys, triggers, foreign keys, and indexes.

1. In your Supabase Dashboard, go to **SQL Editor** (left menu).
2. Click **New Query**.
3. Open [`client/supabase_schema.sql`](file:///D:/git-data/precision-flow/client/supabase_schema.sql) in this repository and copy its entire contents.
4. Paste the SQL script into the Supabase SQL editor and click **Run** (or `Ctrl+Enter`).
5. This sets up:
   - Tables: `restaurants`, `tables`, `categories`, `menu_items`, `staff`, `customers`, `reservations`, `sessions`, `orders`, `order_items`, `bills`, `invoices`, `campaigns`.
   - Triggers: `handle_updated_at()` for automatic timestamp tracking.
   - Initial seed data: Default `rst_default` restaurant record.

### Step 3: Get Your Connection String
1. In Supabase, go to **Project Settings** ➔ **Database**.
2. Scroll to the **Connection parameters** / **Connection string** section.
3. Select the **URI** tab.
4. You will see a connection string resembling:
   ```text
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
   *(For high concurrency, you can also use the Connection Pooler on port `6543` / `5432`).*

### Step 4: Format for SQLAlchemy Async
SQLAlchemy async requires the `postgresql+asyncpg://` protocol prefix.

In `server/.env.local` (or `server/.env`), configure:
```env
# Direct Supabase Connection (Port 5432)
DATABASE_URL=postgresql+asyncpg://postgres:[YOUR-DB-PASSWORD]@db.oprwpgcvctinnkgvwast.supabase.co:5432/postgres

# OR via Supabase Connection Pooler (Recommended for IPv4/Serverless):
# DATABASE_URL=postgresql+asyncpg://postgres.oprwpgcvctinnkgvwast:[YOUR-DB-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

*(Note: If you enter standard `postgresql://` or `postgres://`, the backend automatically adapts it to `postgresql+asyncpg://` at startup).*

---

## Environment Configuration (Dev vs. Production)

### Configuration Reference Table

| Variable | Description | Development Default | Production Recommended |
|:---|:---|:---|:---|
| `PORT` | Backend HTTP listening port | `8000` | `8000` (or host injected) |
| `APP_URL` | Public base URL of backend | `http://127.0.0.1:8000` | `https://api.yourdomain.com` |
| `DATABASE_URL` | Async database connection URI | `sqlite+aiosqlite:///./dinepulse.db` | `postgresql+asyncpg://user:pass@host:5432/dbname` |
| `ADMIN_PIN` | Master administrator security PIN | `9211` | Secure unique 4-6 digit PIN |
| `COOKIE_SECRET` | Session & token signing secret | Any random dev string | 64-char cryptographically random secret |
| `CORS_ORIGINS` | Permitted client origins | `http://localhost:3000,http://127.0.0.1:3000,*` | `https://app.yourdomain.com,https://pos.yourdomain.com` |
| `VITE_API_URL` | Frontend API & WS target | *(empty — uses Vite proxy)* | `https://api.yourdomain.com` |

---

## Step-by-Step Setup Guide

### Local Development Setup (Two-Terminal Workflow)

> [!IMPORTANT]
> The application uses a decoupled architecture. Both the **FastAPI backend** (Port 8000) and the **Vite frontend** (Port 3000) must be running.

#### Terminal 1 — Backend (Python 3.10+)

```powershell
cd server

# 1. Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

# 2. Install dependencies (if not already installed)
pip install -r requirements.txt

# 3. Start FastAPI with auto-reload
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

- Backend API: **http://127.0.0.1:8000**
- Swagger Documentation: **http://127.0.0.1:8000/docs**
- Health Check: **http://127.0.0.1:8000/health**

#### Terminal 2 — Frontend (Node.js 18+)

```powershell
cd client

# 1. Install packages (first time only)
npm install

# 2. Start Vite development server
npm run dev
```

- Open **http://localhost:3000** in your browser.

---

### Production Deployment Guide

#### 1. Backend Production Deployment

```bash
gunicorn main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

#### 2. Nginx Reverse Proxy Configuration (with WebSocket Support)

```nginx
server {
    server_name api.dinepulse.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket upgrade proxy
    location /ws {
        proxy_pass http://127.0.0.1:8000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

#### 3. Frontend Production Build

```bash
cd client
npm run build
```
Static bundle output is created in `client/dist/`.

---

## Troubleshooting & Common Issues (`ECONNREFUSED` Fix)

### Issue: `AggregateError [ECONNREFUSED]` on `/api/...` or `[vite] ws proxy error`

```text
AggregateError [ECONNREFUSED]: 
    at internalConnectMultiple (node:net:1193:18)
    at afterConnectMultiple (node:net:1783:7)
[vite] ws proxy error:
```

#### Solutions:
1. **Backend Not Running:** Ensure the FastAPI server is running in a separate terminal:
   ```powershell
   cd server
   .\venv\Scripts\uvicorn.exe main:app --reload --host 127.0.0.1 --port 8000
   ```
2. **Node 18+ IPv6 `localhost` Resolution:** On Windows, Node.js resolves `localhost` to IPv6 `::1` before IPv4 `127.0.0.1`. In [`client/vite.config.ts`](file:///D:/git-data/precision-flow/client/vite.config.ts), proxy targets must explicitly point to `http://127.0.0.1:8000` and `ws://127.0.0.1:8000` (already configured by default).
3. **Verify Port Availability:** Test if the backend responds directly in PowerShell:
   ```powershell
   curl http://127.0.0.1:8000/health
   ```
   Should return `{"status":"ok","app":"DinePulse Backend"}`.

---

## API & WebSocket Reference

### Key API Endpoints

| Domain | Method | Endpoint | Description |
|:---|:---|:---|:---|
| **Auth** | `POST` | `/api/auth/verify-pin` | Verify staff / admin 4-digit PIN |
| **Restaurant** | `GET`, `PUT` | `/api/restaurants` | View & update restaurant profile and theme |
| **Tables** | `GET`, `POST` | `/api/tables` | Table inventory and live status |
| **Tables** | `POST` | `/api/tables/{id}/reissue-qr` | Re-generate table QR authentication token |
| **Menu** | `GET`, `POST` | `/api/menu-items` | Manage dishes, modifiers, and stock |
| **Sessions** | `POST` | `/api/sessions/checkin` | Diner check-in (upserts guest CRM & table session) |
| **Orders** | `POST` | `/api/orders` | Place food order with SLA deadline |
| **Orders** | `POST` | `/api/orders/{id}/status` | Update order status (`preparing`, `ready`, `served`) |
| **Bills** | `POST` | `/api/bills` | Generate bill for active session |
| **Bills** | `POST` | `/api/bills/{id}/settle` | Settle payment, close session, generate invoice |
| **Invoices** | `GET` | `/api/invoices` | List invoices and transaction records |
| **Invoices** | `POST` | `/api/invoices/{id}/resend` | Re-dispatch invoice via WhatsApp / Email |
| **Analytics** | `GET` | `/api/analytics/daily-revenue` | Daily revenue breakdown |
| **Analytics** | `GET` | `/api/analytics/summary` | Total revenue, order count, and AOV metrics |

### Realtime WebSocket Protocol (`/ws`)

Connect to:
`ws://127.0.0.1:8000/ws?restaurant_id=rst_default`

#### Broadcast Events:
- `{"type": "order_updated", "order_id": "ord_..."}`: Kitchen status change, new order ticket placed.
- `{"type": "table_updated", "table_id": "tbl_..."}`: Occupancy status changed, QR reissued, waiter called.
- `{"type": "bill_updated", "bill_id": "bil_..."}`: Bill requested or settlement completed.
- `{"type": "session_updated", "session_id": "sess_..."}`: Diner checked in or session closed.

---

## Testing & Quality Assurance

To run automated backend tests inside the virtual environment:
```powershell
cd server
.\venv\Scripts\pytest.exe -v
```

The test suite validates:
1. Health check availability.
2. Admin and staff PIN authentication logic.
3. Catalog discovery and table listing.
4. Diner check-in and dynamic QR reissue.
5. Multi-item order creation and SLA timer calculation.
6. Order status progression (`placed` ➔ `preparing` ➔ `ready`).
7. Bill compilation, tax computations (GST 5%), and deposit credits.
8. Payment settlement, table status release, and invoice delivery.
9. Financial analytics and summary KPIs.
