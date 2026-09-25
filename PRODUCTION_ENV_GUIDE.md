# Precision Flow (DinePulse) — Production Environment Setup Guide

This guide provides the exact configuration, environment variables, and step-by-step deployment procedures for deploying Precision Flow to production with:
- **Backend:** Render (or any Python container/PaaS)
- **Frontend:** Vercel / Netlify / Cloudflare Pages
- **Database:** Supabase PostgreSQL (or zero-config SQLite with persistent disk)

---

## 1. Architecture & Deployment Workflow

Deploy the **backend first** so you obtain its live public URL, then deploy the **frontend**, and finally lock down **CORS**:

```
 ┌────────────────────────────────────────────────────────┐
 │ Step 1: Deploy Backend to Render                       │
 │ ➔ Get live backend URL: https://api-service.onrender.com│
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │ Step 2: Deploy Frontend to Vercel                      │
 │ ➔ Set VITE_API_URL=https://api-service.onrender.com   │
 │ ➔ Get live frontend URL: https://dinepulse.vercel.app  │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │ Step 3: Update Backend CORS on Render                  │
 │ ➔ Set CORS_ORIGINS=https://dinepulse.vercel.app        │
 └────────────────────────────────────────────────────────┘
```

---

## 2. Backend Production Environment (Render Web Service)

### A. Environment Variables Reference

Configure these in **Render Dashboard** ➔ **Your Service** ➔ **Environment Variables**:

| Variable | Required | Production Value | Purpose / Description |
|:---|:---:|:---|:---|
| `PORT` | Auto | *Leave empty / handled by Render* | Render injects this dynamically via `$PORT` (typically `10000`). |
| `APP_URL` | Yes | `https://your-backend-name.onrender.com` | Base public URL of your backend (no trailing slash). |
| `DATABASE_URL` | Yes | `postgresql+asyncpg://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres` | Async SQLAlchemy PostgreSQL connection string to your Supabase instance. |
| `CORS_ORIGINS` | Yes | `https://your-frontend.vercel.app` | Comma-separated list of allowed frontend origins (no trailing slashes). |
| `ADMIN_PIN` | Yes | `9211` *(or any strong 4–6 digit PIN)* | Master administrator security PIN for dashboard access. |
| `COOKIE_SECRET` | Yes | `64_char_random_hex_string` | Secret key for signing sessions and tokens. Generate via `openssl rand -hex 32`. |

---

### B. Database Connection String Options

#### Option 1: Supabase Direct Connection (Port 5432)
```env
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@db.oprwpgcvctinnkgvwast.supabase.co:5432/postgres
```

#### Option 2: Supabase Connection Pooler (Recommended for IPv4 / Serverless)
If your host has IPv6 connectivity limitations, use Supabase's built-in transaction pooler (port `6543`):
```env
DATABASE_URL=postgresql+asyncpg://postgres.oprwpgcvctinnkgvwast:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

#### Option 3: Zero-Config SQLite with Render Persistent Disk
If hosting without external Supabase, attach a Render Persistent Disk mounted at `/data`:
```env
DATABASE_URL=sqlite+aiosqlite:////data/dinepulse.db
```

---

### C. Render Service Settings Checklist

In **Render Dashboard** ➔ **Settings**:

- **Name:** `precision-flow-backend` (or your choice)
- **Region:** Closest to your database (e.g., Singapore / Frankfurt / Oregon)
- **Branch:** `main`
- **Root Directory:** `server`
- **Runtime:** `Python 3`
- **Build Command:**
  ```bash
  pip install -r requirements.txt
  ```
- **Start Command (Choose One):**
  - **With Gunicorn (Recommended for production concurrency):**
    ```bash
    gunicorn main:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
    ```
  - **With Uvicorn (Simple & Lightweight):**
    ```bash
    uvicorn main:app --host 0.0.0.0 --port $PORT
    ```

---

## 3. Frontend Production Environment (Vercel / Netlify / Cloudflare Pages)

### A. Environment Variables Reference

Configure this in your frontend hosting dashboard (e.g. **Vercel Project Settings** ➔ **Environment Variables**):

| Variable | Required | Production Value | Purpose / Description |
|:---|:---:|:---|:---|
| `VITE_API_URL` | Yes | `https://your-backend-name.onrender.com` | Base URL of the deployed FastAPI backend. |

> [!IMPORTANT]
> **No Trailing Slash:** Set `https://api.yourdomain.com`, **NOT** `https://api.yourdomain.com/`.  
> The client automatically routes:
> - REST calls to `https://api.yourdomain.com/api/...`
> - WebSockets to `wss://api.yourdomain.com/ws?restaurant_id=rst_default`

---

### B. Vercel Deployment Checklist

1. **Import Git Repository** in Vercel.
2. Configure project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
3. Add Environment Variable:
   - Name: `VITE_API_URL`
   - Value: `https://your-backend-name.onrender.com`
4. Click **Deploy**.

---

## 4. Production Golden Rules & Troubleshooting

### Rule 1: Exact CORS Origin Matching
CORS origins must match the exact browser address bar:
- ✅ `https://dinepulse.vercel.app`
- ❌ `https://dinepulse.vercel.app/` *(trailing slash causes browser CORS denial)*
- ❌ `http://dinepulse.vercel.app` *(HTTP instead of HTTPS will be denied)*

To allow multiple origins (e.g. production domain + staging + local testing):
```env
CORS_ORIGINS=https://dinepulse.vercel.app,https://staging.dinepulse.vercel.app,http://localhost:3000
```

### Rule 2: Render Free Tier Spin-Down
Render's free tier spins down after 15 minutes of inactivity. When a request arrives, it may take 30–50 seconds to spin back up.
- The frontend includes auto-reconnect logic for WebSockets when the server wakes up.
- For production commercial restaurants, upgrade to Render's **Starter tier ($7/mo)** to ensure 100% uptime with zero wake-up lag.

### Rule 3: Secure Secrets Rotation
Before going live to real customers:
1. Change `ADMIN_PIN` from the default `9211` to a unique 4–6 digit PIN.
2. Generate a fresh 64-character `COOKIE_SECRET`:
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

---

## 5. Verification Checklist

After deploying both frontend and backend:

- [ ] **Health Check:** Open `https://your-backend.onrender.com/health` in browser ➔ Returns `{"status":"ok","app":"DinePulse Backend"}`.
- [ ] **Swagger Docs:** Open `https://your-backend.onrender.com/docs` ➔ Interactive API documentation loads.
- [ ] **Frontend Check:** Open `https://your-frontend.vercel.app` ➔ Tables, categories, and menu load without red toast connection errors.
- [ ] **WebSocket Check:** Open browser Developer Tools ➔ **Network** ➔ **WS** tab ➔ Confirm a successful WebSocket connection to `/ws` with status `101 Switching Protocols`.
- [ ] **Order Lifecycle Test:** Check into a table, place an item, and confirm the ticket appears on the kitchen display in real time.
