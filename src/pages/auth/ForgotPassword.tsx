import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      let msg = 'Lỗi gửi email reset mật khẩu. Vui lòng thử lại.';
      if (err.code === 'auth/user-not-found') msg = 'Email này chưa được đăng ký trong hệ thống.';
      else if (err.code === 'auth/invalid-email') msg = 'Định dạng email không hợp lệ.';
      else if (err.code === 'auth/too-many-requests') msg = 'Yêu cầu quá nhanh. Vui lòng thử lại sau vài phút.';
      else if (err.code === 'auth/operation-not-allowed') msg = 'Tính năng Reset mật khẩu hiện đang bị TẮT trong Firebase Console.';
      else if (err.code === 'auth/network-request-failed') msg = 'Lỗi kết nối mạng. Vui lòng kiểm tra lại.';
      
      setError(msg);
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
          <h2 className="text-3xl font-black text-white">Quên Mật Khẩu</h2>
          <p className="mt-2 text-white/60">Nhập email để nhận link tạo mật khẩu mới</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success ? (
          <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-4 text-lg font-bold text-white">Kiểm tra Email</h3>
            <p className="mt-2 text-sm text-white/60">Link reset mật khẩu đã được gửi đến <span className="font-semibold text-white">{email}</span></p>
            <Link to="/login" className="mt-6 inline-block rounded-xl bg-orange-500 px-6 py-2 font-bold text-white transition hover:bg-orange-600">Đăng nhập lại</Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
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

            <button 
              type="submit" 
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-bold text-white transition hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? 'Đang gửi...' : 'Gửi link Reset'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
           <Link to="/login" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
             <ArrowLeft className="h-4 w-4" />
             Quay lại Đăng nhập
           </Link>
        </div>
      </motion.div>
    </div>
  );
}
