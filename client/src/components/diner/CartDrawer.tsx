import React from 'react';
import { MenuItem } from '../../types';
import { X, Plus, Minus, Trash2, Send, Clock, Sparkles } from 'lucide-react';
import { formatINR } from '../../utils/qrHelper';

export interface CartItem {
  id: string;
  item: MenuItem;
  quantity: number;
  modifiers: Record<string, string>;
  instructions?: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onSubmitOrder: () => void;
  roundNumber: number;
  tableLabel: string;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onSubmitOrder,
  roundNumber,
  tableLabel,
}) => {
  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.item.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#F0E4D8] flex items-center justify-between bg-[#FFF8F2]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#FF7A1A] text-white">
                Round {roundNumber}
              </span>
              <h3 className="text-base font-bold text-[#1F1B16]">Your Table Cart ({tableLabel})</h3>
            </div>
            <p className="text-[11px] text-[#6B6259] mt-0.5">
              Review items before firing them to the kitchen.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#F0E4D8] text-[#6B6259] hover:text-[#1F1B16] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3 divide-y divide-[#F0E4D8]">
          {cart.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm font-medium text-[#6B6259]">Your cart is empty.</p>
              <p className="text-xs text-[#6B6259] mt-1">Add drinks or starters to begin your meal!</p>
            </div>
          ) : (
            cart.map(ci => (
              <div key={ci.id} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center ${
                        ci.item.diet_tag === 'veg' ? 'border-green-600' : 'border-red-600'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          ci.item.diet_tag === 'veg' ? 'bg-green-600' : 'bg-red-600'
                        }`}
                      />
                    </span>
                    <h4 className="text-xs font-bold text-[#1F1B16] truncate">{ci.item.name}</h4>
                  </div>

                  <p className="text-xs font-semibold text-[#FF7A1A] mt-0.5">
                    {formatINR(ci.item.price)} each
                  </p>

                  {/* Modifiers Pill */}
                  {Object.keys(ci.modifiers).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(ci.modifiers).map(([k, v]) => (
                        <span key={k} className="text-[10px] bg-orange-50 text-[#FF7A1A] px-1.5 py-0.5 rounded-md font-medium border border-orange-100">
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                  )}

                  {ci.instructions && (
                    <p className="text-[11px] text-[#6B6259] italic mt-1 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                      "{ci.instructions}"
                    </p>
                  )}
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-[#FFF8F2] border border-[#FFE3CC] rounded-full p-0.5">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(ci.id, ci.quantity - 1)}
                      className="w-6 h-6 rounded-full bg-white text-[#1F1B16] flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-xs w-4 text-center text-[#1F1B16]">{ci.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(ci.id, ci.quantity + 1)}
                      className="w-6 h-6 rounded-full bg-[#FF7A1A] text-white flex items-center justify-center hover:bg-[#E8690D] transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(ci.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}

          {cart.length > 0 && (
            <div className="pt-3 bg-[#FFF8F2] p-3 rounded-xl border border-[#FFE3CC] mt-4 flex items-center gap-2 text-xs text-[#6B6259]">
              <Sparkles className="w-4 h-4 text-[#FF7A1A] shrink-0" />
              <span>
                <strong>Multi-round dining:</strong> Order beverages or starters now. You can order round 2 (mains/desserts) anytime without waiting!
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-4 bg-white border-t border-[#F0E4D8] space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6B6259]">Round {roundNumber} Subtotal</span>
              <span className="font-bold text-[#1F1B16] text-base">{formatINR(subtotal)}</span>
            </div>

            <button
              type="button"
              onClick={onSubmitOrder}
              className="w-full py-3 px-4 bg-[#FF7A1A] hover:bg-[#E8690D] active:scale-[0.99] text-white font-semibold text-sm rounded-full shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Fire Order to Kitchen ({formatINR(subtotal)})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
