import React, { useState } from 'react';
import { useDinePulse } from '../../context/DinePulseContext';
import { Campaign } from '../../types';
import { Megaphone, Plus, Send, X, BarChart2 } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-stone-700 text-stone-300',
  scheduled: 'bg-blue-900/50 text-blue-300',
  sent: 'bg-green-900/50 text-green-300',
};

export const AdminCampaigns: React.FC = () => {
  const { campaigns, addCampaign, customers } = useDinePulse();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    channel: 'both' as Campaign['channel'],
    message_body: '',
    audience_last_visit_days: 90,
    audience_min_orders: 1,
  });

  const audienceCount = customers.filter(c =>
    c.marketing_opt_in &&
    (c.last_visit !== null && c.last_visit >= Date.now() - form.audience_last_visit_days * 86400000) &&
    c.visit_count >= form.audience_min_orders
  ).length;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await addCampaign({
        name: form.name.trim(),
        channel: form.channel,
        template_id: '',
        message_body: form.message_body.trim(),
        audience_filter: { last_visit_within_days: form.audience_last_visit_days, min_orders: form.audience_min_orders },
        scheduled_at: null,
        status: 'draft',
      });
      setShowModal(false);
      setForm({ name: '', channel: 'both', message_body: '', audience_last_visit_days: 90, audience_min_orders: 1 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Marketing Campaigns</h1>
          <p className="text-sm text-stone-400 mt-0.5">{campaigns.length} campaigns · {customers.filter(c => c.marketing_opt_in).length} opted-in customers</p>
        </div>
        <button type="button" onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-[#FF7A1A] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-900/30 hover:bg-[#E8690D] transition-colors">
          <Plus className="w-3.5 h-3.5" /> Create Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-20 bg-[#1a1210] rounded-2xl border border-[#2d2018]">
          <Megaphone className="w-12 h-12 text-stone-700 mx-auto mb-3" />
          <p className="text-stone-500 text-sm">No campaigns yet. Create your first marketing broadcast.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map(c => (
            <div key={c.campaign_id} className="bg-[#1a1210] rounded-2xl border border-[#2d2018] p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-white">{c.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold capitalize ${STATUS_COLORS[c.status]}`}>
                      {c.status}
                    </span>
                    <span className="text-[10px] bg-stone-800 text-stone-400 px-2 py-0.5 rounded-full font-bold capitalize">
                      {c.channel}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1 line-clamp-2">{c.message_body}</p>
                </div>
              </div>

              {c.status === 'sent' && (
                <div className="grid grid-cols-3 gap-3 p-3 bg-stone-900/40 rounded-xl">
                  {[
                    { label: 'Sent', value: c.sent_count, color: 'text-white' },
                    { label: 'Opened', value: c.opened_count, color: 'text-blue-400' },
                    { label: 'Redeemed', value: c.redeemed_count, color: 'text-green-400' },
                  ].map(m => (
                    <div key={m.label} className="text-center">
                      <p className={`text-xl font-black ${m.color}`}>{m.value}</p>
                      <p className="text-[10px] text-stone-500">{m.label}</p>
                      {c.sent_count > 0 && m.label !== 'Sent' && (
                        <p className="text-[10px] text-stone-600">
                          {Math.round((m.value / c.sent_count) * 100)}%
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 mt-3 text-xs text-stone-500">
                <span>Audience: visited within {c.audience_filter.last_visit_within_days}d, min {c.audience_filter.min_orders} orders</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[#2d2018]">
              <h3 className="text-base font-bold text-white">Create Campaign</h3>
              <button type="button" onClick={() => setShowModal(false)}><X className="w-5 h-5 text-stone-400" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-400 mb-1">Campaign Name *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-400 mb-1">Channel</label>
                <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]">
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-400 mb-1">Message</label>
                <textarea rows={4} value={form.message_body} onChange={e => setForm(f => ({ ...f, message_body: e.target.value }))}
                  placeholder="Your message to customers…"
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A] resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1">Last Visit Within (days)</label>
                  <input type="number" min="1" value={form.audience_last_visit_days}
                    onChange={e => setForm(f => ({ ...f, audience_last_visit_days: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1">Min Orders</label>
                  <input type="number" min="1" value={form.audience_min_orders}
                    onChange={e => setForm(f => ({ ...f, audience_min_orders: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]" />
                </div>
              </div>
              <div className="p-3 bg-stone-900/60 rounded-xl border border-stone-700">
                <p className="text-xs text-stone-400">
                  Estimated audience: <span className="font-bold text-[#FF7A1A]">{audienceCount} customers</span> match your filters and have opted in to marketing.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2 rounded-xl bg-stone-800 text-stone-300 text-sm font-bold">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 rounded-xl bg-[#FF7A1A] text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  {saving ? 'Saving…' : 'Save as Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
