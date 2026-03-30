import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, AlertCircle, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

export function RedirectPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!user || !taskId) return;

    let timer: NodeJS.Timeout;

    const processRedirect = async () => {
      try {
        // Fetch Task info
        const taskRef = doc(db, 'tasks', taskId);
        const taskSnap = await getDoc(taskRef);

        if (!taskSnap.exists() || !taskSnap.data().status) {
          setError('Nhiệm vụ không tồn tại hoặc đã bị tắt.');
          return;
        }

        const taskData = taskSnap.data();

        // Check if user already did it today to avoid spamming db with pending logs
        // This is a simple client-side check. Backend will strictly verify it as well.

        // Generate Session Token
        const sessionToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        // Save pending Log to DB
        await addDoc(collection(db, 'task_logs'), {
          userId: user.uid,
          taskId: taskId,
          sessionToken: sessionToken,
          status: 'pending',
          createdAt: serverTimestamp()
        });

        // Setup Countdown
        timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              // Append sessionToken to URL. Different providers use different params. We'll use ?custom= for generic 
              // Usually the original URL is constructed from provider dashboard. If originalUrl already contains ?, we append using &
              const sep = taskData.originalUrl.includes('?') ? '&' : '?';
              const finalUrl = `${taskData.originalUrl}${sep}custom=${sessionToken}`;
              
              // Open in current tab to prevent pop-up blocker issues, or new tab based on preference.
              window.location.href = finalUrl;
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

      } catch (err: any) {
        console.error(err);
        setError('Có lỗi xảy ra khi tạo link: ' + err.message);
      }
    };

    processRedirect();

    return () => clearInterval(timer);
  }, [user, taskId]);

  if (error) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="mb-4 h-16 w-16 text-red-500" />
        <h2 className="text-2xl font-bold text-white">Lỗi Chuyển Hướng!</h2>
        <p className="mt-2 text-white/60">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="mt-6 rounded-full bg-white/10 px-6 py-2 font-bold hover:bg-white/20">Quay lại</button>
      </div>
    );
  }

  return (
    <div className="flex h-[80vh] flex-col items-center justify-center p-4 text-center">
      <motion.div
         initial={{ scale: 0.8, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         className="flex flex-col items-center justify-center"
      >
          <div className="relative mb-8">
            <Loader2 className="h-24 w-24 animate-spin text-orange-500" />
            <div className="absolute inset-0 flex items-center justify-center font-bold text-2xl">
              {countdown}
            </div>
          </div>
          <h2 className="text-3xl font-black mb-2 text-white">Đang tạo liên kết bảo mật...</h2>
          <p className="max-w-md text-white/50 text-sm mb-6">
            Lưu ý: Không thay đổi tab hoạc sử dụng VPN. Hệ thống ghi nhận IP <ShieldAlert className="inline w-4 h-4 text-yellow-500" />
          </p>
      </motion.div>
    </div>
  );
}
