export type DietTag = 'veg' | 'non_veg' | 'egg' | 'vegan';
export type SpiceLevel = 'none' | 'mild' | 'medium' | 'hot';
export type TableStatus = 'vacant' | 'occupied' | 'billing_requested' | 'reserved';
export type SessionStatus = 'active' | 'closed' | 'expired';
export type OrderStatus = 'placed' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type ItemStatus = 'placed' | 'preparing' | 'ready' | 'served';
export type StaffRole = 'kitchen' | 'waiter' | 'cashier' | 'admin';
export type PaymentMode = 'online_upi' | 'online_card' | 'counter_cash' | 'counter_card';
export type PaymentStatus = 'pending' | 'paid';
export type ReservationStatus = 'confirmed' | 'checked_in' | 'cancelled' | 'no_show' | 'completed';
export type DepositStatus = 'paid' | 'refunded' | 'forfeited';
export type CampaignStatus = 'draft' | 'scheduled' | 'sent';
export type DeliveryStatus = 'pending' | 'sent' | 'failed';

export interface Restaurant {
  restaurant_id: string;
  name: string;
  gstin: string;
  address: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
  };
  timezone: string;
  currency: string;
  sla_prep_minutes: number;
  reservation_deposit_default: number;
  no_show_forfeit_policy: {
    hours_before: number;
    forfeit_percent: number;
  };
  brand_theme: {
    primary_color: string;
    background_color: string;
  };
  status: 'active' | 'inactive';
}

export interface Table {
  table_id: string;
  label: string;
  capacity: number;
  zone: string;
  qr_token: string;
  qr_issued_at: number; // epoch ms
  qr_version: number;
  status: TableStatus;
  current_session_id: string | null;
  position: { x: number; y: number };
  call_waiter_active?: boolean;
  call_waiter_reason?: string;
  call_waiter_time?: number;
}

export interface Category {
  category_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface MenuModifier {
  name: string;
  options: string[];
}

export interface MenuItem {
  item_id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_url: string;
  diet_tag: DietTag;
  spice_level: SpiceLevel;
  modifiers: MenuModifier[];
  is_available: boolean;
  qty_available: number | null; // null = unlimited
  sort_order: number;
}

export interface Guest {
  name: string;
  phone: string;
  joined_at: number;
}

export interface Session {
  session_id: string;
  table_id: string;
  status: SessionStatus;
  guests: Guest[];
  reservation_id: string | null;
  checkin_at: number;
  expires_at: number;
  closed_at: number | null;
  close_reason: 'settled' | 'manual_reset' | 'idle_timeout' | null;
}

export interface OrderItem {
  order_item_id: string;
  item_id: string;
  name_snapshot: string;
  price_snapshot: number;
  quantity: number;
  modifiers_selected: Record<string, string>;
  special_instructions?: string;
  status: ItemStatus;
}

export interface Order {
  order_id: string;
  session_id: string;
  table_id: string;
  round_number: number;
  placed_at: number;
  placed_by: { name: string; phone: string };
  status: OrderStatus;
  sla_deadline: number;
  sla_breached: boolean;
  items: OrderItem[];
  subtotal: number;
  updated_at: number;
}

export interface Reservation {
  reservation_id: string;
  customer_phone: string;
  customer_name: string;
  party_size: number;
  reserved_for_date: string; // ISO date string YYYY-MM-DD
  time_slot: string;
  table_preference: string;
  deposit_amount: number;
  deposit_payment_id: string;
  deposit_status: DepositStatus;
  status: ReservationStatus;
  reminder_sent_at: number | null;
  notes: string;
  created_at: number;
}

export interface Bill {
  bill_id: string;
  session_id: string;
  table_id: string;
  order_ids: string[];
  items_subtotal: number;
  discount_amount: number;
  gst_rate: number;
  gst_amount: number;
  reservation_credit_applied: number;
  total_payable: number;
  payment_mode?: PaymentMode;
  payment_status: PaymentStatus;
  requested_at: number;
  settled_at: number | null;
  settled_by_staff_id?: string | null;
}

export interface InvoiceLineItem {
  name: string;
  price: number;
  quantity: number;
  amount: number;
}

export interface Invoice {
  invoice_id: string;
  bill_id: string;
  invoice_number: string;
  gstin: string;
  restaurant_name: string;
  restaurant_address: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
  };
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  items: InvoiceLineItem[];
  items_subtotal: number;
  discount_amount: number;
  gst_rate: number;
  gst_amount: number;
  reservation_credit: number;
  total_paid: number;
  payment_mode: PaymentMode;
  issued_at: number;
  whatsapp_status: DeliveryStatus;
  email_status: DeliveryStatus;
}

export interface Staff {
  staff_id: string;
  name: string;
  role: StaffRole;
  phone: string;
  is_active: boolean;
}

export interface Campaign {
  campaign_id: string;
  name: string;
  channel: 'whatsapp' | 'email' | 'both';
  template_id: string;
  message_body: string;
  audience_filter: {
    last_visit_within_days: number;
    min_orders: number;
  };
  scheduled_at: number | null;
  sent_count: number;
  opened_count: number;
  redeemed_count: number;
  status: CampaignStatus;
}

export interface Customer {
  customer_id: string;
  phone: string;
  name: string;
  email: string;
  marketing_opt_in: boolean;
  visit_count: number;
  total_spent: number;
  last_visit: number | null;
  created_at: number;
}

export interface RevenueStats {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  period_days: number;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}
