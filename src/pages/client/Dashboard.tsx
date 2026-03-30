import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  query, 
  collection, 
  where, 
  onSnapshot, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  increment, 
  serverTimestamp, 
  limit 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Task, TaskLog } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { TaskCard } from '../../components/TaskCard';
import { ShieldCheck, Trophy, CheckCircle2, AlertCircle, Info, Zap, X, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function Dashboard() {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [searchParams, setSearchParams] = useSearchParams();
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('completed_token');
    if (token && user) {
      setShowToast(true);

      const verifyTask = async () => {
        try {
          // Small delay to ensure DB sync
          await new Promise(r => setTimeout(r, 1500));

          // 1. Find the pending log
          const logsQuery = query(
            collection(db, 'task_logs'), 
            where('sessionToken', '==', token),
            where('status', '==', 'pending'),
            limit(1)
          );
          
          const logSnap = await getDocs(logsQuery);
          if (logSnap.empty) {
            console.log("Không tìm thấy log pending hoặc đã hoàn thành.");
            return;
          }

          const logDoc = logSnap.docs[0];
          const logData = logDoc.data() as TaskLog;

          // 2. Fetch Reward info
          const taskRef = doc(db, 'tasks', logData.taskId);
          const taskSnap = await getDoc(taskRef);
          if (!taskSnap.exists()) return;
          const taskData = taskSnap.data() as Task;

          // 3. Update Log status
          await updateDoc(logDoc.ref, {
            status: 'completed',
            completedAt: serverTimestamp()
          });

          // 4. Update User Balance & Stats
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            balance: increment(taskData.rewardAmount),
            exp: increment(10),
            totalCompleted: increment(1)
          });
          
          // Trigger a success message via alert or better UI
          alert(`Thành công! Bạn nhận được ${taskData.rewardAmount}đ`);

        } catch (err: any) {
          console.error("Lỗi xác thực:", err);
          alert("Có lỗi xảy ra khi xác thực: " + err.message);
        } finally {
          setShowToast(false);
          // Clean up URL
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('completed_token');
          setSearchParams(newParams, { replace: true });
        }
      };

      verifyTask();
      
      const timer = setTimeout(() => setShowToast(false), 15000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams, user]);

  useEffect(() => {
    // Listen for active tasks
    const tasksQuery = query(collection(db, 'tasks'), where('status', '==', true));
    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const taskList: Task[] = [];
      snapshot.forEach(doc => taskList.push({ id: doc.id, ...doc.data() } as Task));
      setTasks(taskList);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Listen for completed tasks today to mark as done
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const logsQuery = query(
      collection(db, 'task_logs'),
      where('userId', '==', user.uid),
      where('status', '==', 'completed'),
      where('completedAt', '>=', today)
    );
    
    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const completed = new Set<string>();
      snapshot.forEach(doc => completed.add(doc.data().taskId));
      setCompletedTaskIds(completed);
    });

    return () => unsubscribe();
  }, [user]);

  const handleStartTask = (task: Task) => {
    navigate(`/redirect/${task.id}`);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-[100] flex w-[90%] max-w-md items-center gap-4 rounded-2xl border border-orange-500/50 bg-black/90 p-4 shadow-2xl shadow-orange-500/20 backdrop-blur-xl md:w-full"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/20 text-orange-500">
               <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <div className="flex-1">
               <h4 className="text-sm font-bold text-white">Nhiệm vụ đang xác thực</h4>
               <p className="text-xs text-white/60">Hệ thống đang kiểm tra kết quả từ nhà cung cấp. Tiền sẽ được cộng tự động sau vài giây.</p>
            </div>
            <button 
              onClick={() => setShowToast(false)}
              className="p-1 text-white/20 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <div className="mb-12 md:mb-16 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter"
        >
          Vượt Link <span className="text-orange-500">Kiếm Tiền</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 text-sm md:text-lg text-white/60"
        >
          Hệ thống Shortlink Wall uy tín, minh bạch và bảo mật cao. Cộng tiền ngay lập tức khi hoàn thành.
        </motion.p>
      </div>

      {/* Stats Grid */}
      <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-500">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold">Bảo mật Anti-Cheat</h3>
          <p className="mt-2 text-xs md:text-sm text-white/40">Kiểm tra tỷ lệ hoàn thành, chặn IP spam tự động bằng thuật toán bảo mật.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-purple-500">
            <Trophy className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold">Hệ thống Cấp độ</h3>
          <p className="mt-2 text-xs md:text-sm text-white/40">Hoàn thành nhiều, cấp càng cao. Cấp độ cao hơn sẽ giúp nhận thưởng tốt hơn (Sắp ra mắt).</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20 text-green-500">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold">Xác thực Real-time</h3>
          <p className="mt-2 text-xs md:text-sm text-white/40">Cập nhật kết quả tiền thưởng trực tiếp không cần tải lại trang bằng công nghệ Webhook.</p>
        </div>
      </div>

      {/* Task Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Nhiệm vụ khả dụng</h2>
        </div>

        {tasks.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onStart={handleStartTask}
                isCompleted={completedTaskIds.has(task.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 py-20 text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-white/20" />
            <p className="text-white/40">Hiện chưa có nhiệm vụ nào. Vui lòng quay lại sau!</p>
          </div>
        )}
      </div>

      {/* Anti-Cheat Info */}
      <div className="mt-20 rounded-3xl bg-orange-500/10 p-8 md:p-12">
        <div className="flex flex-col items-center gap-8 lg:flex-row">
          <div className="flex-1">
            <div className="mb-4 flex items-center gap-2 text-orange-500">
              <Info className="h-5 w-5" />
              <span className="text-sm font-bold uppercase tracking-widest">Lưu ý quan trọng</span>
            </div>
            <h2 className="text-3xl font-bold">Quy định chống gian lận</h2>
            <p className="mt-4 text-base md:text-lg text-white/60">
              Hệ thống giám sát bằng AI để phát hiện bot, auto click, và proxy. 
              Mọi hành vi vượt link dưới 10 giây hoặc dùng công cụ cheat đều sẽ bị hệ thống đánh dấu <span className="font-bold text-red-400">Suspicious</span> và khóa tài khoản mà không báo trước!
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Một IP chỉ làm 1 lần/ngày/nhiệm vụ</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Không sử dụng Adblock/VPN</span>
              </div>
            </div>
          </div>
          <div className="relative h-48 w-48 shrink-0 md:h-64 md:w-64">
            <div className="absolute inset-0 animate-pulse rounded-full bg-orange-500/20 blur-3xl" />
            <div className="relative flex h-full w-full items-center justify-center rounded-full border border-orange-500/30 bg-black/40 backdrop-blur-xl">
              <ShieldCheck className="h-24 w-24 md:h-32 md:w-32 text-orange-500" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
