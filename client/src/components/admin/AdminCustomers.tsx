import React, { useState } from 'react';
import { useDinePulse } from '../../context/DinePulseContext';
import { formatINR } from '../../utils/qrHelper';
import { Users, Download, Search, Filter } from 'lucide-react';

type Range = '7d' | '30d' | '90d' | 'all';

export const AdminCustomers: React.FC = () => {
  const { customers, refreshCustomers } = useDinePulse();
  const [range, setRange] = useState<Range>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'last_visit' | 'total_spent' | 'visit_count'>('last_visit');

  const getRangeCutoff = (r: Range) => {
    if (r === 'all') return 0;
    const days = r === '7d' ? 7 : r === '30d' ? 30 : 90;
    return Date.now() - days * 86400000;
  };

  const cutoff = getRangeCutoff(range);

  const filtered = customers
    .filter(c => {
      const inRange = range === 'all' || (c.last_visit !== null && c.last_visit >= cutoff);
      const matchSearch = search === '' ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        c.email.toLowerCase().includes(search.toLowerCase());
      return inRange && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'total_spent') return b.total_spent - a.total_spent;
      if (sortBy === 'visit_count') return b.visit_count - a.visit_count;
      return (b.last_visit || 0) - (a.last_visit || 0);
    });

  const totalCustomers = customers.length;
  const totalSpend = customers.reduce((s, c) => s + c.total_spent, 0);
  const marketingOptIn = customers.filter(c => c.marketing_opt_in).length;

  const formatDate = (ts: number | null) =>
    ts ? new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never';

  const exportCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Visit Count', 'Total Spent (₹)', 'Last Visit', 'Marketing Opt-In', 'Joined'];
    const rows = filtered.map(c => [
      c.name,
      c.phone,
      c.email,
      c.visit_count,
      c.total_spent.toFixed(2),
      formatDate(c.last_visit),
      c.marketing_opt_in ? 'Yes' : 'No',
      formatDate(c.created_at),
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const rangeLabel = range === 'all' ? 'all-time' : `last-${range}`;
    a.download = `customers-${rangeLabel}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Customer Data</h1>
          <p className="text-sm text-stone-400 mt-0.5">{totalCustomers} total customers</p>
        </div>
        <button
          type="button"
          onClick={exportCSV}
          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] p-4 text-center">
          <p className="text-2xl font-black text-white">{totalCustomers}</p>
          <p className="text-xs text-stone-500 mt-1">Total Customers</p>
        </div>
        <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] p-4 text-center">
          <p className="text-2xl font-black text-[#FF7A1A]">{formatINR(totalSpend)}</p>
          <p className="text-xs text-stone-500 mt-1">Lifetime Spend</p>
        </div>
        <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] p-4 text-center">
          <p className="text-2xl font-black text-emerald-400">{marketingOptIn}</p>
          <p className="text-xs text-stone-500 mt-1">Marketing Opt-In</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {(['7d', '30d', '90d', 'all'] as Range[]).map(r => (
            <button key={r} type="button" onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${range === r ? 'bg-[#FF7A1A] text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}>
              {r === 'all' ? 'All Time' : `Last ${r}`}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-300 focus:outline-none"
        >
          <option value="last_visit">Sort: Last Visit</option>
          <option value="total_spent">Sort: Highest Spend</option>
          <option value="visit_count">Sort: Most Visits</option>
        </select>
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500" />
          <input
            type="text"
            placeholder="Search name, phone, email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#1a1210] border border-[#2d2018] rounded-xl text-sm text-white placeholder-stone-600 focus:outline-none focus:border-[#FF7A1A]"
          />
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-stone-700 mx-auto mb-3" />
            <p className="text-stone-500 text-sm">No customers match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#2d2018] bg-stone-900/40">
                  {['Name', 'Phone', 'Email', 'Visits', 'Total Spent', 'Last Visit', 'Marketing', 'Joined'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-stone-500 font-bold uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2018]">
                {filtered.map(c => (
                  <tr key={c.customer_id || c.phone} className="hover:bg-stone-900/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-stone-800 flex items-center justify-center text-white font-black text-[11px] shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-300 font-mono">{c.phone}</td>
                    <td className="px-4 py-3 text-stone-400">{c.email || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-stone-800 px-2 py-0.5 rounded-full font-bold text-white">{c.visit_count}</span>
                    </td>
                    <td className="px-4 py-3 text-[#FF7A1A] font-bold">{formatINR(c.total_spent)}</td>
                    <td className="px-4 py-3 text-stone-400 whitespace-nowrap">{formatDate(c.last_visit)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        c.marketing_opt_in ? 'bg-green-900/50 text-green-300' : 'bg-stone-800 text-stone-500'
                      }`}>
                        {c.marketing_opt_in ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-500 whitespace-nowrap">{formatDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Export note */}
      <p className="text-xs text-stone-600 text-center">
        CSV export includes: Name, Phone, Email, Visit Count, Total Spent, Last Visit, Marketing Opt-In, Join Date — filtered by your selected time range
      </p>
    </div>
  );
};
