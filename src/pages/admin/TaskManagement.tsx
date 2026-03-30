import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Task } from '../../types';
import { ShieldAlert, Plus, Edit2, Trash2, Power, PowerOff } from 'lucide-react';
import { motion } from 'motion/react';

export function TaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<Task | null>(null);
  
  const [formData, setFormData] = useState({
    providerName: '',
    originalUrl: '',
    rewardAmount: 500,
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    instructions: '',
    status: true
  });

  useEffect(() => {
    const qTask = query(collection(db, 'tasks'));
    const unsub = onSnapshot(qTask, (snap) => {
      const data: Task[] = [];
      snap.forEach(d => data.push({id: d.id, ...d.data()} as Task));
      
      // Sắp xếp thông minh (A-Z, 1-9) theo providerName
      data.sort((a, b) => a.providerName.localeCompare(b.providerName, undefined, { numeric: true, sensitivity: 'base' }));
      
      setTasks(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && isEditing.id !== 'new') {
        await updateDoc(doc(db, 'tasks', isEditing.id), formData);
      } else {
        await addDoc(collection(db, 'tasks'), formData);
      }
      setIsEditing(null);
      setFormData({
        providerName: '', originalUrl: '', rewardAmount: 500, difficulty: 'easy', instructions: '', status: true
      });
    } catch (err: any) {
      console.error(err);
      alert(`Lỗi lưu Task: ${err.message || 'Lỗi không xác định'}`);
    }
  };

  const handleEdit = (t: Task) => {
    setIsEditing(t);
    setFormData({
       providerName: t.providerName,
       originalUrl: t.originalUrl,
       rewardAmount: t.rewardAmount,
       difficulty: t.difficulty,
       instructions: t.instructions,
       status: t.status
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Chắc chắn xóa?')) {
      await deleteDoc(doc(db, 'tasks', id));
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    await updateDoc(doc(db, 'tasks', id), { status: !currentStatus });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="text-orange-500 h-6 w-6"/> Quản lý Tasks (Shortlinks)
        </h2>
        {!isEditing && (
          <button 
             onClick={() => setIsEditing({ id: 'new' } as Task)}
             className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 font-bold px-4 py-2 rounded-xl text-sm transition"
          >
            <Plus className="h-4 w-4" /> Thêm Mới
          </button>
        )}
      </div>

      {isEditing && (
        <motion.form 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleSave} 
          className="bg-white/5 border border-orange-500/20 rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold mb-4">{isEditing.id === 'new' ? 'Tạo Task Mới' : 'Sửa Task'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/50 mb-1">Tên Provider (VD: Link1s, Megaurl)</label>
              <input type="text" value={formData.providerName} onChange={e=>setFormData({...formData, providerName: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm" required/>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Link Gốc (API của provider)</label>
              <input type="url" value={formData.originalUrl} onChange={e=>setFormData({...formData, originalUrl: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm" required/>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Tiền Thưởng (VNĐ)</label>
              <input type="number" value={formData.rewardAmount} onChange={e=>setFormData({...formData, rewardAmount: Number(e.target.value)})} className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm" required/>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Độ Khó</label>
              <select value={formData.difficulty} onChange={e=>setFormData({...formData, difficulty: e.target.value as any})} className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-sm">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-white/50 mb-1">Hướng Dẫn (Hiển thị cho user)</label>
              <input type="text" value={formData.instructions} onChange={e=>setFormData({...formData, instructions: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm" required/>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
             <button type="submit" className="bg-orange-500 hover:bg-orange-600 px-6 py-2 rounded-xl text-sm font-bold transition">Lưu Lại</button>
             <button type="button" onClick={() => setIsEditing(null)} className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-xl text-sm font-bold transition">Hủy</button>
          </div>
        </motion.form>
      )}

      {/* Task List */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-white/70">
          <thead className="bg-black/50 text-xs uppercase text-white/50">
            <tr>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Phần Thưởng</th>
              <th className="px-4 py-3">Độ Khó</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tasks.map(t => (
               <tr key={t.id} className="hover:bg-white/5 transition">
                  <td className="px-4 py-3 font-semibold">{t.providerName}</td>
                  <td className="px-4 py-3 text-orange-500 font-bold">+{t.rewardAmount}đ</td>
                  <td className="px-4 py-3"><span className="uppercase text-[10px] font-bold tracking-widest bg-white/10 px-2 py-1 rounded-full">{t.difficulty}</span></td>
                  <td className="px-4 py-3">
                     <button onClick={() => toggleStatus(t.id, t.status)} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${t.status ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                        {t.status ? <><Power className="h-3 w-3"/> ĐANG BẬT</> : <><PowerOff className="h-3 w-3"/> ĐÃ TẮT</>}
                     </button>
                  </td>
                  <td className="px-4 py-3 text-right flex justify-end gap-2">
                     <button onClick={() => handleEdit(t)} className="p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/30 transition"><Edit2 className="h-4 w-4"/></button>
                     <button onClick={() => handleDelete(t.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/30 transition"><Trash2 className="h-4 w-4"/></button>
                  </td>
               </tr>
            ))}
            {tasks.length === 0 && !loading && <tr><td colSpan={5} className="px-4 py-8 text-center">Chưa có Tasks.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
