import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

// Layouts
import ClientLayout from './layout/ClientLayout';
import AdminLayout from './layout/AdminLayout';

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
import AdminPlans from './app/AdminPlans';
import StaffValidate from './app/StaffValidate';
import Debug from './app/Debug';

// Role Protection Component
const ProtectedRoute = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: string[] }) => {
  const isAuthed = useAuthStore(state => state.isAuthed);
  const user = useAuthStore(state => state.user);
  
  if (!isAuthed) return <Navigate to="/auth" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect based on role if unauthorized for this route
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'STAFF') return <Navigate to="/staff/validate" replace />;
    return <Navigate to="/app" replace />;
  }
  return <>{children || <Outlet />}</>;
};

const App: React.FC = () => {
  // Use selector to only subscribe to applyTheme
  const applyTheme = useThemeStore(state => state.applyTheme);

  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  return (
    <HashRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/debug" element={<Debug />} />

        {/* Client App */}
        <Route path="/app" element={<ProtectedRoute allowedRoles={['CLIENT']}><ClientLayout /></ProtectedRoute>}>
          <Route index element={<Home />} />
          <Route path="qrcode" element={<QRCodePage />} />
          <Route path="voucher" element={<Voucher />} />
          <Route path="burgers" element={<Burgers />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Admin Panel */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:id" element={<div className="p-10 text-center">Detalhes do usuário (Em desenvolvimento)</div>} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="coupons" element={<div className="p-10 text-center">Gestão de Cupons</div>} />
        </Route>

        {/* Staff Area */}
        <Route path="/staff" element={<ProtectedRoute allowedRoles={['STAFF', 'ADMIN']} />}>
          <Route path="validate" element={<StaffValidate />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;