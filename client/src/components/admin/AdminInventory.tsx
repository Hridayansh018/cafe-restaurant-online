import React from 'react';
import { useDinePulse } from '../../context/DinePulseContext';
import { Package, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export const AdminInventory: React.FC = () => {
  const { menuItems, categories, toggleItemAvailability, updateMenuItem } = useDinePulse();

  const available = menuItems.filter(i => i.is_available);
  const unavailable = menuItems.filter(i => !i.is_available);
  const lowStock = menuItems.filter(i => i.qty_available !== null && i.qty_available !== undefined && i.qty_available < 5);

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-black text-white">Inventory Management</h1>
        <p className="text-sm text-stone-400 mt-0.5">
          Manage dish availability and stock quantities
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-950/30 border border-green-900/40 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-green-400">{available.length}</p>
          <p className="text-xs text-green-300/70 font-medium mt-1">Available</p>
        </div>
        <div className="bg-red-950/30 border border-red-900/40 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-red-400">{unavailable.length}</p>
          <p className="text-xs text-red-300/70 font-medium mt-1">86'd / Out</p>
        </div>
        <div className="bg-amber-950/30 border border-amber-900/40 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-amber-400">{lowStock.length}</p>
          <p className="text-xs text-amber-300/70 font-medium mt-1">Low Stock (&lt;5)</p>
        </div>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="p-4 bg-amber-950/40 border border-amber-800/50 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-300">Low Stock Alert</p>
            <p className="text-xs text-amber-400/80 mt-0.5">
              {lowStock.map(i => i.name).join(', ')} — running low. Consider updating quantities.
            </p>
          </div>
        </div>
      )}

      {/* Per-category inventory */}
      {categories.map(cat => {
        const catItems = menuItems.filter(i => i.category_id === cat.category_id);
        if (catItems.length === 0) return null;
        return (
          <div key={cat.category_id} className="bg-[#1a1210] rounded-2xl border border-[#2d2018] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#2d2018] bg-stone-900/40">
              <h3 className="text-sm font-bold text-white">{cat.name}</h3>
            </div>
            <div className="divide-y divide-[#2d2018]">
              {catItems.map(item => (
                <div key={item.item_id} className="flex items-center gap-4 px-5 py-3">
                  {/* Status indicator */}
                  {item.is_available
                    ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    : <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  }

                  {/* Item info */}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{item.name}</p>
                    <p className="text-[11px] text-stone-500">₹{item.price}</p>
                  </div>

                  {/* Qty editor */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-stone-500">Qty:</label>
                    <input
                      type="number"
                      min="0"
                      value={item.qty_available ?? ''}
                      onChange={e => {
                        const val = e.target.value === '' ? null : Number(e.target.value);
                        updateMenuItem(item.item_id, { qty_available: val });
                      }}
                      placeholder="∞"
                      className="w-16 px-2 py-1 bg-stone-900 border border-stone-700 rounded-lg text-xs text-white text-center focus:outline-none focus:border-[#FF7A1A]"
                    />
                  </div>

                  {/* Toggle availability */}
                  <button
                    type="button"
                    onClick={() => toggleItemAvailability(item.item_id)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                      item.is_available
                        ? 'bg-green-900/50 text-green-300 hover:bg-red-900/50 hover:text-red-300'
                        : 'bg-red-900/50 text-red-300 hover:bg-green-900/50 hover:text-green-300'
                    }`}
                  >
                    {item.is_available ? 'Mark 86\'' : 'Restore'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
