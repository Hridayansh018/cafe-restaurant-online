import React, { useState } from 'react';
import { useDinePulse } from '../../context/DinePulseContext';
import { Invoice, PaymentMode } from '../../types';
import { formatINR } from '../../utils/qrHelper';
import {
  Receipt,
  Download,
  TrendingUp,
  Filter,
  Search,
  Eye,
  X,
  CheckCircle2,
  CreditCard,
  Banknote,
  QrCode,
  Clock,
  Sparkles,
} from 'lucide-react';

type Range = '7d' | '30d' | '90d' | 'all';

export const AdminInvoices: React.FC = () => {
  const { invoices, restaurant, bills, tables, settleBill, requestBill } = useDinePulse();
  const [activeTab, setActiveTab] = useState<'invoices' | 'pending'>('invoices');
  const [range, setRange] = useState<Range>('30d');
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState<Invoice | null>(null);
  const [settlingBillId, setSettlingBillId] = useState<string | null>(null);

  const getRangeDays = (r: Range) => (r === '7d' ? 7 : r === '30d' ? 30 : r === '90d' ? 90 : Infinity);
  const cutoff = Date.now() - getRangeDays(range) * 86400000;

  const filtered = invoices.filter(inv => {
    const inRange = range === 'all' || inv.issued_at >= cutoff;
    const matchSearch =
      search === '' ||
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer_phone.includes(search);
    return inRange && matchSearch;
  });

  const pendingBills = bills.filter(b => b.payment_status === 'pending');

  const totalRevenue = filtered.reduce((s, i) => s + i.total_paid, 0);
  const totalGST = filtered.reduce((s, i) => s + i.gst_amount, 0);
  const totalDiscount = filtered.reduce((s, i) => s + i.discount_amount, 0);

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const PAYMENT_LABELS: Record<string, string> = {
    online_upi: 'UPI',
    online_card: 'Card (Online)',
    counter_cash: 'Cash',
    counter_card: 'Card (Counter)',
  };

  const handleSettle = async (billId: string, mode: PaymentMode) => {
    setSettlingBillId(billId);
    try {
      const inv = await settleBill(billId, mode, 'stf_admin');
      setViewing(inv);
    } catch (err) {
      console.error('Failed to settle bill:', err);
    } finally {
      setSettlingBillId(null);
    }
  };

  const getTableLabel = (tableId: string) => {
    return tables.find(t => t.table_id === tableId)?.label || tableId;
  };

  const printInvoice = (inv: Invoice) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Invoice ${inv.invoice_number}</title>
      <style>body{font-family:monospace;padding:20px;max-width:400px}h1{font-size:16px}table{width:100%;border-collapse:collapse}td,th{padding:4px;text-align:left;border-bottom:1px solid #eee}tfoot td{font-weight:bold}</style></head>
      <body>
        <h1>${inv.restaurant_name}</h1>
        <p>GSTIN: ${inv.gstin || 'N/A'}</p>
        <p>Invoice: ${inv.invoice_number}</p>
        <p>Date: ${formatDate(inv.issued_at)}</p>
        <p>Customer: ${inv.customer_name} | ${inv.customer_phone}</p>
        <hr/>
        <table>
          <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amt</th></tr></thead>
          <tbody>
            ${inv.items.map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>₹${i.price}</td><td>₹${i.amount}</td></tr>`).join('')}
          </tbody>
          <tfoot>
            <tr><td colspan="3">Subtotal</td><td>₹${inv.items_subtotal}</td></tr>
            ${inv.discount_amount > 0 ? `<tr><td colspan="3">Discount</td><td>-₹${inv.discount_amount}</td></tr>` : ''}
            ${inv.reservation_credit > 0 ? `<tr><td colspan="3">Deposit Credit</td><td>-₹${inv.reservation_credit}</td></tr>` : ''}
            <tr><td colspan="3">GST (${inv.gst_rate}%)</td><td>₹${inv.gst_amount}</td></tr>
            <tr><td colspan="3"><strong>TOTAL PAID</strong></td><td><strong>₹${inv.total_paid}</strong></td></tr>
          </tfoot>
        </table>
        <p>Payment: ${PAYMENT_LABELS[inv.payment_mode] || inv.payment_mode}</p>
        <p>Thank you for dining with us!</p>
      </body></html>
    `);
    win.print();
    win.close();
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Invoices &amp; Revenue</h1>
          <p className="text-sm text-stone-400 mt-0.5">
            Generate tax invoices, settle pending table bills, and view revenue analytics
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-900 border border-[#2d2018] rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'invoices'
                ? 'bg-[#FF7A1A] text-white shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Settled Invoices ({invoices.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Pending Bills ({pendingBills.length})
            {pendingBills.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Gross Revenue', value: formatINR(totalRevenue), color: 'text-[#FF7A1A]' },
          { label: 'GST Collected', value: formatINR(totalGST), color: 'text-blue-400' },
          { label: 'Discounts', value: formatINR(totalDiscount), color: 'text-amber-400' },
          { label: 'Net (excl. GST)', value: formatINR(totalRevenue - totalGST), color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#1a1210] rounded-2xl border border-[#2d2018] p-4">
            <p className="text-xs text-stone-500 font-medium mb-1">{s.label}</p>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {activeTab === 'pending' ? (
        /* PENDING BILLS & SETTLE SECTION */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Unsettled Bills Awaiting Payment &amp; Invoice Generation
            </h2>
            <span className="text-xs text-stone-400">{pendingBills.length} pending</span>
          </div>

          {pendingBills.length === 0 ? (
            <div className="text-center py-16 bg-[#1a1210] rounded-2xl border border-[#2d2018] p-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">All Bills Settled!</h3>
              <p className="text-xs text-stone-400 max-w-md mx-auto mb-4">
                There are currently no tables waiting for invoice settlement. When diners request a bill
                or orders are completed, they will appear here.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('invoices')}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-200 text-xs font-bold hover:bg-stone-700"
              >
                View Settled Tax Invoices
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingBills.map(bill => {
                const isSettling = settlingBillId === bill.bill_id;
                return (
                  <div
                    key={bill.bill_id}
                    className="bg-[#1a1210] rounded-2xl border border-amber-900/40 p-5 flex flex-col justify-between gap-4 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-sm">
                            {getTableLabel(bill.table_id)}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white">
                              Table {getTableLabel(bill.table_id)}
                            </h3>
                            <p className="text-[11px] text-stone-400">
                              Requested: {formatDate(bill.requested_at)}
                            </p>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-950 text-amber-300 border border-amber-800/50 uppercase">
                          Pending Payment
                        </span>
                      </div>

                      {/* Amounts Breakdown */}
                      <div className="bg-stone-900/50 rounded-xl p-3 border border-[#2d2018] space-y-1.5 text-xs">
                        <div className="flex justify-between text-stone-400">
                          <span>Items Subtotal</span>
                          <span className="text-stone-300 font-medium">{formatINR(bill.items_subtotal)}</span>
                        </div>
                        {bill.discount_amount > 0 && (
                          <div className="flex justify-between text-stone-400">
                            <span>Discount</span>
                            <span className="text-emerald-400 font-medium">−{formatINR(bill.discount_amount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-stone-400">
                          <span>GST ({bill.gst_rate}%)</span>
                          <span className="text-stone-300 font-medium">{formatINR(bill.gst_amount)}</span>
                        </div>
                        {bill.reservation_credit_applied > 0 && (
                          <div className="flex justify-between text-stone-400">
                            <span>Deposit Credit</span>
                            <span className="text-emerald-400 font-medium">−{formatINR(bill.reservation_credit_applied)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-black border-t border-[#2d2018] pt-1.5">
                          <span className="text-white">Total Payable</span>
                          <span className="text-[#FF7A1A] font-mono">{formatINR(bill.total_payable)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Settle Actions */}
                    <div>
                      <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                        Settle &amp; Generate Tax Invoice:
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          disabled={isSettling}
                          onClick={() => handleSettle(bill.bill_id, 'counter_cash')}
                          className="py-2 px-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/50 text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <Banknote className="w-3.5 h-3.5" /> Cash
                        </button>
                        <button
                          type="button"
                          disabled={isSettling}
                          onClick={() => handleSettle(bill.bill_id, 'online_upi')}
                          className="py-2 px-2.5 rounded-xl bg-blue-950/60 hover:bg-blue-900 text-blue-300 border border-blue-800/50 text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <QrCode className="w-3.5 h-3.5" /> UPI
                        </button>
                        <button
                          type="button"
                          disabled={isSettling}
                          onClick={() => handleSettle(bill.bill_id, 'counter_card')}
                          className="py-2 px-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-800/50 text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Card
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* SETTLED INVOICES SECTION */
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1">
              {(['7d', '30d', '90d', 'all'] as Range[]).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    range === r
                      ? 'bg-[#FF7A1A] text-white'
                      : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                  }`}
                >
                  {r === 'all' ? 'All Time' : `Last ${r}`}
                </button>
              ))}
            </div>
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500" />
              <input
                type="text"
                placeholder="Search invoice, customer, phone…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#1a1210] border border-[#2d2018] rounded-xl text-sm text-white placeholder-stone-600 focus:outline-none focus:border-[#FF7A1A]"
              />
            </div>
          </div>

          {/* Invoice List */}
          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-[#1a1210] rounded-2xl border border-[#2d2018]">
              <Receipt className="w-12 h-12 text-stone-700 mx-auto mb-3" />
              <p className="text-stone-500 text-sm">No invoices in this period.</p>
            </div>
          ) : (
            <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#2d2018] bg-stone-900/40">
                      {[
                        'Invoice #',
                        'Date',
                        'Customer',
                        'Items',
                        'Subtotal',
                        'GST',
                        'Total',
                        'Payment',
                        'WhatsApp',
                        'Email',
                        '',
                      ].map(h => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-stone-500 font-bold uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2d2018]">
                    {filtered.map(inv => (
                      <tr key={inv.invoice_id} className="hover:bg-stone-900/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-[#FF7A1A] font-bold whitespace-nowrap">
                          {inv.invoice_number}
                        </td>
                        <td className="px-4 py-3 text-stone-300 whitespace-nowrap">
                          {formatDate(inv.issued_at)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-white font-medium">{inv.customer_name}</p>
                          <p className="text-stone-500">{inv.customer_phone}</p>
                        </td>
                        <td className="px-4 py-3 text-stone-400">{(inv.items || []).length} items</td>
                        <td className="px-4 py-3 text-stone-300">{formatINR(inv.items_subtotal)}</td>
                        <td className="px-4 py-3 text-stone-400">{formatINR(inv.gst_amount)}</td>
                        <td className="px-4 py-3 text-[#FF7A1A] font-bold">{formatINR(inv.total_paid)}</td>
                        <td className="px-4 py-3 text-stone-300 whitespace-nowrap">
                          {PAYMENT_LABELS[inv.payment_mode] || inv.payment_mode}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold ${
                              inv.whatsapp_status === 'sent'
                                ? 'bg-green-900/50 text-green-300'
                                : inv.whatsapp_status === 'failed'
                                ? 'bg-red-900/50 text-red-300'
                                : 'bg-stone-800 text-stone-400'
                            }`}
                          >
                            {inv.whatsapp_status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold ${
                              inv.email_status === 'sent'
                                ? 'bg-green-900/50 text-green-300'
                                : inv.email_status === 'failed'
                                ? 'bg-red-900/50 text-red-300'
                                : 'bg-stone-800 text-stone-400'
                            }`}
                          >
                            {inv.email_status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setViewing(inv)}
                              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
                              title="View Invoice"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => printInvoice(inv)}
                              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
                              title="Print Invoice"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invoice Detail / Print Modal */}
      {viewing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-[#2d2018] sticky top-0 bg-[#1a1210] z-10">
              <div>
                <h3 className="text-base font-bold text-white">{viewing.invoice_number}</h3>
                <p className="text-xs text-stone-400">{formatDate(viewing.issued_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => printInvoice(viewing)}
                  className="px-3 py-1.5 rounded-lg bg-[#FF7A1A] text-white text-xs font-bold hover:bg-[#E8690D] flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Print
                </button>
                <button type="button" onClick={() => setViewing(null)}>
                  <X className="w-5 h-5 text-stone-400 hover:text-white" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs text-stone-500 mb-1">Restaurant</p>
                <p className="text-sm font-bold text-white">{viewing.restaurant_name}</p>
                {viewing.gstin && <p className="text-xs text-stone-400">GSTIN: {viewing.gstin}</p>}
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-1">Customer</p>
                <p className="text-sm font-bold text-white">{viewing.customer_name}</p>
                <p className="text-xs text-stone-400">{viewing.customer_phone}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-3">Line Items</p>
                <div className="space-y-1.5">
                  {(viewing.items || []).map((item, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-stone-300">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="text-white font-medium">{formatINR(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5 border-t border-[#2d2018] pt-3">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Subtotal</span>
                  <span className="text-stone-300">{formatINR(viewing.items_subtotal)}</span>
                </div>
                {viewing.discount_amount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400">Discount</span>
                    <span className="text-green-400">−{formatINR(viewing.discount_amount)}</span>
                  </div>
                )}
                {viewing.reservation_credit > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400">Deposit Credit</span>
                    <span className="text-green-400">−{formatINR(viewing.reservation_credit)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">GST ({viewing.gst_rate}%)</span>
                  <span className="text-stone-300">{formatINR(viewing.gst_amount)}</span>
                </div>
                <div className="flex justify-between text-sm font-black border-t border-[#2d2018] pt-2">
                  <span className="text-white">Total Paid</span>
                  <span className="text-[#FF7A1A] font-mono">{formatINR(viewing.total_paid)}</span>
                </div>
              </div>
              <div className="text-xs text-stone-400">
                Payment: {PAYMENT_LABELS[viewing.payment_mode] || viewing.payment_mode}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
