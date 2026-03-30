import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { motion } from 'motion/react';
import { Mail, Lock, UserPlus, AlertCircle } from 'lucide-react';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Mật khẩu nhập lại không khớp');
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Auth listener in AuthContext will handle creating the user profile document in Firestore
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại. Email có thể đã tồn tại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md"
      >
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black text-white">Đăng Ký Mới</h2>
          <p className="mt-2 text-white/60">Tạo tài khoản và kiếm tiền ngay hôm nay</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
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
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mật khẩu"
              required
              minLength={6}
              className="w-full rounded-xl border border-white/10 bg-black/50 py-3 pl-10 pr-4 text-white placeholder-white/40 outline-none focus:border-orange-500 focus:bg-white/5"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <input 
              type="password" 
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Xác nhận mật khẩu"
              required
              className="w-full rounded-xl border border-white/10 bg-black/50 py-3 pl-10 pr-4 text-white placeholder-white/40 outline-none focus:border-orange-500 focus:bg-white/5"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-bold text-white transition hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? 'Đang tạo...' : (
              <>
                <UserPlus className="h-5 w-5" />
                Đăng ký tài khoản
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/60">
          Đã có tài khoản? <Link to="/login" className="text-orange-500 hover:underline">Đăng nhập ngay</Link>
        </p>
      </motion.div>
    </div>
  );
}
