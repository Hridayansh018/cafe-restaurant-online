import React, { useState } from 'react';
import { MenuItem } from '../../types';
import { X, Flame, Leaf, Plus, Minus } from 'lucide-react';
import { formatINR } from '../../utils/qrHelper';

interface ModifierModalProps {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, modifiers: Record<string, string>, instructions: string) => void;
}

export const ModifierModal: React.FC<ModifierModalProps> = ({ item, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  
  // Default modifier selections
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    (item.modifiers || []).forEach(mod => {
      if (mod.options && mod.options.length > 0) {
        defaults[mod.name] = mod.options[0];
      }
    });
    return defaults;
  });

  const handleModifierSelect = (modName: string, option: string) => {
    setSelectedModifiers(prev => ({ ...prev, [modName]: option }));
  };

  const calculateTotal = () => {
    return item.price * quantity;
  };

  const handleAdd = () => {
    onAddToCart(item, quantity, selectedModifiers, instructions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header Image & Close */}
        <div className="relative h-48 sm:h-56 bg-gray-100">
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center backdrop-blur-xs transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-4 h-4 rounded-xs border flex items-center justify-center bg-white ${
                  item.diet_tag === 'veg' ? 'border-green-600' : 'border-red-600'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    item.diet_tag === 'veg' ? 'bg-green-600' : 'bg-red-600'
                  }`}
                />
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-xs uppercase tracking-wider">
                {item.diet_tag}
              </span>
              {item.spice_level !== 'none' && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-600/80 backdrop-blur-xs flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  {item.spice_level}
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold">{item.name}</h3>
            <p className="text-base font-semibold text-orange-400">{formatINR(item.price)}</p>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          <p className="text-xs text-[#6B6259] leading-relaxed">{item.description}</p>

          {/* Modifiers List */}
          {(item.modifiers || []).map(mod => (
            <div key={mod.name} className="space-y-2">
              <label className="text-xs font-bold text-[#1F1B16] uppercase tracking-wider">
                {mod.name}
              </label>
              <div className="flex flex-wrap gap-2">
                {(mod.options || []).map(opt => {
                  const isSelected = selectedModifiers[mod.name] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleModifierSelect(mod.name, opt)}
                      className={`px-3.5 py-2 text-xs font-medium rounded-full border transition-all ${
                        isSelected
                          ? 'bg-[#FF7A1A] text-white border-[#FF7A1A] shadow-xs'
                          : 'bg-white text-[#1F1B16] border-[#F0E4D8] hover:border-[#FF7A1A]/50'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Special Instructions */}
          <div>
            <label className="block text-xs font-bold text-[#1F1B16] uppercase tracking-wider mb-1.5">
              Special Instructions for Kitchen
            </label>
            <input
              type="text"
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="e.g. Extra hot, Less salt, Serve without onion"
              maxLength={100}
              className="w-full px-3 py-2 text-xs bg-white border border-[#F0E4D8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A1A]"
            />
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-[#F0E4D8]">
            <span className="text-xs font-bold text-[#1F1B16]">Quantity</span>
            <div className="flex items-center gap-3 bg-[#FFF8F2] border border-[#FFE3CC] rounded-full p-1">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-full bg-white text-[#1F1B16] flex items-center justify-center shadow-xs hover:bg-gray-50 active:scale-95 transition-transform"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-sm w-5 text-center text-[#1F1B16]">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(q => q + 1)}
                className="w-7 h-7 rounded-full bg-[#FF7A1A] text-white flex items-center justify-center shadow-xs hover:bg-[#E8690D] active:scale-95 transition-transform"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-4 bg-white border-t border-[#F0E4D8]">
          <button
            type="button"
            onClick={handleAdd}
            className="w-full py-3 px-4 bg-[#FF7A1A] hover:bg-[#E8690D] active:scale-[0.99] text-white font-semibold text-sm rounded-full shadow-md shadow-orange-500/20 transition-all flex items-center justify-between"
          >
            <span>Add to Table Order</span>
            <span className="font-bold">{formatINR(calculateTotal())}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
