import React, { useState } from 'react';
import { useDinePulse } from '../../context/DinePulseContext';
import { Reservation } from '../../types';
import { CalendarCheck, Plus, Trash2, CheckCircle2, X, Clock } from 'lucide-react';
import { formatINR } from '../../utils/qrHelper';

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-blue-900/50 text-blue-300',
  checked_in: 'bg-green-900/50 text-green-300',
  cancelled: 'bg-red-900/50 text-red-300',
  no_show: 'bg-stone-700 text-stone-400',
  completed: 'bg-purple-900/50 text-purple-300',
};

export const AdminReservations: React.FC = () => {
  const { reservations, addReservation, updateReservation, deleteReservation, tables } = useDinePulse();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    party_size: 2,
    reserved_for_date: new Date().toISOString().split('T')[0],
    time_slot: '20:00',
    table_preference: '',
    deposit_amount: 500,
    notes: '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name.trim() || !form.customer_phone.trim()) return;
    setSaving(true);
    try {
      await addReservation({
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        party_size: form.party_size,
        reserved_for_date: form.reserved_for_date,
        time_slot: form.time_slot,
        table_preference: form.table_preference,
        deposit_amount: form.deposit_amount,
        deposit_payment_id: '',
        deposit_status: 'paid',
        status: 'confirmed',
        reminder_sent_at: null,
        notes: form.notes,
      });
      setShowModal(false);
      setForm({ customer_name: '', customer_phone: '', party_size: 2, reserved_for_date: new Date().toISOString().split('T')[0], time_slot: '20:00', table_preference: '', deposit_amount: 500, notes: '' });
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const upcoming = reservations.filter(r => r.reserved_for_date >= today && r.status !== 'cancelled').sort((a, b) => a.reserved_for_date.localeCompare(b.reserved_for_date) || a.time_slot.localeCompare(b.time_slot));
  const past = reservations.filter(r => r.reserved_for_date < today || r.status === 'cancelled').sort((a, b) => b.reserved_for_date.localeCompare(a.reserved_for_date));

  const confirmedCount = reservations.filter(r => r.status === 'confirmed').length;
  const todayCount = reservations.filter(r => r.reserved_for_date === today).length;

  const ReservationCard: React.FC<{ r: Reservation }> = ({ r }) => (
    <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] p-4 flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-stone-800 flex flex-col items-center justify-center shrink-0">
        <p className="text-lg font-black text-white leading-none">{r.reserved_for_date.split('-')[2]}</p>
        <p className="text-[10px] text-stone-500 uppercase">{new Date(r.reserved_for_date + 'T00:00:00').toLocaleString('en-IN', { month: 'short' })}</p>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="text-sm font-bold text-white">{r.customer_name}</p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold capitalize ${STATUS_COLORS[r.status]}`}>
            {r.status.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-stone-400 flex-wrap">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {r.time_slot}</span>
          <span>Party of {r.party_size}</span>
          <span>{r.customer_phone}</span>
          {r.deposit_amount > 0 && <span className="text-green-400">₹{r.deposit_amount} deposit</span>}
          {r.table_preference && <span>Table: {tables.find(t => t.table_id === r.table_preference)?.label || r.table_preference}</span>}
        </div>
        {r.notes && <p className="text-xs text-stone-500 mt-1 italic">{r.notes}</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {r.status === 'confirmed' && (
          <button type="button" onClick={() => updateReservation(r.reservation_id, { status: 'checked_in' })}
            className="p-1.5 rounded-lg bg-green-900/50 hover:bg-green-800 text-green-400 transition-colors" title="Check In">
            <CheckCircle2 className="w-4 h-4" />
          </button>
        )}
        {r.status === 'confirmed' && (
          <button type="button" onClick={() => updateReservation(r.reservation_id, { status: 'no_show' })}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 transition-colors" title="No Show">
            <X className="w-4 h-4" />
          </button>
        )}
        <button type="button" onClick={async () => {
          if (window.confirm(`Cancel reservation for ${r.customer_name}?`)) {
            await deleteReservation(r.reservation_id);
          }
        }}
          className="p-1.5 rounded-lg bg-red-950/50 hover:bg-red-900 text-red-400 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Reservations</h1>
          <p className="text-sm text-stone-400 mt-0.5">{confirmedCount} confirmed · {todayCount} today</p>
        </div>
        <button type="button" onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-[#FF7A1A] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-900/30 hover:bg-[#E8690D] transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Reservation
        </button>
      </div>

      {/* Upcoming */}
      <div>
        <h2 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">Upcoming ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <div className="text-center py-10 bg-[#1a1210] rounded-2xl border border-[#2d2018] text-stone-600 text-sm">
            No upcoming reservations.
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map(r => <ReservationCard key={r.reservation_id} r={r} />)}
          </div>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-stone-600 uppercase tracking-widest mb-3">Past & Cancelled ({past.length})</h2>
          <div className="space-y-3 opacity-60">
            {past.map(r => <ReservationCard key={r.reservation_id} r={r} />)}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[#2d2018]">
              <h3 className="text-base font-bold text-white">New Reservation</h3>
              <button type="button" onClick={() => setShowModal(false)}><X className="w-5 h-5 text-stone-400" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-stone-400 mb-1">Customer Name *</label>
                  <input required value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-stone-400 mb-1">Phone *</label>
                  <input required type="tel" value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))}
                    placeholder="+91 99999 99999"
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1">Date</label>
                  <input type="date" value={form.reserved_for_date} onChange={e => setForm(f => ({ ...f, reserved_for_date: e.target.value }))}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1">Time</label>
                  <input type="time" value={form.time_slot} onChange={e => setForm(f => ({ ...f, time_slot: e.target.value }))}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1">Party Size</label>
                  <input type="number" min="1" value={form.party_size} onChange={e => setForm(f => ({ ...f, party_size: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1">Deposit (₹)</label>
                  <input type="number" min="0" value={form.deposit_amount} onChange={e => setForm(f => ({ ...f, deposit_amount: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-stone-400 mb-1">Table Preference</label>
                  <select value={form.table_preference} onChange={e => setForm(f => ({ ...f, table_preference: e.target.value }))}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]">
                    <option value="">Any available table</option>
                    {tables.map(t => <option key={t.table_id} value={t.table_id}>Table {t.label} ({t.zone}, {t.capacity} seats)</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-stone-400 mb-1">Notes</label>
                  <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Special requests, occasions…"
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A] resize-none" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2 rounded-xl bg-stone-800 text-stone-300 text-sm font-bold">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 rounded-xl bg-[#FF7A1A] text-white text-sm font-bold disabled:opacity-50">
                  {saving ? 'Saving…' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
