import React, { useState, useMemo } from 'react';
import { useDinePulse } from '../context/DinePulseContext';
import { MenuItem } from '../types';
import { formatINR } from '../utils/qrHelper';
import {
  UtensilsCrossed,
  Search,
  Flame,
  QrCode,
  Sparkles,
  Info,
  Building2,
  ChevronRight,
  Filter,
} from 'lucide-react';

const DIET_BADGES: Record<string, { label: string; color: string }> = {
  veg: { label: 'VEG', color: 'border-green-600 text-green-700 bg-green-50' },
  non_veg: { label: 'NON-VEG', color: 'border-red-600 text-red-700 bg-red-50' },
  egg: { label: 'CONTAINS EGG', color: 'border-yellow-600 text-yellow-800 bg-yellow-50' },
  vegan: { label: 'VEGAN', color: 'border-emerald-600 text-emerald-800 bg-emerald-50' },
};

const SPICE_ICONS: Record<string, string> = {
  none: '○ Mild',
  mild: '🌶 Mild',
  medium: '🌶🌶 Medium',
  hot: '🌶🌶🌶 Extra Hot',
};

export const MenuPage: React.FC = () => {
  const { categories, menuItems, restaurant, isLoading } = useDinePulse();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non_veg' | 'vegan'>('all');

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      if (activeCategory !== 'all' && item.category_id !== activeCategory) {
        return false;
      }
      if (dietFilter !== 'all' && item.diet_tag !== dietFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = (item.description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }, [menuItems, activeCategory, dietFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FFF8F2] text-[#1F1B16] flex flex-col font-sans">
      {/* Sticky Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-[#F0E4D8] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF7A1A] text-white flex items-center justify-center font-black shadow-md shadow-orange-500/20">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-[#1F1B16]">
                {restaurant?.name || 'Restaurant Menu'}
              </h1>
              <p className="text-xs text-[#6B6259]">
                {restaurant?.address?.city ? `${restaurant.address.city} · ` : ''}Digital Menu &amp; Specials
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/admin/menu"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#F0E4D8] text-xs font-bold text-[#6B6259] hover:text-[#1F1B16] hover:bg-stone-50 transition-colors"
            >
              Manage in Admin ↗
            </a>
            <a
              href="/admin"
              className="px-3.5 py-1.5 rounded-xl bg-[#FF7A1A] text-white text-xs font-bold shadow-sm hover:bg-[#E8690D] transition-colors"
            >
              Staff Portal
            </a>
          </div>
        </div>
      </header>

      {/* Hero Dine-in QR Banner */}
      <div className="bg-gradient-to-r from-orange-600 to-[#FF7A1A] text-white py-5 px-4 shadow-inner">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black">Dining in at our restaurant?</h2>
              <p className="text-xs text-orange-100 mt-0.5">
                Scan the QR code on your table to unlock live ordering, order tracking, and table bills!
              </p>
            </div>
          </div>
          <a
            href="/admin/floor"
            className="px-4 py-2 rounded-xl bg-white text-[#FF7A1A] text-xs font-black shadow hover:bg-orange-50 transition-all shrink-0"
          >
            View Table QRs
          </a>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 w-full flex-1 space-y-6">
        {/* Search & Dietary Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes, drinks, desserts…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#F0E4D8] rounded-2xl text-xs sm:text-sm text-[#1F1B16] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FF7A1A] transition-all shadow-xs"
            />
          </div>

          {/* Diet filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'veg', 'non_veg', 'vegan'] as const).map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => setDietFilter(tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap capitalize ${
                  dietFilter === tag
                    ? 'bg-[#1F1B16] text-white shadow-sm'
                    : 'bg-white border border-[#F0E4D8] text-[#6B6259] hover:bg-stone-50'
                }`}
              >
                {tag === 'all' ? 'All Diets' : tag.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#F0E4D8]">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all whitespace-nowrap ${
              activeCategory === 'all'
                ? 'bg-[#FF7A1A] text-white shadow-md shadow-orange-900/10'
                : 'bg-white border border-[#F0E4D8] text-[#6B6259] hover:text-[#1F1B16]'
            }`}
          >
            All Items ({menuItems.length})
          </button>
          {categories.map(cat => {
            const count = menuItems.filter(i => i.category_id === cat.category_id).length;
            return (
              <button
                key={cat.category_id}
                type="button"
                onClick={() => setActiveCategory(cat.category_id)}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all whitespace-nowrap ${
                  activeCategory === cat.category_id
                    ? 'bg-[#FF7A1A] text-white shadow-md shadow-orange-900/10'
                    : 'bg-white border border-[#F0E4D8] text-[#6B6259] hover:text-[#1F1B16]'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Menu Items Grid */}
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#FF7A1A] flex items-center justify-center mx-auto mb-3 animate-pulse">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-[#6B6259]">Loading delicious menu items…</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-3xl border border-[#F0E4D8] p-8 max-w-lg mx-auto">
            <UtensilsCrossed className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-black text-[#1F1B16] mb-1">No items found</h3>
            <p className="text-xs text-[#6B6259] mb-4">
              Try changing your search query or dietary filters.
            </p>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setDietFilter('all'); setActiveCategory('all'); }}
              className="px-4 py-2 rounded-xl bg-[#FF7A1A] text-white text-xs font-bold shadow-sm"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map(item => {
              const badge = DIET_BADGES[item.diet_tag] || DIET_BADGES.veg;
              return (
                <div
                  key={item.item_id}
                  className="bg-white rounded-3xl border border-[#F0E4D8] overflow-hidden flex flex-col hover:shadow-xl hover:shadow-orange-950/5 transition-all duration-200 group"
                >
                  {/* Item Image */}
                  <div className="relative h-48 bg-[#FFF8F2] overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-stone-300">
                        <UtensilsCrossed className="w-10 h-10 mb-1" />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">DinePulse Dish</span>
                      </div>
                    )}

                    {/* Overlay Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border shadow-xs ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    {!item.is_available && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                        <span className="bg-red-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-lg">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <h3 className="text-base font-black text-[#1F1B16] group-hover:text-[#FF7A1A] transition-colors leading-snug">
                          {item.name}
                        </h3>
                        <span className="text-base font-black text-[#FF7A1A] shrink-0 font-mono">
                          {formatINR(item.price)}
                        </span>
                      </div>

                      <p className="text-xs text-[#6B6259] leading-relaxed line-clamp-2 mb-3">
                        {item.description || 'Prepared fresh with premium ingredients by our chef.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#F0E4D8]/60 flex items-center justify-between text-[11px] text-[#6B6259]">
                      <span className="flex items-center gap-1 font-medium">
                        {SPICE_ICONS[item.spice_level] || 'Mild'}
                      </span>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold">
                          Customizable
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#F0E4D8] py-8 px-4 text-center mt-auto">
        <p className="text-xs font-bold text-[#1F1B16]">{restaurant?.name || 'DinePulse'}</p>
        <p className="text-[11px] text-[#6B6259] mt-0.5">
          {restaurant?.address?.line1} {restaurant?.address?.city} {restaurant?.address?.state} {restaurant?.address?.pincode}
        </p>
        <p className="text-[10px] text-stone-400 mt-2">
          Powered by DinePulse High-Performance Restaurant Engine
        </p>
      </footer>
    </div>
  );
};
