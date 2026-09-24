import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { db } from '../lib/db';
import type {
  Restaurant, Table, Category, MenuItem, Session, Order, OrderItem,
  Bill, Invoice, Reservation, Staff, Campaign, Customer,
  OrderStatus, ItemStatus, PaymentMode,
} from '../types';

// ─── Toast ────────────────────────────────────────────────────

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

// ─── Context type ─────────────────────────────────────────────

interface DinePulseContextType {
  // Loading state
  isLoading: boolean;

  // Restaurant
  restaurant: Restaurant;
  updateRestaurant: (updates: Partial<Restaurant>) => Promise<void>;

  // Tables
  tables: Table[];
  updateTableStatus: (tableId: string, status: Table['status']) => Promise<void>;
  reissueTableQR: (tableId: string) => Promise<void>;
  addTable: (table: Omit<Table, 'table_id' | 'qr_token' | 'qr_issued_at' | 'qr_version'>) => Promise<void>;
  deleteTable: (tableId: string) => Promise<void>;
  callWaiter: (tableId: string, reason?: string) => Promise<void>;
  resolveWaiterCall: (tableId: string) => Promise<void>;

  // Categories
  categories: Category[];
  addCategory: (name: string) => Promise<void>;
  updateCategory: (catId: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (catId: string) => Promise<void>;

  // Menu Items
  menuItems: MenuItem[];
  toggleItemAvailability: (itemId: string) => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'item_id'>) => Promise<void>;
  updateMenuItem: (itemId: string, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (itemId: string) => Promise<void>;

  // Diner & Session (QR-gated)
  currentTableId: string;
  setCurrentTableId: (id: string) => void;
  activeSession: Session | null;
  checkinDiner: (tableId: string, name: string, phone: string) => Promise<{ session: Session; matchedReservation: Reservation | null }>;
  resetCurrentSession: () => Promise<void>;

  // Orders
  orders: Order[];
  placeOrder: (
    tableId: string,
    sessionId: string,
    items: Array<{ item: MenuItem; quantity: number; modifiers: Record<string, string>; instructions?: string }>,
    placedBy: { name: string; phone: string }
  ) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updateOrderItemStatus: (orderId: string, orderItemId: string, status: ItemStatus) => Promise<void>;

  // Billing & Invoicing
  bills: Bill[];
  invoices: Invoice[];
  currentBill: Bill | null;
  requestBill: (tableId: string, sessionId: string) => Promise<Bill>;
  settleBill: (billId: string, paymentMode: PaymentMode, staffId?: string) => Promise<Invoice>;

  // Reservations
  reservations: Reservation[];
  addReservation: (r: Omit<Reservation, 'reservation_id' | 'created_at'>) => Promise<Reservation>;
  updateReservation: (resId: string, updates: Partial<Reservation>) => Promise<void>;
  deleteReservation: (resId: string) => Promise<void>;
  checkinReservation: (reservationId: string, tableId: string) => Promise<void>;

  // Staff
  staff: Staff[];
  addStaff: (name: string, role: Staff['role'], phone: string) => Promise<void>;
  updateStaff: (staffId: string, updates: Partial<Staff>) => Promise<void>;
  deleteStaff: (staffId: string) => Promise<void>;

  // Customers
  customers: Customer[];
  refreshCustomers: () => Promise<void>;

  // Campaigns
  campaigns: Campaign[];
  addCampaign: (c: Omit<Campaign, 'campaign_id' | 'sent_count' | 'opened_count' | 'redeemed_count'>) => Promise<void>;

  // Invoices (re-send)
  resendInvoiceWhatsApp: (invoiceId: string) => Promise<void>;
  resendInvoiceEmail: (invoiceId: string) => Promise<void>;

  // Toasts
  toasts: Toast[];
  dismissToast: (id: string) => void;
  addToast: (title: string, message: string, type?: Toast['type']) => void;
}

// ─── Default restaurant placeholder ───────────────────────────

const DEFAULT_RESTAURANT: Restaurant = {
  restaurant_id: 'rst_default',
  name: 'My Restaurant',
  gstin: '',
  address: { line1: '', city: '', state: '', pincode: '' },
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  sla_prep_minutes: 15,
  reservation_deposit_default: 500,
  no_show_forfeit_policy: { hours_before: 2, forfeit_percent: 100 },
  brand_theme: { primary_color: '#FF7A1A', background_color: '#FFFFFF' },
  status: 'active',
};

// ─── Context ──────────────────────────────────────────────────

const DinePulseContext = createContext<DinePulseContextType | undefined>(undefined);

export const DinePulseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant>(DEFAULT_RESTAURANT);
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [currentTableId, setCurrentTableId] = useState<string>('');
  const [activeSession, setActiveSession] = useState<Session | null>(null);

  const toastTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // ─── Toast helpers ──────────────────────────────────────────
  const addToast = useCallback((title: string, message: string, type: Toast['type'] = 'info') => {
    const id = 't_' + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, message, type, timestamp: Date.now() }]);
    const t = setTimeout(() => {
      setToasts(prev => prev.filter(x => x.id !== id));
      toastTimeouts.current.delete(id);
    }, 5000);
    toastTimeouts.current.set(id, t);
  }, []);

  const dismissToast = useCallback((id: string) => {
    const t = toastTimeouts.current.get(id);
    if (t) { clearTimeout(t); toastTimeouts.current.delete(id); }
    setToasts(prev => prev.filter(x => x.id !== id));
  }, []);

  // ─── Initial data load ─────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [rst, tbls, cats, items, stf, res, custs, camps, ords, bls, invs] = await Promise.all([
          db.getRestaurant(),
          db.getTables(),
          db.getCategories(),
          db.getMenuItems(),
          db.getStaff(),
          db.getReservations(),
          db.getCustomers(),
          db.getCampaigns(),
          db.getActiveOrders(),
          db.getBills(),
          db.getInvoices({ limit: 100 }),
        ]);
        if (cancelled) return;
        if (rst) setRestaurant(rst);
        setTables(tbls);
        setCategories(cats);
        setMenuItems(items);
        setStaff(stf);
        setReservations(res);
        setCustomers(custs);
        setCampaigns(camps);
        setOrders(ords);
        setBills(bls);
        setInvoices(invs);
      } catch (err) {
        console.error('[DinePulse] Initial load error:', err);
        addToast('Connection Error', 'Could not connect to backend server. Make sure the FastAPI server is running.', 'error');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [addToast]);

  // ─── Realtime WebSocket connection ─────────────────────────
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let isMounted = true;

    const connectWs = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = import.meta.env.VITE_API_URL
          ? new URL(import.meta.env.VITE_API_URL).host
          : window.location.host;
        const wsUrl = `${protocol}//${host}/ws?restaurant_id=rst_default`;
        ws = new WebSocket(wsUrl);

        ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'order_updated') {
              const fresh = await db.getActiveOrders();
              if (isMounted) setOrders(fresh);
            } else if (data.type === 'table_updated') {
              const fresh = await db.getTables();
              if (isMounted) setTables(fresh);
            } else if (data.type === 'bill_updated') {
              const fresh = await db.getBills();
              if (isMounted) setBills(fresh);
            } else if (data.type === 'session_updated') {
              if (currentTableId) {
                const sess = await db.getSessionByTable(currentTableId);
                if (isMounted) setActiveSession(sess);
              }
            }
          } catch (e) {
            console.warn('[WS] parse error:', e);
          }
        };

        ws.onclose = () => {
          if (isMounted) {
            reconnectTimeout = setTimeout(connectWs, 3000);
          }
        };

        ws.onerror = (err) => {
          console.warn('[WS] connection error:', err);
          ws?.close();
        };
      } catch (err) {
        console.warn('[WS] setup failed:', err);
      }
    };

    connectWs();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [currentTableId]);

  // ─── SLA monitor ───────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const breached = orders.filter(
        o => (o.status === 'placed' || o.status === 'preparing') && !o.sla_breached && now > o.sla_deadline
      );
      if (breached.length > 0) {
        setOrders(prev => prev.map(o =>
          breached.find(b => b.order_id === o.order_id) ? { ...o, sla_breached: true } : o
        ));
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [orders]);

  // ─── Current session for diner ─────────────────────────────
  useEffect(() => {
    if (!currentTableId) { setActiveSession(null); return; }
    let cancelled = false;
    db.getSessionByTable(currentTableId).then(sess => {
      if (!cancelled) setActiveSession(sess);
    });
    return () => { cancelled = true; };
  }, [currentTableId, tables]);

  // ─── currentBill ───────────────────────────────────────────
  const currentBill = activeSession
    ? bills.find(b => b.session_id === activeSession.session_id && b.payment_status === 'pending') || null
    : null;

  // ─── Restaurant ────────────────────────────────────────────
  const updateRestaurant = async (updates: Partial<Restaurant>) => {
    const merged = { ...restaurant, ...updates };
    setRestaurant(merged);
    await db.upsertRestaurant(merged);
    addToast('Settings Updated', 'Restaurant profile saved.', 'success');
  };

  // ─── Tables ────────────────────────────────────────────────
  const updateTableStatus = async (tableId: string, status: Table['status']) => {
    setTables(prev => prev.map(t => t.table_id === tableId ? { ...t, status } : t));
    await db.updateTable(tableId, { status });
  };

  const reissueTableQR = async (tableId: string) => {
    const tbl = tables.find(t => t.table_id === tableId);
    if (!tbl) return;
    const newVersion = tbl.qr_version + 1;
    const newToken = await db.reissueTableQR(tableId, newVersion);
    setTables(prev => prev.map(t =>
      t.table_id === tableId
        ? { ...t, qr_token: newToken, qr_issued_at: Date.now(), qr_version: newVersion }
        : t
    ));
    addToast('QR Reissued', `Table ${tbl.label} QR invalidated & new token generated.`, 'success');
  };

  const addTable = async (tableData: Omit<Table, 'table_id' | 'qr_token' | 'qr_issued_at' | 'qr_version'>) => {
    const newTable = await db.insertTable(tableData);
    if (newTable) {
      setTables(prev => [...prev, newTable]);
      addToast('Table Added', `Table ${newTable.label} created.`, 'success');
    }
  };

  const deleteTable = async (tableId: string) => {
    const tbl = tables.find(t => t.table_id === tableId);
    await db.deleteTable(tableId);
    setTables(prev => prev.filter(t => t.table_id !== tableId));
    addToast('Table Removed', `Table ${tbl?.label || tableId} removed.`, 'info');
  };

  const callWaiter = async (tableId: string, reason = 'Assistance requested') => {
    const now = new Date().toISOString();
    setTables(prev => prev.map(t =>
      t.table_id === tableId
        ? { ...t, call_waiter_active: true, call_waiter_reason: reason, call_waiter_time: Date.now() }
        : t
    ));
    await db.updateTable(tableId, { call_waiter_active: true, call_waiter_reason: reason, call_waiter_time: now });
    const label = tables.find(t => t.table_id === tableId)?.label || tableId;
    addToast('Waiter Alert', `Staff notified for Table ${label}: ${reason}`, 'warning');
  };

  const resolveWaiterCall = async (tableId: string) => {
    setTables(prev => prev.map(t =>
      t.table_id === tableId
        ? { ...t, call_waiter_active: false, call_waiter_reason: undefined, call_waiter_time: undefined }
        : t
    ));
    await db.updateTable(tableId, { call_waiter_active: false, call_waiter_reason: null, call_waiter_time: null });
    const label = tables.find(t => t.table_id === tableId)?.label || tableId;
    addToast('Alert Cleared', `Waiter call for Table ${label} resolved.`, 'info');
  };

  // ─── Categories ────────────────────────────────────────────
  const addCategory = async (name: string) => {
    const cat = await db.insertCategory(name, categories.length + 1);
    if (cat) {
      setCategories(prev => [...prev, cat]);
      addToast('Category Created', `"${name}" added.`, 'success');
    }
  };

  const updateCategory = async (catId: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.category_id === catId ? { ...c, ...updates } : c));
    await db.updateCategory(catId, updates);
    addToast('Category Updated', 'Changes saved.', 'success');
  };

  const deleteCategory = async (catId: string) => {
    await db.deleteCategory(catId);
    setCategories(prev => prev.filter(c => c.category_id !== catId));
    addToast('Category Deleted', 'Category removed.', 'info');
  };

  // ─── Menu Items ────────────────────────────────────────────
  const toggleItemAvailability = async (itemId: string) => {
    const item = menuItems.find(i => i.item_id === itemId);
    if (!item) return;
    const newStatus = !item.is_available;
    setMenuItems(prev => prev.map(i => i.item_id === itemId ? { ...i, is_available: newStatus } : i));
    await db.updateMenuItem(itemId, { is_available: newStatus });
    addToast(
      newStatus ? 'Item Available' : "Item 86'd",
      `"${item.name}" is now ${newStatus ? 'active' : 'unavailable'}.`,
      newStatus ? 'success' : 'warning'
    );
  };

  const addMenuItem = async (itemData: Omit<MenuItem, 'item_id'>) => {
    const item = await db.insertMenuItem(itemData);
    if (item) {
      setMenuItems(prev => [...prev, item]);
      addToast('Menu Item Added', `"${item.name}" added to menu.`, 'success');
    }
  };

  const updateMenuItem = async (itemId: string, updates: Partial<MenuItem>) => {
    setMenuItems(prev => prev.map(i => i.item_id === itemId ? { ...i, ...updates } : i));
    await db.updateMenuItem(itemId, updates);
    addToast('Item Updated', 'Menu item changes saved.', 'success');
  };

  const deleteMenuItem = async (itemId: string) => {
    await db.deleteMenuItem(itemId);
    setMenuItems(prev => prev.filter(i => i.item_id !== itemId));
    addToast('Item Deleted', 'Menu item removed.', 'info');
  };

  // ─── Diner check-in (QR-gated) ────────────────────────────
  const checkinDiner = async (tableId: string, name: string, phone: string) => {
    const targetTable = tables.find(t => t.table_id === tableId);
    if (!targetTable) throw new Error('Table not found');

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const matchedReservation = reservations.find(
      r =>
        (r.customer_phone.includes(cleanPhone) || cleanPhone.includes(r.customer_phone.replace(/\+/g, ''))) &&
        r.status === 'confirmed'
    ) || null;

    let session: Session;

    // Try to join existing session
    const existingSession = await db.getSessionByTable(tableId);
    if (existingSession && existingSession.status === 'active') {
      const updatedGuests = [...existingSession.guests, { name, phone, joined_at: Date.now() }];
      await db.updateSession(existingSession.session_id, { guests: updatedGuests });
      session = { ...existingSession, guests: updatedGuests };
    } else {
      const newSess = await db.insertSession({
        table_id: tableId,
        status: 'active',
        guests: [{ name, phone, joined_at: Date.now() }],
        reservation_id: matchedReservation?.reservation_id || null,
        checkin_at: Date.now(),
        expires_at: Date.now() + 3 * 3600000,
        closed_at: null,
        close_reason: null,
      });
      if (!newSess) throw new Error('Failed to create session');
      session = newSess;
    }

    // Link table to session
    await db.updateTable(tableId, { status: 'occupied', current_session_id: session.session_id });
    setTables(prev => prev.map(t =>
      t.table_id === tableId ? { ...t, status: 'occupied', current_session_id: session.session_id } : t
    ));
    setActiveSession(session);

    // Upsert customer
    await db.upsertCustomer(cleanPhone, name);
    setCustomers(prev => {
      const exists = prev.find(c => c.phone === cleanPhone);
      if (!exists) return [...prev, { customer_id: '', phone: cleanPhone, name, email: '', marketing_opt_in: false, visit_count: 1, total_spent: 0, last_visit: Date.now(), created_at: Date.now() }];
      return prev.map(c => c.phone === cleanPhone ? { ...c, name, last_visit: Date.now() } : c);
    });

    if (matchedReservation) {
      await db.updateReservation(matchedReservation.reservation_id, { status: 'checked_in' });
      setReservations(prev => prev.map(r =>
        r.reservation_id === matchedReservation.reservation_id ? { ...r, status: 'checked_in' } : r
      ));
      addToast(
        'Reservation Linked!',
        `Welcome ${name}! ₹${matchedReservation.deposit_amount} deposit credited to your bill.`,
        'success'
      );
    } else {
      addToast('Checked In', `Welcome to Table ${targetTable.label}, ${name}!`, 'success');
    }

    return { session, matchedReservation };
  };

  const resetCurrentSession = async () => {
    if (!currentTableId) return;
    const currentTable = tables.find(t => t.table_id === currentTableId);
    if (currentTable?.current_session_id) {
      await db.updateSession(currentTable.current_session_id, {
        status: 'closed',
        closed_at: new Date().toISOString(),
        close_reason: 'manual_reset',
      });
    }
    await db.updateTable(currentTableId, { status: 'vacant', current_session_id: null, call_waiter_active: false });
    setTables(prev => prev.map(t =>
      t.table_id === currentTableId ? { ...t, status: 'vacant', current_session_id: null, call_waiter_active: false } : t
    ));
    setActiveSession(null);
    addToast('Session Reset', `Table ${currentTable?.label || currentTableId} is now vacant.`, 'info');
  };

  // ─── Orders ────────────────────────────────────────────────
  const placeOrder = async (
    tableId: string,
    sessionId: string,
    items: Array<{ item: MenuItem; quantity: number; modifiers: Record<string, string>; instructions?: string }>,
    placedBy: { name: string; phone: string }
  ): Promise<Order> => {
    const existingRounds = orders.filter(o => o.session_id === sessionId).length;
    const roundNumber = existingRounds + 1;
    const subtotal = items.reduce((sum, i) => sum + i.item.price * i.quantity, 0);
    const slaDeadline = new Date(Date.now() + restaurant.sla_prep_minutes * 60000);

    const newOrder = await db.insertOrder({
      session_id: sessionId,
      table_id: tableId,
      round_number: roundNumber,
      placed_by_name: placedBy.name,
      placed_by_phone: placedBy.phone,
      sla_deadline: slaDeadline,
      subtotal,
      items: items.map((i, idx) => ({
        item_id: i.item.item_id,
        name_snapshot: i.item.name,
        price_snapshot: i.item.price,
        quantity: i.quantity,
        modifiers_selected: i.modifiers,
        special_instructions: i.instructions || '',
        status: 'placed' as ItemStatus,
        order_item_id: '',
      })),
    });

    if (!newOrder) throw new Error('Failed to place order');
    setOrders(prev => [newOrder, ...prev]);
    const label = tables.find(t => t.table_id === tableId)?.label || tableId;
    addToast(`Round ${roundNumber} Placed!`, `Table ${label} — ${items.length} items (₹${subtotal}) sent to kitchen!`, 'success');
    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    await db.updateOrderStatus(orderId, status);
    setOrders(prev => prev.map(o => {
      if (o.order_id !== orderId) return o;
      const itemStatus = status === 'cancelled' ? 'placed' : status;
      return { ...o, status, items: o.items.map(i => ({ ...i, status: itemStatus as ItemStatus })), updated_at: Date.now() };
    }));
    const ord = orders.find(o => o.order_id === orderId);
    const label = tables.find(t => t.table_id === ord?.table_id)?.label || '';
    if (status === 'ready') addToast('Dish Ready! 🔔', `Order for Table ${label} ready for delivery.`, 'success');
    else if (status === 'preparing') addToast('Cooking Started', `Table ${label} order in kitchen.`, 'info');
    else if (status === 'served') addToast('Order Served', `Table ${label} order delivered.`, 'info');
  };

  const updateOrderItemStatus = async (orderId: string, orderItemId: string, status: ItemStatus) => {
    await db.updateOrderItemStatus(orderItemId, status);
    setOrders(prev => prev.map(o => {
      if (o.order_id !== orderId) return o;
      const updatedItems = o.items.map(i => i.order_item_id === orderItemId ? { ...i, status } : i);
      const allServed = updatedItems.every(i => i.status === 'served');
      const allReady = updatedItems.every(i => i.status === 'ready' || i.status === 'served');
      const anyPreparing = updatedItems.some(i => i.status === 'preparing');
      let overallStatus: OrderStatus = o.status;
      if (allServed) overallStatus = 'served';
      else if (allReady) overallStatus = 'ready';
      else if (anyPreparing) overallStatus = 'preparing';
      return { ...o, status: overallStatus, items: updatedItems, updated_at: Date.now() };
    }));
  };

  // ─── Billing ───────────────────────────────────────────────
  const requestBill = async (tableId: string, sessionId: string): Promise<Bill> => {
    const sessionOrders = orders.filter(o => o.session_id === sessionId && o.status !== 'cancelled');
    const itemsSubtotal = sessionOrders.reduce((sum, o) => sum + o.subtotal, 0);
    const gstRate = 5;
    const gstAmount = Math.round(itemsSubtotal * (gstRate / 100));

    const session = await db.getSession(sessionId);
    let reservationCredit = 0;
    if (session?.reservation_id) {
      const res = reservations.find(r => r.reservation_id === session.reservation_id);
      if (res?.deposit_status === 'paid') reservationCredit = res.deposit_amount;
    }

    const totalPayable = Math.max(0, itemsSubtotal + gstAmount - reservationCredit);

    const existing = bills.find(b => b.session_id === sessionId && b.payment_status === 'pending');
    if (existing) {
      const updates = {
        items_subtotal: itemsSubtotal, gst_amount: gstAmount,
        reservation_credit_applied: reservationCredit, total_payable: totalPayable,
        requested_at: new Date().toISOString(),
      };
      await db.updateBill(existing.bill_id, updates);
      const updated = { ...existing, items_subtotal: itemsSubtotal, gst_amount: gstAmount, reservation_credit_applied: reservationCredit, total_payable: totalPayable };
      setBills(prev => prev.map(b => b.bill_id === existing.bill_id ? updated : b));
      await db.updateTable(tableId, { status: 'billing_requested' });
      setTables(prev => prev.map(t => t.table_id === tableId ? { ...t, status: 'billing_requested' } : t));
      addToast('Bill Updated', `Total payable: ₹${totalPayable}`, 'info');
      return updated;
    }

    const newBill = await db.insertBill({
      session_id: sessionId,
      table_id: tableId,
      order_ids: sessionOrders.map(o => o.order_id),
      items_subtotal: itemsSubtotal,
      discount_amount: 0,
      gst_rate: gstRate,
      gst_amount: gstAmount,
      reservation_credit_applied: reservationCredit,
      total_payable: totalPayable,
      payment_status: 'pending',
      requested_at: Date.now(),
      settled_at: null,
    });
    if (!newBill) throw new Error('Failed to create bill');
    setBills(prev => [newBill, ...prev]);
    await db.updateTable(tableId, { status: 'billing_requested' });
    setTables(prev => prev.map(t => t.table_id === tableId ? { ...t, status: 'billing_requested' } : t));
    addToast('Bill Requested', `Total payable: ₹${totalPayable}`, 'warning');
    return newBill;
  };

  const settleBill = async (billId: string, paymentMode: PaymentMode, staffId?: string): Promise<Invoice> => {
    const bill = bills.find(b => b.bill_id === billId);
    if (!bill) throw new Error('Bill not found');

    const session = await db.getSession(bill.session_id);
    const sessionOrders = orders.filter(o => o.session_id === bill.session_id && o.status !== 'cancelled');

    // Build invoice line items
    const itemMap = new Map<string, { name: string; price: number; quantity: number }>();
    sessionOrders.forEach(ord => {
      ord.items.forEach(item => {
        const curr = itemMap.get(item.name_snapshot);
        if (curr) { curr.quantity += item.quantity; }
        else { itemMap.set(item.name_snapshot, { name: item.name_snapshot, price: item.price_snapshot, quantity: item.quantity }); }
      });
    });

    const invoiceItems = Array.from(itemMap.values()).map(it => ({
      name: it.name, price: it.price, quantity: it.quantity, amount: it.price * it.quantity,
    }));

    const guest = session?.guests?.[0] || { name: 'Guest', phone: '' };
    const seq = String(Date.now()).slice(-5);
    const invoiceNumber = `INV/${new Date().getFullYear()}-${new Date().getFullYear() + 1 - 2000}/${seq}`;

    const newInvoice = await db.insertInvoice({
      bill_id: bill.bill_id,
      invoice_number: invoiceNumber,
      gstin: restaurant.gstin,
      restaurant_name: restaurant.name,
      restaurant_address: restaurant.address,
      customer_name: guest.name,
      customer_phone: guest.phone,
      customer_email: '',
      items: invoiceItems,
      items_subtotal: bill.items_subtotal,
      discount_amount: bill.discount_amount,
      gst_rate: bill.gst_rate,
      gst_amount: bill.gst_amount,
      reservation_credit: bill.reservation_credit_applied,
      total_paid: bill.total_payable,
      payment_mode: paymentMode,
      issued_at: Date.now(),
      whatsapp_status: 'pending',
      email_status: 'pending',
    });
    if (!newInvoice) throw new Error('Failed to create invoice');

    // Update bill to paid
    await db.updateBill(billId, {
      payment_status: 'paid',
      payment_mode: paymentMode,
      settled_at: new Date().toISOString(),
      settled_by_staff_id: staffId || null,
    });
    setBills(prev => prev.map(b =>
      b.bill_id === billId ? { ...b, payment_status: 'paid', payment_mode: paymentMode, settled_at: Date.now() } : b
    ));
    setInvoices(prev => [newInvoice, ...prev]);

    // Close session and reset table
    if (session) {
      await db.updateSession(session.session_id, {
        status: 'closed', closed_at: new Date().toISOString(), close_reason: 'settled',
      });
    }
    await db.updateTable(bill.table_id, { status: 'vacant', current_session_id: null, call_waiter_active: false });
    setTables(prev => prev.map(t =>
      t.table_id === bill.table_id ? { ...t, status: 'vacant', current_session_id: null, call_waiter_active: false } : t
    ));
    setActiveSession(null);

    // Increment customer stats
    if (guest.phone) {
      await db.incrementCustomerStats(guest.phone, bill.total_payable);
    }

    try {
      confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 }, colors: ['#FF7A1A', '#2FAE60', '#FFB020', '#FFFFFF'] });
    } catch { /* safe */ }

    addToast('Payment Settled! 🎉', `Invoice #${invoiceNumber} generated. Pending WhatsApp delivery to ${guest.phone}.`, 'success');
    return newInvoice;
  };

  // ─── Reservations ──────────────────────────────────────────
  const addReservation = async (r: Omit<Reservation, 'reservation_id' | 'created_at'>): Promise<Reservation> => {
    const res = await db.insertReservation(r);
    if (!res) throw new Error('Failed to create reservation');
    setReservations(prev => [res, ...prev]);
    addToast('Reservation Confirmed!', `Booking for ${res.customer_name} on ${res.reserved_for_date}.`, 'success');
    return res;
  };

  const updateReservation = async (resId: string, updates: Partial<Reservation>) => {
    const patch: Record<string, unknown> = {};
    if (updates.status) patch.status = updates.status;
    if (updates.table_preference !== undefined) patch.table_preference = updates.table_preference;
    await db.updateReservation(resId, patch as any);
    setReservations(prev => prev.map(r => r.reservation_id === resId ? { ...r, ...updates } : r));
    addToast('Reservation Updated', 'Changes saved.', 'success');
  };

  const deleteReservation = async (resId: string) => {
    await db.deleteReservation(resId);
    setReservations(prev => prev.filter(r => r.reservation_id !== resId));
    addToast('Reservation Cancelled', 'Reservation removed.', 'info');
  };

  const checkinReservation = async (reservationId: string, tableId: string) => {
    const res = reservations.find(r => r.reservation_id === reservationId);
    if (!res) return;
    await checkinDiner(tableId, res.customer_name, res.customer_phone);
  };

  // ─── Staff ─────────────────────────────────────────────────
  const addStaff = async (name: string, role: Staff['role'], phone: string) => {
    const s = await db.insertStaff({ name, role, phone, is_active: true });
    if (s) {
      setStaff(prev => [...prev, s]);
      addToast('Staff Added', `${name} added as ${role}.`, 'success');
    }
  };

  const updateStaff = async (staffId: string, updates: Partial<Staff>) => {
    const patch: Record<string, unknown> = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.role !== undefined) patch.role = updates.role;
    if (updates.phone !== undefined) patch.phone = updates.phone;
    if (updates.is_active !== undefined) patch.is_active = updates.is_active;
    await db.updateStaff(staffId, patch as any);
    setStaff(prev => prev.map(s => s.staff_id === staffId ? { ...s, ...updates } : s));
    addToast('Staff Updated', 'Changes saved.', 'success');
  };

  const deleteStaff = async (staffId: string) => {
    await db.deleteStaff(staffId);
    setStaff(prev => prev.filter(s => s.staff_id !== staffId));
    addToast('Staff Removed', 'Member removed from system.', 'info');
  };

  // ─── Customers ─────────────────────────────────────────────
  const refreshCustomers = async () => {
    const custs = await db.getCustomers();
    setCustomers(custs);
  };

  // ─── Campaigns ─────────────────────────────────────────────
  const addCampaign = async (c: Omit<Campaign, 'campaign_id' | 'sent_count' | 'opened_count' | 'redeemed_count'>) => {
    const camp = await db.insertCampaign(c);
    if (camp) {
      setCampaigns(prev => [camp, ...prev]);
      addToast('Campaign Created', `"${camp.name}" saved as ${camp.status}.`, 'success');
    }
  };

  // ─── Invoice re-send (stub) ────────────────────────────────
  const resendInvoiceWhatsApp = async (invoiceId: string) => {
    await db.updateInvoiceDelivery(invoiceId, { whatsapp_status: 'sent' });
    setInvoices(prev => prev.map(i => i.invoice_id === invoiceId ? { ...i, whatsapp_status: 'sent' } : i));
    addToast('WhatsApp Sent', 'Invoice re-sent via WhatsApp (delivery stub).', 'success');
  };

  const resendInvoiceEmail = async (invoiceId: string) => {
    await db.updateInvoiceDelivery(invoiceId, { email_status: 'sent' });
    setInvoices(prev => prev.map(i => i.invoice_id === invoiceId ? { ...i, email_status: 'sent' } : i));
    addToast('Email Sent', 'Invoice re-sent via email (delivery stub).', 'success');
  };

  // ─── Provider ──────────────────────────────────────────────
  return (
    <DinePulseContext.Provider
      value={{
        isLoading,
        restaurant,
        updateRestaurant,
        tables,
        updateTableStatus,
        reissueTableQR,
        addTable,
        deleteTable,
        callWaiter,
        resolveWaiterCall,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        menuItems,
        toggleItemAvailability,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        currentTableId,
        setCurrentTableId,
        activeSession,
        checkinDiner,
        resetCurrentSession,
        orders,
        placeOrder,
        updateOrderStatus,
        updateOrderItemStatus,
        bills,
        invoices,
        currentBill,
        requestBill,
        settleBill,
        reservations,
        addReservation,
        updateReservation,
        deleteReservation,
        checkinReservation,
        staff,
        addStaff,
        updateStaff,
        deleteStaff,
        customers,
        refreshCustomers,
        campaigns,
        addCampaign,
        resendInvoiceWhatsApp,
        resendInvoiceEmail,
        toasts,
        dismissToast,
        addToast,
      }}
    >
      {children}
    </DinePulseContext.Provider>
  );
};

export const useDinePulse = (): DinePulseContextType => {
  const ctx = useContext(DinePulseContext);
  if (!ctx) throw new Error('useDinePulse must be used within DinePulseProvider');
  return ctx;
};
