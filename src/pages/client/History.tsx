import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { motion } from 'motion/react';
import { TaskLog, Withdrawal } from '../../types';
import { History as HistoryIcon, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export function History() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'withdrawals'>('tasks');

  useEffect(() => {
    if (!user) return;

    // Fetch Task Logs
    const qTasks = query(
      collection(db, 'task_logs'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unSubTasks = onSnapshot(qTasks, (snapshot) => {
      const data: TaskLog[] = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() } as TaskLog));
      setLogs(data);
    });

    // Fetch Withdrawals
    const qWith = query(
      collection(db, 'withdrawals'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unSubWith = onSnapshot(qWith, (snapshot) => {
      const data: Withdrawal[] = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() } as Withdrawal));
      setWithdrawals(data);
    });

    return () => {
      unSubTasks();
      unSubWith();
    };
  }, [user]);

  const getStatusBadge = (status: TaskLog['status'] | Withdrawal['status']) => {
    switch(status) {
      case 'completed':
      case 'paid':
        return <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs font-semibold text-green-500"><CheckCircle2 className="h-3 w-3"/> HOÀN THÀNH</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-semibold text-yellow-500"><Clock className="h-3 w-3"/> ĐANG XỬ LÝ</span>;
      case 'rejected':
      case 'expired':
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-500"><XCircle className="h-3 w-3"/> TỪ CHỐI</span>;
      case 'suspicious':
        return <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-1 text-xs font-semibold text-orange-500"><AlertTriangle className="h-3 w-3"/> CẢNH BÁO</span>;
      default:
        return <span>{status}</span>;
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return 'Unknown';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString();
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-500">
           <HistoryIcon className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-black text-white">Lịch sử</h1>
      </div>

      <div className="mb-6 flex gap-2 border-b border-white/10 pb-4">
        <button 
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 font-bold rounded-xl transition ${activeTab === 'tasks' ? 'bg-orange-500 text-white' : 'text-white/50 hover:bg-white/5'}`}
        >
          Lịch sử Nhiệm vụ
        </button>
        <button 
          onClick={() => setActiveTab('withdrawals')}
          className={`px-4 py-2 font-bold rounded-xl transition ${activeTab === 'withdrawals' ? 'bg-orange-500 text-white' : 'text-white/50 hover:bg-white/5'}`}
        >
          Lịch sử Rút tiền
        </button>
      </div>

      <motion.div 
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/70">
            <thead className="bg-black/50 text-xs uppercase text-white/50">
              {activeTab === 'tasks' ? (
                <tr>
                  <th className="px-6 py-4">Mã Task</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Lý do (nếu bị huỷ)</th>
                  <th className="px-6 py-4">Thời gian tạo</th>
                  <th className="px-6 py-4">Thời gian hoàn thành</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-6 py-4">Mã Lệnh</th>
                  <th className="px-6 py-4">Số Tiền</th>
                  <th className="px-6 py-4">Phương thức</th>
                  <th className="px-6 py-4">Thông tin</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Thời gian</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-white/5">
              {activeTab === 'tasks' ? (
                logs.length > 0 ? logs.map(log => (
                  <tr key={log.id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4 font-mono text-xs">{log.taskId.slice(0, 10)}...</td>
                    <td className="px-6 py-4">{getStatusBadge(log.status)}</td>
                    <td className="px-6 py-4">{log.reason || '-'}</td>
                    <td className="px-6 py-4">{formatDate(log.createdAt)}</td>
                    <td className="px-6 py-4">{log.completedAt ? formatDate(log.completedAt) : '-'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-white/40">Chưa có dữ liệu</td></tr>
                )
              ) : (
                withdrawals.length > 0 ? withdrawals.map(w => (
                  <tr key={w.id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4 font-mono text-xs text-orange-400">{w.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 font-bold text-white">{w.amount.toLocaleString()}đ</td>
                    <td className="px-6 py-4 uppercase font-semibold">{w.paymentMethod}</td>
                    <td className="px-6 py-4 max-w-[200px] truncate" title={w.paymentDetails}>{w.paymentDetails}</td>
                    <td className="px-6 py-4">{getStatusBadge(w.status)}</td>
                    <td className="px-6 py-4">{formatDate(w.createdAt)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-white/40">Chưa có dữ liệu</td></tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </main>
  );
}
