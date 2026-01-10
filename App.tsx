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
// import Burgers from './app/Burgers'; // Ocultado temporariamente
import Profile from './app/Profile';
import AdminDashboard from './app/AdminDashboard';
import AdminUsers from './app/AdminUsers';
import AdminUserDetails from './app/AdminUserDetails';
import AdminPlans from './app/AdminPlans';
import AdminTemplates from './app/AdminTemplates';
import AdminCoupons from './app/AdminCoupons';
import StaffHome from './app/StaffHome';
import StaffValidate from './app/StaffValidate';
import StaffClientProfile from './app/StaffClientProfile';
import Debug from './app/Debug';
import PublicClientProfile from './app/PublicClientProfile';

const normalizeRole = (input: any): Role | null => {
  const r = String(input || '').toLowerCase();
  if (r === 'admin' || r === 'staff' || r === 'client') return r;
  return null;
};

// 🔒 Proteção por papel
const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children?: React.ReactNode;
  allowedRoles?: Role[];
}) => {
  const { isAuthed, user, isLoading, hasHydrated, logout } = useAuthStore();

  // ✅ espera persist + auth terminar antes de decidir
  if (!hasHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-hero-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthed || !user) {
    return <Navigate to="/auth" replace />;
  }

  const role = normalizeRole(user.role);

  if (!role) {
    console.warn('[ProtectedRoute] role inválida detectada. Limpando sessão local.');
    logout();
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'staff') return <Navigate to="/staff" replace />;
    return <Navigate to="/app" replace />;
  }

  return <>{children || <Outlet />}</>;
};

const App: React.FC = () => {
  const applyTheme = useThemeStore((state) => state.applyTheme);

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
            <Route path="/public/client/:customerCode" element={<PublicClientProfile />} />

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

              {/* ✅ NOVO MENU/ROTA */}
              <Route path="plans" element={<Plans />} />

              {/* <Route path="burgers" element={<Burgers />} /> */}
              <Route path="burgers" element={<Navigate to="/app" replace />} />
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
              <Route path="templates" element={<AdminTemplates />} />
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
              <Route path="client/:customerCode" element={<StaffClientProfile />} />
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
