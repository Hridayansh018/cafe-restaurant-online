/**
 * DinePulse — FastAPI Backend API Client
 * Replaces direct Supabase and localStorage calls with HTTP fetch calls to FastAPI.
 */

import type {
  Restaurant, Table, Category, MenuItem, Session, Order, OrderItem,
  Bill, Invoice, Staff, Customer, Reservation, Campaign,
  OrderStatus, ItemStatus, PaymentMode, PaymentStatus,
} from '../types';

const rawBase = (import.meta.env.VITE_API_URL as string) || '';
const API_BASE = rawBase.replace(/\/+$/, '');

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE}${cleanPath}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[API Error] ${options?.method || 'GET'} ${path} failed (${res.status}):`, errorText);
    throw new Error(errorText || `Request failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── DB API ───────────────────────────────────────────────────

export const db = {
  // ── Auth ──
  async verifyPin(pin: string): Promise<{ success: boolean; role?: string; staff_id?: string; name?: string; message?: string }> {
    return api('/api/auth/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  },

  // ── Restaurant ──
  async getRestaurant(): Promise<Restaurant | null> {
    try {
      return await api<Restaurant>('/api/restaurants');
    } catch (err) {
      console.error('[db] getRestaurant error:', err);
      return null;
    }
  },

  async upsertRestaurant(r: Restaurant): Promise<void> {
    await api<Restaurant>('/api/restaurants', {
      method: 'PUT',
      body: JSON.stringify(r),
    });
  },

  // ── Tables ──
  async getTables(): Promise<Table[]> {
    try {
      return await api<Table[]>('/api/tables');
    } catch (err) {
      console.error('[db] getTables error:', err);
      return [];
    }
  },

  async insertTable(t: Omit<Table, 'table_id' | 'qr_token' | 'qr_issued_at' | 'qr_version'>): Promise<Table> {
    return api<Table>('/api/tables', {
      method: 'POST',
      body: JSON.stringify({
        label: t.label,
        capacity: t.capacity,
        zone: t.zone,
        status: t.status || 'vacant',
        position: t.position || { x: 100, y: 100 },
      }),
    });
  },

  async updateTable(tableId: string, updates: Partial<{
    status: string;
    current_session_id: string | null;
    call_waiter_active: boolean;
    call_waiter_reason: string | null;
    call_waiter_time: string | null;
    qr_token: string;
    qr_issued_at: string | number;
    qr_version: number;
    pos_x: number;
    pos_y: number;
  }>): Promise<void> {
    await api(`/api/tables/${tableId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteTable(tableId: string): Promise<void> {
    await api(`/api/tables/${tableId}`, {
      method: 'DELETE',
    });
  },

  async reissueTableQR(tableId: string, version: number): Promise<string> {
    const res = await api<{ token: string; qr_version: number }>(`/api/tables/${tableId}/reissue-qr?version=${version}`, {
      method: 'POST',
    });
    return res.token;
  },

  // ── Categories ──
  async getCategories(): Promise<Category[]> {
    try {
      return await api<Category[]>('/api/categories');
    } catch (err) {
      console.error('[db] getCategories error:', err);
      return [];
    }
  },

  async insertCategory(name: string, sortOrder: number): Promise<Category> {
    return api<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name, sort_order: sortOrder, is_active: true }),
    });
  },

  async updateCategory(catId: string, updates: Partial<{ name: string; is_active: boolean; sort_order: number }>): Promise<void> {
    await api(`/api/categories/${catId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteCategory(catId: string): Promise<void> {
    await api(`/api/categories/${catId}`, {
      method: 'DELETE',
    });
  },

  // ── Menu Items ──
  async getMenuItems(): Promise<MenuItem[]> {
    try {
      return await api<MenuItem[]>('/api/menu-items');
    } catch (err) {
      console.error('[db] getMenuItems error:', err);
      return [];
    }
  },

  async insertMenuItem(item: Omit<MenuItem, 'item_id'>): Promise<MenuItem> {
    return api<MenuItem>('/api/menu-items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async updateMenuItem(itemId: string, updates: Partial<MenuItem>): Promise<void> {
    await api(`/api/menu-items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteMenuItem(itemId: string): Promise<void> {
    await api(`/api/menu-items/${itemId}`, {
      method: 'DELETE',
    });
  },

  // ── Staff ──
  async getStaff(): Promise<Staff[]> {
    try {
      return await api<Staff[]>('/api/staff');
    } catch (err) {
      console.error('[db] getStaff error:', err);
      return [];
    }
  },

  async insertStaff(s: Omit<Staff, 'staff_id'>, pin?: string): Promise<Staff> {
    return api<Staff>('/api/staff', {
      method: 'POST',
      body: JSON.stringify({ ...s, pin: pin || '1234' }),
    });
  },

  async updateStaff(staffId: string, updates: Partial<{ name: string; role: string; phone: string; is_active: boolean }>, pin?: string): Promise<void> {
    await api(`/api/staff/${staffId}`, {
      method: 'PUT',
      body: JSON.stringify({ ...updates, ...(pin ? { pin } : {}) }),
    });
  },

  async deleteStaff(staffId: string): Promise<void> {
    await api(`/api/staff/${staffId}`, {
      method: 'DELETE',
    });
  },

  // ── Sessions ──
  async getActiveSessions(): Promise<Session[]> {
    try {
      return await api<Session[]>('/api/sessions?status=active');
    } catch (err) {
      console.error('[db] getActiveSessions error:', err);
      return [];
    }
  },

  async getSession(sessionId: string): Promise<Session | null> {
    try {
      return await api<Session>(`/api/sessions/${sessionId}`);
    } catch (err) {
      console.error('[db] getSession error:', err);
      return null;
    }
  },

  async getSessionByTable(tableId: string): Promise<Session | null> {
    try {
      const list = await api<Session[]>(`/api/sessions?table_id=${tableId}&status=active`);
      return list.length > 0 ? list[0] : null;
    } catch (err) {
      console.error('[db] getSessionByTable error:', err);
      return null;
    }
  },

  async insertSession(s: Omit<Session, 'session_id'>): Promise<Session> {
    const firstGuest = s.guests?.[0] || { name: 'Guest', phone: '+919999999999' };
    return api<Session>('/api/sessions/checkin', {
      method: 'POST',
      body: JSON.stringify({
        table_id: s.table_id,
        name: firstGuest.name,
        phone: firstGuest.phone,
        reservation_id: s.reservation_id,
        guests: s.guests,
      }),
    });
  },

  async updateSession(sessionId: string, updates: Partial<{
    status: string;
    guests: object[];
    closed_at: string | null;
    close_reason: string | null;
    reservation_id: string | null;
  }>): Promise<void> {
    await api(`/api/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // ── Orders ──
  async getOrders(options?: { sessionId?: string; status?: OrderStatus[]; limit?: number }): Promise<Order[]> {
    try {
      let path = '/api/orders';
      const params = new URLSearchParams();
      if (options?.sessionId) params.append('session_id', options.sessionId);
      if (params.toString()) path += `?${params.toString()}`;
      let list = await api<Order[]>(path);
      if (options?.status && options.status.length > 0) {
        list = list.filter(o => options.status!.includes(o.status));
      }
      return list;
    } catch (err) {
      console.error('[db] getOrders error:', err);
      return [];
    }
  },

  async getActiveOrders(): Promise<Order[]> {
    try {
      const list = await api<Order[]>('/api/orders');
      return list.filter(o => o.status !== 'served' && o.status !== 'cancelled');
    } catch (err) {
      console.error('[db] getActiveOrders error:', err);
      return [];
    }
  },

  async insertOrder(o: {
    session_id: string;
    table_id: string;
    round_number: number;
    placed_by_name: string;
    placed_by_phone: string;
    sla_deadline: Date;
    subtotal: number;
    items: Omit<OrderItem, 'order_item_id'>[];
  }): Promise<Order> {
    return api<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        session_id: o.session_id,
        table_id: o.table_id,
        round_number: o.round_number,
        placed_by: {
          name: o.placed_by_name,
          phone: o.placed_by_phone,
        },
        items: o.items.map(item => ({
          item_id: item.item_id,
          name_snapshot: item.name_snapshot,
          price_snapshot: item.price_snapshot,
          quantity: item.quantity,
          modifiers_selected: item.modifiers_selected || {},
          special_instructions: item.special_instructions || '',
        })),
      }),
    });
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    await api(`/api/orders/${orderId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  async updateOrderItemStatus(orderItemId: string, status: ItemStatus): Promise<void> {
    await api(`/api/orders/items/${orderItemId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  // ── Bills ──
  async getBills(options?: { sessionId?: string; paymentStatus?: PaymentStatus }): Promise<Bill[]> {
    try {
      let path = '/api/bills';
      const params = new URLSearchParams();
      if (options?.sessionId) params.append('session_id', options.sessionId);
      if (options?.paymentStatus) params.append('status', options.paymentStatus);
      if (params.toString()) path += `?${params.toString()}`;
      return await api<Bill[]>(path);
    } catch (err) {
      console.error('[db] getBills error:', err);
      return [];
    }
  },

  async insertBill(b: Omit<Bill, 'bill_id'>): Promise<Bill> {
    return api<Bill>('/api/bills', {
      method: 'POST',
      body: JSON.stringify({
        session_id: b.session_id,
        table_id: b.table_id,
        order_ids: b.order_ids,
        discount_amount: b.discount_amount || 0,
      }),
    });
  },

  async updateBill(billId: string, updates: Partial<{
    payment_status: string;
    payment_mode: string;
    settled_at: string;
    settled_by_staff_id: string | null;
    total_payable: number;
    items_subtotal: number;
    gst_amount: number;
    reservation_credit_applied: number;
  }>): Promise<void> {
    if (updates.payment_status === 'paid' && updates.payment_mode) {
      await api(`/api/bills/${billId}/settle`, {
        method: 'POST',
        body: JSON.stringify({
          payment_mode: updates.payment_mode,
          settled_by_staff_id: updates.settled_by_staff_id || null,
        }),
      });
    }
  },

  // ── Invoices ──
  async getInvoices(options?: { from?: Date; to?: Date; phone?: string; limit?: number }): Promise<Invoice[]> {
    try {
      let path = '/api/invoices';
      if (options?.phone) path += `?customer_phone=${encodeURIComponent(options.phone)}`;
      return await api<Invoice[]>(path);
    } catch (err) {
      console.error('[db] getInvoices error:', err);
      return [];
    }
  },

  async insertInvoice(inv: Omit<Invoice, 'invoice_id'>): Promise<Invoice> {
    // Invoices are created automatically when settling bills on the backend
    const invoices = await this.getInvoices({ phone: inv.customer_phone });
    const match = invoices.find(i => i.bill_id === inv.bill_id);
    if (match) return match;
    return { ...inv, invoice_id: `inv_${Date.now()}` } as Invoice;
  },

  async updateInvoiceDelivery(invoiceId: string, updates: { whatsapp_status?: string; email_status?: string }): Promise<void> {
    const channel = updates.whatsapp_status ? 'whatsapp' : (updates.email_status ? 'email' : 'both');
    await api(`/api/invoices/${invoiceId}/resend`, {
      method: 'POST',
      body: JSON.stringify({ channel }),
    });
  },

  // ── Customers ──
  async getCustomers(options?: { from?: Date; to?: Date; limit?: number }): Promise<Customer[]> {
    try {
      return await api<Customer[]>('/api/customers');
    } catch (err) {
      console.error('[db] getCustomers error:', err);
      return [];
    }
  },

  async upsertCustomer(phone: string, name: string): Promise<Customer> {
    return api<Customer>('/api/customers', {
      method: 'POST',
      body: JSON.stringify({ phone, name, email: '', marketing_opt_in: true }),
    });
  },

  async incrementCustomerStats(phone: string, amountSpent: number): Promise<void> {
    // Handled automatically on settle in backend
  },

  // ── Reservations ──
  async getReservations(): Promise<Reservation[]> {
    try {
      return await api<Reservation[]>('/api/reservations');
    } catch (err) {
      console.error('[db] getReservations error:', err);
      return [];
    }
  },

  async insertReservation(r: Omit<Reservation, 'reservation_id' | 'created_at'>): Promise<Reservation> {
    return api<Reservation>('/api/reservations', {
      method: 'POST',
      body: JSON.stringify(r),
    });
  },

  async updateReservation(resId: string, updates: Partial<{ status: string; table_preference: string; reminder_sent_at: string }>): Promise<void> {
    await api(`/api/reservations/${resId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteReservation(resId: string): Promise<void> {
    await api(`/api/reservations/${resId}`, {
      method: 'DELETE',
    });
  },

  // ── Campaigns ──
  async getCampaigns(): Promise<Campaign[]> {
    try {
      return await api<Campaign[]>('/api/campaigns');
    } catch (err) {
      console.error('[db] getCampaigns error:', err);
      return [];
    }
  },

  async insertCampaign(c: Omit<Campaign, 'campaign_id' | 'sent_count' | 'opened_count' | 'redeemed_count'>): Promise<Campaign> {
    return api<Campaign>('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(c),
    });
  },

  // ── Analytics ──
  async getDailyRevenue(days = 30): Promise<{ date: string; revenue: number; orders: number }[]> {
    try {
      return await api<{ date: string; revenue: number; orders: number }[]>(`/api/analytics/daily-revenue?days=${days}`);
    } catch (err) {
      console.error('[db] getDailyRevenue error:', err);
      return [];
    }
  },

  async getTopItems(days = 30): Promise<{ item_id: string; name: string; quantity_sold: number; revenue: number }[]> {
    try {
      const items = await api<{ item_id: string; name: string; count: number; revenue: number }[]>('/api/analytics/top-items?limit=10');
      return items.map(i => ({
        item_id: i.item_id,
        name: i.name,
        quantity_sold: i.count,
        revenue: i.revenue,
      }));
    } catch (err) {
      console.error('[db] getTopItems error:', err);
      return [];
    }
  },
};
