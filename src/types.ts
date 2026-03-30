export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  balance: number;
  level: number;
  exp: number;
  totalCompleted: number;
  role?: 'admin' | 'user';
}

export interface Task {
  id: string;
  providerName: string;
  originalUrl: string;
  rewardAmount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  status: boolean;
  instructions: string;
}

export interface TaskLog {
  id: string;
  userId: string;
  taskId: string;
  status: 'pending' | 'completed' | 'expired' | 'suspicious' | 'rejected';
  sessionToken: string;
  createdAt: any;
  completedAt?: any;
  reason?: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  paymentMethod: 'momo' | 'bank' | 'card';
  paymentDetails: string;
  status: 'pending' | 'paid' | 'rejected';
  createdAt: any;
  processedAt?: any;
}
