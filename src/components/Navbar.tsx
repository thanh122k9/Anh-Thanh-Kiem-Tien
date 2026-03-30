import React from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { LogOut, Zap, Wallet, Star } from 'lucide-react';
import { UserProfile } from '../types';
import { Link, useNavigate } from 'react-router-dom';

interface NavbarProps {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  onLogout: () => void;
}

export function Navbar({ user, profile, onLogout }: NavbarProps) {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 shadow-lg shadow-orange-500/20">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white hidden md:inline">Shortlink<span className="text-orange-500">Wall</span></span>
        </Link>

        {user && profile && (
          <div className="flex flex-1 items-center justify-center gap-4 hidden sm:flex">
             <Link to="/dashboard" className="text-sm font-medium hover:text-orange-500 transition">Nhiệm vụ</Link>
             <Link to="/withdraw" className="text-sm font-medium hover:text-orange-500 transition">Rút tiền</Link>
             <Link to="/history" className="text-sm font-medium hover:text-orange-500 transition">Lịch sử</Link>
             {profile.role === 'admin' || user.email === 'acc.xinh001@gmail.com' ? (
               <Link to="/admin" className="text-sm font-medium text-orange-400 hover:text-orange-300 transition">Admin Panel</Link>
             ) : null}
          </div>
        )}

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 md:px-4">
                  <Wallet className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-white">{profile?.balance?.toLocaleString() || 0} đ</span>
                </div>
                <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 md:flex">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-white">Cấp {profile?.level || 1}</span>
                </div>
              </div>
              <button 
                onClick={onLogout}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
                title="Đăng xuất"
              >
                <LogOut className="h-4 w-4 text-white/70" />
              </button>
            </>
          ) : (
            <div className="flex gap-2">
               <Link 
                to="/login"
                className="rounded-full bg-white/10 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-white/20"
              >
                Đăng nhập
              </Link>
              <Link 
                to="/register"
                className="hidden md:inline-block rounded-full bg-orange-500 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/20"
              >
                Đăng ký
              </Link>
            </div>
            
          )}
        </div>
      </div>
      
      {/* Mobile nav links */}
      {user && profile && (
        <div className="flex items-center justify-around border-t border-white/5 bg-black py-2 sm:hidden overflow-x-auto">
             <Link to="/dashboard" className="px-3 text-xs font-medium text-white/70 hover:text-white whitespace-nowrap">Nhiệm vụ</Link>
             <Link to="/withdraw" className="px-3 text-xs font-medium text-white/70 hover:text-white whitespace-nowrap">Rút tiền</Link>
             <Link to="/history" className="px-3 text-xs font-medium text-white/70 hover:text-white whitespace-nowrap">Lịch sử</Link>
             {(profile.role === 'admin' || user.email === 'acc.xinh001@gmail.com') && (
               <Link to="/admin" className="px-3 text-xs font-medium text-orange-400 whitespace-nowrap">Admin</Link>
             )}
        </div>
      )}
    </nav>
  );
}
