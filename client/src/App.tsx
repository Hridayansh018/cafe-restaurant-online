import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DinePulseProvider, useDinePulse } from './context/DinePulseContext';
import { DinerPage } from './pages/DinerPage';
import { KDSPage } from './pages/KDSPage';
import { AdminPage } from './pages/AdminPage';
import { MenuPage } from './pages/MenuPage';
import { Toaster } from './components/ui/Toaster';

/**
 * DinePulse Application — Route Structure
 *
 * /diner?table=<id>&token=<qr_token>  — QR-gated diner experience
 * /menu                                — Public interactive digital menu
 * /kds                                 — Kitchen Display System
 * /admin/*                             — Admin console (PIN protected)
 * /                                    — Redirects to /admin
 */

const AppRoutes: React.FC = () => {
  const { toasts, dismissToast } = useDinePulse();

  return (
    <>
      <Routes>
        {/* Default: redirect to admin */}
        <Route path="/" element={<Navigate to="/admin" replace />} />

        {/* Public Digital Menu */}
        <Route path="/menu" element={<MenuPage />} />

        {/* Diner — QR-gated ordering experience */}
        <Route path="/diner" element={<DinerPage />} />

        {/* Kitchen Display System */}
        <Route path="/kds" element={<KDSPage />} />

        {/* Admin Console (PIN protected, collapsible sidebar) */}
        <Route path="/admin/*" element={<AdminPage />} />

        {/* 404 fallback */}
        <Route path="*" element={
          <div className="min-h-screen bg-[#1a1210] flex items-center justify-center">
            <div className="text-center">
              <p className="text-6xl font-black text-stone-700 mb-4">404</p>
              <p className="text-stone-400 mb-4">Page not found</p>
              <a href="/admin" className="text-[#FF7A1A] underline text-sm">Go to Admin</a>
            </div>
          </div>
        } />
      </Routes>
      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </>
  );
};

const App: React.FC = () => {
  return (
    <DinePulseProvider>
      <AppRoutes />
    </DinePulseProvider>
  );
};

export default App;
