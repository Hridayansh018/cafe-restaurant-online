import React, { useState, useEffect } from 'react';
import { useDinePulse } from '../../context/DinePulseContext';
import { db } from '../../lib/db';
import { formatINR } from '../../utils/qrHelper';
import { TrendingUp, BarChart2, ShoppingBag, Clock, Users } from 'lucide-react';

type Period = '7d' | '30d' | '90d';

export const AdminStats: React.FC = () => {
  const { invoices, customers, orders, tables } = useDinePulse();
  const [period, setPeriod] = useState<Period>('30d');
  const [dailyRevenue, setDailyRevenue] = useState<{ date: string; revenue: number; orders: number }[]>([]);
  const [topItems, setTopItems] = useState<{ item_id: string; name: string; quantity_sold: number; revenue: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

  useEffect(() => {
    setLoading(true);
    Promise.all([db.getDailyRevenue(days), db.getTopItems(days)])
      .then(([rev, items]) => { setDailyRevenue(rev); setTopItems(items); })
      .finally(() => setLoading(false));
  }, [period]);

  const cutoff = Date.now() - days * 86400000;
  const periodInvoices = invoices.filter(i => i.issued_at >= cutoff);
  const totalRevenue = periodInvoices.reduce((s, i) => s + i.total_paid, 0);
  const totalGST = periodInvoices.reduce((s, i) => s + i.gst_amount, 0);
  const avgOrderValue = periodInvoices.length > 0 ? totalRevenue / periodInvoices.length : 0;
  const newCustomers = customers.filter(c => (c.last_visit || 0) >= cutoff).length;

  const maxRevenue = Math.max(...dailyRevenue.map(d => d.revenue), 1);
  const maxTopItem = Math.max(...topItems.map(i => i.revenue), 1);

  const paymentModes = periodInvoices.reduce((acc, inv) => {
    acc[inv.payment_mode] = (acc[inv.payment_mode] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const PAYMENT_LABELS: Record<string, string> = {
    online_upi: 'UPI', online_card: 'Card (Online)',
    counter_cash: 'Cash', counter_card: 'Card (Counter)',
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Detailed Statistics</h1>
          <p className="text-sm text-stone-400 mt-0.5">Analytics from real invoice data</p>
        </div>
        <div className="flex gap-1">
          {(['7d', '30d', '90d'] as Period[]).map(p => (
            <button key={p} type="button" onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${period === p ? 'bg-[#FF7A1A] text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}>
              {p === '7d' ? 'Last 7 Days' : p === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatINR(totalRevenue), icon: TrendingUp, color: 'text-[#FF7A1A]', bg: 'border-orange-900/50 bg-orange-950/20' },
          { label: 'Invoices Generated', value: periodInvoices.length, icon: BarChart2, color: 'text-blue-400', bg: 'border-blue-900/50 bg-blue-950/20' },
          { label: 'Avg Order Value', value: formatINR(avgOrderValue), icon: ShoppingBag, color: 'text-emerald-400', bg: 'border-emerald-900/50 bg-emerald-950/20' },
          { label: 'New Customers', value: newCustomers, icon: Users, color: 'text-purple-400', bg: 'border-purple-900/50 bg-purple-950/20' },
        ].map(kpi => (
          <div key={kpi.label} className={`rounded-2xl border p-5 ${kpi.bg}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-stone-400">{kpi.label}</p>
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </div>
            <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] p-5">
        <h3 className="text-sm font-bold text-white mb-4">Daily Revenue</h3>
        {loading ? (
          <div className="h-48 flex items-center justify-center text-stone-600">Loading…</div>
        ) : dailyRevenue.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-stone-600 text-sm">
            No revenue data for this period.
          </div>
        ) : (
          <>
            <div className="flex items-end gap-1 h-48 mb-2">
              {dailyRevenue.map(day => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-800 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap pointer-events-none z-10">
                    {day.date}<br/>{formatINR(day.revenue)}<br/>{day.orders} orders
                  </div>
                  <div
                    className="w-full bg-[#FF7A1A] rounded-t-sm transition-all hover:bg-orange-400"
                    style={{ height: `${Math.max(4, (day.revenue / maxRevenue) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-[10px] text-stone-600">
              <span>{dailyRevenue[0]?.date}</span>
              <span>{dailyRevenue[dailyRevenue.length - 1]?.date}</span>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Items */}
        <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] p-5">
          <h3 className="text-sm font-bold text-white mb-4">Top Selling Items by Revenue</h3>
          {topItems.length === 0 ? (
            <div className="text-stone-600 text-sm text-center py-10">No sales data yet.</div>
          ) : (
            <div className="space-y-3">
              {topItems.slice(0, 8).map((item, i) => (
                <div key={item.item_id} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-stone-300 flex items-center gap-2">
                      <span className="text-[10px] text-stone-600 font-mono w-4">#{i + 1}</span>
                      {item.name}
                    </span>
                    <span className="text-[#FF7A1A]">{formatINR(item.revenue)} ({item.quantity_sold} sold)</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FF7A1A] rounded-full"
                      style={{ width: `${(item.revenue / maxTopItem) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Breakdown */}
        <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] p-5">
          <h3 className="text-sm font-bold text-white mb-4">Payment Method Breakdown</h3>
          {Object.keys(paymentModes).length === 0 ? (
            <div className="text-stone-600 text-sm text-center py-10">No payments yet.</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(paymentModes)
                .sort((a, b) => b[1] - a[1])
                .map(([mode, count]) => (
                  <div key={mode} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-stone-300">{PAYMENT_LABELS[mode] || mode}</span>
                      <span className="text-stone-400">{count} transactions ({Math.round(count / periodInvoices.length * 100)}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(count / periodInvoices.length) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* GST Summary */}
          <div className="mt-6 pt-4 border-t border-[#2d2018]">
            <h4 className="text-xs font-bold text-stone-500 mb-3">Tax Summary</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-stone-900/40 rounded-xl">
                <p className="text-[10px] text-stone-500">Total GST Collected</p>
                <p className="text-base font-black text-blue-400">{formatINR(totalGST)}</p>
              </div>
              <div className="p-3 bg-stone-900/40 rounded-xl">
                <p className="text-[10px] text-stone-500">Net Revenue (excl. GST)</p>
                <p className="text-base font-black text-emerald-400">{formatINR(totalRevenue - totalGST)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Distribution */}
      <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] p-5">
        <h3 className="text-sm font-bold text-white mb-4">Current Order Queue Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {['placed', 'preparing', 'ready', 'served', 'cancelled'].map(status => {
            const count = orders.filter(o => o.status === status).length;
            const colors: Record<string, string> = {
              placed: 'bg-amber-900/30 border-amber-800/40 text-amber-400',
              preparing: 'bg-orange-900/30 border-orange-800/40 text-orange-400',
              ready: 'bg-green-900/30 border-green-800/40 text-green-400',
              served: 'bg-blue-900/30 border-blue-800/40 text-blue-400',
              cancelled: 'bg-red-900/30 border-red-800/40 text-red-400',
            };
            return (
              <div key={status} className={`rounded-xl border p-4 text-center ${colors[status]}`}>
                <p className="text-2xl font-black">{count}</p>
                <p className="text-[10px] font-bold capitalize mt-1 opacity-80">{status}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
