import React, { useState } from 'react';
import { useDinePulse } from '../../context/DinePulseContext';
import { Order, OrderStatus } from '../../types';
import {
  Clock,
  Bell,
  CheckCircle2,
  ChefHat,
  Sparkles,
  Receipt,
  Droplet,
  UtensilsCrossed,
  HelpCircle,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { formatINR } from '../../utils/qrHelper';

interface LiveOrderTrackerProps {
  sessionOrders: Order[];
  onRequestBill: () => void;
  onOrderMore: () => void;
  tableLabel: string;
}

export const LiveOrderTracker: React.FC<LiveOrderTrackerProps> = ({
  sessionOrders,
  onRequestBill,
  onOrderMore,
  tableLabel,
}) => {
  const { callWaiter, tables, currentTableId } = useDinePulse();
  const currentTable = tables.find(t => t.table_id === currentTableId);
  const [showCallModal, setShowCallModal] = useState(false);
  const [customReason, setCustomReason] = useState('');

  const handleCallWaiter = (reason: string) => {
    callWaiter(currentTableId, reason);
    setShowCallModal(false);
    setCustomReason('');
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'placed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFB020]/20 text-[#B87700] border border-[#FFB020]/40 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Placed
          </span>
        );
      case 'preparing':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FF7A1A]/20 text-[#E8690D] border border-[#FF7A1A]/40 flex items-center gap-1 animate-pulse-subtle">
            <ChefHat className="w-3 h-3" /> Cooking Now
          </span>
        );
      case 'ready':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Ready &amp; Dispatched
          </span>
        );
      case 'served':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Served
          </span>
        );
      default:
        return null;
    }
  };

  const steps = [
    { key: 'placed', label: 'Order Placed', icon: Clock },
    { key: 'preparing', label: 'Kitchen Preparing', icon: ChefHat },
    { key: 'ready', label: 'Ready for Table', icon: Sparkles },
    { key: 'served', label: 'Served', icon: CheckCircle2 },
  ];

  const getStepState = (orderStatus: OrderStatus, stepKey: string) => {
    const orderRank: Record<OrderStatus, number> = {
      placed: 1,
      preparing: 2,
      ready: 3,
      served: 4,
      cancelled: 0,
    };
    const stepRank: Record<string, number> = {
      placed: 1,
      preparing: 2,
      ready: 3,
      served: 4,
    };

    const current = orderRank[orderStatus] || 1;
    const target = stepRank[stepKey];

    if (current > target) return 'completed';
    if (current === target) return 'current';
    return 'upcoming';
  };

  return (
    <div className="space-y-4">
      {/* Table & Waiter Quick Help Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#F0E4D8] flex items-center justify-between shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h3 className="text-xs font-bold text-[#1F1B16] uppercase tracking-wider">
              Live Kitchen Connection • {tableLabel}
            </h3>
          </div>
          <p className="text-[11px] text-[#6B6259] mt-0.5">
            {sessionOrders.length} order {sessionOrders.length === 1 ? 'round' : 'rounds'} active
          </p>
        </div>

        {currentTable?.call_waiter_active ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-full animate-pulse">
            <Bell className="w-3.5 h-3.5 text-amber-600" />
            <span>Staff Coming!</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCallModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF8F2] hover:bg-[#FFE3CC] text-[#FF7A1A] border border-[#FFE3CC] text-xs font-semibold rounded-full transition-colors"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Call Waiter</span>
          </button>
        )}
      </div>

      {/* Orders List */}
      {sessionOrders.map(order => (
        <div
          key={order.order_id}
          className="bg-white rounded-2xl border border-[#F0E4D8] p-4 shadow-xs space-y-3.5"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#F0E4D8] pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-orange-100 text-[#FF7A1A]">
                  Round {order.round_number}
                </span>
                <span className="text-[11px] text-[#6B6259]">
                  {new Date(order.placed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            {getStatusBadge(order.status)}
          </div>

          {/* Stepper Timeline */}
          <div className="py-1">
            <div className="grid grid-cols-4 gap-1 relative">
              {steps.map((s, idx) => {
                const state = getStepState(order.status, s.key);
                const IconComponent = s.icon;
                return (
                  <div key={s.key} className="flex flex-col items-center text-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        state === 'completed'
                          ? 'bg-emerald-600 text-white'
                          : state === 'current'
                          ? 'bg-[#FF7A1A] text-white ring-4 ring-orange-100 animate-pulse'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-[10px] mt-1.5 font-medium leading-tight ${
                        state === 'current'
                          ? 'text-[#FF7A1A] font-bold'
                          : state === 'completed'
                          ? 'text-emerald-700'
                          : 'text-gray-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items Summary */}
          <div className="space-y-1.5 bg-[#FFF8F2] p-2.5 rounded-xl border border-[#FFE3CC]">
            {(order.items || []).map(item => (
              <div key={item.order_item_id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#FF7A1A]">{item.quantity}x</span>
                  <span className="text-[#1F1B16] font-medium">{item.name_snapshot}</span>
                  {Object.keys(item.modifiers_selected || {}).length > 0 && (
                    <span className="text-[10px] text-[#6B6259]">
                      ({Object.values(item.modifiers_selected || {}).join(', ')})
                    </span>
                  )}
                </div>
                <span className="font-semibold text-[#1F1B16]">
                  {formatINR(item.price_snapshot * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Floating Bottom Actions */}
      <div className="grid grid-cols-2 gap-2.5 pt-2">
        <button
          type="button"
          onClick={onOrderMore}
          className="py-3 px-3 bg-white border-2 border-[#FF7A1A] text-[#FF7A1A] hover:bg-orange-50 font-semibold text-xs sm:text-sm rounded-full transition-all flex items-center justify-center gap-1.5 shadow-xs"
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Add More Dishes</span>
        </button>

        <button
          type="button"
          onClick={onRequestBill}
          className="py-3 px-3 bg-[#FF7A1A] hover:bg-[#E8690D] text-white font-semibold text-xs sm:text-sm rounded-full transition-all flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20"
        >
          <Receipt className="w-4 h-4" />
          <span>Request Final Bill</span>
        </button>
      </div>

      {/* Call Waiter Modal */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 border border-[#F0E4D8] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1F1B16] flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#FF7A1A]" /> Call Waiter to Table
              </h3>
              <button
                onClick={() => setShowCallModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#6B6259]">
              Select what you need and our floor steward will be right over.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Request Water', icon: Droplet },
                { label: 'Extra Cutlery', icon: UtensilsCrossed },
                { label: 'Clear Plates', icon: CheckCircle2 },
                { label: 'Need Assistance', icon: HelpCircle },
              ].map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => handleCallWaiter(opt.label)}
                  className="p-2.5 rounded-xl border border-[#F0E4D8] bg-[#FFF8F2] hover:bg-[#FFE3CC] text-left transition-colors flex items-center gap-2 text-xs font-semibold text-[#1F1B16]"
                >
                  <opt.icon className="w-4 h-4 text-[#FF7A1A]" />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            <div>
              <input
                type="text"
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                placeholder="Or write custom message..."
                className="w-full px-3 py-2 text-xs border border-[#F0E4D8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A1A]"
              />
              {customReason && (
                <button
                  type="button"
                  onClick={() => handleCallWaiter(customReason)}
                  className="w-full mt-2 py-2 bg-[#FF7A1A] text-white text-xs font-semibold rounded-lg"
                >
                  Send Request
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
