/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './lib/authContext';
import { testConnection } from './lib/firebase';
import { AuthPage } from './pages/AuthPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { BuyerDashboard } from './pages/BuyerDashboard';
import { PendingApprovalPage, BlockedPage } from './pages/PendingApprovalPage';
import { PublicRedirectPage } from './pages/PublicRedirectPage';
import { BrandLogo3D } from './components/Brand3D';

function extractRedirectQrId(): string | null {
  // Check pathname: /r/abc1234
  const path = window.location.pathname;
  if (path.startsWith('/r/')) {
    const id = path.substring(3).replace(/^\/+|\/+$/g, '');
    if (id) return id;
  }

  // Check hash: #/r/abc1234
  const hash = window.location.hash;
  if (hash.startsWith('#/r/')) {
    const id = hash.substring(4).replace(/^\/+|\/+$/g, '');
    if (id) return id;
  }

  // Check search param: ?r=abc1234
  const searchParams = new URLSearchParams(window.location.search);
  const paramId = searchParams.get('r');
  if (paramId) return paramId;

  return null;
}

const AppContent: React.FC = () => {
  const { currentUser, isAdmin, isApproved, isPending, isBlocked, loading } = useAuth();
  const [redirectQrId, setRedirectQrId] = useState<string | null>(extractRedirectQrId());

  // Listen to popstate and hashchange for in-page navigation to /r/:id
  useEffect(() => {
    const handleLocationChange = () => {
      setRedirectQrId(extractRedirectQrId());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // 1. PUBLIC DYNAMIC QR REDIRECTION (Works WITHOUT login)
  if (redirectQrId) {
    return <PublicRedirectPage qrId={redirectQrId} />;
  }

  // 2. LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center p-4">
        <BrandLogo3D size="lg" />
        <div className="mt-8 flex items-center gap-3 text-sky-400 font-semibold text-xs tracking-widest uppercase">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
          Inicializando Dinâmico Pro...
        </div>
      </div>
    );
  }

  // 3. UNAUTHENTICATED (STRICT REQUIREMENT: ONLY LOGIN & SIGNUP, NO LANDING PAGE)
  if (!currentUser) {
    return <AuthPage />;
  }

  // 4. MASTER ADMIN (Direct routing to admin panel without buyer approval)
  if (isAdmin) {
    return <AdminDashboard />;
  }

  // 5. BUYER STATUSES
  if (isPending) {
    return <PendingApprovalPage />;
  }

  if (isBlocked) {
    return <BlockedPage />;
  }

  if (isApproved) {
    return <BuyerDashboard />;
  }

  // Fallback while status resolves
  return <PendingApprovalPage />;
};

export default function App() {
  useEffect(() => {
    testConnection();
  }, []);

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
