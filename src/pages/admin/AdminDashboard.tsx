import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { TaskManagement } from './TaskManagement';
import { WithdrawalReview } from './WithdrawalReview';
import { UserManagement } from './UserManagement';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldAlert, LayoutDashboard, ListTodo, Wallet, Users, AlertTriangle } from 'lucide-react';

export function AdminLayout() {
  const { profile } = useAuth();
  const location = useLocation();

  if (!profile || (profile.role !== 'admin' && profile.email !== 'acc.xinh001@gmail.com')) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center p-4 text-center">
        <AlertTriangle className="mb-4 h-16 w-16 text-red-500" />
        <h2 className="text-2xl font-bold text-white">Truy cập bị từ chối</h2>
        <p className="mt-2 text-white/60">Bạn không có quyền quản trị để truy cập trang này.</p>
        <Link to="/dashboard" className="mt-6 rounded-full bg-orange-500 px-6 py-2 font-bold text-white">Về trang chủ</Link>
      </div>
    );
  }

  const tabs = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard /> },
    { name: 'Quản lý Tasks', path: '/admin/tasks', icon: <ListTodo /> },
    { name: 'Duyệt Rút Tiền', path: '/admin/withdrawals', icon: <Wallet /> },
    { name: 'Người Dùng', path: '/admin/users', icon: <Users /> },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 flex flex-col md:flex-row gap-8">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 shrink-0">
        <div className="bg-white/5 border border-orange-500/20 rounded-3xl p-6 sticky top-24">
           <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/10 text-orange-500">
             <ShieldAlert className="h-8 w-8" />
             <h2 className="text-xl font-bold leading-tight">Giao Diện<br/>Quản Trị</h2>
           </div>

           <nav className="flex flex-col gap-2">
             {tabs.map(tab => {
               const isActive = location.pathname === tab.path || (location.pathname === '/admin/' && tab.path === '/admin');
               return (
                 <Link 
                    key={tab.path} 
                    to={tab.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${isActive ? 'bg-orange-500 text-white font-bold' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                 >
                    <span className="[&>svg]:h-5 [&>svg]:w-5">{tab.icon}</span>
                    {tab.name}
                 </Link>
               );
             })}
           </nav>
        </div>
      </aside>

      {/* Admin Content Area */}
      <div className="flex-1 min-w-0">
        <Routes>
          <Route path="/" element={<AdminDashboardStats />} />
          <Route path="/tasks" element={<TaskManagement />} />
          <Route path="/withdrawals" element={<WithdrawalReview />} />
          <Route path="/users" element={<UserManagement />} />
        </Routes>
      </div>
    </div>
  );
}

// Simple stats widget for /admin
function AdminDashboardStats() {
  return (
     <div>
       <h1 className="text-3xl font-black mb-8">Tổng Quan Hệ Thống</h1>
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
         <div className="bg-gradient-to-br from-orange-500/20 to-transparent border border-orange-500/30 rounded-2xl p-6">
           <span className="text-white/60 text-sm font-bold uppercase block mb-2">Thống Kê Nhấp Chuột Sắp Có</span>
           <span className="text-3xl font-black text-white">Chờ Cập Nhật</span>
         </div>
         <div className="bg-gradient-to-br from-green-500/20 to-transparent border border-green-500/30 rounded-2xl p-6">
           <span className="text-white/60 text-sm font-bold uppercase block mb-2">Top User Sắp Có</span>
           <span className="text-3xl font-black text-white">Chờ Cập Nhật</span>
         </div>
       </div>
       <div className="mt-8 bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6">
         <h3 className="text-xl font-bold mb-2">Xin chào Admin!</h3>
         <p className="text-white/60">Chọn các tab quản lý bên trái để cấu hình hệ thống Shortlink.</p>
       </div>
     </div>
  );
}
