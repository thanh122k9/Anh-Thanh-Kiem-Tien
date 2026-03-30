import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { UserProfile } from '../../types';
import { Users, Edit3, ShieldAlert, BadgeDollarSign, Ban } from 'lucide-react';

export function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qUsers = query(collection(db, 'users'));
    const unsub = onSnapshot(qUsers, (snap) => {
      const data: UserProfile[] = [];
      snap.forEach(d => data.push(d.data() as UserProfile));
      setUsers(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const adjustBalance = async (user: UserProfile) => {
    const newBalStr = prompt(`Nhập số dư mới (VNĐ) cho user ${user.email}`, String(user.balance));
    if (newBalStr && !isNaN(Number(newBalStr))) {
      await updateDoc(doc(db, 'users', user.uid), {
        balance: Number(newBalStr)
      });
      alert('Đã cập nhật số dư.');
    }
  };

  const setRole = async (user: UserProfile, newRole: 'admin' | 'user') => {
     if(window.confirm(`Đổi quyền của ${user.email} thành ${newRole}?`)) {
        await updateDoc(doc(db, 'users', user.uid), {
           role: newRole
        });
     }
  };

  const banUser = async (user: UserProfile) => {
     // A simplified version of a ban system would just set a flag.
     if(window.confirm(`Thao tác này sẽ cấm (banned=true) ${user.email}?`)) {
        await updateDoc(doc(db, 'users', user.uid), {
           banned: true
        });
     }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
           Quản Lý Người Dùng <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">{users.length}</span>
        </h2>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/70">
            <thead className="bg-black/50 text-xs uppercase text-white/50">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Level / Tiền / Task</th>
                <th className="px-4 py-3">Quyền</th>
                <th className="px-4 py-3 text-right">Thao tác Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map(u => (
                 <tr key={u.uid} className={`hover:bg-white/5 transition ${(u as any).banned ? 'opacity-50 line-through' : ''}`}>
                    <td className="px-4 py-4">
                       <span className="font-bold text-white block">{u.displayName}</span>
                       <span className="text-xs text-white/40">{u.email}</span>
                       <span className="text-[10px] text-orange-400 block mt-1 font-mono">{u.uid}</span>
                    </td>
                    <td className="px-4 py-4">
                       <p><span className="text-white/40">Cấp:</span> <span className="font-bold text-yellow-500">{u.level}</span> ({u.exp}xp)</p>
                       <p><span className="text-white/40">Số dư:</span> <span className="font-bold text-green-500">{u.balance.toLocaleString()}đ</span></p>
                       <p><span className="text-white/40">Task Đã Làm:</span> <span className="font-bold">{u.totalCompleted || 0}</span></p>
                    </td>
                    <td className="px-4 py-4">
                       <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-500' : 'bg-white/10 text-white/60'}`}>
                          {u.role || 'user'}
                       </span>
                       {(u as any).banned && <span className="ml-2 text-[10px] bg-red-500/20 text-red-500 px-2 py-1 rounded-full font-bold">BANNED</span>}
                    </td>
                    <td className="px-4 py-4">
                       <div className="flex justify-end gap-2">
                          <button onClick={() => adjustBalance(u)} title="Sửa số dư" className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition"><BadgeDollarSign className="h-4 w-4"/></button>
                          <button onClick={() => setRole(u, u.role === 'admin' ? 'user' : 'admin')} title="Phân quyền Admin/User" className="p-2 bg-purple-500/10 text-purple-500 rounded-lg hover:bg-purple-500 hover:text-white transition"><ShieldAlert className="h-4 w-4"/></button>
                          <button onClick={() => banUser(u)} title="Khoá tài khoản" className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition"><Ban className="h-4 w-4"/></button>
                       </div>
                    </td>
                 </tr>
              ))}
              {users.length === 0 && !loading && <tr><td colSpan={4} className="px-4 py-8 text-center text-white/40">Không có Users.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
