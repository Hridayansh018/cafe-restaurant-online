import React, { useState } from 'react';
import { useDinePulse } from '../../context/DinePulseContext';
import { MenuItem, MenuModifier } from '../../types';
import { Plus, Pencil, Trash2, X, Check, Search, Filter, Image } from 'lucide-react';
import { formatINR } from '../../utils/qrHelper';

const DIET_COLORS: Record<string, string> = {
  veg: 'bg-green-900/50 text-green-300 border-green-700/50',
  non_veg: 'bg-red-900/50 text-red-300 border-red-700/50',
  egg: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50',
  vegan: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50',
};

const SPICE_LABELS: Record<string, string> = {
  none: '○', mild: '🌶', medium: '🌶🌶', hot: '🌶🌶🌶',
};

const EmptyForm = (): Omit<MenuItem, 'item_id'> => ({
  category_id: '',
  name: '',
  description: '',
  price: 0,
  currency: 'INR',
  image_url: '',
  diet_tag: 'veg',
  spice_level: 'mild',
  modifiers: [],
  is_available: true,
  qty_available: null,
  sort_order: 0,
});

export const AdminMenu: React.FC = () => {
  const {
    categories, menuItems, addMenuItem, updateMenuItem, deleteMenuItem,
    addCategory, updateCategory, deleteCategory, isLoading,
  } = useDinePulse();

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<Omit<MenuItem, 'item_id'>>(EmptyForm());
  const [modifiers, setModifiers] = useState<MenuModifier[]>([]);
  const [saving, setSaving] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const openAdd = () => {
    setEditingItem(null);
    setForm({ ...EmptyForm(), category_id: categories[0]?.category_id || '', sort_order: menuItems.length + 1 });
    setModifiers([]);
    setShowModal(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setForm({
      category_id: item.category_id,
      name: item.name,
      description: item.description,
      price: item.price,
      currency: item.currency,
      image_url: item.image_url,
      diet_tag: item.diet_tag,
      spice_level: item.spice_level,
      modifiers: item.modifiers,
      is_available: item.is_available,
      qty_available: item.qty_available,
      sort_order: item.sort_order,
    });
    setModifiers(item.modifiers);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category_id) return;
    setSaving(true);
    const withMods = { ...form, modifiers };
    try {
      if (editingItem) {
        await updateMenuItem(editingItem.item_id, withMods);
      } else {
        await addMenuItem(withMods);
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await deleteMenuItem(itemId);
  };

  const addModifier = () => setModifiers(prev => [...prev, { name: '', options: [''] }]);

  const updateModifier = (idx: number, key: 'name' | 'options', value: string | string[]) => {
    setModifiers(prev => prev.map((m, i) => i === idx ? { ...m, [key]: value } : m));
  };

  const removeModifier = (idx: number) => setModifiers(prev => prev.filter((_, i) => i !== idx));

  const filteredItems = menuItems.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || item.category_id === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Menu Management</h1>
          <p className="text-sm text-stone-400 mt-0.5">{menuItems.length} items across {categories.length} categories</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCatModal(true)}
            className="px-3 py-2 rounded-xl bg-stone-800 text-stone-300 hover:bg-stone-700 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Category
          </button>
          <button
            type="button"
            onClick={openAdd}
            className="px-4 py-2 rounded-xl bg-[#FF7A1A] text-white hover:bg-[#E8690D] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-orange-900/30"
          >
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500" />
          <input
            type="text"
            placeholder="Search menu items…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#1a1210] border border-[#2d2018] rounded-xl text-sm text-white placeholder-stone-600 focus:outline-none focus:border-[#FF7A1A]"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFilterCat('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filterCat === 'all' ? 'bg-[#FF7A1A] text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.category_id}
              type="button"
              onClick={() => setFilterCat(cat.category_id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filterCat === cat.category_id ? 'bg-[#FF7A1A] text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className="text-center py-20 text-stone-600">Loading menu…</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-stone-500 mb-4">No menu items found.</p>
          <button type="button" onClick={openAdd}
            className="px-4 py-2 rounded-xl bg-[#FF7A1A] text-white text-xs font-bold">
            Add First Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <div key={item.item_id} className="bg-[#1a1210] rounded-2xl border border-[#2d2018] overflow-hidden hover:border-[#FF7A1A]/40 transition-colors group">
              {/* Image */}
              <div className="relative h-40 bg-stone-900">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-8 h-8 text-stone-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${DIET_COLORS[item.diet_tag]}`}>
                    {item.diet_tag.replace('_', ' ')}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    item.is_available ? 'bg-green-900/80 text-green-300' : 'bg-red-900/80 text-red-300'
                  }`}>
                    {item.is_available ? 'Available' : "86'd"}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">{item.name}</h3>
                    <p className="text-[10px] text-stone-500 mt-0.5">{categories.find(c => c.category_id === item.category_id)?.name}</p>
                  </div>
                  <p className="text-base font-black text-[#FF7A1A] shrink-0">{formatINR(item.price)}</p>
                </div>
                <p className="text-[11px] text-stone-400 line-clamp-2 mb-3">{item.description}</p>
                <div className="flex items-center gap-1 text-[10px] text-stone-500 mb-3">
                  <span>{SPICE_LABELS[item.spice_level]}</span>
                  {item.modifiers.length > 0 && (
                    <span className="ml-1 bg-stone-800 px-1.5 py-0.5 rounded">{item.modifiers.length} modifiers</span>
                  )}
                  {item.qty_available !== null && (
                    <span className="ml-1 bg-stone-800 px-1.5 py-0.5 rounded">Qty: {item.qty_available}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="flex-1 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.item_id, item.name)}
                    className="py-1.5 px-3 rounded-lg bg-red-950/50 hover:bg-red-900/60 text-red-400 text-xs font-bold transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Categories Section */}
      <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] p-5">
        <h3 className="text-sm font-bold text-white mb-3">Categories ({categories.length})</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <div key={cat.category_id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-800 border border-stone-700">
              <span className="text-xs text-stone-300 font-medium">{cat.name}</span>
              <button
                type="button"
                onClick={() => deleteCategory(cat.category_id)}
                className="text-stone-600 hover:text-red-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] w-full max-w-lg my-4">
            <div className="flex items-center justify-between p-5 border-b border-[#2d2018]">
              <h3 className="text-base font-bold text-white">{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
              <button type="button" onClick={() => setShowModal(false)}><X className="w-5 h-5 text-stone-400" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-stone-400 mb-1">Item Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]"
                    placeholder="e.g., Butter Chicken"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1">Category *</label>
                  <select
                    required
                    value={form.category_id}
                    onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]"
                  >
                    <option value="">Select…</option>
                    {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1">Price (₹) *</label>
                  <input
                    required type="number" min="0"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1">Diet Type</label>
                  <select
                    value={form.diet_tag}
                    onChange={e => setForm(f => ({ ...f, diet_tag: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]"
                  >
                    <option value="veg">Veg</option>
                    <option value="non_veg">Non-Veg</option>
                    <option value="egg">Egg</option>
                    <option value="vegan">Vegan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1">Spice Level</label>
                  <select
                    value={form.spice_level}
                    onChange={e => setForm(f => ({ ...f, spice_level: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]"
                  >
                    <option value="none">None</option>
                    <option value="mild">Mild</option>
                    <option value="medium">Medium</option>
                    <option value="hot">Hot</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-stone-400 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A] resize-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-stone-400 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={form.image_url}
                    onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]"
                    placeholder="https://…"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1">Qty Available (blank = unlimited)</label>
                  <input
                    type="number" min="0"
                    value={form.qty_available ?? ''}
                    onChange={e => setForm(f => ({ ...f, qty_available: e.target.value === '' ? null : Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A]"
                    placeholder="Unlimited"
                  />
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    id="avail"
                    checked={form.is_available}
                    onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))}
                    className="w-4 h-4 accent-[#FF7A1A]"
                  />
                  <label htmlFor="avail" className="text-xs font-bold text-stone-300">Available on Menu</label>
                </div>
              </div>

              {/* Modifiers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-400">Modifiers / Add-ons</label>
                  <button type="button" onClick={addModifier}
                    className="text-xs text-[#FF7A1A] hover:underline font-bold flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Group
                  </button>
                </div>
                {modifiers.map((mod, idx) => (
                  <div key={idx} className="mb-3 p-3 bg-stone-900 rounded-xl border border-stone-700">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        placeholder="Group name (e.g., Spice Level)"
                        value={mod.name}
                        onChange={e => updateModifier(idx, 'name', e.target.value)}
                        className="flex-1 px-2 py-1 bg-stone-800 border border-stone-600 rounded-lg text-xs text-white focus:outline-none focus:border-[#FF7A1A]"
                      />
                      <button type="button" onClick={() => removeModifier(idx)}>
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                    <input
                      placeholder="Options (comma-separated)"
                      value={mod.options.join(', ')}
                      onChange={e => updateModifier(idx, 'options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      className="w-full px-2 py-1 bg-stone-800 border border-stone-600 rounded-lg text-xs text-white focus:outline-none focus:border-[#FF7A1A]"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2 rounded-xl bg-stone-800 text-stone-300 text-sm font-bold hover:bg-stone-700 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 rounded-xl bg-[#FF7A1A] text-white text-sm font-bold hover:bg-[#E8690D] transition-colors disabled:opacity-50">
                  {saving ? 'Saving…' : editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1210] rounded-2xl border border-[#2d2018] w-full max-w-sm p-6">
            <h3 className="text-base font-bold text-white mb-4">Add Category</h3>
            <input
              autoFocus
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="Category name…"
              className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A1A] mb-4"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowCatModal(false)}
                className="flex-1 py-2 rounded-xl bg-stone-800 text-stone-300 text-sm font-bold">Cancel</button>
              <button
                type="button"
                onClick={async () => {
                  if (newCatName.trim()) { await addCategory(newCatName.trim()); setNewCatName(''); setShowCatModal(false); }
                }}
                className="flex-1 py-2 rounded-xl bg-[#FF7A1A] text-white text-sm font-bold">
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
