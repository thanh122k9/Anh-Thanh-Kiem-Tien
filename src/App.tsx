/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  auth, db 
} from './firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  increment
} from 'firebase/firestore';
import { 
  ExternalLink, 
  Trophy, 
  Zap, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  LogOut,
  User as UserIcon,
  Wallet,
  Star,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Types ---
interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  balance: number;
  level: number;
  exp: number;
  totalCompleted: number;
}

interface Task {
  id: string;
  providerName: string;
  originalUrl: string;
  rewardAmount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  status: boolean;
  instructions: string;
}

interface TaskLog {
  id: string;
  userId: string;
  taskId: string;
  status: 'pending' | 'completed' | 'expired';
  createdAt: any;
}

// --- Components ---

const Navbar = ({ user, profile, onLogin, onLogout }: { 
  user: FirebaseUser | null, 
  profile: UserProfile | null,
  onLogin: () => void,
  onLogout: () => void
}) => (
  <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 shadow-lg shadow-orange-500/20">
          <Zap className="h-6 w-6 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">Shortlink<span className="text-orange-500">Wall</span></span>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="hidden items-center gap-4 md:flex">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                <Wallet className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-white">{profile?.balance.toLocaleString()} VNĐ</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-white">Cấp {profile?.level}</span>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 text-white/70" />
            </button>
          </>
        ) : (
          <button 
            onClick={onLogin}
            className="rounded-full bg-orange-500 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/20"
          >
            Đăng nhập
          </button>
        )}
      </div>
    </div>
  </nav>
);

interface TaskCardProps {
  key?: React.Key;
  task: Task;
  onStart: (task: Task) => void | Promise<void>;
  isCompleted: boolean;
}

const TaskCard = ({ task, onStart, isCompleted }: TaskCardProps) => {
  const difficultyColors = {
    easy: 'text-green-400 bg-green-400/10 border-green-400/20',
    medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    hard: 'text-red-400 bg-red-400/10 border-red-400/20'
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:border-orange-500/50 hover:bg-white/[0.07]"
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/40">{task.providerName}</span>
          <h3 className="text-lg font-bold text-white">{task.instructions}</h3>
        </div>
        <div className={cn("rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest", difficultyColors[task.difficulty])}>
          {task.difficulty}
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between">
        <div className="flex flex-col">
          <span className="text-xs text-white/40">Phần thưởng</span>
          <span className="text-2xl font-black text-orange-500">+{task.rewardAmount} <span className="text-sm font-normal text-white/60">VNĐ</span></span>
        </div>
        
        {isCompleted ? (
          <div className="flex items-center gap-2 rounded-full bg-green-500/20 px-4 py-2 text-sm font-bold text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Hoàn thành
          </div>
        ) : (
          <button 
            onClick={() => onStart(task)}
            className="flex items-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-bold text-black transition-transform active:scale-95 group-hover:bg-orange-500 group-hover:text-white"
          >
            Bắt đầu
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Decorative background element */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl transition-all group-hover:bg-orange-500/20" />
    </motion.div>
  );
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Get or create profile
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setProfile(userSnap.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Người dùng',
            email: firebaseUser.email || '',
            balance: 0,
            level: 1,
            exp: 0,
            totalCompleted: 0
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile);
        }

        // Listen for profile changes
        onSnapshot(userRef, (doc) => {
          if (doc.exists()) setProfile(doc.data() as UserProfile);
        });

        // Listen for completed tasks today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const logsQuery = query(
          collection(db, 'task_logs'),
          where('userId', '==', firebaseUser.uid),
          where('status', '==', 'completed')
        );
        
        onSnapshot(logsQuery, (snapshot) => {
          const completed = new Set<string>();
          snapshot.forEach(doc => completed.add(doc.data().taskId));
          setCompletedTaskIds(completed);
        });
      } else {
        setProfile(null);
        setCompletedTaskIds(new Set());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleStartTask = async (task: Task) => {
    if (!user) {
      handleLogin();
      return;
    }

    // 1. Create a pending log
    const sessionToken = Math.random().toString(36).substring(7);
    const logRef = await addDoc(collection(db, 'task_logs'), {
      userId: user.uid,
      taskId: task.id,
      sessionToken,
      status: 'pending',
      createdAt: serverTimestamp()
    });

    // 2. Open the shortlink in a new tab
    window.open(task.originalUrl, '_blank');

    // 3. Simulate verification (In real app, this would wait for webhook or polling)
    setVerifying(task.id);
    
    // Simulate a delay for the user to complete the task
    setTimeout(async () => {
      try {
        const response = await fetch('/api/verify-task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid, taskId: task.id, sessionToken })
        });
        const result = await response.json();
        
        if (result.success) {
          // Update Firestore (Admin would normally do this via server)
          // For demo, we'll update it here (assuming rules allow for demo or we use a server-side trigger)
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            balance: increment(task.rewardAmount),
            exp: increment(10),
            totalCompleted: increment(1)
          });
          
          await updateDoc(doc(db, 'task_logs', logRef.id), {
            status: 'completed',
            completedAt: serverTimestamp()
          });

          // Check for level up
          if (profile && profile.exp + 10 >= profile.level * 100) {
            await updateDoc(userRef, {
              level: increment(1),
              exp: 0
            });
          }
        }
      } catch (error) {
        console.error("Verification failed", error);
      } finally {
        setVerifying(null);
      }
    }, 5000); // 5 second simulation
  };

  // Admin only: Seed initial tasks
  const seedTasks = async () => {
    const initialTasks = [
      { providerName: 'Link1s', originalUrl: 'https://link1s.com/demo', rewardAmount: 500, difficulty: 'easy', status: true, instructions: 'Vượt link Link1s để nhận thưởng' },
      { providerName: 'MMO88', originalUrl: 'https://mmo88.net/demo', rewardAmount: 800, difficulty: 'medium', status: true, instructions: 'Vượt link MMO88 để nhận thưởng' },
      { providerName: 'Traffic123', originalUrl: 'https://traffic123.com/demo', rewardAmount: 1200, difficulty: 'hard', status: true, instructions: 'Vượt link Traffic123 để nhận thưởng' },
    ];

    for (const t of initialTasks) {
      await addDoc(collection(db, 'tasks'), t);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500/30">
      <Navbar user={user} profile={profile} onLogin={handleLogin} onLogout={handleLogout} />

      <main className="mx-auto max-w-7xl px-4 py-12">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black tracking-tighter md:text-7xl"
          >
            Vượt Link <span className="text-orange-500">Kiếm Tiền</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-white/60"
          >
            Hệ thống Shortlink Wall uy tín, minh bạch và bảo mật cao.
          </motion.p>
        </div>

        {/* Stats Grid */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-500">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold">Bảo mật Anti-Cheat</h3>
            <p className="mt-2 text-sm text-white/40">Hệ thống kiểm tra IP và Fingerprint tự động để đảm bảo công bằng.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-purple-500">
              <Trophy className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold">Hệ thống Cấp độ</h3>
            <p className="mt-2 text-sm text-white/40">Cấp độ càng cao, phần trăm bonus trên mỗi link càng lớn.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20 text-green-500">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold">Xác thực Real-time</h3>
            <p className="mt-2 text-sm text-white/40">Cập nhật trạng thái nhiệm vụ ngay lập tức khi hoàn thành.</p>
          </div>
        </div>

        {/* Task Section */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Nhiệm vụ khả dụng</h2>
            {tasks.length === 0 && user?.email === 'acc.xinh001@gmail.com' && (
              <button onClick={seedTasks} className="text-xs text-white/20 hover:text-white">Seed Tasks</button>
            )}
          </div>

          {tasks.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 py-20">
              <AlertCircle className="mb-4 h-12 w-12 text-white/20" />
              <p className="text-white/40">Hiện chưa có nhiệm vụ nào. Vui lòng quay lại sau!</p>
            </div>
          )}
        </div>

        {/* Anti-Cheat Info */}
        <div className="mt-20 rounded-3xl bg-orange-500/10 p-8 md:p-12">
          <div className="flex flex-col items-center gap-8 md:flex-row">
            <div className="flex-1">
              <div className="mb-4 flex items-center gap-2 text-orange-500">
                <Info className="h-5 w-5" />
                <span className="text-sm font-bold uppercase tracking-widest">Lưu ý quan trọng</span>
              </div>
              <h2 className="text-3xl font-bold">Quy định chống gian lận</h2>
              <p className="mt-4 text-lg text-white/60">
                Hệ thống của chúng tôi sử dụng công nghệ AI để phát hiện bot và các hành vi gian lận. 
                Việc sử dụng VPN, Proxy hoặc các công cụ tự động sẽ dẫn đến việc khóa tài khoản vĩnh viễn.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Một IP chỉ được làm 1 lần/ngày</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Không sử dụng Adblock</span>
                </div>
              </div>
            </div>
            <div className="relative h-64 w-64 md:h-80 md:w-80">
              <div className="absolute inset-0 animate-pulse rounded-full bg-orange-500/20 blur-3xl" />
              <div className="relative flex h-full w-full items-center justify-center rounded-full border border-orange-500/30 bg-black/40 backdrop-blur-xl">
                <ShieldCheck className="h-32 w-32 text-orange-500" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Verifying Overlay */}
      <AnimatePresence>
        {verifying && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <Loader2 className="h-16 w-16 animate-spin text-orange-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-orange-500" />
                </div>
              </div>
              <h2 className="text-2xl font-bold">Đang xác thực nhiệm vụ...</h2>
              <p className="max-w-xs text-white/60">Vui lòng không đóng trình duyệt. Hệ thống đang kiểm tra kết quả từ nhà cung cấp.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black py-12">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="flex items-center justify-center gap-2 opacity-50">
            <Zap className="h-5 w-5" />
            <span className="font-bold">ShortlinkWall Pro</span>
          </div>
          <p className="mt-4 text-sm text-white/30">&copy; 2026 Shortlink Wall System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

