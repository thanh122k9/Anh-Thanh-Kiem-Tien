import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { motion } from 'motion/react';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Sai tên đăng nhập hoặc mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Cửa sổ đăng nhập đã bị đóng.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Đăng nhập Google chưa được bật trong Firebase Console.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Tên miền này chưa được cấp phép trong Firebase.');
      } else {
        setError('Lỗi đăng nhập Google: ' + (err.message || 'Không rõ nguyên nhân'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md"
      >
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black text-white">Đăng Nhập</h2>
          <p className="mt-2 text-white/60">Chào mừng trở lại hệ thống kiếm tiền</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email của bạn"
                required
                className="w-full rounded-xl border border-white/10 bg-black/50 py-3 pl-10 pr-4 text-white placeholder-white/40 outline-none focus:border-orange-500 focus:bg-white/5"
              />
            </div>
          </div>
          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                required
                className="w-full rounded-xl border border-white/10 bg-black/50 py-3 pl-10 pr-4 text-white placeholder-white/40 outline-none focus:border-orange-500 focus:bg-white/5"
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
             <Link to="/forgot-password" className="text-sm text-orange-500 hover:text-orange-400">Quên mật khẩu?</Link>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-bold text-white transition hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : (
              <>
                <LogIn className="h-5 w-5" />
                Đăng nhập
              </>
            )}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10">
          <span className="text-xs text-white/40 uppercase tracking-widest">Hoặc đăng nhập với</span>
        </div>

        <button 
          onClick={handleGoogleLogin}
          type="button"
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 py-3 font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>


        <p className="mt-6 text-center text-sm text-white/60">
          Chưa có tài khoản? <Link to="/register" className="text-orange-500 hover:underline">Đăng ký ngay</Link>
        </p>
      </motion.div>
    </div>
  );
}
