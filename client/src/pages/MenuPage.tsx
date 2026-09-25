import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDinePulse } from '../context/DinePulseContext';
import { MenuItem, Invoice, Order } from '../types';
import { formatINR } from '../utils/qrHelper';
import { ModifierModal } from '../components/diner/ModifierModal';
import { CartDrawer, CartItem } from '../components/diner/CartDrawer';
import { LiveOrderTracker } from '../components/diner/LiveOrderTracker';
import { BillingModal } from '../components/diner/BillingModal';
import { InvoiceModal } from '../components/diner/InvoiceModal';
import {
  UtensilsCrossed,
  Search,
  Flame,
  QrCode,
  Sparkles,
  Info,
  Clock,
  Bell,
  Receipt,
  ShoppingBag,
  ShieldAlert,
  ChevronRight,
  Filter,
  CheckCircle2,
  Phone,
} from 'lucide-react';

const DIET_BADGES: Record<string, { label: string; color: string }> = {
  veg: { label: 'VEG', color: 'border-green-600 text-green-700 bg-green-50' },
  non_veg: { label: 'NON-VEG', color: 'border-red-600 text-red-700 bg-red-50' },
  egg: { label: 'CONTAINS EGG', color: 'border-yellow-600 text-yellow-800 bg-yellow-50' },
  vegan: { label: 'VEGAN', color: 'border-emerald-600 text-emerald-800 bg-emerald-50' },
};

const SPICE_ICONS: Record<string, string> = {
  none: '○ Mild',
  mild: '🌶 Mild',
  medium: '🌶🌶 Medium',
  hot: '🌶🌶🌶 Extra Hot',
};

export const MenuPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tableIdParam = searchParams.get('table');
  const tokenParam = searchParams.get('token');

  const {
    categories,
    menuItems,
    restaurant,
    tables,
    orders,
    activeSession,
    setCurrentTableId,
    currentTableId,
    placeOrder,
    callWaiter,
    requestBill,
    currentBill,
    checkIn,
    isLoading,
  } = useDinePulse();

  // Mode: Dine-in (with valid table param) vs Takeaway / Public
  const currentTable = useMemo(() => {
    if (!tableIdParam) return null;
    return tables.find(t => t.table_id === tableIdParam) || null;
  }, [tables, tableIdParam]);

  const isTableQRValid = Boolean(
    currentTable && (!tokenParam || currentTable.qr_token === tokenParam)
  );

  const orderType: 'dine_in' | 'takeaway' = isTableQRValid ? 'dine_in' : 'takeaway';

  // Set active table in context when tableIdParam is present
  useEffect(() => {
    if (tableIdParam) {
      setCurrentTableId(tableIdParam);
    }
  }, [tableIdParam, setCurrentTableId]);

  // UI state
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non_veg' | 'vegan'>('all');

  // Cart & Ordering
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [guestName, setGuestName] = useState(() => localStorage.getItem('dp_guest_name') || '');
  const [guestPhone, setGuestPhone] = useState(() => localStorage.getItem('dp_guest_phone') || '');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Modals
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [waiterCalled, setWaiterCalled] = useState(false);

  // Active table orders
  const tableOrders = useMemo(() => {
    if (orderType === 'dine_in' && tableIdParam) {
      return orders.filter(
        o => o.table_id === tableIdParam && o.status !== 'cancelled' && o.status !== 'served'
      );
    }
    return [];
  }, [orders, orderType, tableIdParam]);

  const allTableOrders = useMemo(() => {
    if (orderType === 'dine_in' && tableIdParam) {
      return orders.filter(o => o.table_id === tableIdParam && o.status !== 'cancelled');
    }
    return [];
  }, [orders, orderType, tableIdParam]);

  // Filtering menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      if (activeCategory !== 'all' && item.category_id !== activeCategory) {
        return false;
      }
      if (dietFilter !== 'all' && item.diet_tag !== dietFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = (item.description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }, [menuItems, activeCategory, dietFilter, searchQuery]);

  // Cart Handlers
  const handleAddToCart = (item: MenuItem) => {
    if (item.modifiers && item.modifiers.length > 0) {
      setCustomizingItem(item);
    } else {
      const id = `cart_${item.item_id}_${Date.now()}`;
      setCart(prev => [...prev, { id, item, quantity: 1, modifiers: {} }]);
      setIsCartOpen(true);
    }
  };

  const handleAddCustomized = (item: MenuItem, quantity: number, modifiers: Record<string, string>, instructions: string) => {
    const id = `cart_${item.item_id}_${Date.now()}`;
    setCart(prev => [...prev, { id, item, quantity, modifiers, instructions }]);
    setCustomizingItem(null);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart(prev => prev.filter(ci => ci.id !== cartItemId));
    } else {
      setCart(prev => prev.map(ci => (ci.id === cartItemId ? { ...ci, quantity: newQty } : ci)));
    }
  };

  const handleRemoveItem = (cartItemId: string) => {
    setCart(prev => prev.filter(ci => ci.id !== cartItemId));
  };

  // Submit Order (Dine-in for table OR Takeaway)
  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    const finalName = guestName.trim() || 'Guest';
    const finalPhone = guestPhone.trim() || '+919999999999';

    localStorage.setItem('dp_guest_name', finalName);
    localStorage.setItem('dp_guest_phone', finalPhone);

    setIsSubmittingOrder(true);
    try {
      const targetTableId = orderType === 'dine_in' && currentTable ? currentTable.table_id : 'tbl_takeaway';

      // Ensure session exists
      let session = activeSession;
      if (!session || session.table_id !== targetTableId || session.status !== 'active') {
        session = await checkIn(targetTableId, finalName, finalPhone);
      }

      await placeOrder(
        targetTableId,
        session.session_id,
        cart.map(c => ({
          item: c.item,
          quantity: c.quantity,
          modifiers: c.modifiers,
          instructions: c.instructions,
        })),
        { name: finalName, phone: finalPhone }
      );

      setCart([]);
      setIsCartOpen(false);

      if (orderType === 'dine_in') {
        setIsTrackerOpen(true);
      }
    } catch (err) {
      console.error('[MenuPage] Order submission error:', err);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleCallWaiter = async () => {
    if (currentTable) {
      await callWaiter(currentTable.table_id, 'Assistance requested from table menu');
      setWaiterCalled(true);
      setTimeout(() => setWaiterCalled(false), 8000);
    }
  };

  const handleOpenBilling = async () => {
    if (currentTable && activeSession) {
      await requestBill(currentTable.table_id, activeSession.session_id);
      setIsBillingOpen(true);
    }
  };

  const cartSubtotal = cart.reduce((s, i) => s + i.item.price * i.quantity, 0);
  const cartItemCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="min-h-screen bg-[#FFF8F2] text-[#1F1B16] flex flex-col font-sans pb-28 sm:pb-16">
      {/* Top Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-[#F0E4D8] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF7A1A] text-white flex items-center justify-center font-black shadow-md shadow-orange-500/20">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-[#1F1B16]">
                  {restaurant?.name || 'Restaurant Menu'}
                </h1>
                {orderType === 'dine_in' && currentTable && (
                  <span className="px-2 py-0.5 rounded-md bg-orange-100 text-[#FF7A1A] font-black text-xs border border-orange-200">
                    Table {currentTable.label}
                  </span>
                )}
                {orderType === 'takeaway' && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 font-black text-xs border border-blue-200">
                    Takeaway Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B6259]">
                {restaurant?.address?.city ? `${restaurant.address.city} · ` : ''}Digital Food &amp; Beverage Menu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {orderType === 'dine_in' && allTableOrders.length > 0 && (
              <button
                type="button"
                onClick={() => setIsTrackerOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-[#FF7A1A] text-xs font-bold hover:bg-orange-100 transition-colors flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Orders ({tableOrders.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-xl bg-stone-100 text-[#1F1B16] hover:bg-stone-200 transition-colors"
              title="View Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FF7A1A] text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Context Banner: Table Dine-in vs Takeaway */}
        <div
          className={`py-2 px-4 border-t ${
            orderType === 'dine_in'
              ? 'bg-amber-50/80 border-amber-200/80 text-amber-900'
              : 'bg-blue-50/80 border-blue-200/80 text-blue-900'
          }`}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between text-xs font-medium">
            <div className="flex items-center gap-2">
              {orderType === 'dine_in' && currentTable ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    Ordering for <strong>Table {currentTable.label} ({currentTable.zone})</strong>. Orders fire straight to the kitchen.
                  </span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    <strong>Takeaway / Pickup Order:</strong> Place your order and collect fresh from our counter.
                  </span>
                </>
              )}
            </div>

            {orderType === 'dine_in' && currentTable && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCallWaiter}
                  disabled={waiterCalled}
                  className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 text-[11px] font-bold hover:bg-amber-100 transition-all flex items-center gap-1 disabled:opacity-60"
                >
                  <Bell className="w-3 h-3 text-[#FF7A1A]" />
                  <span>{waiterCalled ? 'Waiter Summoned!' : 'Call Waiter'}</span>
                </button>

                {allTableOrders.length > 0 && (
                  <button
                    type="button"
                    onClick={handleOpenBilling}
                    className="px-2.5 py-1 rounded-lg bg-[#FF7A1A] text-white text-[11px] font-bold hover:bg-[#E8690D] transition-all flex items-center gap-1"
                  >
                    <Receipt className="w-3 h-3" />
                    <span>Bill &amp; Pay</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-5 w-full flex-1 space-y-5">
        {/* Search & Dietary Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes, drinks, desserts…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#F0E4D8] rounded-2xl text-xs sm:text-sm text-[#1F1B16] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FF7A1A] transition-all shadow-xs"
            />
          </div>

          {/* Diet filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'veg', 'non_veg', 'vegan'] as const).map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => setDietFilter(tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap capitalize ${
                  dietFilter === tag
                    ? 'bg-[#1F1B16] text-white shadow-sm'
                    : 'bg-white border border-[#F0E4D8] text-[#6B6259] hover:bg-stone-50'
                }`}
              >
                {tag === 'all' ? 'All Diets' : tag.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#F0E4D8]">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all whitespace-nowrap ${
              activeCategory === 'all'
                ? 'bg-[#FF7A1A] text-white shadow-md shadow-orange-900/10'
                : 'bg-white border border-[#F0E4D8] text-[#6B6259] hover:text-[#1F1B16]'
            }`}
          >
            All Items ({menuItems.length})
          </button>
          {categories.map(cat => {
            const count = menuItems.filter(i => i.category_id === cat.category_id).length;
            return (
              <button
                key={cat.category_id}
                type="button"
                onClick={() => setActiveCategory(cat.category_id)}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all whitespace-nowrap ${
                  activeCategory === cat.category_id
                    ? 'bg-[#FF7A1A] text-white shadow-md shadow-orange-900/10'
                    : 'bg-white border border-[#F0E4D8] text-[#6B6259] hover:text-[#1F1B16]'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Menu Items Grid */}
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#FF7A1A] flex items-center justify-center mx-auto mb-3 animate-pulse">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-[#6B6259]">Loading delicious menu items…</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-3xl border border-[#F0E4D8] p-8 max-w-lg mx-auto">
            <UtensilsCrossed className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-black text-[#1F1B16] mb-1">No items found</h3>
            <p className="text-xs text-[#6B6259] mb-4">
              Try changing your search query or dietary filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setDietFilter('all');
                setActiveCategory('all');
              }}
              className="px-4 py-2 rounded-xl bg-[#FF7A1A] text-white text-xs font-bold shadow-sm"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map(item => {
              const badge = DIET_BADGES[item.diet_tag] || DIET_BADGES.veg;
              const hasModifiers = item.modifiers && item.modifiers.length > 0;
              const inCartCount = cart
                .filter(ci => ci.item.item_id === item.item_id)
                .reduce((s, ci) => s + ci.quantity, 0);

              return (
                <div
                  key={item.item_id}
                  className="bg-white rounded-3xl border border-[#F0E4D8] overflow-hidden flex flex-col hover:shadow-xl hover:shadow-orange-950/5 transition-all duration-200 group"
                >
                  {/* Item Image */}
                  <div className="relative h-48 bg-[#FFF8F2] overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-stone-300">
                        <UtensilsCrossed className="w-10 h-10 mb-1" />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">
                          DinePulse Dish
                        </span>
                      </div>
                    )}

                    {/* Overlay Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border shadow-xs ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    {!item.is_available && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                        <span className="bg-red-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-lg">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <h3 className="text-base font-black text-[#1F1B16] group-hover:text-[#FF7A1A] transition-colors leading-snug">
                          {item.name}
                        </h3>
                        <span className="text-base font-black text-[#FF7A1A] shrink-0 font-mono">
                          {formatINR(item.price)}
                        </span>
                      </div>

                      <p className="text-xs text-[#6B6259] leading-relaxed line-clamp-2 mb-3">
                        {item.description || 'Prepared fresh with premium ingredients by our chef.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#F0E4D8]/60 flex items-center justify-between text-[11px] text-[#6B6259]">
                      <span className="flex items-center gap-1 font-medium">
                        {SPICE_ICONS[item.spice_level] || 'Mild'}
                      </span>

                      {/* Add to Cart button */}
                      <button
                        type="button"
                        disabled={!item.is_available}
                        onClick={() => handleAddToCart(item)}
                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs flex items-center gap-1 ${
                          inCartCount > 0
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-[#FF7A1A] text-white hover:bg-[#E8690D]'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {inCartCount > 0 ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Added ({inCartCount})</span>
                          </>
                        ) : hasModifiers ? (
                          <span>Customize +</span>
                        ) : (
                          <span>Add +</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-40 animate-in slide-in-from-bottom duration-200">
          <div className="bg-[#1F1B16] text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between border border-stone-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF7A1A] text-white flex items-center justify-center font-bold text-sm shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {cartItemCount} item{cartItemCount > 1 ? 's' : ''} in cart
                </p>
                <p className="text-sm font-black text-[#FF7A1A] font-mono">{formatINR(cartSubtotal)}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#FF7A1A] hover:bg-[#E8690D] text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-md"
            >
              <span>View Cart</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals & Drawers */}
      {customizingItem && (
        <ModifierModal
          item={customizingItem}
          onClose={() => setCustomizingItem(null)}
          onAdd={handleAddCustomized}
        />
      )}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onSubmitOrder={handleSubmitOrder}
        roundNumber={(tableOrders.length || 0) + 1}
        tableLabel={currentTable ? currentTable.label : 'Takeaway'}
        orderType={orderType}
        guestName={guestName}
        setGuestName={setGuestName}
        guestPhone={guestPhone}
        setGuestPhone={setGuestPhone}
        isSubmitting={isSubmittingOrder}
      />

      {isTrackerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <LiveOrderTracker
              tableId={currentTable?.table_id || ''}
              tableLabel={currentTable?.label || 'Takeaway'}
              onRequestBill={handleOpenBilling}
              onClose={() => setIsTrackerOpen(false)}
            />
          </div>
        </div>
      )}

      {isBillingOpen && currentBill && (
        <BillingModal
          bill={currentBill}
          tableLabel={currentTable ? currentTable.label : 'Counter'}
          onClose={() => setIsBillingOpen(false)}
          onInvoiceGenerated={inv => {
            setIsBillingOpen(false);
            setActiveInvoice(inv);
          }}
        />
      )}

      {activeInvoice && (
        <InvoiceModal
          invoice={activeInvoice}
          onClose={() => setActiveInvoice(null)}
        />
      )}
    </div>
  );
};
