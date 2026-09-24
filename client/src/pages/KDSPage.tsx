import React, { useState, useEffect } from 'react';
import { useDinePulse } from '../context/DinePulseContext';
import { Order, OrderStatus, ItemStatus } from '../types';
import {
  ChefHat, Clock, AlertTriangle, CheckCircle2, Flame,
  Volume2, VolumeX, X, Ban, Check, Search, Utensils,
} from 'lucide-react';
import { formatINR } from '../utils/qrHelper';

export const KDSPage: React.FC = () => {
  const {
    orders,
    updateOrderStatus,
    updateOrderItemStatus,
    tables,
    menuItems,
    toggleItemAvailability,
    restaurant,
    isLoading,
  } = useDinePulse();

  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTableLabel = (tableId: string) =>
    tables.find(t => t.table_id === tableId)?.label || tableId;

  const activeOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'served');
  const placedOrders = activeOrders.filter(o => o.status === 'placed');
  const preparingOrders = activeOrders.filter(o => o.status === 'preparing');
  const readyOrders = activeOrders.filter(o => o.status === 'ready');
  const recentServed = orders.filter(o => o.status === 'served').slice(0, 5);

  const formatElapsed = (timestamp: number) => {
    const diffSec = Math.floor((currentTime - timestamp) / 1000);
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const isBreached = (order: Order) =>
    (currentTime - order.placed_at) / 60000 > restaurant.sla_prep_minutes;

  const getBgForStatus = (status: string) => {
    if (status === 'placed') return 'border-amber-500/50 bg-amber-950/20';
    if (status === 'preparing') return 'border-orange-500/50 bg-orange-950/20';
    if (status === 'ready') return 'border-green-500/50 bg-green-950/20';
    return 'border-stone-700 bg-stone-900/50';
  };

  const renderOrderCard = (order: Order) => {
    const breached = isBreached(order);
    return (
      <div
        key={order.order_id}
        className={`rounded-2xl border p-4 flex flex-col gap-3 ${getBgForStatus(order.status)} ${
          breached ? 'ring-2 ring-red-500/60' : ''
        }`}
      >
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#FF7A1A] text-white flex items-center justify-center font-black text-sm">
              {getTableLabel(order.table_id)}
            </div>
            <div>
              <p className="text-xs font-bold text-white">Round #{order.round_number}</p>
              <p className="text-[10px] text-stone-400">{order.placed_by.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-xs font-mono font-bold ${breached ? 'text-red-400 animate-pulse' : 'text-stone-300'}`}>
              {formatElapsed(order.placed_at)}
            </p>
            {breached && (
              <span className="text-[10px] text-red-400 flex items-center gap-0.5 justify-end">
                <AlertTriangle className="w-3 h-3" /> SLA Breached
              </span>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="space-y-2">
          {order.items.map(item => (
            <div key={item.order_item_id} className="flex items-start gap-2">
              <button
                type="button"
                onClick={() => {
                  const nextStatus: Record<ItemStatus, ItemStatus> = {
                    placed: 'preparing', preparing: 'ready', ready: 'served', served: 'served',
                  };
                  updateOrderItemStatus(order.order_id, item.order_item_id, nextStatus[item.status]);
                }}
                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  item.status === 'served' ? 'bg-green-500 border-green-500' :
                  item.status === 'ready' ? 'bg-blue-500 border-blue-500' :
                  item.status === 'preparing' ? 'bg-orange-500 border-orange-500 animate-pulse' :
                  'border-stone-500 hover:border-amber-400'
                }`}
              >
                {(item.status === 'ready' || item.status === 'served') && <Check className="w-3 h-3 text-white" />}
              </button>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${item.status === 'served' ? 'line-through text-stone-500' : 'text-white'}`}>
                    ×{item.quantity} {item.name_snapshot}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    item.status === 'served' ? 'bg-stone-700 text-stone-400' :
                    item.status === 'ready' ? 'bg-blue-900 text-blue-300' :
                    item.status === 'preparing' ? 'bg-orange-900 text-orange-300' :
                    'bg-amber-900 text-amber-300'
                  }`}>
                    {item.status}
                  </span>
                </div>
                {Object.entries(item.modifiers_selected || {}).map(([k, v]) => (
                  <p key={k} className="text-[10px] text-stone-400">— {k}: {v}</p>
                ))}
                {item.special_instructions && (
                  <p className="text-[10px] text-amber-400 italic">📝 {item.special_instructions}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1 border-t border-white/10">
          {order.status === 'placed' && (
            <button
              type="button"
              onClick={() => updateOrderStatus(order.order_id, 'preparing')}
              className="flex-1 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1"
            >
              <Flame className="w-3.5 h-3.5" /> Start Cooking
            </button>
          )}
          {order.status === 'preparing' && (
            <button
              type="button"
              onClick={() => updateOrderStatus(order.order_id, 'ready')}
              className="flex-1 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Mark Ready
            </button>
          )}
          {order.status === 'ready' && (
            <button
              type="button"
              onClick={() => updateOrderStatus(order.order_id, 'served')}
              className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Served
            </button>
          )}
          <button
            type="button"
            onClick={() => updateOrderStatus(order.order_id, 'cancelled')}
            className="p-1.5 rounded-lg bg-red-900/50 hover:bg-red-800 text-red-400 hover:text-red-200 text-xs transition-colors"
            title="Cancel Order"
          >
            <Ban className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#1F1B16] text-white flex flex-col">
      {/* KDS Header */}
      <header className="bg-[#2B2520] border-b border-[#3D352E] px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF7A1A] text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/20">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white">Kitchen Display</h1>
              <span className="text-[11px] bg-emerald-900/60 text-emerald-400 border border-emerald-700/50 px-2 py-0.5 rounded-md font-mono">
                LIVE
              </span>
            </div>
            <p className="text-xs text-stone-400">{restaurant.name} — Real-time order queue</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 text-xs text-stone-400 font-mono">
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <Clock className="w-3.5 h-3.5" /> {placedOrders.length} New
            </span>
            <span className="flex items-center gap-1 text-orange-400 font-bold">
              <Flame className="w-3.5 h-3.5" /> {preparingOrders.length} Cooking
            </span>
            <span className="flex items-center gap-1 text-green-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> {readyOrders.length} Ready
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg bg-stone-800 text-stone-400 hover:text-white transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setShowStockOutModal(true)}
            className="px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 text-xs font-bold transition-colors"
          >
            86 Item
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ChefHat className="w-12 h-12 text-[#FF7A1A] mx-auto mb-3 animate-pulse" />
            <p className="text-stone-400 text-sm">Loading orders…</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4">
          {activeOrders.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
              <ChefHat className="w-16 h-16 text-stone-600 mb-4" />
              <h2 className="text-xl font-bold text-stone-400 mb-2">Queue Clear</h2>
              <p className="text-stone-500 text-sm text-center">No active orders. Kitchen is ready!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Placed */}
              {placedOrders.length > 0 && (
                <div className="col-span-full">
                  <h2 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    New Orders ({placedOrders.length})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {placedOrders.map(renderOrderCard)}
                  </div>
                </div>
              )}
              {/* Preparing */}
              {preparingOrders.length > 0 && (
                <div className="col-span-full">
                  <h2 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5" />
                    Cooking ({preparingOrders.length})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {preparingOrders.map(renderOrderCard)}
                  </div>
                </div>
              )}
              {/* Ready */}
              {readyOrders.length > 0 && (
                <div className="col-span-full">
                  <h2 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Ready for Pickup ({readyOrders.length})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {readyOrders.map(renderOrderCard)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 86 Stock Out Modal */}
      {showStockOutModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2B2520] rounded-2xl border border-[#3D352E] w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">86 Item — Mark Unavailable</h3>
              <button type="button" onClick={() => setShowStockOutModal(false)}>
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {menuItems.map(item => (
                <div key={item.item_id} className="flex items-center justify-between p-3 rounded-xl bg-stone-800">
                  <span className="text-sm text-white font-medium">{item.name}</span>
                  <button
                    type="button"
                    onClick={() => { toggleItemAvailability(item.item_id); }}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                      item.is_available
                        ? 'bg-green-900 text-green-300 hover:bg-red-900 hover:text-red-300'
                        : 'bg-red-900 text-red-300 hover:bg-green-900 hover:text-green-300'
                    }`}
                  >
                    {item.is_available ? 'Available' : '86\'d'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
