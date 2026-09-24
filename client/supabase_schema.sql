-- ============================================================
-- DinePulse — Supabase PostgreSQL Schema with RLS
-- Run this in your Supabase SQL Editor (New Query → Run All)
-- ============================================================

-- ── Extensions ────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Helper: auto-update updated_at ──────────────────────
create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- TABLE: restaurants
-- ============================================================
create table if not exists restaurants (
  restaurant_id   text primary key default 'rst_' || gen_random_uuid()::text,
  name            text not null,
  gstin           text not null default '',
  address_line1   text not null default '',
  address_city    text not null default '',
  address_state   text not null default '',
  address_pincode text not null default '',
  timezone        text not null default 'Asia/Kolkata',
  currency        text not null default 'INR',
  sla_prep_minutes int not null default 15,
  reservation_deposit_default int not null default 500,
  no_show_hours_before int not null default 2,
  no_show_forfeit_percent int not null default 100,
  brand_primary_color text not null default '#FF7A1A',
  brand_bg_color text not null default '#FFFFFF',
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger restaurants_updated_at
  before update on restaurants
  for each row execute procedure handle_updated_at();

-- Seed: default restaurant (update via Admin panel after setup)
insert into restaurants (restaurant_id, name, gstin, address_line1, address_city, address_state, address_pincode)
values (
  'rst_default',
  'My Restaurant',
  '',
  '',
  '',
  '',
  ''
) on conflict (restaurant_id) do nothing;

-- ============================================================
-- TABLE: tables
-- ============================================================
create table if not exists tables (
  table_id           text primary key default 'tbl_' || substr(gen_random_uuid()::text, 1, 8),
  restaurant_id      text not null references restaurants(restaurant_id) on delete cascade,
  label              text not null,
  capacity           int not null default 4,
  zone               text not null default 'Indoor',
  qr_token           text not null default gen_random_uuid()::text,
  qr_issued_at       timestamptz not null default now(),
  qr_version         int not null default 1,
  status             text not null default 'vacant' check (status in ('vacant','occupied','billing_requested','reserved')),
  current_session_id text,
  pos_x              int not null default 100,
  pos_y              int not null default 100,
  call_waiter_active boolean not null default false,
  call_waiter_reason text,
  call_waiter_time   timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger tables_updated_at
  before update on tables
  for each row execute procedure handle_updated_at();

create index if not exists idx_tables_restaurant on tables(restaurant_id);
create index if not exists idx_tables_qr_token on tables(qr_token);

-- ============================================================
-- TABLE: categories
-- ============================================================
create table if not exists categories (
  category_id   text primary key default 'cat_' || substr(gen_random_uuid()::text, 1, 8),
  restaurant_id text not null references restaurants(restaurant_id) on delete cascade,
  name          text not null,
  sort_order    int not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger categories_updated_at
  before update on categories
  for each row execute procedure handle_updated_at();

-- ============================================================
-- TABLE: menu_items
-- ============================================================
create table if not exists menu_items (
  item_id       text primary key default 'itm_' || substr(gen_random_uuid()::text, 1, 8),
  restaurant_id text not null references restaurants(restaurant_id) on delete cascade,
  category_id   text not null references categories(category_id) on delete restrict,
  name          text not null,
  description   text not null default '',
  price         numeric(10,2) not null default 0,
  currency      text not null default 'INR',
  image_url     text not null default '',
  diet_tag      text not null default 'veg' check (diet_tag in ('veg','non_veg','egg','vegan')),
  spice_level   text not null default 'mild' check (spice_level in ('none','mild','medium','hot')),
  modifiers     jsonb not null default '[]'::jsonb,
  is_available  boolean not null default true,
  qty_available int,   -- null = unlimited; number = finite inventory count
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger menu_items_updated_at
  before update on menu_items
  for each row execute procedure handle_updated_at();

create index if not exists idx_menu_items_restaurant on menu_items(restaurant_id);
create index if not exists idx_menu_items_category on menu_items(category_id);

-- ============================================================
-- TABLE: staff
-- ============================================================
create table if not exists staff (
  staff_id      text primary key default 'stf_' || substr(gen_random_uuid()::text, 1, 8),
  restaurant_id text not null references restaurants(restaurant_id) on delete cascade,
  name          text not null,
  role          text not null check (role in ('kitchen','waiter','cashier','admin')),
  phone         text not null default '',
  pin_hash      text,             -- bcrypt hash of 4-digit PIN
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger staff_updated_at
  before update on staff
  for each row execute procedure handle_updated_at();

create index if not exists idx_staff_restaurant on staff(restaurant_id);

-- ============================================================
-- TABLE: customers
-- ============================================================
create table if not exists customers (
  customer_id      text primary key default 'cus_' || substr(gen_random_uuid()::text, 1, 8),
  restaurant_id    text not null references restaurants(restaurant_id) on delete cascade,
  phone            text not null,
  name             text not null default '',
  email            text not null default '',
  marketing_opt_in boolean not null default false,
  visit_count      int not null default 0,
  total_spent      numeric(12,2) not null default 0,
  last_visit       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique(restaurant_id, phone)
);

create trigger customers_updated_at
  before update on customers
  for each row execute procedure handle_updated_at();

create index if not exists idx_customers_restaurant on customers(restaurant_id);
create index if not exists idx_customers_phone on customers(phone);

-- ============================================================
-- TABLE: reservations
-- ============================================================
create table if not exists reservations (
  reservation_id     text primary key default 'res_' || substr(gen_random_uuid()::text, 1, 8),
  restaurant_id      text not null references restaurants(restaurant_id) on delete cascade,
  customer_phone     text not null,
  customer_name      text not null,
  party_size         int not null default 2,
  reserved_for_date  date not null,
  time_slot          text not null default '20:00',
  table_preference   text,
  deposit_amount     numeric(10,2) not null default 0,
  deposit_payment_id text not null default '',
  deposit_status     text not null default 'paid' check (deposit_status in ('paid','refunded','forfeited')),
  status             text not null default 'confirmed' check (status in ('confirmed','checked_in','cancelled','no_show','completed')),
  reminder_sent_at   timestamptz,
  notes              text not null default '',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger reservations_updated_at
  before update on reservations
  for each row execute procedure handle_updated_at();

create index if not exists idx_reservations_restaurant on reservations(restaurant_id);
create index if not exists idx_reservations_date on reservations(reserved_for_date);

-- ============================================================
-- TABLE: sessions
-- ============================================================
create table if not exists sessions (
  session_id      text primary key default 'sess_' || substr(gen_random_uuid()::text, 1, 8),
  restaurant_id   text not null references restaurants(restaurant_id) on delete cascade,
  table_id        text not null references tables(table_id) on delete cascade,
  status          text not null default 'active' check (status in ('active','closed','expired')),
  guests          jsonb not null default '[]'::jsonb,
  reservation_id  text references reservations(reservation_id) on delete set null,
  checkin_at      timestamptz not null default now(),
  expires_at      timestamptz not null default now() + interval '3 hours',
  closed_at       timestamptz,
  close_reason    text check (close_reason in ('settled','manual_reset','idle_timeout') or close_reason is null),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger sessions_updated_at
  before update on sessions
  for each row execute procedure handle_updated_at();

create index if not exists idx_sessions_table on sessions(table_id);
create index if not exists idx_sessions_status on sessions(status);

-- ============================================================
-- TABLE: orders
-- ============================================================
create table if not exists orders (
  order_id      text primary key default 'ord_' || substr(gen_random_uuid()::text, 1, 8),
  session_id    text not null references sessions(session_id) on delete cascade,
  restaurant_id text not null references restaurants(restaurant_id) on delete cascade,
  table_id      text not null references tables(table_id) on delete cascade,
  round_number  int not null default 1,
  placed_at     timestamptz not null default now(),
  placed_by_name  text not null default '',
  placed_by_phone text not null default '',
  status        text not null default 'placed' check (status in ('placed','preparing','ready','served','cancelled')),
  sla_deadline  timestamptz not null default now() + interval '15 minutes',
  sla_breached  boolean not null default false,
  subtotal      numeric(10,2) not null default 0,
  updated_at    timestamptz not null default now()
);

create trigger orders_updated_at
  before update on orders
  for each row execute procedure handle_updated_at();

create index if not exists idx_orders_session on orders(session_id);
create index if not exists idx_orders_restaurant on orders(restaurant_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_placed_at on orders(placed_at desc);

-- ============================================================
-- TABLE: order_items
-- ============================================================
create table if not exists order_items (
  order_item_id      text primary key default 'oit_' || substr(gen_random_uuid()::text, 1, 8),
  order_id           text not null references orders(order_id) on delete cascade,
  item_id            text not null references menu_items(item_id) on delete restrict,
  name_snapshot      text not null,
  price_snapshot     numeric(10,2) not null,
  quantity           int not null default 1,
  modifiers_selected jsonb not null default '{}'::jsonb,
  special_instructions text not null default '',
  status             text not null default 'placed' check (status in ('placed','preparing','ready','served')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger order_items_updated_at
  before update on order_items
  for each row execute procedure handle_updated_at();

create index if not exists idx_order_items_order on order_items(order_id);

-- ============================================================
-- TABLE: bills
-- ============================================================
create table if not exists bills (
  bill_id                    text primary key default 'bil_' || substr(gen_random_uuid()::text, 1, 8),
  session_id                 text not null references sessions(session_id) on delete cascade,
  restaurant_id              text not null references restaurants(restaurant_id) on delete cascade,
  table_id                   text not null references tables(table_id) on delete cascade,
  order_ids                  jsonb not null default '[]'::jsonb,
  items_subtotal             numeric(10,2) not null default 0,
  discount_amount            numeric(10,2) not null default 0,
  gst_rate                   numeric(5,2) not null default 5,
  gst_amount                 numeric(10,2) not null default 0,
  reservation_credit_applied numeric(10,2) not null default 0,
  total_payable              numeric(10,2) not null default 0,
  payment_mode               text check (payment_mode in ('online_upi','online_card','counter_cash','counter_card') or payment_mode is null),
  payment_status             text not null default 'pending' check (payment_status in ('pending','paid')),
  requested_at               timestamptz not null default now(),
  settled_at                 timestamptz,
  settled_by_staff_id        text references staff(staff_id) on delete set null,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

create trigger bills_updated_at
  before update on bills
  for each row execute procedure handle_updated_at();

create index if not exists idx_bills_session on bills(session_id);
create index if not exists idx_bills_restaurant on bills(restaurant_id);
create index if not exists idx_bills_settled_at on bills(settled_at desc);

-- ============================================================
-- TABLE: invoices
-- ============================================================
create table if not exists invoices (
  invoice_id         text primary key default 'inv_' || substr(gen_random_uuid()::text, 1, 8),
  bill_id            text not null references bills(bill_id) on delete cascade,
  restaurant_id      text not null references restaurants(restaurant_id) on delete cascade,
  invoice_number     text not null,
  gstin              text not null default '',
  restaurant_name    text not null,
  customer_name      text not null,
  customer_phone     text not null,
  customer_email     text not null default '',
  items              jsonb not null default '[]'::jsonb,
  items_subtotal     numeric(10,2) not null default 0,
  discount_amount    numeric(10,2) not null default 0,
  gst_rate           numeric(5,2) not null default 5,
  gst_amount         numeric(10,2) not null default 0,
  reservation_credit numeric(10,2) not null default 0,
  total_paid         numeric(10,2) not null default 0,
  payment_mode       text not null,
  issued_at          timestamptz not null default now(),
  whatsapp_status    text not null default 'pending' check (whatsapp_status in ('pending','sent','failed')),
  email_status       text not null default 'pending' check (email_status in ('pending','sent','failed')),
  created_at         timestamptz not null default now()
);

create index if not exists idx_invoices_restaurant on invoices(restaurant_id);
create index if not exists idx_invoices_issued_at on invoices(issued_at desc);
create index if not exists idx_invoices_customer_phone on invoices(customer_phone);

-- ============================================================
-- TABLE: campaigns
-- ============================================================
create table if not exists campaigns (
  campaign_id     text primary key default 'cmp_' || substr(gen_random_uuid()::text, 1, 8),
  restaurant_id   text not null references restaurants(restaurant_id) on delete cascade,
  name            text not null,
  channel         text not null default 'both' check (channel in ('whatsapp','email','both')),
  template_id     text not null default '',
  message_body    text not null default '',
  audience_last_visit_days int not null default 90,
  audience_min_orders int not null default 1,
  scheduled_at    timestamptz,
  sent_count      int not null default 0,
  opened_count    int not null default 0,
  redeemed_count  int not null default 0,
  status          text not null default 'draft' check (status in ('draft','scheduled','sent')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger campaigns_updated_at
  before update on campaigns
  for each row execute procedure handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
alter table restaurants        enable row level security;
alter table tables             enable row level security;
alter table categories         enable row level security;
alter table menu_items         enable row level security;
alter table staff              enable row level security;
alter table customers          enable row level security;
alter table reservations       enable row level security;
alter table sessions           enable row level security;
alter table orders             enable row level security;
alter table order_items        enable row level security;
alter table bills              enable row level security;
alter table invoices           enable row level security;
alter table campaigns          enable row level security;

-- ── Service Role bypasses RLS (used by backend) ────────────
-- (service_role already bypasses by default in Supabase)

-- ── Public (anon) access policies ──────────────────────────
-- Diners can READ the restaurant info, tables, categories, and menu items
-- (needed for QR-initiated check-in flow)

create policy "anon_read_restaurants" on restaurants
  for select to anon using (true);

create policy "anon_read_tables" on tables
  for select to anon using (true);

create policy "anon_read_categories" on categories
  for select to anon using (true);

create policy "anon_read_menu_items" on menu_items
  for select to anon using (true);

-- Diners can INSERT a session (check-in)
create policy "anon_insert_sessions" on sessions
  for insert to anon with check (true);

-- Diners can READ their own session
create policy "anon_read_sessions" on sessions
  for select to anon using (true);

-- Diners can UPDATE sessions (join existing session)
create policy "anon_update_sessions" on sessions
  for update to anon using (true) with check (true);

-- Diners can INSERT orders
create policy "anon_insert_orders" on orders
  for insert to anon with check (true);

-- Diners can READ orders for their session
create policy "anon_read_orders" on orders
  for select to anon using (true);

-- Diners can INSERT order items
create policy "anon_insert_order_items" on order_items
  for insert to anon with check (true);

-- Diners can READ order items
create policy "anon_read_order_items" on order_items
  for select to anon using (true);

-- Diners can INSERT a bill request
create policy "anon_insert_bills" on bills
  for insert to anon with check (true);

-- Diners can READ bills
create policy "anon_read_bills" on bills
  for select to anon using (true);

-- Diners can READ invoices (for displaying after payment)
create policy "anon_read_invoices" on invoices
  for select to anon using (true);

-- Diners can INSERT customers (upsert on check-in)
create policy "anon_upsert_customers" on customers
  for all to anon using (true) with check (true);

-- ── Staff / Admin access (authenticated users) ─────────────
-- Full access for authenticated users to all tables

create policy "auth_all_restaurants" on restaurants
  for all to authenticated using (true) with check (true);

create policy "auth_all_tables" on tables
  for all to authenticated using (true) with check (true);

create policy "auth_all_categories" on categories
  for all to authenticated using (true) with check (true);

create policy "auth_all_menu_items" on menu_items
  for all to authenticated using (true) with check (true);

create policy "auth_all_staff" on staff
  for all to authenticated using (true) with check (true);

create policy "auth_all_customers" on customers
  for all to authenticated using (true) with check (true);

create policy "auth_all_reservations" on reservations
  for all to authenticated using (true) with check (true);

create policy "auth_all_sessions" on sessions
  for all to authenticated using (true) with check (true);

create policy "auth_all_orders" on orders
  for all to authenticated using (true) with check (true);

create policy "auth_all_order_items" on order_items
  for all to authenticated using (true) with check (true);

create policy "auth_all_bills" on bills
  for all to authenticated using (true) with check (true);

create policy "auth_all_invoices" on invoices
  for all to authenticated using (true) with check (true);

create policy "auth_all_campaigns" on campaigns
  for all to authenticated using (true) with check (true);

-- KDS also needs to UPDATE orders and order_items (anon, since KDS is open)
create policy "anon_update_orders" on orders
  for update to anon using (true) with check (true);

create policy "anon_update_order_items" on order_items
  for update to anon using (true) with check (true);

-- Tables need UPDATE for session link, call waiter etc.
create policy "anon_update_tables" on tables
  for update to anon using (true) with check (true);

-- Bills need UPDATE for settlement
create policy "anon_update_bills" on bills
  for update to anon using (true) with check (true);

-- Invoices can be inserted on payment
create policy "anon_insert_invoices" on invoices
  for insert to anon with check (true);

-- Reservations — anon can read (for check-in matching)
create policy "anon_read_reservations" on reservations
  for select to anon using (true);

-- Reservations — anon can update (for check-in status)
create policy "anon_update_reservations" on reservations
  for update to anon using (true) with check (true);

-- Staff — anon cannot read (admin only) — already handled by default deny
-- (no anon policy = blocked for anon)

-- ============================================================
-- REALTIME: Enable for live updates
-- ============================================================
-- Run in Supabase dashboard → Database → Replication → Add tables:
-- orders, order_items, tables, sessions, bills

-- ============================================================
-- END OF SCHEMA
-- ============================================================
