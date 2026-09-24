import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDinePulse } from '../context/DinePulseContext';
import { CheckinScreen } from '../components/diner/CheckinScreen';
import { MenuBrowse } from '../components/diner/MenuBrowse';
import { CartDrawer, CartItem } from '../components/diner/CartDrawer';
import { LiveOrderTracker } from '../components/diner/LiveOrderTracker';
import { BillingModal } from '../components/diner/BillingModal';
import { InvoiceModal } from '../components/diner/InvoiceModal';
import { MenuItem, Invoice } from '../types';
import {
  Utensils, Clock, Receipt, Bell, ShieldCheck, LogOut, QrCode,
} from 'lucide-react';

export const DinerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tableIdParam = searchParams.get('table');
  const tokenParam = searchParams.get('token');

  const {
    tables,
    restaurant,
    activeSession,
    orders,
    placeOrder,
    requestBill,
    currentBill,
    callWaiter,
    resetCurrentSession,
    setCurrentTableId,
    currentTableId,
    isLoading,
  } = useDinePulse();

  const [activeTab, setActiveTab] = useState<'menu' | 'tracker'>('menu');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);

  // Validate table + token from QR
  useEffect(() => {
    if (tableIdParam) {
      setCurrentTableId(tableIdParam);
    }
  }, [tableIdParam, setCurrentTableId]);

  // ── Guard: No QR params ──────────────────────────────────
  if (!tableIdParam || !tokenParam) {
    return (
      <div className="min-h-screen bg-[#FFF8F2] flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-sm w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-orange-100 text-[#FF7A1A] mb-6">
            <QrCode className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-[#1F1B16] mb-3">Scan to Order</h1>
          <p className="text-sm text-[#6B6259] leading-relaxed mb-6">
            This page is only accessible by scanning the QR code on your table.
            Please scan the QR code placed on your table to start ordering.
          </p>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs font-medium">
            🔒 Each QR code is uniquely bound to a physical table. Direct URL access is not permitted.
          </div>
        </div>
      </div>
    );
  }

  // ── Guard: Validate token ────────────────────────────────
  const currentTable = tables.find(t => t.table_id === tableIdParam);
  const isTokenValid = currentTable && currentTable.qr_token === tokenParam;

  if (!isLoading && !isTokenValid) {
    return (
      <div className="min-h-screen bg-[#FFF8F2] flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-sm w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-red-100 text-red-500 mb-6">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-[#1F1B16] mb-3">Invalid or Expired QR</h1>
          <p className="text-sm text-[#6B6259] leading-relaxed mb-6">
            This QR code is invalid or has been reissued by the restaurant. 
            Please ask your server for an updated QR code or scan the one on your table again.
          </p>
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-medium">
            🔒 Security token mismatch. Table: {tableIdParam}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF8F2] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#FF7A1A] flex items-center justify-center mx-auto mb-3 animate-pulse">
            <Utensils className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-[#6B6259] font-medium">Loading menu…</p>
        </div>
      </div>
    );
  }

  // ── Show check-in if no active session ───────────────────
  if (!activeSession || activeSession.status !== 'active') {
    return <CheckinScreen onCheckinSuccess={() => setActiveTab('menu')} />;
  }

  const sessionOrders = orders.filter(o => o.session_id === activeSession.session_id);
  const guestName = activeSession.guests[0]?.name || 'Guest';

  const handleAddToCart = (item: MenuItem, quantity: number, modifiers: Record<string, string>, instructions: string) => {
    const id = `cart_${item.item_id}_${Date.now()}`;
    setCart(prev => [...prev, { id, item, quantity, modifiers, instructions }]);
  };

  const handleUpdateQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) setCart(prev => prev.filter(ci => ci.id !== cartItemId));
    else setCart(prev => prev.map(ci => ci.id === cartItemId ? { ...ci, quantity: newQty } : ci));
  };

  const handleRemoveItem = (cartItemId: string) => setCart(prev => prev.filter(ci => ci.id !== cartItemId));

  const handleSubmitOrder = async () => {
    if (cart.length === 0 || !activeSession) return;
    const guest = activeSession.guests[0] || { name: 'Diner', phone: '' };
    await placeOrder(
      currentTable!.table_id,
      activeSession.session_id,
      cart.map(c => ({ item: c.item, quantity: c.quantity, modifiers: c.modifiers, instructions: c.instructions })),
      { name: guest.name, phone: guest.phone }
    );
    setCart([]);
    setIsCartOpen(false);
    setActiveTab('tracker');
  };

  const handleOpenBilling = async () => {
    if (!activeSession) return;
    await requestBill(currentTable!.table_id, activeSession.session_id);
    setIsBillingOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FFF8F2] flex flex-col items-center">
      <div className="w-full max-w-lg bg-[#FFF8F2] min-h-screen flex flex-col px-4 pt-3 pb-8">
        {/* Header */}
        <header className="bg-white rounded-2xl border border-[#F0E4D8] p-3 shadow-xs mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#FF7A1A] text-white flex items-center justify-center font-bold text-base shadow-xs">
              {currentTable!.label}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs font-bold text-[#1F1B16]">{restaurant.name}</h1>
                <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  QR Verified
                </span>
              </div>
              <p className="text-[11px] text-[#6B6259]">
                Welcome, <strong>{guestName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {sessionOrders.length > 0 && (
              <button
                type="button"
                onClick={handleOpenBilling}
                className="px-2.5 py-1.5 rounded-lg bg-[#FFF8F2] border border-[#FFE3CC] text-[#FF7A1A] hover:bg-[#FFE3CC] text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Bill</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => callWaiter(currentTable!.table_id)}
              className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 hover:text-amber-700 transition-colors"
              title="Call Waiter"
            >
              <Bell className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={resetCurrentSession}
              className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-400 hover:text-red-600 transition-colors"
              title="Leave Table"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 p-1 bg-white rounded-xl border border-[#F0E4D8] mb-3 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'menu' ? 'bg-[#FF7A1A] text-white shadow-xs' : 'text-[#6B6259] hover:text-[#1F1B16]'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Menu</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tracker')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 relative ${
              activeTab === 'tracker' ? 'bg-[#FF7A1A] text-white shadow-xs' : 'text-[#6B6259] hover:text-[#1F1B16]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Order Tracker</span>
            {sessionOrders.length > 0 && (
              <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                activeTab === 'tracker' ? 'bg-white text-[#FF7A1A]' : 'bg-[#FF7A1A] text-white'
              }`}>
                {sessionOrders.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'menu' ? (
          <MenuBrowse
            cart={cart}
            onOpenCart={() => setIsCartOpen(true)}
            onAddToCart={handleAddToCart}
            onViewTracker={() => setActiveTab('tracker')}
            hasActiveOrders={sessionOrders.length > 0}
            tableLabel={currentTable!.label}
          />
        ) : (
          <LiveOrderTracker
            sessionOrders={sessionOrders}
            onRequestBill={handleOpenBilling}
            onOrderMore={() => setActiveTab('menu')}
            tableLabel={currentTable!.label}
          />
        )}

        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onSubmitOrder={handleSubmitOrder}
          roundNumber={sessionOrders.length + 1}
          tableLabel={currentTable!.label}
        />

        {isBillingOpen && currentBill && (
          <BillingModal
            bill={currentBill}
            onClose={() => setIsBillingOpen(false)}
            onInvoiceGenerated={invoice => { setIsBillingOpen(false); setActiveInvoice(invoice); }}
            tableLabel={currentTable!.label}
          />
        )}

        {activeInvoice && (
          <InvoiceModal
            invoice={activeInvoice}
            onClose={() => setActiveInvoice(null)}
          />
        )}
      </div>
    </div>
  );
};
