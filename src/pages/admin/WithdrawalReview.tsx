import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, increment, runTransaction } from 'firebase/firestore';
import { Withdrawal, UserProfile } from '../../types';
import { Check, X, CreditCard, Banknote, Wallet, ExternalLink } from 'lucide-react';

export function WithdrawalReview() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Chỉ lấy những yêu cầu đang chờ xử lý
    const qWith = query(
      collection(db, 'withdrawals'),
      where('status', '==', 'pending')
    );
    const unsub = onSnapshot(qWith, (snap) => {
      const data: Withdrawal[] = [];
      snap.forEach(d => data.push({id: d.id, ...d.data()} as Withdrawal));
      // Xếp cũ lên trước để duyệt trước
      data.sort((a,b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
      setWithdrawals(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAction = async (withdrawal: Withdrawal, action: 'paid' | 'rejected') => {
    if (!window.confirm(`Xác nhận ${action === 'paid' ? 'ĐÃ THANH TOÁN' : 'TỪ CHỐI'} yêu cầu này?`)) return;

    try {
      const userRef = doc(db, 'users', withdrawal.userId);
      const withdrawalRef = doc(db, 'withdrawals', withdrawal.id);

      await runTransaction(db, async (transaction) => {
        const withSnap = await transaction.get(withdrawalRef);
        if (!withSnap.exists()) throw new Error("Yêu cầu không tồn tại!");
        if (withSnap.data().status !== 'pending') throw new Error("Yêu cầu này đã được xử lý rồi!");

        // 1. Update Status
        transaction.update(withdrawalRef, {
          status: action,
          processedAt: new Date()
        });

        // 2. If Rejected, refund balance
        if (action === 'rejected') {
          transaction.update(userRef, {
            balance: increment(withdrawal.amount)
          });
        }
      });

      alert(`Đã xử lý thành công! (${action})`);

    } catch (err: any) {
      console.error(err);
      alert('Đã có lỗi xảy ra: ' + err.message);
    }
  };

  const getMethodIcon = (method: string) => {
     if(method === 'momo') return <Wallet className="h-4 w-4 text-pink-500" />;
     if(method === 'bank') return <Banknote className="h-4 w-4 text-blue-500" />;
     return <CreditCard className="h-4 w-4 text-orange-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
           Duyệt Rút Tiền <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">{withdrawals.length}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {withdrawals.map(w => (
           <div key={w.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <span className="text-xs text-white/40 uppercase tracking-widest block mb-1">Mã Phiếu: {w.id.slice(0, 8)}</span>
                    <span className="text-2xl font-black text-orange-500">{w.amount.toLocaleString()}đ</span>
                 </div>
                 <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase">
                    {getMethodIcon(w.paymentMethod)} {w.paymentMethod}
                 </div>
              </div>

              <div className="mb-6 space-y-2">
                 <p className="text-sm">
                    <span className="text-white/50 block text-xs">Thông tin nhận tiền:</span>
                    <span className="font-semibold">{w.paymentDetails}</span>
                 </p>
                 <p className="text-sm">
                    <span className="text-white/50 block text-xs">Của User:</span>
                    <span className="font-mono text-xs text-orange-400">{w.userId}</span>
                 </p>
                 <p className="text-sm text-white/40 text-xs">
                    Tạo lúc: {w.createdAt?.toDate ? w.createdAt.toDate().toLocaleString() : 'N/A'}
                 </p>
              </div>

              <div className="flex items-center gap-3">
                 <button 
                   onClick={() => handleAction(w, 'paid')}
                   className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition"
                 >
                   <Check className="h-4 w-4"/> Duyệt Trả
                 </button>
                 <button 
                   onClick={() => handleAction(w, 'rejected')}
                   className="flex-1 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition"
                 >
                   <X className="h-4 w-4"/> Từ chối
                 </button>
              </div>

              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-orange-500/20 to-transparent -z-10 rounded-bl-full" />
           </div>
        ))}

        {!loading && withdrawals.length === 0 && (
           <div className="col-span-full py-12 text-center text-white/40 bg-white/5 rounded-2xl border border-dashed border-white/10">
              Không có yêu cầu rút tiền mới nào đang chờ duyệt.
           </div>
        )}
      </div>
    </div>
  );
}
