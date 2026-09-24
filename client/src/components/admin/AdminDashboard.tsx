import React, { useState, useEffect } from 'react';
import { useDinePulse } from '../../context/DinePulseContext';
import { db } from '../../lib/db';
import { formatINR } from '../../utils/qrHelper';
import {
  TrendingUp, ShoppingBag, Users, Clock, Receipt, Zap,
  ArrowUpRight, ArrowDownRight, BarChart2,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { restaurant, tables, orders, invoices, customers, reservations, staff } = useDinePulse();
  const [revenueData, setRevenueData] = useState<{ date: string; revenue: number; orders: number }[]>([]);

  useEffect(() => {
    db.getDailyRevenue(7).then(setRevenueData);
  }, []);

  const totalRevenue = invoices.reduce((s, i) => s + i.total_paid, 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayInvs = invoices.filter(i => new Date(i.issued_at).toISOString().startsWith(todayStr));
  const todayRevenue = todayInvs.reduce((s, i) => s + i.total_paid, 0);
  const avgOrderValue = invoices.length > 0 ? totalRevenue / invoices.length : 0;

  const occupiedTables = tables.filter(t => t.status === 'occupied' || t.status === 'billing_requested').length;
  const activeSessions = tables.filter(t => t.status === 'occupied').length;
  const pendingOrders = orders.filter(o => o.status === 'placed' || o.status === 'preparing').length;
  const confirmedReservations = reservations.filter(r => r.status === 'confirmed').length;

  const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Dashboard</h1>
        <p className="text-sm text-stone-400 mt-0.5">
          {restaurant.name} — Live operational overview
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Today's Revenue",
            value: formatINR(todayRevenue),
            sub: `${todayInvs.length} invoices today`,
            icon: Receipt,
            color: 'text-[#FF7A1A]',
            bg: 'bg-orange-950/40 border-orange-900/50',
          },
          {
            label: 'Total Revenue (All Time)',
            value: formatINR(totalRevenue),
            sub: `${invoices.length} total invoices`,
            icon: TrendingUp,
            color: 'text-emerald-400',
            bg: 'bg-emerald-950/30 border-emerald-900/40',
          },
          {
            label: 'Avg Order Value',
            value: formatINR(avgOrderValue),
            sub: 'Per settled invoice',
            icon: Zap,
            color: 'text-blue-400',
            bg: 'bg-blue-950/30 border-blue-900/40',
          },
          {
            label: 'Active Tables',
            value: `${occupiedTables} / ${tables.length}`,
            sub: `${pendingOrders} orders in queue`,
            icon: BarChart2,
            color: 'text-purple-400',
            bg: 'bg-purple-950/30 border-purple-900/40',
          },
        ].map(kpi => (
          <div key={kpi.label} className={`rounded-2xl border p-5 ${kpi.bg}`}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider leading-tight">{kpi.label}</p>
              <kpi.icon className={`w-5 h-5 ${kpi.color} shrink-0`} />
            </div>
            <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[11px] text-stone-500 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* 7-Day Revenue Chart */}
      <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-[#FF7A1A]" />
          Revenue — Last 7 Days
        </h3>
        {revenueData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-stone-600 text-sm">
            No revenue data yet. Invoices will appear here.
          </div>
        ) : (
          <div className="flex items-end gap-2 h-40">
            {revenueData.map(day => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-stone-400 font-mono">{formatINR(day.revenue)}</span>
                <div
                  className="w-full bg-[#FF7A1A] rounded-t-md transition-all"
                  style={{ height: `${Math.max(4, (day.revenue / maxRevenue) * 100)}px` }}
                />
                <span className="text-[9px] text-stone-500">{day.date.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Tables */}
        <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] p-5">
          <h3 className="text-sm font-bold text-white mb-3">Floor Status</h3>
          <div className="space-y-2">
            {['vacant', 'occupied', 'billing_requested', 'reserved'].map(status => {
              const count = tables.filter(t => t.status === status).length;
              const colors: Record<string, string> = {
                vacant: 'bg-stone-700 text-stone-300',
                occupied: 'bg-green-900/60 text-green-300',
                billing_requested: 'bg-amber-900/60 text-amber-300',
                reserved: 'bg-blue-900/60 text-blue-300',
              };
              return (
                <div key={status} className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${colors[status]}`}>
                    {status.replace('_', ' ')}
                  </span>
                  <span className="text-lg font-black text-white">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Metrics */}
        <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] p-5">
          <h3 className="text-sm font-bold text-white mb-3">Today's Metrics</h3>
          <div className="space-y-3">
            {[
              { label: 'Orders Settled', value: todayInvs.length },
              { label: 'Pending Orders', value: pendingOrders },
              { label: 'Reservations Today', value: confirmedReservations },
              { label: 'Total Customers', value: customers.length },
              { label: 'Active Staff', value: staff.filter(s => s.is_active).length },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between text-sm">
                <span className="text-stone-400">{m.label}</span>
                <span className="font-bold text-white">{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Waiter Calls */}
        <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] p-5">
          <h3 className="text-sm font-bold text-white mb-3">Active Alerts</h3>
          {tables.filter(t => t.call_waiter_active).length === 0 ? (
            <div className="text-center py-6 text-stone-600 text-sm">
              No active waiter calls 🎉
            </div>
          ) : (
            <div className="space-y-2">
              {tables.filter(t => t.call_waiter_active).map(t => (
                <div key={t.table_id} className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/50">
                  <p className="text-xs font-bold text-amber-300">Table {t.label}</p>
                  <p className="text-[11px] text-stone-400">{t.call_waiter_reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
