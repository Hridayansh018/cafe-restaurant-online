import React, { useState } from 'react';
import { useDinePulse } from '../../context/DinePulseContext';
import { Settings, Save } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { restaurant, updateRestaurant } = useDinePulse();
  const [form, setForm] = useState({
    name: restaurant.name,
    gstin: restaurant.gstin,
    address_line1: restaurant.address.line1,
    address_city: restaurant.address.city,
    address_state: restaurant.address.state,
    address_pincode: restaurant.address.pincode,
    sla_prep_minutes: restaurant.sla_prep_minutes,
    reservation_deposit_default: restaurant.reservation_deposit_default,
    brand_primary_color: restaurant.brand_theme.primary_color,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateRestaurant({
        name: form.name.trim(),
        gstin: form.gstin.trim(),
        address: {
          line1: form.address_line1.trim(),
          city: form.address_city.trim(),
          state: form.address_state.trim(),
          pincode: form.address_pincode.trim(),
        },
        sla_prep_minutes: form.sla_prep_minutes,
        reservation_deposit_default: form.reservation_deposit_default,
        brand_theme: {
          primary_color: form.brand_primary_color,
          background_color: restaurant.brand_theme.background_color,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-white">Restaurant Settings</h1>
        <p className="text-sm text-stone-400 mt-0.5">Configure your restaurant profile and operational settings</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Basic Information</h3>
          <div>
            <label className="block text-xs font-bold text-stone-400 mb-1">Restaurant Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-400 mb-1">GSTIN</label>
            <input value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value }))}
              placeholder="22AAAAA0000A1Z5"
              className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#FF7A1A]" />
          </div>
        </div>

        {/* Address */}
        <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Address (used on invoices)</h3>
          <div>
            <label className="block text-xs font-bold text-stone-400 mb-1">Address Line 1</label>
            <input value={form.address_line1} onChange={e => setForm(f => ({ ...f, address_line1: e.target.value }))}
              className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-400 mb-1">City</label>
              <input value={form.address_city} onChange={e => setForm(f => ({ ...f, address_city: e.target.value }))}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-400 mb-1">State</label>
              <input value={form.address_state} onChange={e => setForm(f => ({ ...f, address_state: e.target.value }))}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-400 mb-1">Pincode</label>
              <input value={form.address_pincode} onChange={e => setForm(f => ({ ...f, address_pincode: e.target.value }))}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]" />
            </div>
          </div>
        </div>

        {/* Operational */}
        <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Operational Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-400 mb-1">Kitchen SLA (minutes)</label>
              <input type="number" min="1" value={form.sla_prep_minutes}
                onChange={e => setForm(f => ({ ...f, sla_prep_minutes: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]" />
              <p className="text-[10px] text-stone-600 mt-1">Orders beyond this are marked as SLA breached in KDS</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-400 mb-1">Default Reservation Deposit (₹)</label>
              <input type="number" min="0" value={form.reservation_deposit_default}
                onChange={e => setForm(f => ({ ...f, reservation_deposit_default: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]" />
            </div>
          </div>
        </div>

        {/* Brand */}
        <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Brand</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-stone-400 mb-1">Primary Color</label>
              <input type="color" value={form.brand_primary_color}
                onChange={e => setForm(f => ({ ...f, brand_primary_color: e.target.value }))}
                className="w-16 h-10 rounded-lg cursor-pointer bg-transparent border border-stone-700" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-stone-500">Preview</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm"
                  style={{ backgroundColor: form.brand_primary_color }}>A</div>
                <span className="text-sm font-bold" style={{ color: form.brand_primary_color }}>{form.name || 'My Restaurant'}</span>
              </div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-3 rounded-2xl bg-[#FF7A1A] text-white font-bold text-sm disabled:opacity-50 hover:bg-[#E8690D] transition-colors flex items-center justify-center gap-2 shadow-md shadow-orange-900/30">
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : saved ? 'Saved! ✓' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};
