import React, { useRef } from 'react';
import { Invoice } from '../../types';
import {
  X,
  Printer,
  Share2,
  CheckCircle,
  FileText,
  Building,
  Phone,
  Mail,
  MessageSquare,
  Sparkles,
  Download,
} from 'lucide-react';
import { formatINR } from '../../utils/qrHelper';

interface InvoiceModalProps {
  invoice: Invoice;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-[#F0E4D8] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="p-4 bg-[#FFF8F2] border-b border-[#F0E4D8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#1F1B16]">Payment Settled &amp; Invoiced</h3>
              <p className="text-[11px] text-[#6B6259]">Tax Invoice #{invoice.invoice_number}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg bg-white border border-[#F0E4D8] text-[#1F1B16] hover:bg-gray-50 transition-colors"
              title="Print Tax Invoice"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white border border-[#F0E4D8] text-[#6B6259] hover:text-[#1F1B16] flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Deliveries alert */}
        <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Auto-delivered to WhatsApp ({invoice.customer_phone})</span>
          </div>
          <span className="font-semibold text-[10px] bg-emerald-200/80 px-2 py-0.5 rounded-full">
            SENT
          </span>
        </div>

        {/* Printable Tax Invoice Container */}
        <div ref={printRef} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-[#1F1B16] print:m-0 print:p-0">
          {/* Restaurant Details */}
          <div className="text-center pb-3 border-b border-[#F0E4D8]">
            <h2 className="text-lg font-black tracking-tight">{invoice.restaurant_name}</h2>
            <p className="text-xs text-[#6B6259]">
              {invoice.restaurant_address.line1}, {invoice.restaurant_address.city}, {invoice.restaurant_address.state} - {invoice.restaurant_address.pincode}
            </p>
            <p className="text-xs font-semibold text-[#1F1B16] mt-0.5">
              GSTIN: <span className="font-mono">{invoice.gstin}</span>
            </p>
            <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-[#FFF8F2] border border-[#FFE3CC] text-[#FF7A1A] rounded">
              Original For Recipient • Tax Invoice
            </span>
          </div>

          {/* Invoice Meta */}
          <div className="grid grid-cols-2 gap-2 text-xs py-1">
            <div>
              <p className="text-[#6B6259]">Invoice Number:</p>
              <p className="font-bold font-mono text-[#1F1B16]">{invoice.invoice_number}</p>
            </div>
            <div className="text-right">
              <p className="text-[#6B6259]">Date &amp; Time:</p>
              <p className="font-medium">{new Date(invoice.issued_at).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[#6B6259]">Billed To:</p>
              <p className="font-semibold">{invoice.customer_name}</p>
              <p className="text-[11px] text-[#6B6259]">{invoice.customer_phone}</p>
            </div>
            <div className="text-right">
              <p className="text-[#6B6259]">Payment Mode:</p>
              <p className="font-semibold uppercase text-[#FF7A1A]">{invoice.payment_mode.replace('_', ' ')}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-[#F0E4D8] rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#FFF8F2] text-[#6B6259] font-bold border-b border-[#F0E4D8]">
                <tr>
                  <th className="p-2.5">Item Description</th>
                  <th className="p-2.5 text-center">Qty</th>
                  <th className="p-2.5 text-right">Rate</th>
                  <th className="p-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E4D8]">
                {invoice.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="p-2.5 font-medium">{it.name}</td>
                    <td className="p-2.5 text-center font-semibold">{it.quantity}</td>
                    <td className="p-2.5 text-right">{formatINR(it.price)}</td>
                    <td className="p-2.5 text-right font-semibold">{formatINR(it.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculations */}
          <div className="space-y-1.5 text-xs border-t border-[#F0E4D8] pt-3">
            <div className="flex justify-between">
              <span className="text-[#6B6259]">Subtotal (Excl. Tax)</span>
              <span className="font-semibold">{formatINR(invoice.items_subtotal)}</span>
            </div>

            <div className="flex justify-between text-[#6B6259]">
              <span>CGST @ 2.5%</span>
              <span className="font-medium">{formatINR(Math.round(invoice.gst_amount / 2))}</span>
            </div>

            <div className="flex justify-between text-[#6B6259]">
              <span>SGST @ 2.5%</span>
              <span className="font-medium">{formatINR(Math.round(invoice.gst_amount / 2))}</span>
            </div>

            {invoice.reservation_credit > 0 && (
              <div className="flex justify-between text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                <span>Advance Token Deposit Deducted</span>
                <span className="font-bold">- {formatINR(invoice.reservation_credit)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-black pt-2 border-t border-[#F0E4D8] text-[#1F1B16]">
              <span>Grand Total Paid</span>
              <span className="text-base text-[#FF7A1A]">{formatINR(invoice.total_paid)}</span>
            </div>
          </div>

          <div className="pt-2 text-center text-[10px] text-[#6B6259] leading-relaxed border-t border-[#F0E4D8]">
            <p>Thank you for dining with {invoice.restaurant_name}!</p>
            <p className="mt-0.5">This is a computer-generated tax invoice verified under DinePulse protocol.</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#FFF8F2] border-t border-[#F0E4D8] flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 bg-white border border-[#F0E4D8] text-[#1F1B16] hover:bg-gray-50 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Invoice</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-[#FF7A1A] hover:bg-[#E8690D] text-white text-xs font-semibold rounded-full shadow-md shadow-orange-500/20 transition-all"
          >
            Done &amp; Close Session
          </button>
        </div>
      </div>
    </div>
  );
};
