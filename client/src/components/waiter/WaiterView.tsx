import React, { useState } from 'react';
import { useDinePulse } from '../../context/DinePulseContext';
import { Table, Order, Bill, Invoice } from '../../types';
import {
  Users,
  Bell,
  Sparkles,
  Receipt,
  CheckCircle2,
  Clock,
  Utensils,
  DollarSign,
  AlertCircle,
  X,
  CreditCard,
  Banknote,
  Send,
  Layers,
} from 'lucide-react';
import { formatINR } from '../../utils/qrHelper';
import { InvoiceModal } from '../diner/InvoiceModal';

export const WaiterView: React.FC = () => {
  const {
    tables,
    orders,
    bills,
    invoices,
    updateTableStatus,
    resolveWaiterCall,
    updateOrderStatus,
    requestBill,
    settleBill,
    activeSession,
    restaurant,
  } = useDinePulse();

  const [selectedTableId, setSelectedTableId] = useState<string | null>('tbl_014');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const selectedTable = tables.find(t => t.table_id === selectedTableId) || null;

  // Alerts
  const waiterCalls = tables.filter(t => t.call_waiter_active);
  const readyOrders = orders.filter(o => o.status === 'ready');

  // Zones
  const zones = Array.from(new Set(tables.map(t => t.zone)));
  const filteredTables = tables.filter(
    t => selectedZone === 'all' || t.zone === selectedZone
  );

  // Get orders for selected table
  const selectedTableOrders = selectedTable?.current_session_id
    ? orders.filter(o => o.session_id === selectedTable.current_session_id)
    : [];

  const selectedTableBill = selectedTable?.current_session_id
    ? bills.find(
        b => b.session_id === selectedTable.current_session_id && b.payment_status === 'pending'
      )
    : null;

  const handleDeliverOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'served');
  };

  const handleCashierSettle = async (table: Table) => {
    if (!table.current_session_id) return;
    // ensure bill exists
    let bill = bills.find(
      b => b.session_id === table.current_session_id && b.payment_status === 'pending'
    );
    if (!bill) {
      bill = await requestBill(table.table_id, table.current_session_id);
    }
    const invoice = await settleBill(bill.bill_id, 'counter_cash', 'stf_002');
    setViewingInvoice(invoice);
  };

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'occupied':
        return 'border-[#FF7A1A] bg-orange-50/40 text-[#FF7A1A]';
      case 'billing_requested':
        return 'border-[#E4572E] bg-red-50 text-[#E4572E] animate-pulse';
      case 'reserved':
        return 'border-amber-400 bg-amber-50/60 text-amber-800';
      case 'vacant':
      default:
        return 'border-gray-200 bg-white text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F2] flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-[#F0E4D8] px-4 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF7A1A] text-white flex items-center justify-center font-bold shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#1F1B16]">
              Floor Steward &amp; Cashier Console
            </h1>
            <p className="text-xs text-[#6B6259]">
              Real-time floor grid, waiter call alerts &amp; counter settlement
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-200 border border-gray-300" />
            <span className="text-[#6B6259]">Vacant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FF7A1A]" />
            <span className="text-[#6B6259]">Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#E4572E] animate-ping" />
            <span className="text-[#6B6259] font-bold">Billing Requested</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-[#6B6259]">Reserved</span>
          </div>
        </div>
      </header>

      {/* Critical Alerts Banner (Waiter Calls & Ready Dishes) */}
      {(waiterCalls.length > 0 || readyOrders.length > 0) && (
        <div className="bg-white border-b border-[#F0E4D8] p-3 space-y-2">
          {waiterCalls.map(t => (
            <div
              key={t.table_id}
              className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center justify-between gap-3 animate-pulse"
            >
              <div className="flex items-center gap-2.5">
                <Bell className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h3 className="text-xs font-bold text-amber-900">
                    WAITER CALLED: Table {t.label} ({t.zone})
                  </h3>
                  <p className="text-[11px] text-amber-800">
                    Reason: {t.call_waiter_reason || 'Assistance requested'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => resolveWaiterCall(t.table_id)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0"
              >
                Acknowledge Call
              </button>
            </div>
          ))}

          {readyOrders.map(ord => (
            <div
              key={ord.order_id}
              className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="text-xs font-bold text-emerald-900">
                    FOOD READY ON PASS: Table {tables.find(t => t.table_id === ord.table_id)?.label} (Round {ord.round_number})
                  </h3>
                  <p className="text-[11px] text-emerald-800">
                    {ord.items.map(i => `${i.quantity}x ${i.name_snapshot}`).join(', ')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDeliverOrder(ord.order_id)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0"
              >
                Delivered to Table ✓
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Floor Grid & Side Panel */}
      <div className="flex-1 p-4 flex flex-col lg:flex-row gap-4">
        {/* Floor Grid Section */}
        <div className="flex-1 space-y-3">
          {/* Zone Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedZone('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                selectedZone === 'all'
                  ? 'bg-[#FF7A1A] text-white'
                  : 'bg-white text-[#6B6259] border border-[#F0E4D8]'
              }`}
            >
              All Zones ({tables.length})
            </button>
            {zones.map(z => (
              <button
                key={z}
                type="button"
                onClick={() => setSelectedZone(z)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                  selectedZone === z
                    ? 'bg-[#FF7A1A] text-white'
                    : 'bg-white text-[#6B6259] border border-[#F0E4D8]'
                }`}
              >
                {z} ({tables.filter(t => t.zone === z).length})
              </button>
            ))}
          </div>

          {/* Grid of Table Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredTables.map(table => {
              const isSelected = selectedTableId === table.table_id;
              const hasAlert = table.call_waiter_active;
              const isBilling = table.status === 'billing_requested';

              return (
                <button
                  key={table.table_id}
                  type="button"
                  onClick={() => setSelectedTableId(table.table_id)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between h-36 ${
                    isSelected ? 'ring-2 ring-[#FF7A1A] shadow-md' : 'hover:shadow-xs'
                  } ${getStatusColor(table.status)}`}
                >
                  {/* Alert Ping */}
                  {hasAlert && (
                    <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs animate-bounce shadow-md">
                      <Bell className="w-3.5 h-3.5" />
                    </span>
                  )}

                  {isBilling && (
                    <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-[#E4572E] text-white font-bold text-[10px] uppercase shadow-md animate-pulse">
                      Bill!
                    </span>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black">{table.label}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/80 border border-current">
                      {table.capacity} seats
                    </span>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold truncate">{table.zone}</p>
                    <p className="text-xs font-bold uppercase tracking-wider mt-0.5">
                      {table.status.replace('_', ' ')}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Table Drawer / Side Panel */}
        <div className="w-full lg:w-96 bg-white rounded-2xl border border-[#F0E4D8] p-5 shadow-xs flex flex-col justify-between shrink-0">
          {selectedTable ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#F0E4D8] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-[#1F1B16]">Table {selectedTable.label}</h2>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                        selectedTable.status === 'occupied'
                          ? 'bg-orange-100 text-orange-800'
                          : selectedTable.status === 'billing_requested'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {selectedTable.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B6259]">{selectedTable.zone} • Capacity: {selectedTable.capacity}</p>
                </div>

                {selectedTable.call_waiter_active && (
                  <button
                    type="button"
                    onClick={() => resolveWaiterCall(selectedTable.table_id)}
                    className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold rounded-lg border border-amber-300"
                  >
                    Clear Call
                  </button>
                )}
              </div>

              {/* Session / Order details */}
              {selectedTable.current_session_id ? (
                <div className="space-y-3">
                  <div className="bg-[#FFF8F2] p-3 rounded-xl border border-[#FFE3CC]">
                    <p className="text-xs font-semibold text-[#1F1B16]">
                      Session ID: <span className="font-mono text-[11px] text-[#6B6259]">{selectedTable.current_session_id}</span>
                    </p>
                    <p className="text-xs text-[#6B6259] mt-0.5">
                      Order Rounds: <strong>{selectedTableOrders.length}</strong>
                    </p>
                  </div>

                  {/* Active Orders List */}
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    <p className="text-xs font-bold text-[#1F1B16] uppercase tracking-wider">
                      Orders Summary
                    </p>
                    {selectedTableOrders.length === 0 ? (
                      <p className="text-xs text-gray-400">No dishes ordered yet.</p>
                    ) : (
                      selectedTableOrders.map(o => (
                        <div key={o.order_id} className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-xs">
                          <div className="flex justify-between font-bold mb-1">
                            <span className="text-[#FF7A1A]">Round {o.round_number} ({o.status})</span>
                            <span>{formatINR(o.subtotal)}</span>
                          </div>
                          <ul className="text-[11px] text-gray-600 space-y-0.5">
                            {o.items.map(it => (
                              <li key={it.order_item_id}>
                                {it.quantity}x {it.name_snapshot} ({it.status})
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Cash Settlement Button (FR-5.3 & FR-5.6) */}
                  <div className="pt-3 border-t border-[#F0E4D8] space-y-2">
                    <button
                      type="button"
                      onClick={() => handleCashierSettle(selectedTable)}
                      className="w-full py-3 px-4 bg-[#FF7A1A] hover:bg-[#E8690D] text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Banknote className="w-4 h-4" />
                      <span>Confirm Counter Cash / Card Settlement</span>
                    </button>
                    <p className="text-[10px] text-center text-[#6B6259]">
                      Generates GST invoice, closes table session, and resets table to vacant.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-[#6B6259]">
                  <p className="text-sm font-semibold">Table is Currently Vacant</p>
                  <p className="text-xs mt-1">Diners can scan table QR to self check-in and start ordering.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400 text-xs">
              Select a table from the floor grid to view live status.
            </div>
          )}
        </div>
      </div>

      {/* Invoice Viewer if settled from cashier */}
      {viewingInvoice && (
        <InvoiceModal
          invoice={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
        />
      )}
    </div>
  );
};
