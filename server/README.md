# Precision Flow — Backend API Server

FastAPI asynchronous backend for Precision Flow (DinePulse).

---

## 1. Zero-Config Hosting (Hosting Without External Database)

### Can I host this project without setting up a database?
**YES!** As currently implemented, the backend defaults to SQLite (`sqlite+aiosqlite:///./dinepulse.db`) and requires **zero external database setup**:
- On startup, the server automatically inspects and generates all 13 tables (`init_db()`).
- The server automatically seeds initial restaurant info, tables T1–T6, menu items, categories, and staff PINs (`seed_default_data()`).
- For VPS / Docker deployments, you can deploy immediately without provisioning Supabase or external PostgreSQL.

---

## 2. Complete Supabase & PostgreSQL Setup

When ready to switch to your cloud database:

### Step 1: Run the Database Queries
1. Open your Supabase Dashboard ➔ **SQL Editor**.
2. Click **New Query**.
3. Copy the entire content of [`client/supabase_schema.sql`](../client/supabase_schema.sql) and click **Run**.
4. This creates all 13 tables, primary keys, triggers, and indexes.

### Step 2: Configure Connection String
In `server/.env.local` or `server/.env`:

```env
# Direct Connection (Port 5432)
DATABASE_URL=postgresql+asyncpg://postgres:[YOUR-PASSWORD]@db.oprwpgcvctinnkgvwast.supabase.co:5432/postgres

# OR Connection Pooler (Port 6543 / 5432)
# DATABASE_URL=postgresql+asyncpg://postgres.oprwpgcvctinnkgvwast:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

*(Note: The server automatically converts `postgres://` or `postgresql://` to `postgresql+asyncpg://` if standard URI syntax is provided).*

---

## 3. Quick Start (Development)

Ensure commands are executed inside the Python virtual environment:

```powershell
cd server

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run development server (explicit IPv4 to avoid IPv6 ECONNREFUSED)
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

- Interactive API documentation: **http://127.0.0.1:8000/docs**
- ReDoc reference: **http://127.0.0.1:8000/redoc**
- Health check: **http://127.0.0.1:8000/health**
- Realtime WebSocket: **ws://127.0.0.1:8000/ws?restaurant_id=rst_default**

---

## 4. Troubleshooting: `ECONNREFUSED`

If the frontend displays `AggregateError [ECONNREFUSED]` on `/api/...` or `[vite] ws proxy error`:
1. Ensure the FastAPI backend is running in its own terminal (`uvicorn main:app --reload --host 127.0.0.1 --port 8000`).
2. Make sure [`client/vite.config.ts`](../client/vite.config.ts) proxies to `127.0.0.1:8000` rather than `localhost:8000` to prevent Node.js 18+ from resolving to IPv6 `::1`.

---

## 5. Running Integration Tests

```powershell
.\venv\Scripts\pytest.exe -v
```

This validates authentication, check-in, order lifecycle, SLA breach timers, billing, settlement, and analytics.

---

## 6. Production Deployment

### Option A: Gunicorn (Multi-Worker)
```bash
# Standard VPS / Docker
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Render / Railway (Dynamic $PORT injected by cloud provider)
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
```

### Option B: Uvicorn Direct (Lightweight / Render)
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```
