import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ChevronRight, Clock, PlayCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onStart: (task: Task) => void;
  status: 'completed' | 'pending' | 'none';
}

export function TaskCard({ task, onStart, status }: TaskCardProps) {
  const [cooldown, setCooldown] = useState(0);

  const difficultyColors = {
    easy: 'text-green-400 bg-green-400/10 border-green-400/20',
    medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    hard: 'text-red-400 bg-red-400/10 border-red-400/20'
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleStart = () => {
    if (cooldown > 0) return;
    setCooldown(5); // 5 sec cooldown prevent double click
    onStart(task);
  };

  return (
    <motion.div 
      layout
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:border-orange-500/50 hover:bg-white/[0.07]"
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/40">{task.providerName}</span>
          <h3 className="text-lg font-bold text-white line-clamp-2">{task.instructions}</h3>
        </div>
        <div className={cn("shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest", difficultyColors[task.difficulty || 'easy'])}>
          {task.difficulty || 'easy'}
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between">
        <div className="flex flex-col">
          <span className="text-xs text-white/40">Phần thưởng</span>
          <span className="text-2xl font-black text-orange-500">+{task.rewardAmount} <span className="text-sm font-normal text-white/60">VNĐ</span></span>
        </div>
        
        {status === 'completed' ? (
          <div className="flex items-center gap-2 rounded-full bg-green-500/20 px-4 py-2 text-sm font-bold text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Hoàn thành
          </div>
        ) : status === 'pending' ? (
          <button 
            onClick={handleStart}
            disabled={cooldown > 0}
            className={cn(
              "flex items-center gap-2 rounded-full px-6 py-2 text-sm font-bold bg-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white transition-all transform active:scale-95"
            )}
          >
            <PlayCircle className="h-4 w-4" />
            Đang làm
          </button>
        ) : (
          <button 
            onClick={handleStart}
            disabled={cooldown > 0}
            className={cn(
              "flex items-center gap-2 rounded-full px-6 py-2 text-sm font-bold transition-transform active:scale-95",
              cooldown > 0 
                ? "bg-white/10 text-white/50 cursor-not-allowed"
                : "bg-white text-black group-hover:bg-orange-500 group-hover:text-white"
            )}
          >
            {cooldown > 0 ? (
              <>
                <Clock className="h-4 w-4 animate-pulse" />
                Đợi {cooldown}s
              </>
            ) : (
              <>
                Bắt đầu
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl transition-all group-hover:bg-orange-500/20" />
    </motion.div>
  );
}
