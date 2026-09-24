import React, { useState, useMemo } from 'react';
import { useDinePulse } from '../../context/DinePulseContext';
import { MenuItem, Category } from '../../types';
import {
  Search,
  Flame,
  Plus,
  ShoppingBag,
  Bell,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { formatINR } from '../../utils/qrHelper';
import { ModifierModal } from './ModifierModal';
import { CartItem } from './CartDrawer';

interface MenuBrowseProps {
  onOpenCart: () => void;
  cart: CartItem[];
  onAddToCart: (item: MenuItem, quantity: number, modifiers: Record<string, string>, instructions: string) => void;
  onViewTracker: () => void;
  hasActiveOrders: boolean;
  tableLabel: string;
}

export const MenuBrowse: React.FC<MenuBrowseProps> = ({
  onOpenCart,
  cart,
  onAddToCart,
  onViewTracker,
  hasActiveOrders,
  tableLabel,
}) => {
  const { categories, menuItems, restaurant } = useDinePulse();

  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.category_id || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non_veg'>('all');
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      // Category filter
      if (activeCategory !== 'all' && item.category_id !== activeCategory) {
        return false;
      }
      // Diet filter
      if (dietFilter !== 'all' && item.diet_tag !== dietFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(query);
        const matchDesc = item.description.toLowerCase().includes(query);
        if (!matchName && !matchDesc) return false;
      }
      return true;
    });
  }, [menuItems, activeCategory, dietFilter, searchQuery]);

  const totalCartCount = cart.reduce((sum, ci) => sum + ci.quantity, 0);
  const totalCartAmount = cart.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);

  const handleQuickAdd = (item: MenuItem) => {
    if (item.modifiers && item.modifiers.length > 0) {
      setCustomizingItem(item);
    } else {
      onAddToCart(item, 1, {}, '');
    }
  };

  return (
    <div className="pb-24">
      {/* Search & Filters */}
      <div className="sticky top-0 z-30 bg-[#FFF8F2]/95 backdrop-blur-md pt-2 pb-3 space-y-2 border-b border-[#F0E4D8]">
        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#6B6259] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search curries, tandoor, biryani..."
            className="w-full pl-9.5 pr-4 py-2 text-xs sm:text-sm bg-white border border-[#F0E4D8] rounded-full focus:outline-none focus:ring-2 focus:ring-[#FF7A1A] text-[#1F1B16] shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Veg / Non-veg Quick Toggle */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setDietFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              dietFilter === 'all'
                ? 'bg-[#FF7A1A] text-white shadow-xs'
                : 'bg-white text-[#6B6259] border border-[#F0E4D8]'
            }`}
          >
            All Items
          </button>

          <button
            type="button"
            onClick={() => setDietFilter('veg')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              dietFilter === 'veg'
                ? 'bg-green-600 text-white shadow-xs'
                : 'bg-white text-green-700 border border-green-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span>Pure Veg</span>
          </button>

          <button
            type="button"
            onClick={() => setDietFilter('non_veg')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              dietFilter === 'non_veg'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white text-red-700 border border-red-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>Non-Veg</span>
          </button>

          {hasActiveOrders && (
            <button
              type="button"
              onClick={onViewTracker}
              className="ml-auto px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-[#FF7A1A] border border-orange-200 flex items-center gap-1.5 whitespace-nowrap animate-pulse"
            >
              <Clock className="w-3 h-3" />
              <span>Track Active Orders</span>
            </button>
          )}
        </div>

        {/* Horizontal Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeCategory === 'all'
                ? 'bg-[#FF7A1A] text-white'
                : 'bg-white text-[#6B6259] hover:text-[#1F1B16]'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.category_id}
              type="button"
              onClick={() => setActiveCategory(cat.category_id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeCategory === cat.category_id
                  ? 'bg-[#FF7A1A] text-white'
                  : 'bg-white text-[#6B6259] hover:text-[#1F1B16]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Item List Grid */}
      <div className="mt-4 space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#F0E4D8] p-6">
            <p className="text-sm font-semibold text-[#1F1B16]">No menu items found.</p>
            <p className="text-xs text-[#6B6259] mt-1">Try clearing your search query or filters.</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.item_id}
              className={`bg-white rounded-2xl border border-[#F0E4D8] p-3 sm:p-4 shadow-xs flex gap-3 transition-all ${
                !item.is_available ? 'opacity-60 bg-gray-50' : 'hover:border-[#FF7A1A]/40'
              }`}
            >
              {/* Item Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {/* Diet Dot */}
                    <span
                      className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center ${
                        item.diet_tag === 'veg' ? 'border-green-600' : 'border-red-600'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.diet_tag === 'veg' ? 'bg-green-600' : 'bg-red-600'
                        }`}
                      />
                    </span>

                    {item.spice_level !== 'none' && (
                      <span className="text-[10px] text-orange-600 flex items-center gap-0.5 font-medium">
                        <Flame className="w-2.5 h-2.5" />
                        {item.spice_level}
                      </span>
                    )}

                    {!item.is_available && (
                      <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.2 rounded">
                        86'd / Sold Out
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-[#1F1B16] leading-snug">{item.name}</h3>
                  <p className="text-xs font-bold text-[#FF7A1A] mt-0.5">{formatINR(item.price)}</p>
                  <p className="text-[11px] text-[#6B6259] line-clamp-2 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Modifiers hint */}
                {item.modifiers && item.modifiers.length > 0 && (
                  <p className="text-[10px] text-orange-600 font-medium mt-2">
                    Customizable options available
                  </p>
                )}
              </div>

              {/* Image & Action */}
              <div className="w-24 sm:w-28 flex flex-col items-center justify-between shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-24 rounded-xl overflow-hidden bg-gray-100 relative">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {!item.is_available && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-1 text-center">
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                        Sold Out
                      </span>
                    </div>
                  )}
                </div>

                <div className="w-full mt-2">
                  {item.is_available ? (
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(item)}
                      className="w-full py-1.5 px-3 bg-[#FFF8F2] hover:bg-[#FF7A1A] text-[#FF7A1A] hover:text-white border border-[#FF7A1A] rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full py-1.5 px-3 bg-gray-200 text-gray-400 rounded-full text-xs font-bold cursor-not-allowed"
                    >
                      Unavailable
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Cart Pill */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40 animate-in slide-in-from-bottom duration-200">
          <button
            type="button"
            onClick={onOpenCart}
            className="w-full py-3.5 px-5 bg-[#FF7A1A] hover:bg-[#E8690D] active:scale-[0.99] text-white rounded-full shadow-lg shadow-orange-500/30 flex items-center justify-between font-bold text-sm transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                {totalCartCount}
              </span>
              <span>{totalCartCount === 1 ? '1 item' : `${totalCartCount} items`}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>View Cart • {formatINR(totalCartAmount)}</span>
              <ShoppingBag className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Modifier Customization Modal */}
      {customizingItem && (
        <ModifierModal
          item={customizingItem}
          onClose={() => setCustomizingItem(null)}
          onAddToCart={onAddToCart}
        />
      )}
    </div>
  );
};
