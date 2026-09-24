# FastAPI Backend Integration Plan — DinePulse

## Overview

Replace the direct Supabase client access from the React frontend with a FastAPI backend that owns all business logic, database queries, and realtime via WebSockets. The localStorage fallback and Supabase JS client are removed.

---

## 1. Backend Structure (`backend/`)

```
backend/
├── main.py                     # FastAPI app, CORS, lifespan events
├── config.py                   # Settings via pydantic-settings (DATABASE_URL, etc.)
├── database.py                 # SQLAlchemy async engine + session dependency
├── models/                     # SQLAlchemy ORM models (13 tables)
│   ├── __init__.py
│   ├── restaurant.py
│   ├── table.py
│   ├── category.py
│   ├── menu_item.py
│   ├── staff.py
│   ├── customer.py
│   ├── reservation.py
│   ├── session.py
│   ├── order.py
│   ├── order_item.py
│   ├── bill.py
│   ├── invoice.py
│   └── campaign.py
├── schemas/                    # Pydantic request/response schemas
│   ├── __init__.py
│   └── ... (one per entity, mirrors types.ts)
├── routers/                    # API routers (one per domain)
│   ├── __init__.py
│   ├── auth.py                 # POST /api/auth/verify-pin
│   ├── restaurants.py          # CRUD /api/restaurants
│   ├── tables.py               # CRUD /api/tables + QR reissue
│   ├── categories.py           # CRUD /api/categories
│   ├── menu.py                 # CRUD /api/menu-items
│   ├── staff.py                # CRUD /api/staff
│   ├── sessions.py             # CRUD /api/sessions (check-in, close)
│   ├── orders.py               # CRUD /api/orders + status updates
│   ├── bills.py                # CRUD /api/bills + settle
│   ├── invoices.py             # CRUD /api/invoices + resend
│   ├── customers.py            # CRUD /api/customers
│   ├── reservations.py         # CRUD /api/reservations
│   ├── campaigns.py            # CRUD /api/campaigns
│   └── analytics.py            # GET /api/analytics/daily-revenue, /top-items
├── services/                   # Business logic layer
│   ├── __init__.py
│   ├── order_service.py        # SLA deadline calculation, item status cascading
│   ├── bill_service.py         # GST calculation, total payable
│   └── session_service.py      # Check-in flow, reservation matching
├── websocket.py                # WebSocket connection manager for realtime
├── dependencies.py             # get_db, get_current_staff (PIN verification)
├── requirements.txt
└── .env.example
```

---

## 2. Key API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/verify-pin` | Verify staff PIN, return session info |
| GET/PUT | `/api/restaurants` | Restaurant profile |
| CRUD | `/api/tables` | Table management + `POST /{id}/reissue-qr` |
| CRUD | `/api/categories` | Menu categories |
| CRUD | `/api/menu-items` | Menu items with inventory |
| CRUD | `/api/staff` | Staff management |
| POST | `/api/sessions/checkin` | Diner check-in (creates session, upserts customer) |
| GET/PUT | `/api/sessions/{id}` | Session status, close |
| CRUD | `/api/orders` | Place order, update status |
| POST | `/api/orders/{id}/status` | Update order status (preparing/ready/served) |
| CRUD | `/api/bills` | Request bill, settle |
| POST | `/api/bills/{id}/settle` | Mark paid, generate invoice |
| CRUD | `/api/invoices` | Invoice history, resend via WhatsApp/email |
| CRUD | `/api/customers` | Customer CRM |
| CRUD | `/api/reservations` | Reservation management |
| CRUD | `/api/campaigns` | Marketing campaigns |
| GET | `/api/analytics/daily-revenue` | Revenue chart data |
| GET | `/api/analytics/top-items` | Top selling items |
| WS | `/ws` | Realtime updates (orders, tables, bills) |

---

## 3. Database Layer

- **SQLAlchemy 2.0** async with `asyncpg` driver
- Models mirror the existing `supabase_schema.sql` tables exactly
- Use `Alembic` for migrations (optional, can start without it)

---

## 4. Realtime via WebSockets

```python
# websocket.py
class ConnectionManager:
    """Manages WebSocket connections per restaurant."""
    async def connect(self, websocket, restaurant_id: str)
    async def broadcast(self, restaurant_id: str, event: dict)
    # Event types: order_updated, table_updated, bill_updated
```

- Frontend opens a single WebSocket to `/ws?restaurant_id=rst_default`
- Backend broadcasts after every mutation that changes orders/tables/bills
- Replaces Supabase Realtime subscriptions entirely

---

## 5. Frontend Changes

### Remove
- `src/lib/supabase.ts` (Supabase client)
- All localStorage logic from `src/lib/db.ts`
- Supabase Realtime subscription setup in `DinePulseContext.tsx`

### Replace `src/lib/db.ts`
Rewrite with a fetch-based version that calls FastAPI endpoints:

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const db = {
  getRestaurant: () => api<Restaurant>('/api/restaurants'),
  upsertRestaurant: (r) => api('/api/restaurants', { method: 'PUT', body: JSON.stringify(r) }),
  getTables: () => api<Table[]>('/api/tables'),
  // ... all other methods become simple fetch calls
};
```

### Add WebSocket client in `DinePulseContext.tsx`

```typescript
useEffect(() => {
  const ws = new WebSocket(`${WS_BASE}/ws?restaurant_id=rst_default`);
  ws.onmessage = (event) => {
    const { type } = JSON.parse(event.data);
    if (type === 'order_updated') refreshOrders();
    if (type === 'table_updated') refreshTables();
    if (type === 'bill_updated') refreshBills();
  };
  return () => ws.close();
}, []);
```

---

## 6. Migration Steps

1. **Create `backend/` directory** with FastAPI app, config, database setup
2. **Define SQLAlchemy models** matching existing Supabase schema
3. **Implement routers** one domain at a time (start with restaurants/tables/menu for read-only, then sessions/orders/bills for mutations)
4. **Add WebSocket manager** for realtime broadcast
5. **Update `requirements.txt`**: `fastapi`, `uvicorn`, `sqlalchemy[asyncio]`, `asyncpg`, `pydantic-settings`, `passlib[bcrypt]`
6. **Rewrite `src/lib/db.ts`** to use `fetch` calls to FastAPI
7. **Remove `src/lib/supabase.ts`** and Supabase dependency from `package.json`
8. **Update `DinePulseContext.tsx`** realtime subscriptions to use WebSocket
9. **Add `.env` variables**: `DATABASE_URL`, `APP_URL`, `CORS_ORIGINS`
10. **Update `vite.config.ts`** to proxy `/api` and `/ws` to FastAPI during dev

---

## 7. Development Setup

```bash
# Terminal 1: Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
npm run dev  # Vite on port 3000, proxies /api → localhost:8000
```

---

## 8. Files Modified (Summary)

| Action | File |
|--------|------|
| **Create** | `backend/` (entire directory, ~25 files) |
| **Rewrite** | `src/lib/db.ts` (fetch-based, no localStorage) |
| **Delete** | `src/lib/supabase.ts` |
| **Edit** | `src/context/DinePulseContext.tsx` (WebSocket instead of Supabase Realtime) |
| **Edit** | `package.json` (remove `@supabase/supabase-js`) |
| **Edit** | `vite.config.ts` (add API proxy) |
| **Edit** | `.env.example` (add `VITE_API_URL`) |

---

## 9. Dependencies

### Python (backend/requirements.txt)
```
fastapi>=0.115.0
uvicorn[standard]>=0.34.0
sqlalchemy[asyncio]>=2.0.36
asyncpg>=0.30.0
pydantic-settings>=2.7.0
passlib[bcrypt]>=1.7.4
python-dotenv>=1.0.1
websockets>=14.2
```

### Frontend (removals from package.json)
- Remove `@supabase/supabase-js`

### Frontend (additions to package.json)
- None required (native `fetch` + `WebSocket` used)
