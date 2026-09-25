import React, { useState } from 'react';
import { useDinePulse } from '../../context/DinePulseContext';
import { Bill, Invoice, PaymentMode } from '../../types';
import {
  X,
  Receipt,
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Building,
  Sparkles,
  Smartphone,
  Banknote,
  ShieldCheck,
} from 'lucide-react';
import { formatINR } from '../../utils/qrHelper';

interface BillingModalProps {
  bill: Bill;
  onClose: () => void;
  onInvoiceGenerated: (invoice: Invoice) => void;
  tableLabel: string;
}

export const BillingModal: React.FC<BillingModalProps> = ({
  bill,
  onClose,
  onInvoiceGenerated,
  tableLabel,
}) => {
  const { settleBill, restaurant, activeSession } = useDinePulse();
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('online_upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [upiVpa, setUpiVpa] = useState('rahul@okaxis');

  const handlePayAndSettle = async (mode: PaymentMode) => {
    setIsProcessing(true);
    try {
      const invoice = await settleBill(bill.bill_id, mode);
      setIsProcessing(false);
      onInvoiceGenerated(invoice);
    } catch (err) {
      console.error('[BillingModal] Failed to settle bill:', err);
      setIsProcessing(false);
    }
  };

  const guestName = activeSession?.guests[0]?.name || 'Valued Guest';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[95vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#F0E4D8] flex items-center justify-between bg-[#FFF8F2]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF7A1A] text-white flex items-center justify-center font-bold text-sm">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1F1B16]">Bill Summary • {tableLabel}</h3>
              <p className="text-[11px] text-[#6B6259]">
                GSTIN: {restaurant.gstin}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#F0E4D8] text-[#6B6259] hover:text-[#1F1B16] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Guest Greeting */}
          <div className="flex items-center justify-between text-xs text-[#6B6259] pb-2 border-b border-[#F0E4D8]">
            <span>Guest: <strong className="text-[#1F1B16]">{guestName}</strong></span>
            <span>Date: <strong>{new Date().toLocaleDateString('en-IN')}</strong></span>
          </div>

          {/* Breakdown Card */}
          <div className="bg-[#FFF8F2] p-4 rounded-xl border border-[#FFE3CC] space-y-2.5 text-xs">
            <div className="flex justify-between text-[#1F1B16]">
              <span>Items Subtotal</span>
              <span className="font-semibold">{formatINR(bill.items_subtotal)}</span>
            </div>

            <div className="flex justify-between text-[#6B6259]">
              <span>GST (5% : 2.5% CGST + 2.5% SGST)</span>
              <span className="font-medium text-[#1F1B16]">{formatINR(bill.gst_amount)}</span>
            </div>

            {/* Advance Deposit Deduction Alert */}
            {bill.reservation_credit_applied > 0 && (
              <div className="flex justify-between items-center text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-medium">Advance Reservation Deposit Credited</span>
                </div>
                <span className="font-bold">- {formatINR(bill.reservation_credit_applied)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-[#F0E4D8] flex justify-between items-baseline text-sm">
              <span className="font-bold text-[#1F1B16]">Net Payable Total</span>
              <span className="font-black text-lg text-[#FF7A1A]">
                {formatINR(bill.total_payable)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-[#1F1B16] uppercase tracking-wider mb-2">
              Select Payment Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('online_upi')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  paymentMode === 'online_upi'
                    ? 'border-[#FF7A1A] bg-orange-50/60 ring-2 ring-orange-200'
                    : 'border-[#F0E4D8] bg-white hover:border-[#FF7A1A]/50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Smartphone className="w-4 h-4 text-[#FF7A1A]" />
                  <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.2 rounded font-semibold">Fast</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1F1B16]">UPI / GPay / PhonePe</h4>
                  <p className="text-[10px] text-[#6B6259]">Instant digital pay</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('online_card')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  paymentMode === 'online_card'
                    ? 'border-[#FF7A1A] bg-orange-50/60 ring-2 ring-orange-200'
                    : 'border-[#F0E4D8] bg-white hover:border-[#FF7A1A]/50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <CreditCard className="w-4 h-4 text-[#FF7A1A]" />
                  <span className="text-[10px] text-gray-500">Secure</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1F1B16]">Credit / Debit Card</h4>
                  <p className="text-[10px] text-[#6B6259]">Visa, Mastercard, RuPay</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('counter_cash')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  paymentMode === 'counter_cash'
                    ? 'border-[#FF7A1A] bg-orange-50/60 ring-2 ring-orange-200'
                    : 'border-[#F0E4D8] bg-white hover:border-[#FF7A1A]/50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Banknote className="w-4 h-4 text-[#FF7A1A]" />
                  <span className="text-[10px] text-gray-500">Manual</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1F1B16]">Pay Cash at Counter</h4>
                  <p className="text-[10px] text-[#6B6259]">Wait for cashier</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('counter_card')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  paymentMode === 'counter_card'
                    ? 'border-[#FF7A1A] bg-orange-50/60 ring-2 ring-orange-200'
                    : 'border-[#F0E4D8] bg-white hover:border-[#FF7A1A]/50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Building className="w-4 h-4 text-[#FF7A1A]" />
                  <span className="text-[10px] text-gray-500">POS</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1F1B16]">Card at Counter</h4>
                  <p className="text-[10px] text-[#6B6259]">Swipe on floor POS</p>
                </div>
              </button>
            </div>
          </div>

          {/* Interactive Mode Details */}
          {paymentMode === 'online_upi' && (
            <div className="p-3 bg-white rounded-xl border border-[#F0E4D8] flex items-center gap-3">
              <div className="w-12 h-12 bg-[#FFF8F2] border border-[#FFE3CC] rounded-lg flex items-center justify-center shrink-0">
                <QrCode className="w-6 h-6 text-[#FF7A1A]" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-[#1F1B16]">UPI Direct Checkout</p>
                <p className="text-[11px] text-[#6B6259]">Simulated Razorpay / UPI intent</p>
                <input
                  type="text"
                  value={upiVpa}
                  onChange={e => setUpiVpa(e.target.value)}
                  className="mt-1 w-full text-[11px] px-2 py-1 bg-gray-50 border border-gray-200 rounded text-gray-700"
                />
              </div>
            </div>
          )}

          {paymentMode.startsWith('counter_') && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>
                Floor steward / Cashier will come to your table or you can complete settlement at the front desk.
              </span>
            </div>
          )}
        </div>

        {/* Action CTA */}
        <div className="p-4 bg-white border-t border-[#F0E4D8] space-y-2">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handlePayAndSettle(paymentMode)}
            className="w-full py-3.5 px-4 bg-[#FF7A1A] hover:bg-[#E8690D] active:scale-[0.99] text-white font-semibold text-sm rounded-full shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing Payment &amp; Generating GST Invoice...</span>
              </div>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {paymentMode.startsWith('online')
                    ? `Confirm & Pay ${formatINR(bill.total_payable)}`
                    : `Confirm Settlement (${formatINR(bill.total_payable)})`}
                </span>
              </>
            )}
          </button>

          <p className="text-[10px] text-center text-[#6B6259]">
            Upon settlement, your table session self-destructs and your official GST tax invoice is delivered to WhatsApp &amp; Email.
          </p>
        </div>
      </div>
    </div>
  );
};
