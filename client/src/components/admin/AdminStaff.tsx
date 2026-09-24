import React, { useState } from 'react';
import { useDinePulse } from '../../context/DinePulseContext';
import { Staff } from '../../types';
import { Plus, Pencil, Trash2, X, UserCheck, UserX, Phone } from 'lucide-react';

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-900/50 text-purple-300',
  waiter: 'bg-blue-900/50 text-blue-300',
  kitchen: 'bg-orange-900/50 text-orange-300',
  cashier: 'bg-green-900/50 text-green-300',
};

export const AdminStaff: React.FC = () => {
  const { staff, addStaff, updateStaff, deleteStaff } = useDinePulse();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState({ name: '', role: 'waiter' as Staff['role'], phone: '' });
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setEditing(null); setForm({ name: '', role: 'waiter', phone: '' }); setShowModal(true); };
  const openEdit = (s: Staff) => { setEditing(s); setForm({ name: s.name, role: s.role, phone: s.phone }); setShowModal(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateStaff(editing.staff_id, form);
      } else {
        await addStaff(form.name.trim(), form.role, form.phone.trim());
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (staffId: string, name: string) => {
    if (!window.confirm(`Remove ${name} from staff? This cannot be undone.`)) return;
    await deleteStaff(staffId);
  };

  const active = staff.filter(s => s.is_active);
  const inactive = staff.filter(s => !s.is_active);

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Staff Management</h1>
          <p className="text-sm text-stone-400 mt-0.5">{active.length} active · {inactive.length} inactive</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="px-4 py-2 rounded-xl bg-[#FF7A1A] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-900/30 hover:bg-[#E8690D] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Staff
        </button>
      </div>

      {/* Active Staff */}
      <div>
        <h2 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">Active Staff ({active.length})</h2>
        {active.length === 0 ? (
          <div className="text-center py-10 text-stone-600 bg-[#1a1210] rounded-2xl border border-[#2d2018]">
            No active staff. Add team members.
          </div>
        ) : (
          <div className="space-y-3">
            {active.map(s => (
              <div key={s.staff_id} className="bg-[#1a1210] rounded-2xl border border-[#2d2018] p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center text-lg font-black text-white shrink-0">
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">{s.name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold capitalize ${ROLE_COLORS[s.role]}`}>
                      {s.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-stone-500" />
                    <span className="text-xs text-stone-400">{s.phone || 'No phone'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateStaff(s.staff_id, { is_active: false })}
                    className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-amber-400 transition-colors"
                    title="Deactivate"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(s)}
                    className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(s.staff_id, s.name)}
                    className="p-2 rounded-lg bg-red-950/50 hover:bg-red-900 text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inactive Staff */}
      {inactive.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-stone-600 uppercase tracking-widest mb-3">Inactive Staff ({inactive.length})</h2>
          <div className="space-y-3">
            {inactive.map(s => (
              <div key={s.staff_id} className="bg-[#1a1210] rounded-2xl border border-[#2d2018] opacity-60 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center text-lg font-black text-stone-600 shrink-0">
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-stone-500 line-through">{s.name}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold capitalize ${ROLE_COLORS[s.role]} opacity-50`}>
                    {s.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => updateStaff(s.staff_id, { is_active: true })}
                  className="px-3 py-1.5 rounded-lg bg-green-900/50 text-green-300 hover:bg-green-800 text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Reactivate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-[#2d2018]">
              <h3 className="text-base font-bold text-white">{editing ? 'Edit Staff' : 'Add Staff Member'}</h3>
              <button type="button" onClick={() => setShowModal(false)}><X className="w-5 h-5 text-stone-400" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-400 mb-1">Full Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-400 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as Staff['role'] }))}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]"
                >
                  <option value="waiter">Waiter</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="cashier">Cashier</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-400 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2 rounded-xl bg-stone-800 text-stone-300 text-sm font-bold hover:bg-stone-700">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 rounded-xl bg-[#FF7A1A] text-white text-sm font-bold disabled:opacity-50">
                  {saving ? 'Saving…' : editing ? 'Update' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
