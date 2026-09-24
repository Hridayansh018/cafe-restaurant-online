import React, { useState } from 'react';
import { useDinePulse } from '../../context/DinePulseContext';
import { CheckinScreen } from './CheckinScreen';
import { MenuBrowse } from './MenuBrowse';
import { CartDrawer, CartItem } from './CartDrawer';
import { LiveOrderTracker } from './LiveOrderTracker';
import { BillingModal } from './BillingModal';
import { InvoiceModal } from './InvoiceModal';
import { MenuItem, Invoice, Bill } from '../../types';
import {
  Utensils,
  Clock,
  Receipt,
  Bell,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  LogOut,
  ChevronRight,
  ListOrdered,
} from 'lucide-react';

export const DinerView: React.FC = () => {
  const {
    currentTableId,
    tables,
    restaurant,
    activeSession,
    orders,
    placeOrder,
    requestBill,
    currentBill,
    callWaiter,
    resetCurrentSession,
  } = useDinePulse();

  const currentTable = tables.find(t => t.table_id === currentTableId) || tables[0];
  const sessionOrders = activeSession
    ? orders.filter(o => o.session_id === activeSession.session_id)
    : [];

  const [activeTab, setActiveTab] = useState<'menu' | 'tracker'>('menu');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);

  // If no active session on this table, show the Checkin Screen!
  if (!activeSession || activeSession.status !== 'active') {
    return (
      <CheckinScreen
        onCheckinSuccess={() => {
          setActiveTab('menu');
        }}
      />
    );
  }

  // Cart operations
  const handleAddToCart = (
    item: MenuItem,
    quantity: number,
    modifiers: Record<string, string>,
    instructions: string
  ) => {
    const id = `cart_${item.item_id}_${Date.now()}`;
    setCart(prev => [...prev, { id, item, quantity, modifiers, instructions }]);
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

  const handleSubmitOrder = () => {
    if (cart.length === 0 || !activeSession) return;
    const guest = activeSession.guests[0] || { name: 'Diner', phone: '+919999999999' };

    placeOrder(
      currentTable.table_id,
      activeSession.session_id,
      cart.map(c => ({
        item: c.item,
        quantity: c.quantity,
        modifiers: c.modifiers,
        instructions: c.instructions,
      })),
      { name: guest.name, phone: guest.phone }
    );

    setCart([]);
    setIsCartOpen(false);
    setActiveTab('tracker');
  };

  const handleOpenBilling = () => {
    if (!activeSession) return;
    requestBill(currentTable.table_id, activeSession.session_id);
    setIsBillingOpen(true);
  };

  const guestName = activeSession.guests[0]?.name || 'Guest';

  return (
    <div className="min-h-screen bg-[#FFF8F2] flex flex-col items-center">
      <div className="w-full max-w-lg bg-[#FFF8F2] min-h-screen flex flex-col px-4 pt-3 pb-8">
        {/* Diner Top Bar */}
        <header className="bg-white rounded-2xl border border-[#F0E4D8] p-3 shadow-xs mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#FF7A1A] text-white flex items-center justify-center font-bold text-base shadow-xs">
              {currentTable.label}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs font-bold text-[#1F1B16]">{restaurant.name}</h1>
                <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  Active
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
                title="Request Bill"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Bill</span>
              </button>
            )}

            <button
              type="button"
              onClick={resetCurrentSession}
              className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-400 hover:text-red-600 transition-colors"
              title="Reset Table Session"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Navigation Tabs: Menu vs Live Tracker */}
        <div className="grid grid-cols-2 p-1 bg-white rounded-xl border border-[#F0E4D8] mb-3 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'menu'
                ? 'bg-[#FF7A1A] text-white shadow-xs'
                : 'text-[#6B6259] hover:text-[#1F1B16]'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Digital Menu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tracker')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 relative ${
              activeTab === 'tracker'
                ? 'bg-[#FF7A1A] text-white shadow-xs'
                : 'text-[#6B6259] hover:text-[#1F1B16]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Order Tracker</span>
            {sessionOrders.length > 0 && (
              <span
                className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                  activeTab === 'tracker' ? 'bg-white text-[#FF7A1A]' : 'bg-[#FF7A1A] text-white'
                }`}
              >
                {sessionOrders.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab View */}
        {activeTab === 'menu' ? (
          <MenuBrowse
            cart={cart}
            onOpenCart={() => setIsCartOpen(true)}
            onAddToCart={handleAddToCart}
            onViewTracker={() => setActiveTab('tracker')}
            hasActiveOrders={sessionOrders.length > 0}
            tableLabel={currentTable.label}
          />
        ) : (
          <LiveOrderTracker
            sessionOrders={sessionOrders}
            onRequestBill={handleOpenBilling}
            onOrderMore={() => setActiveTab('menu')}
            tableLabel={currentTable.label}
          />
        )}

        {/* Cart Drawer */}
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onSubmitOrder={handleSubmitOrder}
          roundNumber={sessionOrders.length + 1}
          tableLabel={currentTable.label}
        />

        {/* Billing Modal */}
        {isBillingOpen && currentBill && (
          <BillingModal
            bill={currentBill}
            onClose={() => setIsBillingOpen(false)}
            onInvoiceGenerated={invoice => {
              setIsBillingOpen(false);
              setActiveInvoice(invoice);
            }}
            tableLabel={currentTable.label}
          />
        )}

        {/* Invoice Modal */}
        {activeInvoice && (
          <InvoiceModal
            invoice={activeInvoice}
            onClose={() => {
              setActiveInvoice(null);
              // table session resets automatically on settlement
            }}
          />
        )}
      </div>
    </div>
  );
};
