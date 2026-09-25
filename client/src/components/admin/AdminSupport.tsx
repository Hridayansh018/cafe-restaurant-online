import React, { useState } from 'react';
import { useDinePulse } from '../../context/DinePulseContext';
import { Invoice } from '../../types';
import { Phone, Search, MessageSquare, Mail, CheckCircle2, Clock, AlertCircle, X } from 'lucide-react';
import { formatINR } from '../../utils/qrHelper';

export const AdminSupport: React.FC = () => {
  const { invoices, resendInvoiceWhatsApp, resendInvoiceEmail } = useDinePulse();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [sendingWA, setSendingWA] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const results = search.length >= 3
    ? invoices.filter(inv =>
        inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        inv.customer_phone.includes(search) ||
        inv.customer_name.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const handleWhatsApp = async () => {
    if (!selected) return;
    setSendingWA(true);
    try {
      await resendInvoiceWhatsApp(selected.invoice_id);
      setSelected(prev => prev ? { ...prev, whatsapp_status: 'sent' } : null);
    } finally {
      setSendingWA(false);
    }
  };

  const handleEmail = async () => {
    if (!selected) return;
    setSendingEmail(true);
    try {
      await resendInvoiceEmail(selected.invoice_id);
      setSelected(prev => prev ? { ...prev, email_status: 'sent' } : null);
    } finally {
      setSendingEmail(false);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${
      status === 'sent' ? 'bg-green-900/50 text-green-300' :
      status === 'failed' ? 'bg-red-900/50 text-red-300' :
      'bg-stone-800 text-stone-400'
    }`}>
      {status === 'sent' ? <CheckCircle2 className="w-2.5 h-2.5" /> :
       status === 'failed' ? <AlertCircle className="w-2.5 h-2.5" /> :
       <Clock className="w-2.5 h-2.5" />}
      {status}
    </span>
  );

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-white">Customer Support</h1>
        <p className="text-sm text-stone-400 mt-0.5">Search invoices and re-send via WhatsApp or email</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
        <input
          type="text"
          placeholder="Search by invoice number, phone, or customer name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-[#1a1210] border border-[#2d2018] rounded-2xl text-sm text-white placeholder-stone-600 focus:outline-none focus:border-[#FF7A1A]"
        />
      </div>

      {search.length > 0 && search.length < 3 && (
        <p className="text-xs text-stone-600 text-center">Type at least 3 characters to search…</p>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] overflow-hidden">
          <div className="divide-y divide-[#2d2018]">
            {results.map(inv => (
              <button
                key={inv.invoice_id}
                type="button"
                onClick={() => setSelected(inv)}
                className={`w-full text-left p-4 hover:bg-stone-900/40 transition-colors flex items-center gap-4 ${
                  selected?.invoice_id === inv.invoice_id ? 'bg-orange-950/20 border-l-2 border-[#FF7A1A]' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[#FF7A1A] font-mono">{inv.invoice_number}</p>
                    <StatusBadge status={inv.whatsapp_status} />
                    <StatusBadge status={inv.email_status} />
                  </div>
                  <p className="text-xs text-white font-medium mt-0.5">{inv.customer_name} — {inv.customer_phone}</p>
                  <p className="text-[11px] text-stone-500">{formatDate(inv.issued_at)} · {formatINR(inv.total_paid)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {search.length >= 3 && results.length === 0 && (
        <div className="text-center py-12 bg-[#1a1210] rounded-2xl border border-[#2d2018]">
          <p className="text-stone-500 text-sm">No invoices found for "{search}"</p>
        </div>
      )}

      {/* Selected Invoice Panel */}
      {selected && (
        <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-[#2d2018]">
            <div>
              <p className="text-base font-bold text-[#FF7A1A] font-mono">{selected.invoice_number}</p>
              <p className="text-xs text-stone-400">{formatDate(selected.issued_at)}</p>
            </div>
            <button type="button" onClick={() => setSelected(null)}>
              <X className="w-5 h-5 text-stone-400" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            {/* Customer */}
            <div className="p-4 bg-stone-900/40 rounded-xl">
              <p className="text-xs text-stone-500 mb-1">Customer</p>
              <p className="text-sm font-bold text-white">{selected.customer_name}</p>
              <p className="text-xs text-stone-400">{selected.customer_phone}</p>
              {selected.customer_email && <p className="text-xs text-stone-500">{selected.customer_email}</p>}
            </div>

            {/* Invoice Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-stone-900/40 rounded-xl">
                <p className="text-[10px] text-stone-500">Total Paid</p>
                <p className="text-lg font-black text-[#FF7A1A]">{formatINR(selected.total_paid)}</p>
              </div>
              <div className="p-3 bg-stone-900/40 rounded-xl">
                <p className="text-[10px] text-stone-500">Items</p>
                <p className="text-lg font-black text-white">{(selected.items || []).length}</p>
              </div>
            </div>

            {/* Delivery Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border border-[#2d2018] bg-stone-900/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-green-400" />
                    <span className="text-xs font-bold text-white">WhatsApp</span>
                  </div>
                  <StatusBadge status={selected.whatsapp_status} />
                </div>
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  disabled={sendingWA}
                  className="w-full py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {sendingWA ? 'Sending…' : 'Re-send via WhatsApp'}
                </button>
                <p className="text-[10px] text-stone-600 mt-1 text-center">
                  Delivery stub — integrates with your WhatsApp API
                </p>
              </div>
              <div className="p-4 rounded-xl border border-[#2d2018] bg-stone-900/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white">Email</span>
                  </div>
                  <StatusBadge status={selected.email_status} />
                </div>
                <button
                  type="button"
                  onClick={handleEmail}
                  disabled={sendingEmail || !selected.customer_email}
                  className="w-full py-2 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {sendingEmail ? 'Sending…' : 'Re-send via Email'}
                </button>
                {!selected.customer_email && (
                  <p className="text-[10px] text-amber-500 mt-1 text-center">No email on record</p>
                )}
                {selected.customer_email && (
                  <p className="text-[10px] text-stone-600 mt-1 text-center">
                    Delivery stub — integrates with your Email API
                  </p>
                )}
              </div>
            </div>

            {/* Line items */}
            <div>
              <p className="text-xs font-bold text-stone-500 mb-2">Order Items</p>
              <div className="space-y-1.5">
                {selected.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-stone-300">{item.name} × {item.quantity}</span>
                    <span className="text-stone-400">{formatINR(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {search.length === 0 && !selected && (
        <div className="text-center py-16 bg-[#1a1210] rounded-2xl border border-[#2d2018]">
          <Phone className="w-12 h-12 text-stone-700 mx-auto mb-3" />
          <h2 className="text-base font-bold text-stone-400 mb-1">Customer Support</h2>
          <p className="text-sm text-stone-600 max-w-sm mx-auto">
            Search for a customer's invoice by invoice number, phone, or name to re-send via WhatsApp or email.
          </p>
        </div>
      )}
    </div>
  );
};
