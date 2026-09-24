import React, { useState } from 'react';
import { useDinePulse } from '../../context/DinePulseContext';
import { ShieldCheck, Utensils, CheckCircle2, User, Phone, QrCode } from 'lucide-react';

interface CheckinScreenProps {
  onCheckinSuccess: () => void;
}

export const CheckinScreen: React.FC<CheckinScreenProps> = ({ onCheckinSuccess }) => {
  const { currentTableId, tables, restaurant, checkinDiner, reservations } = useDinePulse();
  const currentTable = tables.find(t => t.table_id === currentTableId) || tables[0];

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  // Check if any reservation exists for testing convenience
  const upcomingReservations = reservations.filter(r => r.status === 'confirmed');

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 8) {
      setError('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      await checkinDiner(currentTable.table_id, name.trim(), phone.trim());
      onCheckinSuccess();
    } catch (err: any) {
      setError(err.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F2] flex flex-col justify-center items-center px-4 py-8">
      {/* Brand Header */}
      <div className="w-full max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FF7A1A] text-white shadow-md shadow-orange-500/20 mb-3">
          <Utensils className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-[#1F1B16]">{restaurant.name}</h1>
        <p className="text-sm text-[#6B6259] mt-0.5">Contactless Table-side Dining</p>
      </div>

      {/* Main Check-in Card */}
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-sm border border-[#F0E4D8]">
        {/* Table Badge */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FFF8F2] border border-[#FFE3CC] mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FF7A1A] text-white flex items-center justify-center font-bold text-lg">
              {currentTable.label}
            </div>
            <div>
              <p className="text-xs font-medium text-[#6B6259] uppercase tracking-wider">Physical Table Bound</p>
              <h3 className="text-sm font-semibold text-[#1F1B16]">{currentTable.zone}</h3>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-medium rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>HMAC Signed</span>
          </div>
        </div>

        <div className="mb-5">
          <h2 className="text-lg font-bold text-[#1F1B16]">Welcome to your table!</h2>
          <p className="text-xs text-[#6B6259] mt-1">
            Check in with your phone to order starters, mains, and beverages directly to your table.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1F1B16] mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#FF7A1A]" />
              Guest Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Rahul Sharma"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#F0E4D8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A1A] focus:border-transparent text-[#1F1B16]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F1B16] mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#FF7A1A]" />
              Mobile Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 99999 99999"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#F0E4D8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A1A] focus:border-transparent text-[#1F1B16]"
            />
            <p className="text-[11px] text-[#6B6259] mt-1">
              Your GST tax invoice will be sent to this WhatsApp &amp; SMS.
            </p>
          </div>


          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3 px-4 bg-[#FF7A1A] hover:bg-[#E8690D] active:scale-[0.99] text-white font-semibold text-sm rounded-full shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Checking in…</>
            ) : (
              <><span>Start Ordering</span><CheckCircle2 className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-[#F0E4D8] text-center">
          <p className="text-[11px] text-[#6B6259]">
            🔒 Session is securely bound to <strong>{currentTable.label}</strong> and self-destructs upon bill settlement.
          </p>
        </div>
      </div>
    </div>
  );
};
