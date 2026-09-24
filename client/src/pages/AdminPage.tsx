import React, { useState, useRef } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useDinePulse } from '../context/DinePulseContext';
import {
  LayoutDashboard, UtensilsCrossed, Package, Users2, FileText,
  UserCheck, Megaphone, Grid, Phone, TrendingUp, CalendarCheck,
  ChevronLeft, ChevronRight, Menu, X, LogOut, Settings,
  Building2,
} from 'lucide-react';

// Admin sub-pages (Force IDE re-evaluation)
import { AdminDashboard } from '@/src/components/admin/AdminDashboard';
import { AdminMenu } from '@/src/components/admin/AdminMenu';
import { AdminInventory } from '@/src/components/admin/AdminInventory';
import { AdminStaff } from '@/src/components/admin/AdminStaff';
import { AdminInvoices } from '@/src/components/admin/AdminInvoices';
import { AdminCustomers } from '@/src/components/admin/AdminCustomers';
import { AdminReservations } from '@/src/components/admin/AdminReservations';
import { AdminCampaigns } from '@/src/components/admin/AdminCampaigns';
import { AdminFloor } from '@/src/components/admin/AdminFloor';
import { AdminSupport } from '@/src/components/admin/AdminSupport';
import { AdminStats } from '@/src/components/admin/AdminStats';
import { AdminSettings } from '@/src/components/admin/AdminSettings';

// ── PIN Gate ────────────────────────────────────────────────

const ADMIN_PIN = '1234'; // In production, store hashed in DB

const PinGate: React.FC<{ onUnlock: () => void }> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const { restaurant } = useDinePulse();

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      if (next === ADMIN_PIN) {
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => setPin(''), 600);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1210] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FF7A1A] text-white shadow-lg shadow-orange-900/40 mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white">{restaurant.name || 'DinePulse'}</h1>
          <p className="text-sm text-stone-400 mt-1">Admin Console — Enter PIN</p>
        </div>

        {/* PIN dots */}
        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`w-4 h-4 rounded-full transition-all ${
              pin.length > i
                ? error ? 'bg-red-500' : 'bg-[#FF7A1A] scale-110'
                : 'bg-stone-700'
            }`} />
          ))}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
            <button
              key={i}
              type="button"
              disabled={d === ''}
              onClick={() => d === '⌫' ? setPin(p => p.slice(0, -1)) : handleDigit(d)}
              className={`h-14 rounded-2xl text-lg font-bold transition-all active:scale-95 ${
                d === '' ? 'invisible' :
                d === '⌫' ? 'bg-stone-800 text-stone-300 hover:bg-stone-700' :
                'bg-stone-800 text-white hover:bg-[#FF7A1A] hover:shadow-lg hover:shadow-orange-900/30'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-stone-600 mt-6">Default PIN: 1234</p>
      </div>
    </div>
  );
};

// ── Sidebar Nav ─────────────────────────────────────────────

const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/menu', label: 'Menu Management', icon: UtensilsCrossed },
  { path: '/admin/inventory', label: 'Inventory', icon: Package },
  { path: '/admin/staff', label: 'Staff', icon: Users2 },
  { path: '/admin/invoices', label: 'Invoices & Revenue', icon: FileText },
  { path: '/admin/customers', label: 'Customer Data', icon: UserCheck },
  { path: '/admin/reservations', label: 'Reservations', icon: CalendarCheck },
  { path: '/admin/campaigns', label: 'Marketing', icon: Megaphone },
  { path: '/admin/floor', label: 'Floor & QR', icon: Grid },
  { path: '/admin/support', label: 'Customer Support', icon: Phone },
  { path: '/admin/stats', label: 'Detailed Statistics', icon: TrendingUp },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

// ── Admin Shell ─────────────────────────────────────────────

export const AdminPage: React.FC = () => {
  const [unlocked, setUnlocked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { restaurant } = useDinePulse();

  if (!unlocked) {
    return <PinGate onUnlock={() => setUnlocked(true)} />;
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={`bg-[#1a1210] border-r border-[#2d2018] flex flex-col h-full transition-all duration-300 ${
      mobile ? 'w-72' : sidebarOpen ? 'w-64' : 'w-16'
    }`}>
      {/* Brand */}
      <div className={`p-4 border-b border-[#2d2018] flex items-center gap-3 ${!sidebarOpen && !mobile ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-[#FF7A1A] text-white flex items-center justify-center font-black text-base shrink-0 shadow-md shadow-orange-900/30">
          DP
        </div>
        {(sidebarOpen || mobile) && (
          <div className="overflow-hidden">
            <p className="text-sm font-black text-white truncate">{restaurant.name || 'My Restaurant'}</p>
            <span className="text-[10px] bg-orange-900/50 text-[#FF7A1A] font-bold px-1.5 py-0.5 rounded">
              Admin Console
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto space-y-0.5 px-2">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              onClick={() => mobile && setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all group ${
                  isActive
                    ? 'bg-[#FF7A1A] text-white shadow-md shadow-orange-900/30'
                    : 'text-stone-400 hover:bg-stone-800 hover:text-white'
                } ${!sidebarOpen && !mobile ? 'justify-center' : ''}`
              }
              title={!sidebarOpen && !mobile ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {(sidebarOpen || mobile) && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Quick Links */}
      {(sidebarOpen || mobile) && (
        <div className="p-4 border-t border-[#2d2018] space-y-2">
          <a href="/kds" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-stone-400 hover:text-orange-400 transition-colors font-medium">
            <Grid className="w-3.5 h-3.5" /> Open KDS ↗
          </a>
          <button
            type="button"
            onClick={() => setUnlocked(false)}
            className="flex items-center gap-2 text-xs text-stone-500 hover:text-red-400 transition-colors font-medium w-full text-left"
          >
            <LogOut className="w-3.5 h-3.5" /> Lock Admin
          </button>
        </div>
      )}

      {/* Collapse toggle (desktop only) */}
      {!mobile && (
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="m-3 p-2 rounded-xl bg-stone-800/60 hover:bg-stone-700 text-stone-400 hover:text-white transition-all flex items-center justify-center"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      )}
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#120e0b] flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between p-4 bg-[#1a1210] border-b border-[#2d2018]">
              <span className="text-white font-bold text-sm">Navigation</span>
              <button type="button" onClick={() => setMobileOpen(false)}>
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 p-4 bg-[#1a1210] border-b border-[#2d2018] sticky top-0 z-30">
          <button type="button" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5 text-stone-400" />
          </button>
          <p className="text-sm font-bold text-white">{restaurant.name}</p>
          <span className="text-[10px] bg-orange-900/50 text-[#FF7A1A] font-bold px-1.5 py-0.5 rounded ml-auto">
            Admin
          </span>
        </div>

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/menu" element={<AdminMenu />} />
            <Route path="/inventory" element={<AdminInventory />} />
            <Route path="/staff" element={<AdminStaff />} />
            <Route path="/invoices" element={<AdminInvoices />} />
            <Route path="/customers" element={<AdminCustomers />} />
            <Route path="/reservations" element={<AdminReservations />} />
            <Route path="/campaigns" element={<AdminCampaigns />} />
            <Route path="/floor" element={<AdminFloor />} />
            <Route path="/support" element={<AdminSupport />} />
            <Route path="/stats" element={<AdminStats />} />
            <Route path="/settings" element={<AdminSettings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};
