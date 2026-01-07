import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { SupabaseAuthProvider } from './components/auth/SupabaseAuthProvider';
import ErrorBoundary from './components/ErrorBoundary';

// Layouts
import ClientLayout from './layout/ClientLayout';
import AdminLayout from './layout/AdminLayout';
import StaffLayout from './layout/StaffLayout';

// Pages
import Landing from './app/Landing';
import Auth from './app/Auth';
import Plans from './app/Plans';
import Checkout from './app/Checkout';
import Home from './app/Home';
import QRCodePage from './app/QRCodePage';
import Voucher from './app/Voucher';
import Burgers from './app/Burgers';
import Profile from './app/Profile';
import AdminDashboard from './app/AdminDashboard';
import AdminUsers from './app/AdminUsers';
import AdminUserDetails from './app/AdminUserDetails';
import AdminPlans from './app/AdminPlans';
import AdminCoupons from './app/AdminCoupons';
import StaffHome from './app/StaffHome';
import StaffValidate from './app/StaffValidate';
import Debug from './app/Debug';

import type { Role } from './types';

const redirectByRole = (role?: Role) => {
  if (role === 'admin') return '/admin';
  if (role === 'staff') return '/staff';
  return '/app';
};

const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children?: React.ReactNode;
  allowedRoles?: Role[];
}) => {
  const isAuthed = useAuthStore((s) => s.isAuthed);
  const user = useAuthStore((s) => s.user);

  if (!isAuthed || !user) return <Navigate to="/auth" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectByRole(user.role)} replace />;
  }

  return <>{children || <Outlet />}</>;
};

const App: React.FC = () => {
  const applyTheme = useThemeStore((s) => s.applyTheme);
  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  return (
    <ErrorBoundary>
      <SupabaseAuthProvider>
        <HashRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/debug" element={<Debug />} />

            {/* Client App */}
            <Route
              path="/app"
              element={
                <ProtectedRoute allowedRoles={['client']}>
                  <ClientLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Home />} />
              <Route path="qrcode" element={<QRCodePage />} />
              <Route path="voucher" element={<Voucher />} />
              <Route path="burgers" element={<Burgers />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Admin Panel */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/:id" element={<AdminUserDetails />} />
              <Route path="plans" element={<AdminPlans />} />
              <Route path="coupons" element={<AdminCoupons />} />
            </Route>

            {/* Staff Area */}
            <Route
              path="/staff"
              element={
                <ProtectedRoute allowedRoles={['staff', 'admin']}>
                  <StaffLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<StaffHome />} />
              <Route path="validate" element={<StaffValidate />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </SupabaseAuthProvider>
    </ErrorBoundary>
  );
};

export default App;
