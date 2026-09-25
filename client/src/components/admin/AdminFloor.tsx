import React, { useState, useEffect } from 'react';
import { useDinePulse } from '../../context/DinePulseContext';
import { Table } from '../../types';
import { generateQRCodeDataURL, formatINR } from '../../utils/qrHelper';
import { Grid, Plus, Trash2, RefreshCw, QrCode, X, Download, Users } from 'lucide-react';

export const AdminFloor: React.FC = () => {
  const { tables, addTable, deleteTable, reissueTableQR, restaurant, resolveWaiterCall } = useDinePulse();
  const [showAddModal, setShowAddModal] = useState(false);
  const [qrTable, setQrTable] = useState<Table | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [form, setForm] = useState({ label: '', capacity: 4, zone: 'Indoor' });
  const [saving, setSaving] = useState(false);

  // Generate real QR when viewing table
  useEffect(() => {
    if (!qrTable) { setQrDataUrl(''); return; }
    const url = `${window.location.origin}/menu?table=${qrTable.table_id}&token=${qrTable.qr_token}`;
    generateQRCodeDataURL(url).then(setQrDataUrl);
  }, [qrTable]);

  const STATUS_COLORS: Record<string, string> = {
    vacant: 'border-stone-700 bg-stone-900/30 text-stone-400',
    occupied: 'border-green-700/60 bg-green-950/30 text-green-400',
    billing_requested: 'border-amber-700/60 bg-amber-950/30 text-amber-400',
    reserved: 'border-blue-700/60 bg-blue-950/30 text-blue-400',
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label.trim()) return;
    setSaving(true);
    try {
      await addTable({ label: form.label.trim(), capacity: form.capacity, zone: form.zone, status: 'vacant', current_session_id: null, position: { x: 100, y: 100 } });
      setShowAddModal(false);
      setForm({ label: '', capacity: 4, zone: 'Indoor' });
    } finally {
      setSaving(false);
    }
  };

  const printQR = () => {
    if (!qrTable || !qrDataUrl) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>QR — Table ${qrTable.label}</title>
      <style>body{font-family:sans-serif;text-align:center;padding:40px}img{border:2px solid #eee;border-radius:12px;padding:12px}p{margin:8px 0;color:#555}</style>
      </head><body>
        <h2>${restaurant.name}</h2>
        <h3>Table ${qrTable.label} — ${qrTable.zone}</h3>
        <img src="${qrDataUrl}" width="280" height="280" />
        <p>Scan to order · Capacity: ${qrTable.capacity}</p>
        <p style="font-size:10px;color:#999">Token v${qrTable.qr_version} · ${new Date(qrTable.qr_issued_at).toLocaleDateString()}</p>
      </body></html>
    `);
    win.print();
    win.close();
  };

  const zones = [...new Set(tables.map(t => t.zone))];

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Floor & QR Management</h1>
          <p className="text-sm text-stone-400 mt-0.5">{tables.length} tables · QRs link to this device's URL</p>
        </div>
        <button type="button" onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-[#FF7A1A] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-900/30 hover:bg-[#E8690D] transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Table
        </button>
      </div>

      {/* QR URL note */}
      <div className="p-4 bg-blue-950/30 border border-blue-800/40 rounded-2xl text-xs text-blue-300">
        <strong>QR Code URL:</strong> Each table QR encodes <code className="bg-blue-900/40 px-1 py-0.5 rounded font-mono">{window.location.origin}/menu?table=[id]&token=[token]</code>. 
        Scanning the code on a phone opens the menu page directly bound to that table.
      </div>

      {/* Tables by zone */}
      {zones.map(zone => (
        <div key={zone}>
          <h2 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">{zone}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {tables.filter(t => t.zone === zone).map(table => (
              <div key={table.table_id} className={`rounded-2xl border p-4 ${STATUS_COLORS[table.status]} relative`}>
                {table.call_waiter_active && (
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-500 border-2 border-[#1a1210] animate-pulse" />
                )}
                <div className="text-center mb-3">
                  <p className="text-2xl font-black text-white">{table.label}</p>
                  <p className="text-[10px] text-stone-500 flex items-center justify-center gap-1">
                    <Users className="w-3 h-3" /> {table.capacity} seats
                  </p>
                </div>
                <div className="text-center mb-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold capitalize ${
                    table.status === 'vacant' ? 'bg-stone-700 text-stone-300' :
                    table.status === 'occupied' ? 'bg-green-900 text-green-200' :
                    table.status === 'billing_requested' ? 'bg-amber-900 text-amber-200' :
                    'bg-blue-900 text-blue-200'
                  }`}>
                    {table.status.replace('_', ' ')}
                  </span>
                </div>
                {table.call_waiter_active && (
                  <button type="button" onClick={() => resolveWaiterCall(table.table_id)}
                    className="w-full mb-2 py-1 rounded-lg bg-amber-900/50 text-amber-300 text-[10px] font-bold hover:bg-amber-800 transition-colors">
                    Clear Alert
                  </button>
                )}
                <div className="flex gap-1">
                  <button type="button" onClick={() => setQrTable(table)}
                    className="flex-1 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-bold transition-colors flex items-center justify-center gap-1">
                    <QrCode className="w-3 h-3" /> QR
                  </button>
                  <button type="button" onClick={() => reissueTableQR(table.table_id)}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-amber-400 transition-colors" title="Reissue QR">
                    <RefreshCw className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => { if (window.confirm(`Delete table ${table.label}?`)) deleteTable(table.table_id); }}
                    className="p-1.5 rounded-lg bg-red-950/50 hover:bg-red-900 text-red-400 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {tables.length === 0 && (
        <div className="text-center py-20 bg-[#1a1210] rounded-2xl border border-[#2d2018] text-stone-600">
          No tables yet. Add your first table to get started.
        </div>
      )}

      {/* QR Modal */}
      {qrTable && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-[#2d2018]">
              <h3 className="text-base font-bold text-white">QR Code — Table {qrTable.label}</h3>
              <button type="button" onClick={() => setQrTable(null)}><X className="w-5 h-5 text-stone-400" /></button>
            </div>
            <div className="p-5 text-center">
              <div className="inline-block p-4 bg-white rounded-2xl mb-4">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[#FF7A1A] rounded-full animate-spin border-t-transparent" />
                  </div>
                )}
              </div>
              <p className="text-sm font-bold text-white mb-1">Table {qrTable.label}</p>
              <p className="text-xs text-stone-400 mb-1">{qrTable.zone} · {qrTable.capacity} seats</p>
              <p className="text-[10px] text-stone-600 mb-4 font-mono break-all">
                {window.location.origin}/diner?table={qrTable.table_id}
              </p>
              <p className="text-[10px] text-stone-500 mb-4">
                Token v{qrTable.qr_version} · Issued {new Date(qrTable.qr_issued_at).toLocaleDateString()}
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => reissueTableQR(qrTable.table_id).then(() => {
                  const updated = tables.find(t => t.table_id === qrTable.table_id);
                  if (updated) setQrTable(updated);
                })}
                  className="flex-1 py-2 rounded-xl bg-amber-900/50 text-amber-300 text-xs font-bold hover:bg-amber-800 transition-colors flex items-center justify-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5" /> Reissue
                </button>
                <button type="button" onClick={printQR}
                  className="flex-1 py-2 rounded-xl bg-[#FF7A1A] text-white text-xs font-bold hover:bg-[#E8690D] transition-colors flex items-center justify-center gap-1">
                  <Download className="w-3.5 h-3.5" /> Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-[#2d2018]">
              <h3 className="text-base font-bold text-white">Add Table</h3>
              <button type="button" onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-stone-400" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-400 mb-1">Table Label *</label>
                <input required value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="e.g., T1, T-VIP, Outdoor 3"
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-400 mb-1">Capacity (seats)</label>
                <input type="number" min="1" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-400 mb-1">Zone / Location</label>
                <input value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}
                  placeholder="Indoor, Outdoor, Private Room…"
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 rounded-xl bg-stone-800 text-stone-300 text-sm font-bold">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 rounded-xl bg-[#FF7A1A] text-white text-sm font-bold disabled:opacity-50">
                  {saving ? 'Adding…' : 'Add Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
