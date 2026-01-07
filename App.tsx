import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { SupabaseAuthProvider } from './components/auth/SupabaseAuthProvider';
import ErrorBoundary from './components/ErrorBoundary';
import type { Role } from './types';

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

// 🔒 Proteção por papel (ROLE é minúsculo: 'client' | 'staff' | 'admin')
const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children?: React.ReactNode;
  allowedRoles?: Role[];
}) => {
  const { isAuthed, user } = useAuthStore();

  if (!isAuthed || !user) return <Navigate to="/auth" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'staff') return <Navigate to="/staff" replace />;
    return <Navigate to="/app" replace />;
  }

  return <>{children || <Outlet />}</>;
};

const App: React.FC = () => {
  const applyTheme = useThemeStore(state => state.applyTheme);

  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  return (
    <ErrorBoundary>
      <SupabaseAuthProvider>
        <HashRouter>
          <Routes>
            {/* Público */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/plans" element={<Plans />} />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute allowedRoles={['client']}>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route path="/debug" element={<Debug />} />

            {/* Cliente */}
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

            {/* Admin */}
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

            {/* Staff */}
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
