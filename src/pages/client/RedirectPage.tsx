import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, AlertCircle, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { TaskLog } from '../../types';

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
        // 1. Fetch User IP
        let userIp = 'unknown';
        try {
          const ipRes = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipRes.json();
          userIp = ipData.ip;
        } catch (ipErr) {
          console.error("Không thể lấy IP:", ipErr);
        }

        const userAgent = navigator.userAgent;

        // 2. Fetch Task info
        const taskRef = doc(db, 'tasks', taskId);
        const taskSnap = await getDoc(taskRef);

        if (!taskSnap.exists() || !taskSnap.data().status) {
          setError('Nhiệm vụ không tồn tại hoặc đã bị tắt.');
          return;
        }

        const taskData = taskSnap.data();

        // 3. Anti-Cheat: Check if this IP has already been used by ANOTHER user for THIS task today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const antiCheatQuery = query(
          collection(db, 'task_logs'),
          where('taskId', '==', taskId),
          where('ipAddress', '==', userIp),
          where('createdAt', '>=', today),
          limit(5) // Check a few to be sure
        );

        const antiCheatSnap = await getDocs(antiCheatQuery);
        const isCheat = antiCheatSnap.docs.some(doc => {
          const data = doc.data() as TaskLog;
          return data.userId !== user.uid;
        });

        if (isCheat) {
          setError('Hệ thống phát hiện bạn đang sử dụng nhiều tài khoản trên cùng thiết bị/mạng. Để đảm bảo công bằng, vui lòng không gian lận!');
          return;
        }

        // 4. Generate Session Token
        const sessionToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        // 5. Save pending Log to DB with IP and Device Info
        await addDoc(collection(db, 'task_logs'), {
          userId: user.uid,
          taskId: taskId,
          sessionToken: sessionToken,
          status: 'pending',
          ipAddress: userIp,
          userAgent: userAgent,
          createdAt: serverTimestamp()
        });

        // Setup Countdown
        timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              
              const baseUrl = window.location.origin;
              const verificationUrl = `${baseUrl}/dashboard?completed_token=${sessionToken}`;
              const encodedVerifyUrl = encodeURIComponent(verificationUrl);

              let finalUrl = taskData.originalUrl;
              
              if (finalUrl.includes('url=')) {
                // Handle API style: append encoded verification URL to the url= parameter
                if (finalUrl.endsWith('url=')) {
                  finalUrl += encodedVerifyUrl;
                } else if (finalUrl.includes('url=&')) {
                    finalUrl = finalUrl.replace('url=&', `url=${encodedVerifyUrl}&`);
                } else {
                    // Generic fallback if url= is somewhere in the middle but empty
                    finalUrl = finalUrl.replace(/url=([^&]*)/, `url=${encodedVerifyUrl}`);
                }
                
                // Also append alias/custom for Webhook support if the provider supports it
                finalUrl += `&alias=${sessionToken}&custom=${sessionToken}`;
              } else {
                // Standard direct link: append as query param
                const sep = finalUrl.includes('?') ? '&' : '?';
                finalUrl = `${finalUrl}${sep}custom=${sessionToken}`;
              }
              
              window.location.href = finalUrl;
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

      } catch (err: any) {
        console.error("Lỗi chuyển hướng:", err);
        setError(`Lỗi khởi tạo link: ${err.message} (Mã: ${err.code || 'N/A'})`);
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
