import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { Dashboard } from './pages/client/Dashboard';
import { RedirectPage } from './pages/client/RedirectPage';
import { Withdraw } from './pages/client/Withdraw';
import { History } from './pages/client/History';
import { AdminLayout } from './pages/admin/AdminDashboard';
import { Loader2 } from 'lucide-react';

// Require Auth Guard
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

// Redirect if already logged in
function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>;
  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function AppContent() {
  const { user, profile, logout } = useAuth();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500/30 font-sans">
      <Navbar user={user} profile={profile} onLogout={logout} />
      
      <Routes>
        {/* Public / Guest Routes */}
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />

        {/* Private Client Routes */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/redirect/:taskId" element={<PrivateRoute><RedirectPage /></PrivateRoute>} />
        <Route path="/withdraw" element={<PrivateRoute><Withdraw /></PrivateRoute>} />
        <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/*" element={<PrivateRoute><AdminLayout /></PrivateRoute>} />
        
        {/* Unknown routes redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
