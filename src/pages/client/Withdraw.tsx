import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Wallet, CreditCard, Landmark, AlertCircle, CheckCircle2 } from 'lucide-react';

const MIN_PAY = 10000;

export function Withdraw() {
  const { user, profile } = useAuth();
  const [amount, setAmount] = useState<number | ''>('');
  const [method, setMethod] = useState<'momo' | 'bank' | 'card'>('momo');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setError('');
    
    const numAmount = Number(amount);
    
    if (!numAmount || numAmount < MIN_PAY) {
      return setError(`Số tiền rút tối thiểu là ${MIN_PAY.toLocaleString()}đ`);
    }
    
    if (numAmount > profile.balance) {
      return setError('Số dư không đủ để thực hiện giao dịch');
    }

    if (!details.trim()) {
      return setError('Vui lòng nhập thông tin nhận tiền');
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'withdrawals'), {
        userId: user.uid,
        amount: numAmount,
        paymentMethod: method,
        paymentDetails: details,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      // Note: Trừ tiền balance ở đây sẽ cần rule db chặt chẽ. Ở đây ta ưu tiên dùng Cloud Function hoặc duyệt tay r mới trừ để an toàn.
      // Dựa trên yêu cầu, khi yêu cầu rút tiền thành công, min pay là 10k đ, user tạo ticket => Admin duyệt mới trừ tiền, hoặc trừ tiền pending ngay lập tức(sử dụng cloud functions transaction). 
      // Tạm thời hiển thị success cho ticket thành công.

      setSuccess(true);
      setAmount('');
      setDetails('');
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo yêu cầu rút tiền');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <div className="mb-12 md:mb-16 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter"
        >
          Rút Tiền <span className="text-orange-500">Mặt</span>
        </motion.h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8"
        >
          <div className="mb-6 flex flex-col gap-2">
            <span className="text-sm font-semibold text-white/40 uppercase tracking-wider">Số dư khả dụng</span>
            <span className="text-4xl font-black text-orange-500">
              {profile?.balance?.toLocaleString() || 0} <span className="text-lg text-white/50">VNĐ</span>
            </span>
          </div>

          <p className="text-sm text-white/60 mb-6 pb-6 border-b border-white/10">
            Hạn mức rút tối thiểu là <strong className="text-white">{MIN_PAY.toLocaleString()}đ</strong>. <br />
            Thời gian xử lý giao dịch thông thường từ 1 - 24 giờ làm việc.
          </p>

          {success ? (
            <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-6 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-4 text-lg font-bold text-white">Yêu cầu thành công</h3>
              <p className="mt-2 text-sm text-green-400">Yêu cầu rút tiền của bạn đang được xử lý.</p>
              <button onClick={() => setSuccess(false)} className="mt-6 w-full rounded-xl bg-white/10 py-3 font-bold hover:bg-white/20">Tạo lệnh khác</button>
            </div>
          ) : (
            <form onSubmit={handleWithdraw} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-red-500">
                  <AlertCircle className="shrink-0 h-5 w-5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Số tiền cần rút</label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                  <input 
                    type="number" 
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    min={MIN_PAY}
                    max={profile?.balance || 0}
                    placeholder="Nhập số tiền..."
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/50 py-3 pl-10 pr-4 text-white placeholder-white/40 outline-none focus:border-orange-500 focus:bg-white/5"
                  />
                </div>
                <button
                   type="button"
                   onClick={() => setAmount(profile?.balance || 0)}
                   className="mt-2 text-xs text-orange-500 hover:text-orange-400 font-bold"
                >
                  Rút toàn bộ
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Phương thức nhận</label>
                <div className="grid grid-cols-3 gap-2">
                   <button type="button" onClick={() => setMethod('momo')} className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${method === 'momo' ? 'border-pink-500 bg-pink-500/10 text-pink-500' : 'border-white/10 bg-black/50 text-white/60 hover:bg-white/5'}`}>
                      <Wallet className="h-6 w-6" /> Momo
                   </button>
                   <button type="button" onClick={() => setMethod('bank')} className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${method === 'bank' ? 'border-blue-500 bg-blue-500/10 text-blue-500' : 'border-white/10 bg-black/50 text-white/60 hover:bg-white/5'}`}>
                      <Landmark className="h-6 w-6" /> Ngân hàng
                   </button>
                   <button type="button" onClick={() => setMethod('card')} className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${method === 'card' ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-white/10 bg-black/50 text-white/60 hover:bg-white/5'}`}>
                      <CreditCard className="h-6 w-6" /> Thẻ cào
                   </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  {method === 'momo' ? 'Số điện thoại Momo' : method === 'bank' ? 'Số TK / Tên Ngân Hàng / Tên Chủ Thẻ' : 'Loại thẻ / Nhà mạng'}
                </label>
                <input 
                  type="text" 
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder="Nhập thông tin..."
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/50 py-3 px-4 text-white placeholder-white/40 outline-none focus:border-orange-500 focus:bg-white/5"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading || (profile?.balance || 0) < MIN_PAY}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-bold text-white transition hover:bg-orange-600 disabled:opacity-50"
              >
                {loading ? 'Đang gửi...' : 'Tạo lệnh Rút tiền'}
              </button>
            </form>
          )}
        </motion.div>
        
        <div className="flex flex-col gap-6">
           <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6 md:p-8">
              <h3 className="text-xl font-bold mb-4 text-orange-400">Chính sách xử lý</h3>
              <ul className="space-y-3 text-sm text-white/70">
                 <li className="flex items-start gap-2">
                    <CheckCircle2 className="shrink-0 h-5 w-5 text-orange-500" /> 
                    <span>Mọi lệnh rút tiền sẽ được Admin kiểm duyệt thủ công để đảm bảo bảo mật.</span>
                 </li>
                 <li className="flex items-start gap-2">
                    <CheckCircle2 className="shrink-0 h-5 w-5 text-orange-500" /> 
                    <span>Hệ thống quét anti-cheat lần cuối trước khi chuyển khoản. Nếu phát hiện vi phạm, lệnh sẽ bị huỷ.</span>
                 </li>
                 <li className="flex items-start gap-2">
                    <CheckCircle2 className="shrink-0 h-5 w-5 text-orange-500" /> 
                    <span>Trong trường hợp điền sai thông tin, phí giao dịch (nếu có) do bạn chịu.</span>
                 </li>
              </ul>
           </div>
        </div>
      </div>
    </main>
  );
}
