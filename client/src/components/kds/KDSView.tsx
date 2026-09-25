import React, { useState, useEffect } from 'react';
import { useDinePulse } from '../../context/DinePulseContext';
import { Order, OrderStatus, ItemStatus } from '../../types';
import {
  ChefHat,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Flame,
  Volume2,
  VolumeX,
  X,
  Ban,
  Check,
  Search,
} from 'lucide-react';
import { formatINR } from '../../utils/qrHelper';

export const KDSView: React.FC = () => {
  const {
    orders,
    updateOrderStatus,
    updateOrderItemStatus,
    tables,
    menuItems,
    toggleItemAvailability,
    restaurant,
  } = useDinePulse();

  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Update clock every second for live elapsed counters
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTableLabel = (tableId: string) => {
    return tables.find(t => t.table_id === tableId)?.label || tableId;
  };

  const activeOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'served');
  const placedOrders = activeOrders.filter(o => o.status === 'placed');
  const preparingOrders = activeOrders.filter(o => o.status === 'preparing');
  const readyOrders = activeOrders.filter(o => o.status === 'ready');
  const servedOrders = orders.filter(o => o.status === 'served').slice(0, 5);

  const formatElapsed = (timestamp: number) => {
    const diffSec = Math.floor((currentTime - timestamp) / 1000);
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const isOrderBreached = (order: Order) => {
    const elapsedMinutes = (currentTime - order.placed_at) / 60000;
    return elapsedMinutes > restaurant.sla_prep_minutes;
  };

  return (
    <div className="min-h-screen bg-[#1F1B16] text-white flex flex-col">
      {/* KDS Header Bar */}
      <header className="bg-[#2B2520] border-b border-[#3D352E] px-4 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF7A1A] text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/20">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white">
                DinePulse KDS — Kitchen Display
              </h1>
              <span className="text-[11px] bg-emerald-900/60 text-emerald-400 border border-emerald-700/50 px-2 py-0.5 rounded-md font-mono">
                LIVE QUEUE
              </span>
            </div>
            <p className="text-xs text-stone-400">
              {restaurant.name} • Prep SLA Target: {restaurant.sla_prep_minutes} mins
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active stats counter */}
          <div className="hidden sm:flex items-center gap-2 bg-[#1F1B16] px-3 py-1.5 rounded-xl border border-[#3D352E] text-xs">
            <span className="text-stone-400">Active Tickets:</span>
            <span className="font-bold text-[#FF7A1A] text-sm">{activeOrders.length}</span>
          </div>

          {/* 86'd Stock-out Drawer Button */}
          <button
            type="button"
            onClick={() => setShowStockOutModal(true)}
            className="px-3.5 py-1.5 bg-[#FFF8F2] hover:bg-white text-[#1F1B16] font-bold text-xs rounded-xl border border-stone-300 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Ban className="w-3.5 h-3.5 text-red-600" />
            <span>86'd Sold-out Menu Items</span>
          </button>

          {/* Time Clock */}
          <div className="px-3 py-1.5 bg-black/40 rounded-xl border border-stone-700 text-stone-300 font-mono text-sm">
            {new Date(currentTime).toLocaleTimeString()}
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="flex-1 p-4 overflow-x-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1: Placed / New Orders */}
        <section className="flex flex-col bg-[#2A241F] rounded-2xl border border-[#3D352E] overflow-hidden min-h-[600px]">
          <div className="p-3 bg-[#362E27] border-b border-[#3D352E] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FFB020]" />
              <h2 className="text-sm font-bold tracking-wide uppercase text-stone-200">
                New Placed
              </h2>
            </div>
            <span className="px-2 py-0.5 text-xs font-bold bg-[#FFB020]/20 text-[#FFB020] rounded-full border border-[#FFB020]/40">
              {placedOrders.length}
            </span>
          </div>

          <div className="p-3 overflow-y-auto flex-1 space-y-3">
            {placedOrders.length === 0 ? (
              <div className="text-center py-16 text-stone-500 text-xs">
                No new orders waiting.
              </div>
            ) : (
              placedOrders.map(order => {
                const breached = isOrderBreached(order);
                return (
                  <div
                    key={order.order_id}
                    className={`bg-[#1F1B16] rounded-xl p-3.5 border transition-all shadow-md ${
                      breached
                        ? 'border-red-500 animate-pulse-breach bg-red-950/20'
                        : 'border-[#3D352E] hover:border-[#FFB020]'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-[#FF7A1A] bg-[#2E241D] px-2.5 py-0.5 rounded-lg border border-orange-900/40">
                          {getTableLabel(order.table_id)}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 bg-stone-800 text-stone-300 rounded">
                          R{order.round_number}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-mono text-[#FFB020]">
                        <Clock className="w-3 h-3" />
                        <span>{formatElapsed(order.placed_at)}</span>
                      </div>
                    </div>

                    {breached && (
                      <div className="mb-2 px-2 py-1 bg-red-900/60 border border-red-500 text-red-200 text-[10px] font-bold rounded flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        <span>SLA BREACH (&gt;15 MINS)</span>
                      </div>
                    )}

                    {/* Order Items */}
                    <div className="space-y-2 mb-3">
                      {order.items.map(it => (
                        <div
                          key={it.order_item_id}
                          className="flex items-start justify-between text-xs py-1 border-b border-stone-800/60 last:border-0"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-[#FF7A1A] text-sm">{it.quantity}x</span>
                              <span className="font-bold text-stone-100">{it.name_snapshot}</span>
                            </div>
                            {Object.keys(it.modifiers_selected || {}).length > 0 && (
                              <p className="text-[11px] text-stone-400 ml-6">
                                {Object.entries(it.modifiers_selected || {})
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(' • ')}
                              </p>
                            )}
                            {it.special_instructions && (
                              <p className="text-[11px] text-amber-300 ml-6 font-semibold italic">
                                Note: "{it.special_instructions}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action */}
                    <button
                      type="button"
                      onClick={() => updateOrderStatus(order.order_id, 'preparing')}
                      className="w-full py-2.5 bg-[#FF7A1A] hover:bg-[#E8690D] active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>Start Cooking Ticket</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Column 2: Preparing */}
        <section className="flex flex-col bg-[#2A241F] rounded-2xl border border-[#3D352E] overflow-hidden min-h-[600px]">
          <div className="p-3 bg-[#362E27] border-b border-[#3D352E] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF7A1A] animate-ping" />
              <h2 className="text-sm font-bold tracking-wide uppercase text-stone-200">
                Cooking on Stove
              </h2>
            </div>
            <span className="px-2 py-0.5 text-xs font-bold bg-[#FF7A1A]/20 text-[#FF7A1A] rounded-full border border-[#FF7A1A]/40">
              {preparingOrders.length}
            </span>
          </div>

          <div className="p-3 overflow-y-auto flex-1 space-y-3">
            {preparingOrders.length === 0 ? (
              <div className="text-center py-16 text-stone-500 text-xs">
                No orders currently in prep.
              </div>
            ) : (
              preparingOrders.map(order => {
                const breached = isOrderBreached(order);
                return (
                  <div
                    key={order.order_id}
                    className={`bg-[#1F1B16] rounded-xl p-3.5 border transition-all shadow-md ${
                      breached
                        ? 'border-red-500 animate-pulse-breach bg-red-950/20'
                        : 'border-[#FF7A1A]/50'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-[#FF7A1A] bg-[#2E241D] px-2.5 py-0.5 rounded-lg border border-orange-900/40">
                          {getTableLabel(order.table_id)}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 bg-stone-800 text-stone-300 rounded">
                          R{order.round_number}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-mono text-[#FF7A1A]">
                        <Flame className="w-3 h-3 text-[#FF7A1A] animate-pulse" />
                        <span>{formatElapsed(order.placed_at)}</span>
                      </div>
                    </div>

                    {breached && (
                      <div className="mb-2 px-2 py-1 bg-red-900/60 border border-red-500 text-red-200 text-[10px] font-bold rounded flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        <span>SLA BREACH (&gt;15 MINS)</span>
                      </div>
                    )}

                    {/* Order Items with individual readiness toggle */}
                    <div className="space-y-2 mb-3">
                      {order.items.map(it => (
                        <div
                          key={it.order_item_id}
                          className="flex items-start justify-between text-xs py-1 border-b border-stone-800/60 last:border-0"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-[#FF7A1A] text-sm">{it.quantity}x</span>
                              <span
                                className={`font-bold ${
                                  it.status === 'ready' ? 'line-through text-stone-400' : 'text-stone-100'
                                }`}
                              >
                                {it.name_snapshot}
                              </span>
                            </div>
                            {Object.keys(it.modifiers_selected || {}).length > 0 && (
                              <p className="text-[11px] text-stone-400 ml-6">
                                {Object.entries(it.modifiers_selected || {})
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(' • ')}
                              </p>
                            )}
                            {it.special_instructions && (
                              <p className="text-[11px] text-amber-300 ml-6 font-semibold italic">
                                Note: "{it.special_instructions}"
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              updateOrderItemStatus(
                                order.order_id,
                                it.order_item_id,
                                it.status === 'ready' ? 'preparing' : 'ready'
                              )
                            }
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                              it.status === 'ready'
                                ? 'bg-emerald-800 text-emerald-200'
                                : 'bg-stone-800 text-stone-400 hover:text-white'
                            }`}
                          >
                            {it.status === 'ready' ? '✓ Ready' : 'Done?'}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Action: Mark entire ticket ready */}
                    <button
                      type="button"
                      onClick={() => updateOrderStatus(order.order_id, 'ready')}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Mark Ticket Ready 🔔</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Column 3: Ready for Delivery */}
        <section className="flex flex-col bg-[#2A241F] rounded-2xl border border-[#3D352E] overflow-hidden min-h-[600px]">
          <div className="p-3 bg-[#362E27] border-b border-[#3D352E] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <h2 className="text-sm font-bold tracking-wide uppercase text-stone-200">
                Ready for Pickup
              </h2>
            </div>
            <span className="px-2 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/40">
              {readyOrders.length}
            </span>
          </div>

          <div className="p-3 overflow-y-auto flex-1 space-y-3">
            {readyOrders.length === 0 ? (
              <div className="text-center py-16 text-stone-500 text-xs">
                No orders waiting on pickup counter.
              </div>
            ) : (
              readyOrders.map(order => (
                <div
                  key={order.order_id}
                  className="bg-[#1F1B16] rounded-xl p-3.5 border border-emerald-500/50 shadow-md"
                >
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-lg border border-emerald-800/40">
                        {getTableLabel(order.table_id)}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 bg-stone-800 text-stone-300 rounded">
                        R{order.round_number}
                      </span>
                    </div>
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Waiter Alerted
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    {order.items.map(it => (
                      <div key={it.order_item_id} className="text-xs text-stone-300 flex items-center gap-2">
                        <span className="font-bold text-emerald-400">{it.quantity}x</span>
                        <span>{it.name_snapshot}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => updateOrderStatus(order.order_id, 'served')}
                    className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs rounded-xl border border-stone-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Confirm Handed to Waiter / Served</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* 86'd Menu Stock-out Modal */}
      {showStockOutModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#2B2520] border border-[#3D352E] w-full max-w-xl rounded-2xl p-5 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-[#3D352E] pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Ban className="w-5 h-5 text-red-500" /> Kitchen 86'd Items Manager
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Toggle items sold out. Disables them instantly across all diner menus.
                </p>
              </div>
              <button
                onClick={() => setShowStockOutModal(false)}
                className="w-8 h-8 rounded-lg bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-[#3D352E] pr-1 space-y-2">
              {menuItems.map(item => (
                <div key={item.item_id} className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.name}</h4>
                    <p className="text-[11px] text-stone-400">{formatINR(item.price)} • {item.diet_tag}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleItemAvailability(item.item_id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      item.is_available
                        ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-600'
                        : 'bg-red-900/60 text-red-200 border border-red-500'
                    }`}
                  >
                    {item.is_available ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>In Stock</span>
                      </>
                    ) : (
                      <>
                        <Ban className="w-3.5 h-3.5" />
                        <span>86'd (Sold Out)</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[#3D352E] mt-4 text-right">
              <button
                type="button"
                onClick={() => setShowStockOutModal(false)}
                className="px-5 py-2 bg-[#FF7A1A] hover:bg-[#E8690D] text-white font-bold text-xs rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
